/* 后台 service worker：替内容脚本调各家模型接口（内容脚本受页面跨域限制，扩展后台有 host_permissions），
 * 以及截图（captureVisibleTab 只能在后台调）、阅读器导出（webNavigation 枚举 frame + scripting 注入，见 reader-export.js）。
 * 消息：{ type:"bc-llm", provider, model, apiKey, baseUrl, system, messages:[{role, content:[{type:"text"|"image", text?, mime?, data?}]}] }
 *       -> { ok, text } | { ok:false, error }
 *       { type:"bc-capture" } -> { ok, dataUrl }
 * 反向：manifest commands 的快捷键在这里收到（chrome.commands.onCommand），用 chrome.tabs.sendMessage 发 { type:"bc-hotkey" } 给当前标签页的内容脚本。 */

importScripts("i18n.js");   // 界面语言（BC.t）。必须第一个加载：下面 reader-export.js 顶部就要登记词条
/* 版本标记：商店版（scripts/build-store.js 打出来的 dist/store）多一个 src/edition.js，把 BC.EDITION 置成 "store"；
 * 开发仓库里没有这个文件 → importScripts 抛错被吞掉 → BC.EDITION 为 undefined = 完整版。商店版不含 gate.js / kaltura*.js / reader-*.js / print/。 */
try { importScripts("edition.js"); } catch (e) {}
const STORE_EDITION = !!(BC.EDITION === "store");
BC.i18n.add({
  "模型拒绝了这个请求": "The model refused this request",
  "模型拒绝了这个请求：{why}": "The model refused this request: {why}",
  "没有填写接口地址（Base URL）": "Base URL is not set",
  "接口没有返回内容": "The API returned no content",
  "模型未返回内容：{reason}": "The model returned no content: {reason}",
  "先填 API key": "Enter an API key first",
  "还没有填写 API key（设置面板 → 助手）": "No API key set (Settings → Assistant)",
  "还没有填写模型名": "No model name set",
  "还没有授权访问所有网站": "Access to all websites has not been granted",
  "不允许的域名": "Domain not allowed",
  "接口返回的不是 JSON：{text}": "The API did not return JSON: {text}",
  "没有目标标签页": "No target tab",
  "这个标签页已经在导出中": "This tab is already exporting",
  "这个版本不包含该功能": "This feature is not available in this edition"
});
BC.i18n.init();   // 读一次 bc_settings.ui.lang（不等结果；设置变化时 i18n.js 自己跟着切）
// 阅读器导出（IndexedDB 封装 + bcReaderPage 注入函数 + ReaderExport 任务流程）。商店版没有这三个文件：importScripts 抛错，HAS_READER 为 false
try { importScripts("reader-db.js", "reader-links.js", "reader-export.js"); } catch (e) { console.info("[BC] reader export not bundled in this edition"); }
const HAS_READER = typeof ReaderExport !== "undefined";

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
  if (j.stop_reason === "refusal") {
    const why = j.stop_details && j.stop_details.explanation;
    throw new Error(why ? BC.t("模型拒绝了这个请求：{why}", { why }) : BC.t("模型拒绝了这个请求"));
  }
  return (j.content || []).filter(b => b.type === "text").map(b => b.text).join("");
}

async function callOpenAICompat({ provider, model, apiKey, baseUrl, system, messages }) {
  const base = (baseUrl || (PROVIDERS[provider] || {}).base || "").replace(/\/+$/, "");
  if (!base) throw new Error(BC.t("没有填写接口地址（Base URL）"));
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
  if (!c) throw new Error(BC.t("接口没有返回内容"));
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
  if (!cand || !cand.content) throw new Error(cand && cand.finishReason ? BC.t("模型未返回内容：{reason}", { reason: cand.finishReason }) : BC.t("接口没有返回内容"));
  return (cand.content.parts || []).map(p => p.text || "").join("");
}

// 拉取该服务当前可用的模型列表（设置面板「刷新模型列表」）
async function listModels({ provider, apiKey, baseUrl }) {
  if (!apiKey) throw new Error(BC.t("先填 API key"));
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
    if (!base) throw new Error(BC.t("没有填写接口地址（Base URL）"));
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
  if (!req.apiKey) throw new Error(BC.t("还没有填写 API key（设置面板 → 助手）"));
  if (!req.model) throw new Error(BC.t("还没有填写模型名"));
  if (req.provider === "anthropic") return callAnthropic(req);
  if (req.provider === "gemini") return callGemini(req);
  return callOpenAICompat(req);
}

/* Kaltura 讲座视频：记录每个标签页里播放器真正请求过的地址（playManifest / m3u8 / flavor / api_v3），
 * 内容脚本扫描时来取——比在 iframe 里猜播放器配置可靠得多。存在 chrome.storage.session（worker 被回收也不丢）。 */
const KALTURA_SEEN_MAX = 60;
async function kalturaSeenAdd(tabId, url) {
  if (tabId < 0 || !/playManifest|\.m3u8|\.mpd|\/flavorId\/|api_v3/i.test(url)) return;
  const key = "kaltura_seen_" + tabId;
  const cur = (await chrome.storage.session.get(key))[key] || [];
  if (cur.includes(url)) return;
  cur.push(url);
  if (cur.length > KALTURA_SEEN_MAX) cur.splice(0, cur.length - KALTURA_SEEN_MAX);
  await chrome.storage.session.set({ [key]: cur });
}
// 商店版没有 webRequest 权限（chrome.webRequest 为 undefined）也没有 kaltura.js：整块跳过
try {
  if (!STORE_EDITION && chrome.webRequest && chrome.webRequest.onBeforeRequest) {
    chrome.webRequest.onBeforeRequest.addListener(d => { kalturaSeenAdd(d.tabId, d.url); }, { urls: ["https://*.kaltura.com/*"] });
    chrome.tabs.onRemoved.addListener(tabId => chrome.storage.session.remove("kaltura_seen_" + tabId));
    chrome.webNavigation && chrome.webNavigation.onCommitted && chrome.webNavigation.onCommitted.addListener(d => { if (d.frameId === 0) chrome.storage.session.remove("kaltura_seen_" + d.tabId); });
  }
} catch (e) { console.warn("[BC] webRequest", e); }

/* 「在所有网站启用」：动态注册一套精简内容脚本（助手 + 学习工具）到 http(s) 全站，Canvas 域排除（那里由 manifest 里的完整脚本负责）。
 * 需要用户先在弹窗里授权 optional_host_permissions 里的全站权限（所有 https 站点）；registerContentScripts 带 persistAcrossSessions，重启浏览器仍在。 */
const ANYWHERE_ID = "bc-anywhere";
async function registerAnywhere() {
  // 商店版没有 optional_host_permissions（全站权限是审核的头号触发点），也没有 gate.js：一律拒绝
  if (STORE_EDITION) throw new Error(BC.t("这个版本不包含该功能"));
  const has = await chrome.permissions.contains({ origins: ["https://*/*"] });
  if (!has) throw new Error(BC.t("还没有授权访问所有网站"));
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [ANYWHERE_ID] }).catch(() => []);
  const spec = {
    id: ANYWHERE_ID, matches: ["https://*/*", "http://*/*"], excludeMatches: ["https://*.instructure.com/*"],
    js: ["src/i18n.js", "src/gate.js", "src/storage.js", "src/knowledge.js", "src/assistant.js", "src/study.js", "src/anywhere.js"], css: ["styles/inject.css"],
    runAt: "document_idle", persistAcrossSessions: true
  };
  if (existing.length) await chrome.scripting.updateContentScripts([spec]); else await chrome.scripting.registerContentScripts([spec]);
}
async function unregisterAnywhere() {
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [ANYWHERE_ID] }).catch(() => []);
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [ANYWHERE_ID] });
}
// 启动 / 更新时按设置对齐一次（权限被用户在浏览器里撤销时注销）
// 首次安装：打开新手引导页（更新 / 重载不打开，避免每次开发重载都弹）
chrome.runtime.onInstalled.addListener(d => {
  if (d && d.reason === "install") { try { chrome.tabs.create({ url: chrome.runtime.getURL("onboarding/onboarding.html") }); } catch (e) {} }
});
// 引导页 / 设置面板请求「重新播放页内导览」：清掉标记后由 tour.js 在仪表盘上再走一遍
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "bc-open-onboarding") { chrome.tabs.create({ url: chrome.runtime.getURL("onboarding/onboarding.html") }); sendResponse({ ok: true }); }
});
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const s = (await chrome.storage.local.get("bc_settings")).bc_settings || {};
    const on = s.assistant && s.assistant.everywhere;
    if (on) await registerAnywhere().catch(() => unregisterAnywhere()); else await unregisterAnywhere();
  } catch (e) {}
});
chrome.permissions.onRemoved.addListener(p => { if ((p.origins || []).some(o => /\*\/\*/.test(o))) unregisterAnywhere(); });

/* New Quizzes 跑在跨域 iframe（https://<学校>.quiz-lti-<区域>-prod.instructure.com/…）里，manifest 里的内容脚本只进顶层页面，
 * 所以在那个 frame 每次加载完成后把助手 + 学习工具注进去（入口 quiz-frame.js；是否启用、是否在作答由 frame 里的脚本自己判断）。
 * 同一份文档只注一次：先探测 window.BC.assistant 是否已存在（LTI 启动是 表单 POST → 302 的一次导航，onCompleted 只报一次，探测是兜底）。 */
// 商店版没有 gate.js，改注 edition.js（让 frame 里的脚本也知道自己是商店版）
const QUIZ_FRAME_FILES = ["src/i18n.js", STORE_EDITION ? "src/edition.js" : "src/gate.js", "src/storage.js", "src/knowledge.js", "src/assistant.js", "src/study.js", "src/quiz-frame.js"];
if (chrome.webNavigation && chrome.webNavigation.onCompleted) {
  chrome.webNavigation.onCompleted.addListener(async d => {
    if (d.frameId === 0) return;
    const target = { tabId: d.tabId, frameIds: [d.frameId] };
    try {
      const [probe] = await chrome.scripting.executeScript({ target, func: () => !!(window.BC && window.BC.assistant) });
      if (probe && probe.result) return;
      await chrome.scripting.insertCSS({ target, files: ["styles/inject.css"] });
      await chrome.scripting.executeScript({ target, files: QUIZ_FRAME_FILES });
    } catch (e) { console.warn("[BC] quiz frame inject", e); }
  }, { url: [{ hostContains: "quiz-lti", hostSuffix: ".instructure.com" }, { hostContains: "quizzes.next" }] });
}

/* Gradescope 成绩：后台带 cookie 抓取（用户在 gradescope.com 登录一次并勾选 Remember me 后，内容脚本不用再让用户逐个打开课程页）。
 * 消息 { type:"bc-gs-fetch", courseHint?, force? } →
 *   { ok:true, loggedIn:false } | { ok:true, loggedIn:true, courses:[{ id, name, shortname, termHint, html }] } | { ok:false, error }
 * 流程：GET /account → 判断是否被 302 到 /login（或页面里有登录表单）→ 用正则从 courseBox 块里挖课程列表（worker 里没有 DOMParser）
 *       → 最多抓 12 门课程页（courseHint 模糊命中的排前面；4 个一批并发）→ 原样把 HTML 交给内容脚本用 DOMParser 解析（gradescope-parse.js）。
 * 结果缓存在 chrome.storage.session.bc_gs_cache 10 分钟（只缓存已登录的结果），force:true 跳过缓存。
 * 会话维持：安装 / 启动时建 alarm bc-gs-keepalive（每 6 小时），到点若设置 gradescope.enabled && gradescope.keepAlive 就访问一次 /account 刷新 cookie，
 * 并把 loggedIn / lastKeepAlive 合并进 chrome.storage.local.bc_gradescope（不动 courses）。 */
const GS_BASE = "https://www.gradescope.com";
const GS_CACHE_KEY = "bc_gs_cache", GS_CACHE_TTL = 10 * 60 * 1000, GS_MAX_COURSES = 12, GS_BATCH = 4, GS_ALARM = "bc-gs-keepalive";

async function gsFetchText(path) {
  const r = await fetch(GS_BASE + path, { credentials: "include", redirect: "follow", cache: "no-store" });
  return { url: r.url || "", status: r.status, html: await r.text() };
}
// 未登录：/account 被重定向到 /login，或页面里有登录表单
function gsIsLogin(finalUrl, html) {
  return /\/login(\/|\?|#|$)/.test(finalUrl || "") || /session\[email\]|id="session_email"/.test(html || "");
}
function gsText(s) {
  return String(s || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0*39;|&#x27;|&apos;/gi, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
// 瘦身：去掉 script / style / svg / 注释，课程页原本几百 KB，存缓存和传消息都轻些（作业表在普通 HTML 里，不受影响）
function gsSlim(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
}
/* /account 页里的课程：<a href="/courses/123" class="courseBox …"><h3 class="courseBox--shortname">CS 206</h3><div class="courseBox--name">…</div></a>
 * 学期分组标题 <… class="courseList--term">Fall 2026</…> 在各组课程前面，取离锚点最近的一个当 termHint。
 * 也接受没有 courseBox 类的普通 /courses/<id> 链接（用链接文字当课程名）。 */
function gsParseCourses(html) {
  const out = new Map();
  const terms = [];
  const termRe = /<[a-z0-9]+\b[^>]*class="[^"]*courseList--term\b[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi;
  let m;
  while ((m = termRe.exec(html))) terms.push({ at: m.index, text: gsText(m[1]) });
  const termAt = idx => { let t = ""; for (const x of terms) { if (x.at < idx) t = x.text; else break; } return t; };
  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((m = aRe.exec(html))) {
    const attrs = m[1], inner = m[2];
    const h = attrs.match(/href\s*=\s*["']?(?:https?:\/\/(?:www\.)?gradescope\.com)?\/courses\/(\d+)\/?["'\s>]/i);
    if (!h) continue;
    const id = h[1];
    const cls = (attrs.match(/class\s*=\s*["']([^"']*)["']/i) || [])[1] || "";
    const isBox = /\bcourseBox\b/.test(cls) || /courseBox--/.test(inner);
    const short = isBox ? gsText((inner.match(/class="[^"]*courseBox--shortname[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/i) || [])[1]) : "";
    const name = isBox ? gsText((inner.match(/class="[^"]*courseBox--name[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/i) || [])[1]) : "";
    const text = gsText(inner);
    const c = { id, shortname: short, name: name || (short ? "" : text), termHint: termAt(m.index) };
    if (!c.shortname && !c.name) continue;
    const prev = out.get(id);
    if (!prev || (isBox && !prev._box)) out.set(id, Object.assign(c, { _box: isBox }));
  }
  return [...out.values()].map(c => ({ id: c.id, shortname: c.shortname, name: c.name, termHint: c.termHint }));
}
// courseHint（Canvas 课程名，如 "01:198:206:01 INTRO DISCRETE STRUCT"）模糊命中的课程排前面：课号数字命中 ×2 + 长词命中；其余保持页面顺序
function gsRank(courses, hint) {
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const hn = norm(hint);
  if (!hn) return courses;
  const codes = [...new Set(hn.match(/\d{3,}/g) || [])].filter(c => !/^(19|20)\d\d$/.test(c));
  const toks = [...new Set(hn.split(" ").filter(w => w.length >= 4 && !/^\d+$/.test(w)))];
  return courses.map((c, i) => {
    const gn = norm([c.shortname, c.name].filter(Boolean).join(" "));
    const score = codes.filter(x => gn.includes(x)).length * 2 + toks.filter(t => gn.includes(t)).length;
    return { c, i, score };
  }).sort((a, b) => b.score - a.score || a.i - b.i).map(x => x.c);
}
async function gsFetchAll(courseHint) {
  const acct = await gsFetchText("/account");
  if (gsIsLogin(acct.url, acct.html)) return { ok: true, loggedIn: false };
  if (acct.status >= 400) throw new Error(`Gradescope HTTP ${acct.status}`);
  const all = gsParseCourses(acct.html);
  const picked = gsRank(all, courseHint).slice(0, GS_MAX_COURSES);
  const courses = [];
  for (let i = 0; i < picked.length; i += GS_BATCH) {
    const res = await Promise.all(picked.slice(i, i + GS_BATCH).map(async c => {
      try {
        const r = await gsFetchText(`/courses/${c.id}`);
        if (gsIsLogin(r.url, r.html) || r.status >= 400) return null;
        return { id: c.id, name: c.name, shortname: c.shortname, termHint: c.termHint, html: gsSlim(r.html) };
      } catch (e) { return null; }
    }));
    res.forEach(r => { if (r) courses.push(r); });
  }
  return { ok: true, loggedIn: true, courses, total: all.length, truncated: all.length > picked.length, fetchedAt: Date.now() };
}
async function gsFetch({ courseHint, force }) {
  const hint = String(courseHint || "");
  if (!force) {
    try {
      const c = (await chrome.storage.session.get(GS_CACHE_KEY))[GS_CACHE_KEY];
      // 课程超过上限时结果依赖 courseHint 的排序，hint 变了就重抓
      if (c && c.result && Date.now() - (c.at || 0) < GS_CACHE_TTL && (!c.result.truncated || c.hint === hint)) return c.result;
    } catch (e) {}
  }
  const result = await gsFetchAll(hint);
  gsRecord({ loggedIn: !!result.loggedIn }).catch(() => {});
  if (result.loggedIn) { try { await chrome.storage.session.set({ [GS_CACHE_KEY]: { at: Date.now(), hint, result } }); } catch (e) {} }
  return result;
}
// 把登录状态等字段合并进 chrome.storage.local.bc_gradescope（不覆盖 courses）
async function gsRecord(fields) {
  const cur = (await chrome.storage.local.get("bc_gradescope")).bc_gradescope || { loggedIn: false, courses: {}, updatedAt: 0 };
  await chrome.storage.local.set({ bc_gradescope: Object.assign(cur, fields, { updatedAt: Date.now() }) });
}
function gsScheduleKeepAlive() { try { chrome.alarms.create(GS_ALARM, { periodInMinutes: 360 }); } catch (e) {} }
chrome.runtime.onInstalled.addListener(gsScheduleKeepAlive);
chrome.runtime.onStartup.addListener(gsScheduleKeepAlive);
if (chrome.alarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener(async a => {
    if (!a || a.name !== GS_ALARM) return;
    try {
      const s = (await chrome.storage.local.get("bc_settings")).bc_settings || {};
      const g = Object.assign({ enabled: true, keepAlive: true }, s.gradescope || {});
      if (!g.enabled || !g.keepAlive) return;
      const r = await keepAlive(gsFetchText("/account"));
      await gsRecord({ loggedIn: !gsIsLogin(r.url, r.html), lastKeepAlive: Date.now() });
    } catch (e) {}
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "bc-gs-fetch") {
    keepAlive(gsFetch(msg)).then(sendResponse)
      .catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true;
  }
  // New Quizzes iframe 里的脚本要顶层 Canvas 页面的地址（题库按课程归档）；frame 自己的 URL 和 referrer 都没有课程 id
  if (msg.type === "bc-top-url") {
    sendResponse({ ok: true, url: (sender.tab && sender.tab.url) || "", title: (sender.tab && sender.tab.title) || "" });
    return;
  }
  if (msg.type === "bc-kaltura-seen") {
    const tabId = sender.tab ? sender.tab.id : -1;
    chrome.storage.session.get("kaltura_seen_" + tabId).then(o => sendResponse({ ok: true, urls: o["kaltura_seen_" + tabId] || [] }))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
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
  if (msg.type === "bc-fetch") {
    // 代理跨域请求（Kaltura 讲座视频 / 字幕）：带浏览器 cookie，只放行 kaltura.com 与 instructure.com，避免变成开放代理；商店版没有 kaltura 权限，只剩 instructure.com
    const okHost = (STORE_EDITION ? /^https:\/\/([\w-]+\.)*instructure\.com(\/|$)/i : /^https:\/\/([\w-]+\.)*(kaltura\.com|instructure\.com)(\/|$)/i).test(msg.url || "");
    if (!okHost) { sendResponse({ ok: false, error: BC.t("不允许的域名") }); return; }
    keepAlive((async () => {
      const r = await fetch(msg.url, { method: msg.method || "GET", credentials: "include", redirect: "follow",
        headers: msg.as === "probe" ? { Range: "bytes=0-0" } : {} });
      const out = { ok: true, status: r.status, finalUrl: r.url, contentType: r.headers.get("content-type") || "",
        contentLength: r.headers.get("content-range") ? (r.headers.get("content-range").split("/")[1] || "") : (r.headers.get("content-length") || "") };
      if (msg.as === "probe") { try { await r.body?.cancel(); } catch (e) {} return out; }
      if (msg.as === "bytes") {   // 二进制（HLS 分段跨域被拒时的兜底），base64 回传
        if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = ""; for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
        out.body = btoa(bin); return out;
      }
      const text = await r.text();
      if (msg.as === "json") { try { out.body = JSON.parse(text); } catch (e) { out.ok = false; out.error = BC.t("接口返回的不是 JSON：{text}", { text: text.slice(0, 120) }); } }
      else out.body = text;
      if (!r.ok && msg.as !== "probe") { out.ok = false; out.error = `HTTP ${r.status}`; }
      return out;
    })()).then(sendResponse).catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true;
  }
  if (msg.type === "bc-download") {
    // 一键下载课程资料：存到 下载/PotatoCanvas/<课程>/<文件夹>/<文件名>，重名自动加序号
    chrome.downloads.download({ url: msg.url, filename: msg.filename, conflictAction: "uniquify", saveAs: false })
      .then(id => sendResponse({ ok: true, id }))
      .catch(e => sendResponse({ ok: false, error: e && e.message ? e.message : String(e) }));
    return true;
  }
  if (msg.type === "bc-reader-export") {
    // 弹窗发起：抓当前标签页里的阅读器正文（单节或自动翻页到书末），导出 PDF（打开打印页）或 Markdown（下载）
    if (!HAS_READER) { sendResponse({ ok: false, error: BC.t("这个版本不包含该功能") }); return; }
    const tabId = msg.tabId != null ? msg.tabId : (sender.tab ? sender.tab.id : -1);
    if (tabId < 0) { sendResponse({ ok: false, error: BC.t("没有目标标签页") }); return; }
    ReaderExport.status(tabId).then(cur => {
      if (cur && cur.status === "running" && Date.now() - (cur.ts || 0) < ReaderExport.RESUME_AGE) { sendResponse({ ok: false, error: BC.t("这个标签页已经在导出中") }); return; }
      keepAlive(ReaderExport.run({ tabId, mode: msg.mode === "md" ? "md" : "pdf", opts: msg.opts || {} })).catch(() => {});
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === "bc-reader-status") {
    if (!HAS_READER) { sendResponse({ ok: false, error: BC.t("这个版本不包含该功能") }); return; }
    ReaderExport.status(msg.tabId).then(job => sendResponse({ ok: true, job })); return true;
  }
  if (msg.type === "bc-anywhere") {
    // 在所有网站启用 / 停用助手：注册或注销动态内容脚本（权限申请在弹窗里完成，那里有用户手势）
    (msg.enable ? registerAnywhere() : unregisterAnywhere()).then(() => sendResponse({ ok: true }))
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
