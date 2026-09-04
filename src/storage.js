/* Better Canvas - 全局命名空间 / 工具函数 / 设置存储 / 缓存
 * 所有模块挂在 window.BC 下；多个 content script 共享同一 isolated world。 */
window.BC = window.BC || {};

/* ----------------------- 默认设置 ----------------------- */
BC.DEFAULTS = {
  theme: {
    enabled: true,
    preset: "",         // 预设主题 id（见 themes.js），空=不用预设
    cursorTrail: true,  // 鼠标拖尾（样式跟随预设主题；无预设时不显示）
    navBg: "",          // 左侧全局导航背景色，空=不改
    navText: "",        // 导航文字颜色
    pageBg: "",         // 页面背景色
    pageBgImage: "",    // 页面背景图 URL
    accent: "",         // 强调色（链接、按钮）
    cardRadius: "",     // 卡片圆角 px，空=默认
    cardShadow: false,  // 卡片是否加大阴影
    cardStyle: "default" // default | flat | glass
  },
  cards: {
    showGrade: true,    // 卡片右上角显示成绩
    showPoints: true,   // 同时显示 得分/总分
    groupBySubject: true // 按 Rutgers 科目代码分组卡片
  },
  blocks: {
    enabled: true,
    order: ["dueThisWeek", "gpa", "absence", "latest", "today", "examCountdown", "history"],  // 倒计时整行，其余同行
    // 迁移标记（默认 false 才会和老设置合并后触发）：老设置里新面板被追加到了末尾，第一次渲染时挪到指定位置
    absencePlaced: false,
    latestPlaced: false,
    todayPlaced: false,
    historyInSidebar: true,  // 历史课程放右侧栏底部（侧栏卡），而不是仪表盘整行
    latestCurrentTermOnly: true, // 「最新消息」只显示当前学期课程的消息
    visible: { dueThisWeek: true, gpa: true, examCountdown: true, absence: true, latest: true, today: true, history: true }
  },
  // 学习助手（assistant.js）：模型配置存本地，只从你的浏览器直连模型接口
  assistant: {
    enabled: true,
    trigger: "both",      // dblclick | select | both
    contextMenu: true,    // 右键点选中的文字时弹助手菜单（接管浏览器默认右键菜单）
    provider: "anthropic", // 见 BC.assistant.PRESETS
    model: "",            // 空 = 用该服务的默认模型
    apiKey: "",
    baseUrl: "",          // custom / 反代时填；OpenAI 兼容接口填到 /v1
    lang: "zh"            // zh | en
  },
  qbank: [],              // 题库：[{ id, ts, url, title, course, cid, question, answer, note, review }]
  flashcards: [],         // 闪卡卡组：[{ id, ts, title, course, cid, url, cards:[{ id, q, a, box, due, reviews }] }]
  summaries: [],          // 资料总结：[{ id, ts, cid, course, fileId, name, url, chars, summary }]
  // 手填每周课表（「今日课程」面板的来源之一）：[{ cid, name, days:[0-6], start:"HH:MM", end:"HH:MM", location }]
  schedule: [],
  // 「教授请假」面板：公告 / 私信里命中这些词的课程打 ×
  absenceWords: [
    "professor absence", "instructor absence", "absence", "absent", "no class", "class is cancel", "class cancel",
    "class will not meet", "no lecture", "lecture cancel", "lecture is cancel", "停课", "教授请假", "老师请假", "请假"
  ],
  sidebar: {
    gpaChart: true,       // 右侧栏 View Grades 上方的课程卡（开关）
    rightCard: "section", // 那张卡显示什么："section"（课程 Section，默认）| "gpa"（GPA 与各科差距）
    links: true,          // 右侧栏顶部的「常用网站」导航（见 links.js）
    linksEverywhere: false, // false = 只在仪表盘；true = 所有带右侧栏的页面
    linksOpen: null,      // 记住哪些分组是展开的；null = 全部展开
    hideTodo: true,       // 隐藏 Canvas 右侧栏自带的 To Do 列表（本周截止面板已覆盖它的功能）
    hideFeedback: true    // 隐藏 Canvas 右侧栏自带的 Recent Feedback
  },
  links: null,            // null = 用 BC.links.DEFAULTS；用户在设置里改过后存完整列表 [{group, emoji, name, url}]
  messages: {
    enabled: true,
    sources: { announcements: true, inbox: true },
    lookbackDays: 21
  },
  // 重要消息关键词分类 -> 决定高亮颜色
  importantRules: [
    { key: "quiz",      color: "#e8590c", label: "测验/考试", words: ["quiz","exam","midterm","final","test","测验","考试","期中","期末"] },
    { key: "room",      color: "#7048e8", label: "教室变动", words: ["room change","change of room","relocat","moved to","换教室","改教室","教室变","地点变"] },
    { key: "schedule",  color: "#1c7ed6", label: "时间/请假", words: ["cancel","canceled","cancelled","reschedul","postpone","no class","延期","取消","停课","请假","调课","顺延"] },
    { key: "due",       color: "#c2255c", label: "截止日期", words: ["due date","deadline","extension","extended","截止","延后提交","ddl"] }
  ],
  examDates: {},        // { [courseId]: [ {type:"midterm"|"final"|"other", title, date:"YYYY-MM-DD", source:"manual|syllabus|upload"} ] }
  seenMessages: [],     // 本地已在弹窗中查看过的消息 id
  gpaScale: "4.0"       // 预留：评分换算方案
};

/* ----------------------- 工具 ----------------------- */
BC.util = {
  deepMerge(target, src) {
    for (const k in src) {
      const v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        target[k] = BC.util.deepMerge(target[k] && typeof target[k] === "object" ? target[k] : {}, v);
      } else if (v !== undefined) {
        target[k] = v;
      }
    }
    return target;
  },
  clone(o) { return JSON.parse(JSON.stringify(o)); },
  esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  // 课程卡片元素 -> courseId
  courseIdFromCard(card) {
    const a = card.querySelector('a[href*="/courses/"]');
    if (!a) return null;
    const m = a.getAttribute("href").match(/\/courses\/(\d+)/);
    return m ? m[1] : null;
  },
  // "course_123" -> "123"
  // 课程显示名：只留名字。去掉学期前缀（2026FA -）、Rutgers 课号（01:198:211:05-08）、index 号、括号内容、
  // 纯数字 / 符号的零散片段；保留字母、&、/、- 和罗马数字（INTR DISCRT STRCT II）。
  courseTitle(name) {
    let s = String(name || "");
    s = s.replace(/^\s*\d{4}\s*[A-Z]{1,2}\s*[-–—:]\s*/i, "");                 // 2026FA -
    s = s.replace(/\b\d{2}:\d{3}:\d{3}(?::[A-Z0-9]{1,3}(?:-[A-Z0-9]{1,3})?)*(?::\d{4,6})?\b/gi, " "); // 课号(:section)(:index)
    s = s.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");                                  // (All Sections)
    s = s.replace(/[^\p{L}\p{N}\s&'’/-]/gu, " ");                                  // 其他符号
    s = s.split(/\s+/).filter(w => w && (w === "&" || !/^[\d\W_]+$/.test(w))).join(" "); // 纯数字 / 纯符号片段（& 保留）
    s = s.replace(/^[\s&'’/-]+|[\s&'’/-]+$/g, "").trim();
    return s || String(name || "").trim();
  },

  idFromContextCode(code) {
    if (!code) return null;
    const m = String(code).match(/course_(\d+)/);
    return m ? m[1] : null;
  },
  daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const now = new Date();
    return Math.ceil((d - now) / 86400000);
  },
  fmtDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  },
  // 等待元素出现
  waitFor(selector, { timeout = 15000, root = document } = {}) {
    return new Promise(resolve => {
      const found = root.querySelector(selector);
      if (found) return resolve(found);
      const obs = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });
      obs.observe(root.documentElement || root, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); resolve(root.querySelector(selector)); }, timeout);
    });
  }
};

/* ----------------------- 设置读写 ----------------------- */
BC.storage = {
  async get() {
    return new Promise(res =>
      chrome.storage.local.get("bc_settings", d =>
        res(BC.util.deepMerge(BC.util.clone(BC.DEFAULTS), d.bc_settings || {}))));
  },
  async set(settings) {
    return new Promise(res => chrome.storage.local.set({ bc_settings: settings }, res));
  },
  async patch(mutator) {
    const s = await BC.storage.get();
    await mutator(s);
    await BC.storage.set(s);
    return s;
  },
  onChange(cb) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.bc_settings) cb();
    });
  }
};

/* ----------------------- 右下角 Toast（样式内联，跨站可用） ----------------------- */
BC.toast = function (msg, opts = {}) {
  let wrap = document.getElementById("bc-toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "bc-toast-wrap";
    wrap.style.cssText =
      "position:fixed;right:18px;bottom:74px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;";
    document.body.appendChild(wrap);
  }
  const bg = opts.type === "error" ? "#c92a2a" : opts.type === "success" ? "#2b8a3e" : "#1c2733";
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText =
    `background:${bg};color:#fff;padding:10px 14px;border-radius:8px;` +
    "font:13px/1.45 system-ui,'Microsoft YaHei',sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);" +
    "max-width:320px;opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;";
  wrap.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "none"; });
  setTimeout(() => {
    t.style.opacity = "0"; t.style.transform = "translateY(8px)";
    setTimeout(() => t.remove(), 300);
  }, opts.duration || 5000);
};

/* ----------------------- 简易缓存（带 TTL） ----------------------- */
BC.cache = {
  async get(key, maxAgeMs) {
    return new Promise(res =>
      chrome.storage.local.get("bc_cache_" + key, d => {
        const e = d["bc_cache_" + key];
        res(e && Date.now() - e.t < maxAgeMs ? e.v : null);
      }));
  },
  async set(key, v) {
    return new Promise(res =>
      chrome.storage.local.set({ ["bc_cache_" + key]: { t: Date.now(), v } }, res));
  },
  async clearAll() {
    return new Promise(res =>
      chrome.storage.local.get(null, all => {
        const keys = Object.keys(all).filter(k => k.startsWith("bc_cache_"));
        chrome.storage.local.remove(keys, res);
      }));
  }
};
