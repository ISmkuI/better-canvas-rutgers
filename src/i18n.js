/* 界面语言：默认跟随浏览器 / 系统语言（chrome.i18n.getUILanguage），设置里可改（ui.lang: "auto" | "zh" | "en"）。
 * 用法：BC.t("中文原文") → 当前语言的文本；带变量：BC.t("本页有 {n} 个视频", { n })（中英文模板都用 {name} 占位）。
 * 各模块在自己文件顶部用 BC.i18n.add({ "中文": "English", ... }) 登记英文词条；没登记的词条按原文（中文）返回，
 * 所以漏译不会报错。词典键是完整的中文句子，改中文文案时记得同步改键。
 * 不依赖 BC.storage（弹窗页、后台注入的 frame 也用），直接读 chrome.storage.local.bc_settings.ui.lang；
 * 设置变化时自动切换，由各模块自己决定是否重绘。 */
// 后台 service worker 里没有 window：用 globalThis（background.js 用 importScripts("i18n.js") 引入）
var BC = globalThis.BC = globalThis.BC || {};   // var：可重复声明，别的脚本再写 window.BC 也不冲突
BC.i18n = {
  lang: "zh",          // 已解析的当前语言："zh" | "en"
  setting: "auto",     // 设置项原值
  _dict: {},
  _listeners: [],

  add(map) { Object.assign(BC.i18n._dict, map); },

  // 浏览器界面语言 → zh / en（中文各变体都算 zh，其它一律 en）
  detect() {
    let l = "";
    try { l = (chrome.i18n && chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) || ""; } catch (e) {}
    if (!l) { try { l = navigator.language || (navigator.languages || [])[0] || ""; } catch (e) {} }
    return /^zh/i.test(l || "") ? "zh" : "en";
  },
  resolve(setting) { return setting === "zh" || setting === "en" ? setting : BC.i18n.detect(); },
  setLang(setting) {
    BC.i18n.setting = setting || "auto";
    const next = BC.i18n.resolve(setting);
    const changed = next !== BC.i18n.lang;
    BC.i18n.lang = next;
    try { if (typeof document !== "undefined") document.documentElement.setAttribute("data-bc-lang", next); } catch (e) {}
    if (changed) BC.i18n._listeners.forEach(fn => { try { fn(next); } catch (e) {} });
    return next;
  },
  onChange(fn) { BC.i18n._listeners.push(fn); },
  // 读一次设置并应用；返回语言
  async init() {
    try {
      const d = await new Promise(res => chrome.storage.local.get("bc_settings", res));
      const s = (d && d.bc_settings) || {};
      return BC.i18n.setLang(s.ui && s.ui.lang);
    } catch (e) { return BC.i18n.setLang("auto"); }
  },
  isEn() { return BC.i18n.lang === "en"; },
  // toLocaleDateString 等用的 locale
  locale() { return BC.i18n.lang === "en" ? "en-US" : "zh-CN"; },

  t(key, vars) {
    let s = BC.i18n.lang === "en" ? (BC.i18n._dict[key] !== undefined ? BC.i18n._dict[key] : key) : key;
    if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return s;
  },
  // 中 / 英各写一份时用：BC.i18n.pick("中文", "English")
  pick(zh, en) { return BC.i18n.lang === "en" ? en : zh; }
};
BC.t = (key, vars) => BC.i18n.t(key, vars);

// 还没读到设置前先按系统语言；随后读设置，设置变化时跟着切
BC.i18n.lang = BC.i18n.detect();
try {
  BC.i18n.init();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.bc_settings) return;
    const s = changes.bc_settings.newValue || {};
    BC.i18n.setLang(s.ui && s.ui.lang);
  });
} catch (e) {}
