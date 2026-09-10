/* 新手引导页（扩展页面，首次安装时打开；设置面板「📖 新手教程 → 安装引导页」也能打开）。
 * 5 步：欢迎 + 语言 → 外观预设 → 仪表盘开关 → 学习助手 → 完成。
 * 每一步改动都直接写进 chrome.storage.local.bc_settings（通过 BC.storage.patch 合并），没有「保存」按钮；不联网。
 * 静态文案用 data-i18n（中文原文即 key），动态文案用 BC.t；切换语言后整页重新套用一遍。 */
BC.i18n.add({
  "新手引导 · 一分钟配好": "Getting started · one minute to set up",
  "👋 欢迎使用 PotatoCanvas": "👋 Welcome to PotatoCanvas",
  "给 Rutgers Canvas 加上这些东西：": "It adds these to Rutgers Canvas:",
  "外观主题": "Themes",
  "十来个预设风格（暗夜 / 清新 / 像素风 / 赛博朋克…），还能自己调色、换背景。": "A dozen presets (Dark / Fresh / Pixel / Cyberpunk…), plus your own colors and background.",
  "卡片成绩与班级均分": "Grades and class averages on cards",
  "课程卡旁直接看总评、GPA、班级均分和 Section，不用一门门点进去。": "See your total, GPA, class average and section right on each course card.",
  "仪表盘面板": "Dashboard panels",
  "本周截止、期中期末倒计时、今日课程、最新消息，都放在仪表盘顶部。": "Due this week, midterm / final countdown, today's classes and latest messages, all at the top of the dashboard.",
  "学习助手（可选）": "Study assistant (optional)",
  "选中文字提问、页面对话、闪卡、练习题。需要自备模型 API key，只从你的浏览器直连。": "Ask about selected text, chat with the page, flashcards, practice questions. Bring your own API key; calls go straight from your browser.",
  "界面语言": "UI language",
  "跟随系统": "Follow system",
  "🎨 选一个外观": "🎨 Pick a look",
  "点一下就生效，之后随时可以在设置里换。": "One click applies it; you can change it in settings any time.",
  "📊 仪表盘": "📊 Dashboard",
  "这些默认都是开着的，不想要的关掉即可。": "All of these are on by default; turn off what you don't want.",
  "卡片成绩": "Grades on cards",
  "每张课程卡旁显示总评 / GPA / 班级均分 / Section": "Total / GPA / class average / section next to each course card",
  "自定义面板": "Custom panels",
  "仪表盘顶部：本周截止、GPA、倒计时、今日课程、最新消息": "Top of the dashboard: due this week, GPA, countdown, today's classes, latest messages",
  "隐藏 Canvas 自带的 To Do / Recent Feedback": "Hide Canvas's own To Do / Recent Feedback",
  "本周截止面板已经覆盖了它们的功能，右侧栏会清爽很多": "The due-this-week panel already covers them; the sidebar gets much cleaner",
  "鼠标拖尾": "Cursor trail",
  "样式跟随预设主题；没选预设时不显示": "Style follows the preset theme; hidden when no preset is selected",
  "右键助手菜单": "Right-click assistant menu",
  "选中文字后右键直接弹出助手（思路 / 解答 / 概念 / 翻译）": "Right-click selected text to open the assistant (hint / solve / concept / translate)",
  "提示：仪表盘功能需要经典的卡片式仪表盘。如果你的 Canvas 首页是列表 / 最近活动视图，点右上角「⋮」→「Switch to old dashboard view / Card View」。": "Note: dashboard features need the classic card dashboard. If your Canvas home is the list / recent-activity view, click “⋮” at the top right → “Switch to old dashboard view / Card View”.",
  "✨ 学习助手（可选）": "✨ Study assistant (optional)",
  "填一个模型服务的 API key 就能用。现在不想填也没关系，之后在设置的「✨ 助手」里随时补。": "Paste an API key from a model provider and it works. Skipping is fine; you can add it later under “✨ Assistant” in settings.",
  "模型服务": "Provider",
  "模型（可选）": "Model (optional)",
  "默认：{model}": "Default: {model}",
  "接口地址（OpenAI 兼容，填到 /v1）": "Endpoint (OpenAI-compatible, up to /v1)",
  "自定义 OpenAI 兼容接口": "Custom OpenAI-compatible endpoint",
  "OpenRouter（聚合）": "OpenRouter (aggregator)",
  "通义千问 (DashScope)": "Qwen (DashScope)",
  "智谱 GLM": "Zhipu GLM",
  "✓ 已保存": "✓ Saved",
  "隐私：key 只保存在你这台浏览器的扩展存储里，不经过任何中间服务器。只有你主动提问时，选中的文字 / 页面内容 / 截图才会发给你选的这家模型服务。": "Privacy: the key is stored only in this browser's extension storage and never passes through any intermediate server. Only when you ask a question are the selected text / page content / screenshot sent, and only to the provider you chose.",
  "🎉 配好了": "🎉 All set",
  "接下来：": "Next:",
  "打开 Canvas 仪表盘": "Open the Canvas dashboard",
  "所有功能都在那里生效；第一次进去会有一个页内导览。": "Everything takes effect there; the first visit shows a short in-page tour.",
  "右下角 ⚙ 是完整设置": "⚙ at the bottom right is the full settings",
  "外观微调、面板排序、消息关键词、期中期末日期、助手模型都在里面。": "Theme tweaks, panel order, message keywords, midterm / final dates and the assistant model all live there.",
  "工具栏图标是快速开关": "The toolbar icon is the quick toggle",
  "主题 / 卡片成绩 / 面板 / 消息铃铛一键开关，还有清缓存。": "One-click switches for theme / card grades / panels / message bell, plus clear cache.",
  "打开 Canvas": "Open Canvas",
  "在 Canvas 里看一遍页内导览": "Replay the in-page tour on Canvas",
  "上一步": "Back",
  "下一步": "Next",
  "完成": "Done",
  "← → 方向键也能翻页": "← → arrow keys also turn pages"
});

const CANVAS_URL = "https://rutgers.instructure.com/";
const $ = id => document.getElementById(id);
const STEPS = 5;

// 与 src/assistant.js 的 BC.assistant.PRESETS 对齐（id / 显示名 / 默认模型）；引导页不加载 assistant.js，这里写死一份
const PROVIDERS = [
  ["anthropic",  "Claude (Anthropic)",       "claude-opus-5"],
  ["openai",     "OpenAI",                   "gpt-5"],
  ["gemini",     "Google Gemini",            "gemini-3.1-pro-preview"],
  ["deepseek",   "DeepSeek",                 "deepseek-chat"],
  ["kimi",       "Kimi (Moonshot)",          "kimi-k2-turbo-preview"],
  ["qwen",       "通义千问 (DashScope)",      "qwen-plus"],
  ["zhipu",      "智谱 GLM",                 "glm-4.5"],
  ["grok",       "xAI Grok",                 "grok-4"],
  ["groq",       "Groq",                     "llama-3.3-70b-versatile"],
  ["openrouter", "OpenRouter（聚合）",        "anthropic/claude-opus-5"],
  ["custom",     "自定义 OpenAI 兼容接口",    ""]
];
// themes.js 加载失败时的兜底列表（正常情况用 BC.themes.META）
const THEME_FALLBACK = [
  { id: "", name: "无", emoji: "🚫", desc: "关闭预设主题" },
  { id: "minimal", name: "简约", emoji: "⬜", desc: "干净留白 低饱和" },
  { id: "fresh", name: "清新", emoji: "🌿", desc: "薄荷渐变 圆润" },
  { id: "dark", name: "暗夜", emoji: "🌙", desc: "真正的深色配色，不反色" },
  { id: "blackwhite", name: "黑白", emoji: "🎞️", desc: "整页灰度 高对比" },
  { id: "seasons", name: "春夏秋冬", emoji: "🍂", desc: "随季节飘落的背景" },
  { id: "timeofday", name: "日出日落", emoji: "🌅", desc: "随时间的海岸天空" },
  { id: "pixel", name: "像素风", emoji: "👾", desc: "复古 8-bit" },
  { id: "cyberpunk", name: "赛博朋克", emoji: "🌃", desc: "霓虹 + 随机故障" },
  { id: "hacker", name: "黑客", emoji: "💻", desc: "黑底绿色字幕雨" },
  { id: "marathon", name: "马拉松", emoji: "🟡", desc: "红黄硬边 新粗野主义" }
];

const state = { step: 0, s: null };

function getPath(obj, path) { return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj); }
function setPath(obj, path, val) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = (o[keys[i]] = o[keys[i]] || {});
  o[keys[keys.length - 1]] = val;
}
// 合并写入：读最新设置 → 改 → 写回，本地 state.s 同步
async function patch(fn) {
  state.s = await BC.storage.patch(fn);
  return state.s;
}

/* ---------- 文案 ---------- */
function applyI18n() {
  document.documentElement.lang = BC.i18n.lang;
  document.title = "PotatoCanvas · " + BC.i18n.pick("新手引导", "Getting started");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = BC.t(el.dataset.i18n); });
  renderLang();
  renderGallery();
  renderProviders();
  updateNav();
}

/* ---------- 第 1 步：语言 ---------- */
function renderLang() {
  const sel = $("lang");
  const cur = (state.s.ui && state.s.ui.lang) || "auto";
  sel.innerHTML = "";
  const sys = BC.i18n.detect() === "zh" ? "中文" : "English";
  [["auto", BC.t("跟随系统") + " (" + sys + ")"], ["zh", "中文"], ["en", "English"]].forEach(([v, t]) => {
    const o = document.createElement("option"); o.value = v; o.textContent = t; o.selected = v === cur; sel.appendChild(o);
  });
}
$("lang").addEventListener("change", async () => {
  const v = $("lang").value;
  await patch(s => { s.ui = s.ui || {}; s.ui.lang = v; });
  BC.i18n.setLang(v);
  applyI18n();
});

/* ---------- 第 2 步：外观预设 ---------- */
function renderGallery() {
  const gal = $("gallery");
  gal.innerHTML = "";
  const list = (window.BC && BC.themes && Array.isArray(BC.themes.META) && BC.themes.META.length) ? BC.themes.META : THEME_FALLBACK;
  const cur = (state.s.theme && state.s.theme.preset) || "";
  list.forEach(p => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "theme" + (p.id === cur ? " sel" : ""); b.dataset.id = p.id;
    const e = document.createElement("span"); e.className = "emoji"; e.textContent = p.emoji;
    const n = document.createElement("span"); n.className = "name"; n.textContent = BC.t(p.name);
    const d = document.createElement("small"); d.textContent = BC.t(p.desc);
    b.append(e, n, d);
    b.addEventListener("click", async () => {
      gal.querySelectorAll(".theme").forEach(c => c.classList.remove("sel"));
      b.classList.add("sel");
      await patch(s => {
        s.theme = s.theme || {};
        s.theme.preset = p.id;
        // 与 settings-ui 一致：换预设时清掉手调的背景 / 导航色 / 强调色，免得盖住预设
        if (p.id) { s.theme.pageBg = ""; s.theme.pageBgImage = ""; s.theme.navBg = ""; s.theme.navText = ""; s.theme.accent = ""; }
      });
    });
    gal.appendChild(b);
  });
}

/* ---------- 第 3 步：开关 ---------- */
function initToggles() {
  document.querySelectorAll("input[data-path]").forEach(input => {
    const path = input.dataset.path;
    const cur = getPath(state.s, path);
    input.checked = cur === undefined ? getPath(BC.DEFAULTS, path) !== false : !!cur;
    input.addEventListener("change", () => patch(s => {
      setPath(s, path, input.checked);
      if (input.dataset.also) setPath(s, input.dataset.also, input.checked);
    }));
  });
}

/* ---------- 第 4 步：助手 ---------- */
let savedTimer = 0;
function flashSaved() {
  const el = $("ai-saved");
  el.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { el.hidden = true; }, 1800);
}
function providerOf(id) { return PROVIDERS.find(p => p[0] === id) || PROVIDERS[PROVIDERS.length - 1]; }
function renderProviders() {
  const sel = $("provider");
  const a = state.s.assistant || {};
  const cur = a.provider || "anthropic";
  sel.innerHTML = "";
  PROVIDERS.forEach(([id, name]) => {
    const o = document.createElement("option"); o.value = id; o.textContent = BC.t(name); o.selected = id === cur; sel.appendChild(o);
  });
  syncProviderUI();
}
function syncProviderUI() {
  const id = $("provider").value;
  const [, , model] = providerOf(id);
  $("model").placeholder = model ? BC.t("默认：{model}", { model }) : "";
  $("baseurl-field").hidden = id !== "custom";
}
function initAssistant() {
  const a = state.s.assistant || {};
  $("apikey").value = a.apiKey || "";
  $("model").value = a.model || "";
  $("baseurl").value = a.baseUrl || "";
  $("provider").addEventListener("change", async () => {
    syncProviderUI();
    await patch(s => { s.assistant = s.assistant || {}; s.assistant.provider = $("provider").value; });
    flashSaved();
  });
  const bind = (id, key) => $(id).addEventListener("change", async () => {
    const v = $(id).value.trim();
    $(id).value = v;
    await patch(s => { s.assistant = s.assistant || {}; s.assistant[key] = v; });
    flashSaved();
  });
  bind("apikey", "apiKey");
  bind("model", "model");
  bind("baseurl", "baseUrl");
}

/* ---------- 第 5 步：完成 ---------- */
function openCanvas() {
  try { chrome.tabs.create({ url: CANVAS_URL }); }
  catch (e) { window.open(CANVAS_URL, "_blank"); }
}
$("open-canvas").addEventListener("click", openCanvas);
$("open-tour").addEventListener("click", () => {
  chrome.storage.local.set({ bc_tour_done: false }, openCanvas);
});

/* ---------- 步骤导航 ---------- */
function updateNav() {
  $("prev").disabled = state.step === 0;
  const last = state.step === STEPS - 1;
  $("next").hidden = last;
  $("next").textContent = BC.t("下一步");
  $("counter").textContent = (state.step + 1) + " / " + STEPS;
}
function go(n) {
  n = Math.max(0, Math.min(STEPS - 1, n));
  state.step = n;
  document.querySelectorAll(".step").forEach(sec => { sec.hidden = +sec.dataset.step !== n; });
  document.querySelectorAll("#dots li").forEach(li => {
    const i = +li.dataset.step;
    li.classList.toggle("on", i === n);
    li.classList.toggle("done", i < n);
  });
  updateNav();
  window.scrollTo({ top: 0 });
}
$("prev").addEventListener("click", () => go(state.step - 1));
$("next").addEventListener("click", () => go(state.step + 1));
document.querySelectorAll("#dots li").forEach(li => li.addEventListener("click", () => go(+li.dataset.step)));
document.addEventListener("keydown", e => {
  const tag = (e.target && e.target.tagName) || "";
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
  if (e.key === "ArrowRight") { e.preventDefault(); go(state.step + 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); go(state.step - 1); }
});

/* ---------- 启动 ---------- */
(async function init() {
  await BC.i18n.init();
  state.s = await BC.storage.get();
  initToggles();
  initAssistant();
  applyI18n();
  go(0);
})();
