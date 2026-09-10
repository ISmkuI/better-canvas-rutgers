/* 弹窗：「常用」（主开关 + 助手全站开关 + 清缓存）和「🔒 高级功能」（讲座视频开关 + 阅读器导出，需要小时密码解锁，见 src/gate.js）。
 * 直接读写 chrome.storage.local.bc_settings；界面文案走 BC.i18n（静态文本用 data-i18n 标记，动态文本用 BC.t）。 */
BC.i18n.add({
  // 标签页
  "常用": "General",
  "🔒 高级功能": "🔒 Advanced",
  // 常用
  "主题美化": "Theme",
  "卡片成绩": "Grades on cards",
  "自定义面板": "Custom panels",
  "消息铃铛": "Message bell",
  "完整设置（颜色、背景、关键词、期中期末）：在 Canvas 页面点右下角 ⚙ 按钮。": "Full settings (colors, background, keywords, midterm / final): click the ⚙ button at the bottom right of any Canvas page.",
  "✨ 学习助手": "✨ Study Assistant",
  "在所有网站启用助手（双击 / 选中 / 右键 / 快捷键 / 📖）": "Enable the assistant on all websites (double-click / selection / right-click / shortcut / 📖)",
  "开启后会申请「访问所有网站」权限；Canvas 之外的页面只加载助手浮窗、题库和学习工具（页面对话 / 闪卡 / 练习），不加载 Canvas 专用功能。": "Turning this on requests the “access all websites” permission. Outside Canvas only the assistant popover, question bank and study tools (page chat / flashcards / practice) load, not the Canvas-specific features.",
  "没有授权，未开启。": "Permission not granted; not enabled.",
  "注册失败：{msg}": "Registration failed: {msg}",
  "无响应": "No response",
  "已开启：刷新其他网站的页面即可使用（Canvas 之外只加载助手和学习工具）。": "Enabled: refresh pages on other sites to use it (outside Canvas only the assistant and study tools load).",
  "已关闭。": "Disabled.",
  "失败：{msg}": "Failed: {msg}",
  "清除数据缓存（重新拉取成绩/消息）": "Clear data cache (re-fetch grades / messages)",
  "已清除，刷新 Canvas 页面生效": "Cleared; refresh Canvas pages to apply",
  // 高级功能
  "这些功能与 Canvas 无关且依赖网站权限，默认锁定。": "These features are unrelated to Canvas and rely on site permissions, so they are locked by default.",
  "🎬 讲座视频": "🎬 Lecture videos",
  "🎬 讲座视频下载 / 转写标签": "🎬 Lecture video download / transcript tab",
  "📕 阅读器导出（eText / Revel / EPUB 网页书）": "📕 Reader export (eText / Revel / EPUB web books)",
  "清理界面（去掉工具栏、浮层）": "Clean up the UI (remove toolbars, overlays)",
  "破解打印限制（剔除 @media print）": "Bypass print restrictions (strip @media print)",
  "强制懒加载（自动滚动）": "Force lazy loading (auto-scroll)",
  "每步滚动间隔（毫秒）": "Scroll interval per step (ms)",
  "连续导出（自动翻页到书末）": "Continuous export (auto-page to the end)",
  "最多导出节数": "Max sections to export",
  "每节之间停顿（毫秒，防限流）": "Pause between sections (ms, avoids throttling)",
  "🖨 打印为 PDF": "🖨 Print to PDF",
  "⬇ 下载 Markdown": "⬇ Download Markdown",
  "导出日志": "Export log",
  "复制": "Copy",
  "在打开教材阅读器的标签页上点按钮。第一次会请求访问阅读器所在网站的权限。连续导出会自动点「下一页」，期间别动那个标签页。": "Click the buttons on the tab that has the textbook reader open. The first time it asks for permission to access the reader's site. Continuous export clicks “Next” automatically; leave that tab alone meanwhile.",
  "日志已复制": "Log copied",
  "当前标签页不是网页（chrome:// 之类的页面无法注入）": "The current tab is not a web page (chrome:// pages can't be injected)",
  "申请访问权限…": "Requesting access…",
  "没有授权访问这个网站，无法读取阅读器内容": "No permission to access this site, so the reader content can't be read",
  "后台没有响应": "Background did not respond",
  "⏳ 定位正文…": "⏳ Locating content…",
  "⏳ {msg}（已 {n} 节）": "⏳ {msg} ({n} sections so far)",
  // 解锁门
  "🔒 高级功能已锁定": "🔒 Advanced features are locked",
  "输入本小时密码解锁；解锁后这台浏览器会记住，不用再输。": "Enter this hour's password to unlock. Once unlocked, this browser remembers it and won't ask again.",
  "解锁": "Unlock",
  "密码不对或已过期（每小时更换）": "Wrong or expired password (it changes every hour)",
  "密码由独立生成器提供（tools/gate-password）。": "Passwords come from the standalone generator (tools/gate-password).",
  "✅ 本机已绑定 ·": "✅ This browser is bound ·",
  "解除绑定": "Unbind"
});

const DEFAULTS = {
  theme: { enabled: true },
  cards: { showGrade: true },
  blocks: { enabled: true },
  messages: { enabled: true },
  advanced: { videos: true },
  readerExport: { cleanUI: true, breakPrint: true, forceLazy: true, scrollInterval: 120, continuous: false, maxPages: 300, pageDelay: 1500 }
};

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}
function set(obj, path, val) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = (o[keys[i]] = o[keys[i]] || {});
  o[keys[keys.length - 1]] = val;
}
const loadSettings = () => new Promise(res => chrome.storage.local.get("bc_settings", d => res(d.bc_settings || {})));
const $ = id => document.getElementById(id);
/* 商店版（scripts/build-store.js 打包：注入 src/edition.js 置 BC.EDITION="store"，并去掉 gate.js 的 <script>）：
 * 没有「🔒 高级功能」分页（讲座视频 / 阅读器导出 / 解锁门），也没有「在所有网站启用助手」（需要全站 optional_host_permissions）。
 * 开发仓库里没有 edition.js → BC.EDITION 为 undefined，且 gate.js 存在 → 完整版。gate.js 缺失时同样按商店版处理，避免下面直接调 BC.gate 报错。 */
const STORE_EDITION = !!(window.BC && BC.EDITION === "store") || !(window.BC && BC.gate);

/* ---------- 语言：静态文本按 data-i18n 翻译（中文原文就是元素内容，所以 zh 什么都不用做） ---------- */
function applyI18n() {
  document.documentElement.lang = BC.i18n.lang;
  if (BC.i18n.lang !== "en") return;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = BC.t(el.dataset.i18n); });
}
const ready = BC.i18n.init().then(applyI18n).catch(() => {});

/* ---------- 标签页 ---------- */
(function () {
  const panes = { main: $("pane-main"), adv: $("pane-adv") };
  if (STORE_EDITION) {   // 商店版：整个「高级功能」分页连同标签按钮一起拿掉；只剩一页时标签栏也不显示
    document.querySelector('.tabs button[data-tab="adv"]')?.remove();
    panes.adv?.remove(); delete panes.adv;
    const bar = document.querySelector(".tabs"); if (bar) bar.hidden = true;
  }
  const btns = [...document.querySelectorAll(".tabs button")];
  function show(name) {
    if (!panes[name]) name = "main";
    btns.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    Object.keys(panes).forEach(k => { panes[k].hidden = k !== name; });
    try { localStorage.setItem("bc_popup_tab", name); } catch (e) {}
  }
  btns.forEach(b => b.addEventListener("click", () => show(b.dataset.tab)));
  let last = "main";
  try { last = localStorage.getItem("bc_popup_tab") || "main"; } catch (e) {}
  show(last);
})();

/* ---------- 设置开关（data-path） ---------- */
chrome.storage.local.get("bc_settings", d => {
  const s = d.bc_settings || {};
  document.querySelectorAll("input[data-path]").forEach(input => {
    const path = input.dataset.path;
    const isNum = input.type === "number";
    const cur = get(s, path);
    const val = cur === undefined ? get(DEFAULTS, path) : cur;
    if (isNum) input.value = val; else input.checked = !!val;
    input.addEventListener("change", () => {
      chrome.storage.local.get("bc_settings", dd => {
        const ns = dd.bc_settings || {};
        let v = isNum ? +input.value : input.checked;
        if (isNum && (!isFinite(v) || v <= 0)) { v = get(DEFAULTS, path); input.value = v; }
        set(ns, path, v);
        chrome.storage.local.set({ bc_settings: ns });
      });
    });
  });
});

/* 在所有网站启用助手：权限申请必须在有用户手势的扩展页面里做，所以放这里而不是 Canvas 内的设置面板 */
(function () {
  const cb = $("everywhere");
  const note = $("ev-note");
  if (!cb) return;
  if (STORE_EDITION) {   // 商店版没有全站权限：去掉这一行、说明文字和它上面的「✨ 学习助手」小标题
    const row = cb.closest(".row"), sec = row && row.previousElementSibling;
    if (sec && sec.classList.contains("sec")) sec.remove();
    row?.remove(); note?.remove();
    return;
  }
  loadSettings().then(s => { cb.checked = !!(s.assistant && s.assistant.everywhere); });
  cb.addEventListener("change", async () => {
    const want = cb.checked;
    cb.disabled = true;
    try {
      if (want) {
        const origins = ["https://*/*", "http://*/*"];
        const has = await chrome.permissions.contains({ origins });
        const ok = has || await chrome.permissions.request({ origins });
        if (!ok) { cb.checked = false; note.textContent = BC.t("没有授权，未开启。"); return; }
      }
      const s = await loadSettings();
      s.assistant = s.assistant || {};
      s.assistant.everywhere = want;
      await new Promise(res => chrome.storage.local.set({ bc_settings: s }, res));
      const r = await chrome.runtime.sendMessage({ type: "bc-anywhere", enable: want });
      if (!r || !r.ok) { note.textContent = BC.t("注册失败：{msg}", { msg: (r && r.error) || BC.t("无响应") }); cb.checked = !want; return; }
      note.textContent = want ? BC.t("已开启：刷新其他网站的页面即可使用（Canvas 之外只加载助手和学习工具）。") : BC.t("已关闭。");
    } catch (e) { note.textContent = BC.t("失败：{msg}", { msg: e.message }); cb.checked = !want; }
    finally { cb.disabled = false; }
  });
})();

$("clear").addEventListener("click", () => {
  chrome.storage.local.get(null, all => {
    const keys = Object.keys(all).filter(k => k.startsWith("bc_cache_"));
    chrome.storage.local.remove(keys, () => {
      $("clear").textContent = BC.t("已清除，刷新 Canvas 页面生效");
    });
  });
});

/* ---------- 高级功能的解锁门 ---------- */
const gateUI = {
  timer: 0,
  async render() {
    const lock = $("adv-lock"), feats = $("adv-features");
    clearInterval(gateUI.timer);
    let on = false;
    try { on = await BC.gate.isUnlocked(); } catch (e) {}
    feats.hidden = !on;
    lock.hidden = on;
    if (on) { lock.innerHTML = ""; return; }
    gateUI.lockCard(lock);
  },
  lockCard(box) {
    box.innerHTML = "";
    const card = document.createElement("div"); card.className = "lock";
    const h = document.createElement("h3"); h.textContent = BC.t("🔒 高级功能已锁定");
    const p = document.createElement("p"); p.className = "note"; p.textContent = BC.t("输入本小时密码解锁；解锁后这台浏览器会记住，不用再输。");
    const inRow = document.createElement("div"); inRow.className = "in";
    const input = document.createElement("input"); input.type = "text"; input.placeholder = "XXXX-XXXX"; input.maxLength = 9; input.autocomplete = "off"; input.spellcheck = false;
    const go = document.createElement("button"); go.type = "button"; go.className = "primary"; go.textContent = BC.t("解锁");
    inRow.append(input, go);
    const err = document.createElement("p"); err.className = "note err"; err.hidden = true;
    const src = document.createElement("p"); src.className = "note"; src.textContent = BC.t("密码由独立生成器提供（tools/gate-password）。");
    card.append(h, p, inRow, err, src);
    box.appendChild(card);

    // 输入框：自动大写，4 位后自动补横线（有没有横线都能验证）
    input.addEventListener("input", () => {
      const raw = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      input.value = raw.length > 4 ? raw.slice(0, 4) + "-" + raw.slice(4) : raw;
      err.hidden = true;
    });
    const tryUnlock = async () => {
      go.disabled = true;
      try {
        const ok = await BC.gate.unlock(input.value);
        if (ok) { await gateUI.render(); return; }
        err.textContent = BC.t("密码不对或已过期（每小时更换）"); err.hidden = false; input.select();
      } catch (e) { err.textContent = BC.t("失败：{msg}", { msg: e.message }); err.hidden = false; }
      finally { go.disabled = false; }
    };
    go.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });
    setTimeout(() => input.focus(), 0);
  }
};
if (!STORE_EDITION) {
  $("gate-unbind").addEventListener("click", async () => {
    try { await BC.gate.unbind(); } catch (e) {}
    gateUI.render();
  });
  ready.then(() => gateUI.render());
  BC.gate.onChange(() => gateUI.render());   // 别处（Canvas 页 / 另一个弹窗）改了绑定状态也跟着刷新
}

/* ---------- 阅读器导出（商店版没有：分页已被移除，元素不存在，整段跳过） ---------- */
(function () {
if (STORE_EDITION) return;
const rxStatus = $("rx-status");
const rxBtns = [$("rx-pdf"), $("rx-md")];
let rxTimer = 0;
function say(text, cls) { rxStatus.textContent = text; rxStatus.className = "note " + (cls || ""); }
// 后台记的步骤日志（导出断了时看最后几行就知道停在哪）；有内容才显示
function showLog(job) {
  const box = $("rx-log"), pre = $("rx-log-pre");
  const lines = (job && job.log) || [];
  box.hidden = !lines.length;
  if (lines.length && pre.textContent !== lines.join("\n")) { pre.textContent = lines.join("\n"); pre.scrollTop = pre.scrollHeight; }
}
$("rx-log-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("rx-log-pre").textContent).then(() => say(BC.t("日志已复制"), "ok"));
});

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
// 注入需要阅读器所在域名的 host 权限：把这个标签页里所有 https frame 的源都申请一遍（optional_host_permissions 已声明 https://*/*）
async function ensureOrigins(tabId, topUrl) {
  const urls = [topUrl];
  try { (await chrome.webNavigation.getAllFrames({ tabId }) || []).forEach(f => urls.push(f.url)); } catch (e) {}
  // blob: frame 的源是创建它的页面（new URL("blob:https://x/..").origin 就是 https://x）
  const origins = [...new Set(urls.filter(u => /^(https?:|blob:https?:)/.test(u || "")).map(u => { try { const o = new URL(u).origin; return /^https?:/.test(o) ? o + "/*" : null; } catch (e) { return null; } }).filter(Boolean))];
  if (!origins.length) return true;
  if (await chrome.permissions.contains({ origins })) return true;
  return chrome.permissions.request({ origins });
}
function pollStatus(tabId) {
  clearInterval(rxTimer);
  rxTimer = setInterval(async () => {
    let r; try { r = await chrome.runtime.sendMessage({ type: "bc-reader-status", tabId }); } catch (e) { return; }
    const job = r && r.job;
    if (!job) return;
    showLog(job);
    if (job.status === "running") { say(BC.t("⏳ {msg}（已 {n} 节）", { msg: job.msg, n: job.pages })); return; }
    clearInterval(rxTimer);
    rxBtns.forEach(b => b.disabled = false);
    if (job.status === "error") say("✕ " + job.msg, "err");
    else say("✓ " + job.msg + (job.warn ? BC.i18n.pick("；", "; ") + job.warn : ""), "ok");
  }, 600);
}
async function startExport(mode) {
  rxBtns.forEach(b => b.disabled = true);
  try {
    const tab = await activeTab();
    if (!tab || !/^https?:/.test(tab.url || "")) throw new Error(BC.t("当前标签页不是网页（chrome:// 之类的页面无法注入）"));
    say(BC.t("申请访问权限…"));
    if (!(await ensureOrigins(tab.id, tab.url))) throw new Error(BC.t("没有授权访问这个网站，无法读取阅读器内容"));
    const s = await loadSettings();
    const opts = Object.assign({}, DEFAULTS.readerExport, s.readerExport || {});
    const r = await chrome.runtime.sendMessage({ type: "bc-reader-export", tabId: tab.id, mode, opts });
    if (!r || !r.ok) throw new Error((r && r.error) || BC.t("后台没有响应"));
    say(BC.t("⏳ 定位正文…"));
    pollStatus(tab.id);
  } catch (e) {
    say("✕ " + (e && e.message ? e.message : String(e)), "err");
    rxBtns.forEach(b => b.disabled = false);
  }
}
$("rx-pdf").addEventListener("click", () => startExport("pdf"));
$("rx-md").addEventListener("click", () => startExport("md"));
// 弹窗重新打开时，如果这个标签页还在导出中就接着显示进度
activeTab().then(tab => tab && pollStatus(tab.id)).catch(() => {});
})();
