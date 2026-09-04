/* 后台 service worker：替内容脚本调各家模型接口（内容脚本受页面跨域限制，扩展后台有 host_permissions），
 * 以及截图（captureVisibleTab 只能在后台调）。
 * 消息：{ type:"bc-llm", provider, model, apiKey, baseUrl, system, messages:[{role, content:[{type:"text"|"image", text?, mime?, data?}]}] }
 *       -> { ok, text } | { ok:false, error }
 *       { type:"bc-capture" } -> { ok, dataUrl }
 * 反向：manifest commands 的快捷键在这里收到（chrome.commands.onCommand），用 chrome.tabs.sendMessage 发 { type:"bc-hotkey" } 给当前标签页的内容脚本。 */

const PROVIDERS = {
  anthropic: { base: "https://api.anthropic.com" },
  openai:    { base: "https://api.openai.com/v1" },
  deepseek:  { base: "https://api.deepseek.com/v1" },
  gemini:    { base: "https://generativelanguage.googleapis.com/v1beta" },
  kimi:      { base: "https://api.moonshot.cn/v1" },
  qwen:      { base: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  zhipu:     { base: "https://open.bigmodel.cn/api/paas/v4" },
  grok:      { base: "https://api.x.ai/v1" },
  groq:      { base: "https://api.groq.com/openai/v1" },
  openrouter:{ base: "https://openrouter.ai/api/v1" },
  custom:    { base: "" }
};

async function callAnthropic({ model, apiKey, baseUrl, system, messages }) {
  const toBlocks = parts => parts.map(p => p.type === "image"
    ? { type: "image", source: { type: "base64", media_type: p.mime || "image/png", data: p.data } }
    : { type: "text", text: p.text || "" });
  // 思考不显式配置（Opus 5 / Fable 默认自适应思考）；fallbacks:"default" = 被安全分类拒答时服务端自动改走备用模型
  const body = {
    model: model || "claude-opus-5",
    max_tokens: 8000,
    system: system || undefined,
    fallbacks: "default",
    messages: messages.map(m => ({ role: m.role, content: toBlocks(m.content) }))
  };
  const r = await fetch((baseUrl || PROVIDERS.anthropic.base) + "/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || `HTTP ${r.status}`);
  if (j.stop_reason === "refusal") throw new Error("模型拒绝了这个请求" + (j.stop_details && j.stop_details.explanation ? "：" + j.stop_details.explanation : ""));
  return (j.content || []).filter(b => b.type === "text").map(b => b.text).join("");
}

async function callOpenAICompat({ provider, model, apiKey, baseUrl, system, messages }) {
  const base = (baseUrl || (PROVIDERS[provider] || {}).base || "").replace(/\/+$/, "");
  if (!base) throw new Error("没有填写接口地址（Base URL）");
  const toParts = parts => parts.map(p => p.type === "image"
    ? { type: "image_url", image_url: { url: `data:${p.mime || "image/png"};base64,${p.data}` } }
    : { type: "text", text: p.text || "" });
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  messages.forEach(m => {
    const hasImg = m.content.some(p => p.type === "image");
    msgs.push({ role: m.role, content: hasImg ? toParts(m.content) : m.content.map(p => p.text || "").join("\n") });
  });
  const r = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model, messages: msgs, max_tokens: 8000 })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || `HTTP ${r.status}`);
  const c = j.choices && j.choices[0] && j.choices[0].message;
  if (!c) throw new Error("接口没有返回内容");
  return typeof c.content === "string" ? c.content : (c.content || []).map(p => p.text || "").join("");
}

async function callGemini({ model, apiKey, baseUrl, system, messages }) {
  const base = (baseUrl || PROVIDERS.gemini.base).replace(/\/+$/, "");
  const toParts = parts => parts.map(p => p.type === "image"
    ? { inline_data: { mime_type: p.mime || "image/png", data: p.data } }
    : { text: p.text || "" });
  const body = {
    contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: toParts(m.content) }))
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || `HTTP ${r.status}`);
  const cand = j.candidates && j.candidates[0];
  if (!cand || !cand.content) throw new Error(cand && cand.finishReason ? "模型未返回内容：" + cand.finishReason : "接口没有返回内容");
  return (cand.content.parts || []).map(p => p.text || "").join("");
}

// 拉取该服务当前可用的模型列表（设置面板「刷新模型列表」）
async function listModels({ provider, apiKey, baseUrl }) {
  if (!apiKey) throw new Error("先填 API key");
  let ids = [];
  if (provider === "anthropic") {
    const r = await fetch((baseUrl || PROVIDERS.anthropic.base) + "/v1/models?limit=100", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || `HTTP ${r.status}`);
    ids = (j.data || []).map(m => m.id);
  } else if (provider === "gemini") {
    const base = (baseUrl || PROVIDERS.gemini.base).replace(/\/+$/, "");
    const r = await fetch(`${base}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || `HTTP ${r.status}`);
    ids = (j.models || [])
      .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes("generateContent"))
      .map(m => String(m.name || "").replace(/^models\//, ""))
      .filter(id => /gemini/i.test(id) && !/embedding|aqa|imagen|veo|tts|audio|image-generation|native-audio|live/i.test(id));
  } else {
    const base = (baseUrl || (PROVIDERS[provider] || {}).base || "").replace(/\/+$/, "");
    if (!base) throw new Error("没有填写接口地址（Base URL）");
    const r = await fetch(base + "/models", { headers: { "Authorization": "Bearer " + apiKey } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || `HTTP ${r.status}`);
    ids = (j.data || []).map(m => m.id).filter(Boolean);
  }
  return [...new Set(ids)].sort();
}

/* MV3 service worker 30 秒没有扩展 API 活动就会被浏览器回收；一个 pending 的 fetch 不算活动。
 * 总结整份 PDF 这类请求经常跑超过 30 秒，worker 半路被杀，内容脚本那边就报
 * "A listener indicated an asynchronous response by returning true, but the message channel closed"。
 * 办法：有请求在飞时每 20 秒调一次任意扩展 API（getPlatformInfo 最便宜）重置空闲计时；全部完成后停掉。 */
let _inflight = 0, _keepTimer = 0;
function keepAlive(promise) {
  if (++_inflight === 1 && !_keepTimer) _keepTimer = setInterval(() => { try { chrome.runtime.getPlatformInfo(() => {}); } catch (e) {} }, 20000);
  const done = () => { if (--_inflight <= 0) { _inflight = 0; clearInterval(_keepTimer); _keepTimer = 0; } };
  promise.then(done, done);
  return promise;
}

async function callLLM(req) {
  if (!req.apiKey) throw new Error("还没有填写 API key（设置面板 → 助手）");
  if (!req.model) throw new Error("还没有填写模型名");
  if (req.provider === "anthropic") return callAnthropic(req);
  if (req.provider === "gemini") return callGemini(req);
  return callOpenAICompat(req);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "bc-llm") {
    keepAlive(callLLM(msg)).then(text => sendResponse({ ok: true, text }))
      .catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true; // 异步回复
  }
  if (msg.type === "bc-models") {
    keepAlive(listModels(msg)).then(models => sendResponse({ ok: true, models }))
      .catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true;
  }
  if (msg.type === "bc-capture") {
    chrome.tabs.captureVisibleTab(sender.tab ? sender.tab.windowId : undefined, { format: "png" })
      .then(dataUrl => sendResponse({ ok: true, dataUrl }))
      .catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true;
  }
  if (msg.type === "bc-download") {
    // 一键下载课程资料：存到 下载/Better Canvas/<课程>/<文件夹>/<文件名>，重名自动加序号
    chrome.downloads.download({ url: msg.url, filename: msg.filename, conflictAction: "uniquify", saveAs: false })
      .then(id => sendResponse({ ok: true, id }))
      .catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true;
  }
  if (msg.type === "bc-permission") {
    // 自定义 Base URL 需要临时申请该域名的访问权限
    chrome.permissions.request({ origins: [msg.origin] })
      .then(granted => sendResponse({ ok: granted }))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

// 快捷键（manifest "commands"，默认 Alt+Shift+A）：后台收到后转发给当前标签页的内容脚本。
// 不是 Canvas 页面时没有内容脚本在听，sendMessage 会 reject，直接吞掉。
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command !== "bc-ask" || !tab || tab.id == null) return;
    chrome.tabs.sendMessage(tab.id, { type: "bc-hotkey" }).catch(() => {});
  });
}
