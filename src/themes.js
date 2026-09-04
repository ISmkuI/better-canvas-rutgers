/* 预设主题：配色 / 背景 / 字体 + 动态动画（季节、日出日落、赛博朋克、黑客、马拉松…）
 * 每个预设 = { css?, font?, start?() => cleanup }。start 返回清理函数，stop() 负责移除 DOM。 */
BC.themes = {
  FX_ID: "bc-fx",
  TRAIL_ID: "bc-trail",
  STYLE_ID: "bc-preset-style",
  _active: null,

  META: [
    { id: "",          name: "无",       emoji: "🚫", desc: "关闭预设主题" },
    { id: "minimal",   name: "简约",     emoji: "⬜", desc: "干净留白 低饱和" },
    { id: "fresh",     name: "清新",     emoji: "🌿", desc: "薄荷渐变 圆润" },
    { id: "dark",      name: "暗夜",     emoji: "🌙", desc: "护眼深色模式" },
    { id: "blackwhite",name: "黑白",     emoji: "🎞️", desc: "整页灰度 高对比" },
    { id: "seasons",   name: "春夏秋冬", emoji: "🍂", desc: "随季节飘落的背景" },
    { id: "timeofday", name: "日出日落", emoji: "🌅", desc: "随时间的海岸天空" },
    { id: "pixel",     name: "像素风",   emoji: "👾", desc: "复古 8-bit" },
    { id: "cyberpunk", name: "赛博朋克", emoji: "🌃", desc: "霓虹 + 随机故障" },
    { id: "hacker",    name: "黑客",     emoji: "💻", desc: "黑底绿色字幕雨" },
    { id: "marathon",  name: "马拉松",   emoji: "🟡", desc: "红黄硬边 新粗野主义" }
  ],
  list() { return BC.themes.META; },

  /* ---------- 应用 / 停止 ---------- */
  apply(id, settings) {
    BC.themes.stop();
    if (!id) return;
    const def = BC.themes._defs[id];
    if (!def) return;
    if (def.font) BC.themes._loadFont(def.font, "bc-font-" + id);
    // 日历页（FullCalendar + 右侧迷你日历）和各页通用内容框（表格 / 输入框 / 按钮）由共享生成器按主题令牌出样式
    BC.themes._setStyle((def.css || "") +
      (def.calendar ? BC.themes._calendarCss(def.calendar) + BC.themes._boxesCss(def.calendar) + BC.themes._uiVarsCss(def.calendar) : ""));
    const cleanup = def.start ? def.start(settings) : null;
    // 任何改了页面底色的主题都需要中和 Canvas 那条白色标题横条，所以打标是共享能力
    const hdr = def.tagHeader ? BC.themes._watchHeader() : null;
    // 鼠标拖尾：每个主题声明自己的粒子样式，引擎共享；设置里可关
    const trailOn = !(settings && settings.theme && settings.theme.cursorTrail === false);
    const trail = def.trail && trailOn ? BC.themes._trail(def.trail) : null;
    BC.themes._active = { id, cleanup, hdr, trail };
  },

  stop() {
    if (BC.themes._active) {
      for (const fn of [BC.themes._active.cleanup, BC.themes._active.hdr, BC.themes._active.trail]) {
        if (fn) { try { fn(); } catch (e) {} }
      }
    }
    BC.themes._active = null;
    document.getElementById(BC.themes.TRAIL_ID)?.remove();
    document.getElementById(BC.themes.FX_ID)?.remove();
    document.getElementById(BC.themes.STYLE_ID)?.remove();
    document.documentElement.classList.remove("bc-fx-active");
    document.querySelectorAll(".bc-glitch").forEach(e => e.classList.remove("bc-glitch"));
  },

  /* ---------- 仪表盘标题横条（共享） ----------
   * Canvas 会在标题区画一条白色满宽横条。任何把正文调成浅色或把页面底色调深的主题，
   * 不中和它就会白底白字。新版 Canvas 的标题是 InstUI 组件——类名是编译期哈希，
   * 且 #content 里唯一的 <h1> 是 screenreader-only 的，视觉标题其实是个 span。
   * 所以既不能按标签找也不能按类名找，只能按文本匹配，然后打上自己的类。
   * 主题在 CSS 里各自决定 .bc-hdr-* 长什么样。 */
  HDR: ["bc-hdr-title", "bc-hdr-strip", "bc-hdr-btn"],

  _tagHeader() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;                                  // 只在仪表盘上动头部
    if (dash.querySelector(".bc-hdr-title")) return;    // 已标记：跳过整树扫描
    const sr = dash.querySelector("h1.screenreader-only") || dash.querySelector("h1");
    const label = (sr ? sr.textContent : "Dashboard").trim();
    if (!label) return;

    let title = null;
    // 文档序里父元素总在子元素之前，所以最后一个命中的就是最深的那个
    dash.querySelectorAll('h1,h2,span,div,[role="heading"]').forEach(e => {
      if (e === sr || e.classList.contains("screenreader-only")) return;
      if (e.textContent.trim() !== label) return;
      if (!e.getClientRects().length) return;           // fixed/sticky 下 offsetParent 不可靠
      title = e;
    });
    if (!title) return;
    title.classList.add("bc-hdr-title");

    const chain = [];
    for (let el = title.parentElement; el && el !== dash && chain.length < 5; el = el.parentElement) chain.push(el);
    chain.forEach(el => el.classList.add("bc-hdr-strip"));

    const scope = chain[chain.length - 1];
    if (!scope) return;                                 // 横条没找到就别乱标按钮
    scope.querySelectorAll('button,[role="button"]').forEach(b => {
      if (!b.closest(".ic-DashboardCard") && !b.closest("#bc-blocks")) b.classList.add("bc-hdr-btn");
    });
  },

  // 头部是 React 异步渲染的，切视图还会重建，所以要盯着
  _watchHeader() {
    BC.themes._tagHeader();
    let pending = 0;
    const obs = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => { pending = 0; BC.themes._tagHeader(); });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      if (pending) cancelAnimationFrame(pending);
      document.querySelectorAll("." + BC.themes.HDR.join(",."))
        .forEach(e => e.classList.remove(...BC.themes.HDR));
    };
  },

  /* ---------- 工具 ---------- */
  _setStyle(css) {
    let st = document.getElementById(BC.themes.STYLE_ID);
    if (!st) { st = document.createElement("style"); st.id = BC.themes.STYLE_ID; document.head.appendChild(st); }
    st.textContent = css;
  },
  _loadFont(url, id) {
    if (!url || document.getElementById(id)) return;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = url; l.id = id;
    document.head.appendChild(l);
  },
  _canvas(bg) {
    document.documentElement.classList.add("bc-fx-active");
    document.getElementById(BC.themes.FX_ID)?.remove();
    const c = document.createElement("canvas");
    c.id = BC.themes.FX_ID;
    if (bg) c.style.background = bg;
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    c._bcResize = resize;
    window.addEventListener("resize", resize);
    return { c, ctx };
  },
  /* ---------- 鼠标拖尾引擎（共享） ----------
   * spec = { colors, shape, size, count, life, spread, drift, gravity, glow, alpha, chars, font, min }
   *   shape: dot(圆点) | ring(扩散圆环) | square(像素块) | char(字符) | petal(花瓣/叶片) | spark(四角星)
   *   也可以传函数（按季节 / 时段动态决定）。返回清理函数。 */
  _trail(spec) {
    if (typeof spec === "function") spec = spec();
    if (!spec) return null;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    const S = {
      colors: ["#888"], shape: "dot", size: 4, count: 2, life: 600, spread: 6,
      drift: 0.6, gravity: 0, glow: 0, alpha: 0.8, chars: "01", font: "14px monospace", min: 3, snap: 0,
      ...spec
    };
    document.getElementById(BC.themes.TRAIL_ID)?.remove();
    const c = document.createElement("canvas");
    c.id = BC.themes.TRAIL_ID;
    c.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;";
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const P = [];
    let raf = 0, lx = null, ly = null;
    const pick = arr => arr[(Math.random() * arr.length) | 0];

    const onMove = ev => {
      const x = ev.clientX, y = ev.clientY;
      if (lx != null && Math.hypot(x - lx, y - ly) < S.min) return;
      const now = performance.now();
      for (let i = 0; i < S.count; i++) {
        P.push({
          x: x + (Math.random() - 0.5) * S.spread, y: y + (Math.random() - 0.5) * S.spread,
          vx: (Math.random() - 0.5) * S.drift, vy: (Math.random() - 0.5) * S.drift,
          born: now, life: S.life * (0.7 + Math.random() * 0.6),
          size: S.size * (0.6 + Math.random() * 0.8),
          col: pick(S.colors), rot: Math.random() * 6.28, ch: pick(S.chars)
        });
      }
      if (P.length > 400) P.splice(0, P.length - 400);
      lx = x; ly = y;
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        const t = (now - p.born) / p.life;
        if (t >= 1) { P.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy; p.vy += S.gravity;
        ctx.globalAlpha = S.alpha * (1 - t);
        ctx.fillStyle = p.col; ctx.strokeStyle = p.col;
        ctx.shadowBlur = S.glow; ctx.shadowColor = S.glow ? p.col : "transparent";
        const sz = p.size * (S.shape === "ring" ? 1 : 1 - t * 0.5);
        switch (S.shape) {
          case "square": {
            const g = S.snap || 1;
            const qx = Math.round(p.x / g) * g, qy = Math.round(p.y / g) * g;
            ctx.fillRect(qx - sz / 2, qy - sz / 2, sz, sz);
            break;
          }
          case "ring":
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + t * 1.6), 0, 6.283); ctx.stroke();
            break;
          case "char":
            ctx.font = S.font; ctx.textBaseline = "middle"; ctx.textAlign = "center";
            ctx.fillText(p.ch, p.x, p.y);
            break;
          case "petal":
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + t * 2);
            ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.55, 0, 0, 6.283); ctx.fill();
            ctx.restore();
            break;
          case "spark": {
            const L = sz * 1.6;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y);
            ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(p.x, p.y, sz * 0.35, 0, 6.283); ctx.fill();
            break;
          }
          default:
            ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, 6.283); ctx.fill();
        }
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = P.length ? requestAnimationFrame(draw) : 0;
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      c.remove();
    };
  },

  /* ---------- 日历页样式生成器（共享） ----------
   * Canvas 日历 = #calendar_header（导航/视图按钮）+ #calendar-app（FullCalendar 月/周视图、议程视图）
   *             + 右侧 #minical（迷你日历）/ #calendar-list-holder（课程列表）/ 事件弹窗（.popover/.ui-dialog）。
   * 这些都是运行时渲染的，只能按类名覆盖。每个主题传一组令牌，这里统一出 CSS，保证各页观感一致。
   * 事件条本身的底色是 Canvas 按课程颜色内联的，这里只动圆角 / 边框 / 阴影，不改颜色。 */
  // 令牌默认值（日历页和通用内容框共用）
  _tokens(t) {
    return {
      font: "inherit", mono: "inherit", text: "#222", muted: "#999",
      bg: "#fff", cell: "#fff", cellAlt: "#f5f5f5", today: "#fff8e1", line: "#ddd", head: "#f5f5f5", headText: "#333",
      radius: "6px", border: "1px solid #ddd", shadow: "none", blur: false,
      btnBg: "#fff", btnText: "#333", btnBorder: "1px solid #ccc", btnShadow: "none",
      accent: "#333", accentText: "#fff", accentLink: "#0374b5",
      eventRadius: "4px", eventBorder: null, eventShadow: "none",
      headSize: "12px", titleSize: "26px",
      ...t
    };
  },
  // 一条规则：所有声明都带 !important；值为 null / "" 的声明跳过
  _rule(sel, d) {
    return sel + "{" + Object.entries(d)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => k + ":" + v + "!important").join(";") + "}\n";
  },

  /* ---------- 各页通用内容框（共享） ----------
   * Files / Assignments / Modules / Grades / People… 这些页面里的白框：表格、搜索框、按钮、旧式面板。
   * 新版页面是 InstUI（类名带哈希，只能按后缀 / 结构匹配），旧版页面是 .ig-* / .ef-* / .box 之类。
   * 只作用于 #content，日历页的表格由 _calendarCss 单独管，这里排除；纯图标按钮（⋮ / 分页箭头）不加框。 */
  _boxesCss(t) {
    const T = BC.themes._tokens(t);
    const R = BC.themes._rule;
    const C = "#content ";
    const NOT_CAL = ":not(#calendar-app *):not(#minical *)";
    const panel = { background: T.bg, color: T.text, border: T.border, "border-radius": T.radius, "box-shadow": T.shadow,
                    "backdrop-filter": T.blur ? "blur(8px)" : null };
    const btn = { background: T.btnBg, "background-image": "none", color: T.btnText, border: T.btnBorder,
                  "border-radius": T.radius, "box-shadow": T.btnShadow, "text-shadow": "none", "font-family": T.font, "font-weight": "700" };
    const btnActive = { background: T.accent, "background-image": "none", color: T.accentText, "border-color": T.eventBorder || T.accent };
    const headRow = { background: T.head, color: T.headText, "font-family": T.font, "font-weight": "700",
                      "text-transform": "uppercase", "font-size": T.headSize, "letter-spacing": ".03em" };
    // 纯图标按钮：InstUI IconButton 结构是 button > span.__content > span.__children > svg
    const ICON_ONLY = ":has([class*=\"__children\"]>svg:only-child)";
    const TEXT_BTN = `${C}button:not(${ICON_ONLY}):not([class*="bc-"]):not(.al-trigger):not(.Button--icon-action):not(.ui-datepicker *):not(thead *):not([role="columnheader"] *)${NOT_CAL}`;
    let css = "\n/* ---- 通用内容框（生成） ---- */\n";

    // 页面级包裹层（#content 往下三层）一律去白底：主题背景要透出来，只有下面明确列出的面板才有底色。
    // 用 :where() 把优先级压到 (1,0,0)，面板规则（至少 (1,1,0)）能覆盖它。
    const WRAP = ":where(*:not(table):not([role=\"table\"]):not(.item-group-condensed):not(.context_module):not(.box):not(.content-box):not(.well)" +
                 ":not(.ef-directory):not(.discussion-topic):not(.discussion_topic):not(.ic-Table):not([class*=\"bc-\"]):not([id^=\"bc-\"]):not(.ic-DashboardCard))";
    css += R(`${C}> ${WRAP},${C}> * > ${WRAP},${C}> * > * > ${WRAP}`, { "background-color": "transparent", "background-image": "none" });
    css += R(`${C}.header-bar,${C}.header-bar-outer-container,${C}.item-group-container,${C}.ig-list,${C}.show-content,${C}.user_content`,
             { "background-color": "transparent", "background-image": "none", border: "0", "box-shadow": "none" });

    // 表格（InstUI Table / 老式 table / 旧 Files 的 .ef-directory）：外框 = 面板
    css += R(`${C}table${NOT_CAL},${C}[role="table"]${NOT_CAL},${C}.ef-directory,` +
             `${C}[class*="-view"]:has(>table)${NOT_CAL},${C}[class*="-view"]:has(>[role="table"])${NOT_CAL}`,
             { ...panel, "border-collapse": "separate", "border-spacing": "0", overflow: "hidden" });
    css += R(`${C}[class*="-view"]:has(>table) table,${C}[class*="-view"]:has(>[role="table"]) [role="table"]`,
             { border: "0", "box-shadow": "none", "border-radius": "0", background: "transparent" });
    css += R(`${C}table${NOT_CAL} thead th,${C}table${NOT_CAL} thead td,${C}[role="columnheader"]${NOT_CAL},${C}.ef-directory-header,${C}.ef-directory-header *`,
             { ...headRow, "border-bottom": "1px solid " + T.line, "border-color": T.line });
    css += R(`${C}thead th button,${C}thead th button *,${C}[role="columnheader"] button,${C}[role="columnheader"] button *,${C}thead th a,${C}[role="columnheader"] a`,
             { background: "transparent", border: "0", "box-shadow": "none", color: T.headText, fill: T.headText, "font-family": T.font, "text-decoration": "none" });
    css += R(`${C}table${NOT_CAL} td,${C}table${NOT_CAL} th,${C}[role="row"]${NOT_CAL},${C}[role="cell"]${NOT_CAL},${C}[role="gridcell"]${NOT_CAL},${C}[role="rowheader"]${NOT_CAL},${C}.ef-item-row`,
             { "border-color": T.line, color: T.text, background: "transparent" });
    css += R(`${C}table${NOT_CAL} tbody tr:hover,${C}[role="row"]${NOT_CAL}:hover,${C}.ef-item-row:hover`, { background: T.cellAlt });
    css += R(`${C}table${NOT_CAL} td *:not(a):not(button):not(button *):not(input):not(select):not(svg):not(path),${C}[role="cell"]${NOT_CAL} *:not(a):not(button):not(button *):not(input):not(svg):not(path)`,
             { color: T.text });

    // 输入框 / 搜索框 / 下拉
    css += R(`${C}input[type="text"],${C}input[type="search"],${C}input[type="email"],${C}input[type="number"],${C}input[type="date"],${C}input[type="url"],` +
             `${C}textarea,${C}select,${C}[class*="textInput__facade"],${C}[class*="-select__inputContainer"],${C}[class*="textArea__"],${C}.form-control,${C}.ic-Input`,
             { background: T.cell, color: T.text, border: T.btnBorder, "border-radius": T.radius, "box-shadow": "none" });
    css += R(`${C}[class*="textInput__facade"] input,${C}[class*="textInput"] input,${C}[class*="-select__inputContainer"] input`,
             { background: "transparent", border: "0", "box-shadow": "none", color: T.text });
    css += R(`${C}input::placeholder,${C}textarea::placeholder`, { color: T.muted });
    css += R(`${C}label,${C}legend,${C}[class*="formFieldLabel"]`, { color: T.text, "font-family": T.font });

    // 按钮：有文字的加框；主色 / 提交按钮用强调色
    css += R(`${TEXT_BTN},${C}.btn${NOT_CAL},${C}.Button:not(.Button--icon-action)${NOT_CAL},${C}a.btn${NOT_CAL},${C}a.Button${NOT_CAL}`, btn);
    css += R(`${TEXT_BTN} *,${C}.btn${NOT_CAL} *,${C}.Button:not(.Button--icon-action)${NOT_CAL} *`, { color: "inherit", fill: "currentColor", "background-color": "transparent" });
    css += R(`${TEXT_BTN}:active,${C}.btn${NOT_CAL}:active`, { transform: "translate(2px,2px)", "box-shadow": "none" });
    css += R(`${C}.btn-primary${NOT_CAL},${C}.Button--primary${NOT_CAL},${C}button[type="submit"]:not([class*="bc-"])${NOT_CAL}`, btnActive);
    css += R(`${C}.btn-primary${NOT_CAL} *,${C}.Button--primary${NOT_CAL} *,${C}button[type="submit"]:not([class*="bc-"])${NOT_CAL} *`, { color: T.accentText, fill: T.accentText });
    css += R(`${C}button${ICON_ONLY}${NOT_CAL},${C}.al-trigger${NOT_CAL},${C}.Button--icon-action${NOT_CAL}`,
             { background: "transparent", "background-image": "none", border: "0", "box-shadow": "none", color: T.text });
    css += R(`${C}button${ICON_ONLY}${NOT_CAL} svg,${C}.al-trigger${NOT_CAL} *`, { color: T.text, fill: "currentColor" });

    // 旧式面板 / 列表（Assignments / Modules / Discussions / Syllabus / 表单动作区）
    // 分组的面板是 .item-group-condensed（外层）；里面的 .ig-list 不再加框，否则双层边
    css += R(`${C}.box,${C}.content-box,${C}.well,${C}.context_module,${C}.ef-header,${C}.form-actions,${C}.ic-Form-actions,` +
             `${C}.discussion-topic,${C}.discussion_topic,${C}.ui-widget-content:not(.ui-dialog):not(.ui-datepicker),${C}.ic-Table,${C}#syllabusContainer,${C}.item-group-condensed`,
             panel);
    css += R(`${C}.ig-row,${C}.ig-header,${C}.context_module .header,${C}.discussion-topic .discussion-summary`,
             { background: "transparent", "border-color": T.line, color: T.text, "box-shadow": "none" });
    css += R(`${C}.ig-row:hover`, { background: T.cellAlt });
    // 分组标题里的折叠按钮（▾ Surveys）是标题的一部分，不当普通按钮加框
    css += R(`${C}.ig-header button,${C}.ig-header .element_toggler,${C}.element_toggler,${C}.ig-header button *`,
             { background: "transparent", border: "0", "box-shadow": "none", transform: "none", color: T.text, "font-family": T.font, "font-weight": "800", padding: "0" });
    css += R(`${C}.ig-header-title,${C}.ig-header .name,${C}.context_module .name,${C}.ig-title`, { "font-family": T.font, color: T.text, "font-weight": "800" });
    css += R(`${C}.ig-details,${C}.ig-details *,${C}.ig-info`, { color: T.muted });

    // 标题 / 分页
    css += R(`${C}h1:not(.screenreader-only),${C}h2:not(.bc-block-title),${C}h3:not(.bc-block-title)`, { "font-family": T.font, color: T.text, "font-weight": "800" });
    css += R(`${C}h1:not(.screenreader-only)`, { "font-size": T.titleSize, "letter-spacing": "-.01em" });
    css += R(`${C}[class*="pagination"],${C}[class*="pagination"] *:not(svg):not(path)`, { color: T.text });
    return css;
  },

  /* ---------- 扩展自身 UI 的主题变量（共享） ----------
   * 助手浮窗 / 小按钮 / 右键菜单在 closed Shadow DOM 里，页面 CSS 进不去，但 CSS 自定义属性会继承进影子树
   * （`all: initial` 不会重置自定义属性）。这里把主题令牌输出成 --bc-ai-* 变量挂在 :root 上，
   * assistant.js 的影子样式、inject.css 里的 📖 / ⚙ 按钮和学习抽屉都用 var(--bc-ai-*, 默认值) 取值。 */
  _uiVarsCss(t) {
    const T = BC.themes._tokens(t);
    const v = {
      "--bc-ai-bg": T.bg, "--bc-ai-text": T.text, "--bc-ai-muted": T.muted, "--bc-ai-line": T.line,
      "--bc-ai-head": T.head, "--bc-ai-head-text": T.headText, "--bc-ai-cell": T.cell, "--bc-ai-cell-alt": T.cellAlt,
      "--bc-ai-accent": T.accent, "--bc-ai-accent-text": T.accentText, "--bc-ai-link": T.accentLink,
      "--bc-ai-border": T.border, "--bc-ai-radius": T.radius, "--bc-ai-shadow": T.shadow,
      "--bc-ai-btn-bg": T.btnBg, "--bc-ai-btn-text": T.btnText, "--bc-ai-btn-border": T.btnBorder, "--bc-ai-btn-shadow": T.btnShadow,
      "--bc-ai-font": T.font === "inherit" ? "" : T.font
    };
    return "\n/* ---- 扩展 UI 主题变量（生成） ---- */\n:root{" +
      Object.entries(v).filter(([, val]) => val != null && val !== "").map(([k, val]) => `${k}:${val}`).join(";") + "}\n";
  },

  _calendarCss(t) {
    const T = BC.themes._tokens(t);
    const R = BC.themes._rule;
    const panel = { background: T.bg, color: T.text, border: T.border, "border-radius": T.radius, "box-shadow": T.shadow,
                    "backdrop-filter": T.blur ? "blur(8px)" : null };
    const btn = { background: T.btnBg, "background-image": "none", color: T.btnText, border: T.btnBorder,
                  "border-radius": T.radius, "box-shadow": T.btnShadow, "text-shadow": "none", "font-family": T.font, "font-weight": "700" };
    const btnActive = { background: T.accent, "background-image": "none", color: T.accentText };
    const headRow = { background: T.head, color: T.headText, "font-family": T.font, "font-weight": "700",
                      "text-transform": "uppercase", "font-size": T.headSize, "letter-spacing": ".03em" };
    let css = "\n/* ---- 日历页（生成） ---- */\n";

    // 头部：标题 + 前后/今天 + 视图切换 + 新建
    // 头部整条是白底满宽横条：容器和所有非按钮的包裹层一律透明、去边框
    css += R("#calendar_header,#calendar_header .calendar_header,#calendar_header>div," +
             "#calendar_header *:not(button):not(.btn):not(.Button):not(.ui-button):not(svg):not(path)",
             { "background-color": "transparent", "background-image": "none", "box-shadow": "none", "border-color": "transparent" });
    css += R("#calendar_header .navigation_title,#calendar_header h2,#calendar_header .navigation_title_text,#calendar_header .navigation_title *",
             { "font-family": T.font, color: T.text, "font-weight": "800", "font-size": T.titleSize, "letter-spacing": "-.01em", "text-decoration": "none" });
    css += R("#calendar_header .btn,#calendar_header button,#calendar_header .Button,#calendar_header .ui-button,#calendar_header a.btn", btn);
    css += R("#calendar_header .btn *,#calendar_header button *,#calendar_header .Button *", { color: T.btnText, fill: T.btnText, background: "transparent" });
    css += R("#calendar_header .btn:active,#calendar_header button:active,#calendar_header .Button:active", { transform: "translate(2px,2px)", "box-shadow": "none" });
    css += R("#calendar_header .btn.active,#calendar_header .btn[aria-pressed=\"true\"],#calendar_header button[aria-pressed=\"true\"]," +
             "#calendar_header .ui-state-active,#calendar_header .calendar_view_buttons .active,#calendar_header .Button.active", btnActive);
    css += R("#calendar_header .btn.active *,#calendar_header button[aria-pressed=\"true\"] *,#calendar_header .ui-state-active *,#calendar_header .Button.active *",
             { color: T.accentText, fill: T.accentText });

    // 月 / 周视图表格
    css += R("#calendar-app,#calendar-app .fc,#calendar-app .fc-view-container>*", { background: "transparent", color: T.text });
    css += R("#calendar-app .fc-view-container", { ...panel, overflow: "hidden" });
    css += R("#calendar-app .fc-view,#calendar-app .fc-view>table", { background: T.bg });
    css += R("#calendar-app .fc th,#calendar-app .fc td,#calendar-app .fc-unthemed .fc-divider,#calendar-app .fc-unthemed .fc-row," +
             "#calendar-app .fc-unthemed .fc-popover,#calendar-app .fc-time-grid .fc-slats td,#calendar-app .fc-row .fc-content-skeleton td," +
             "#calendar-app .fc-unthemed .fc-content,#calendar-app .fc-unthemed .fc-list-view,#calendar-app .fc-unthemed .fc-list-heading td",
             { "border-color": T.line });
    css += R("#calendar-app .fc-widget-header,#calendar-app .fc-day-header,#calendar-app .fc thead th,#calendar-app .fc-head td", headRow);
    css += R("#calendar-app .fc-day-header a,#calendar-app .fc-day-header span,#calendar-app .fc thead th a", { color: T.headText });
    css += R("#calendar-app .fc-day,#calendar-app .fc-widget-content,#calendar-app .fc-bg td,#calendar-app .fc-time-grid .fc-slats td", { background: T.cell });
    css += R("#calendar-app .fc-other-month,#calendar-app .fc-bg .fc-other-month", { background: T.cellAlt });
    css += R("#calendar-app .fc-today,#calendar-app .fc-unthemed .fc-today,#calendar-app .fc-bg .fc-today,#calendar-app td.fc-today", { background: T.today });
    css += R("#calendar-app .fc-day-number,#calendar-app .fc-day-top,#calendar-app .fc-day-top .fc-day-number,#calendar-app .fc-axis," +
             "#calendar-app .fc-time,#calendar-app .fc-content-skeleton .fc-day-number,#calendar-app .fc-week-number",
             { color: T.text, "font-family": T.mono, "font-weight": "600" });
    css += R("#calendar-app .fc-other-month .fc-day-number,#calendar-app .fc-other-month .fc-day-top", { color: T.muted });
    css += R("#calendar-app .fc-today .fc-day-number,#calendar-app .fc-today.fc-day-top .fc-day-number",
             { background: T.accent, color: T.accentText, padding: "1px 6px", "border-radius": T.radius, "font-weight": "800", display: "inline-block", margin: "2px" });
    // 扩展注入的考试条目 .bc-cal-chip 跟原生事件条走同一套几何（圆角 / 阴影 / 边框色）
    css += R("#calendar-app .fc-event,#calendar-app .fc-event .fc-content,#calendar-app .bc-cal-chip",
             { "border-radius": T.eventRadius, "box-shadow": T.eventShadow, "border-color": T.eventBorder });    css += R("#calendar-app .fc-event .fc-title,#calendar-app .fc-event .fc-time", { "font-family": T.font });
    css += R("#calendar-app .fc-now-indicator", { "border-color": T.accent });
    css += R("#calendar-app .fc-more,#calendar-app .fc-more-cell a", { color: T.accentLink, "font-weight": "700" });
    css += R("#calendar-app .fc-popover,#calendar-app .fc-popover .fc-header", { ...panel });
    css += R("#calendar-app .fc-popover .fc-header,#calendar-app .fc-popover .fc-header .fc-title", { background: T.head, color: T.headText, "border-radius": "0", "box-shadow": "none", border: "0" });

    // 议程视图
    css += R("#calendar-app .agenda-wrapper,#calendar-app .agenda-view,#calendar-app .agenda-actions", { background: "transparent", color: T.text });
    css += R("#calendar-app .agenda-day", { ...panel, "margin-bottom": "12px", padding: "10px 14px" });
    css += R("#calendar-app .agenda-date,#calendar-app .agenda-day h3,#calendar-app .agenda-day>h3",
             { "font-family": T.font, color: T.text, "font-weight": "800", "text-transform": "uppercase", "font-size": "13px", "letter-spacing": ".03em", "border-bottom": "1px solid " + T.line, "padding-bottom": "6px" });
    css += R("#calendar-app .agenda-event__item,#calendar-app .agenda-event__item-container,#calendar-app .agenda-event",
             { "border-color": T.line, color: T.text, background: "transparent" });
    css += R("#calendar-app .agenda-event__time,#calendar-app .agenda-event__title,#calendar-app .agenda-event__item *", { color: T.text });
    css += R("#calendar-app .agenda-event__time", { "font-family": T.mono, color: T.muted });
    css += R("#calendar-app .agenda-event__link,#calendar-app .agenda-event__link *,#calendar-app .agenda-load-btn", { color: T.accentLink });
    css += R("#calendar-app .agenda-load-btn,#calendar-app .agenda-actions .btn", btn);

    // 右侧：迷你日历
    css += R("#minical", { ...panel, padding: "6px", "margin-bottom": "14px" });
    css += R("#minical .fc,#minical .fc-view,#minical .fc-view>table,#minical table", { background: "transparent", color: T.text });
    css += R("#minical .fc th,#minical .fc td", { "border-color": T.line });
    css += R("#minical .fc-widget-header,#minical .fc thead th,#minical .fc-day-header", { ...headRow, "font-size": "10px" });
    css += R("#minical .fc-day,#minical .fc-widget-content,#minical .fc-bg td", { background: T.cell });
    css += R("#minical .fc-other-month,#minical .fc-bg .fc-other-month", { background: T.cellAlt });
    css += R("#minical .fc-today,#minical .fc-unthemed .fc-today,#minical td.fc-today", { background: T.today });
    css += R("#minical .fc-day-number,#minical .fc-day-top,#minical .fc-day-top .fc-day-number", { color: T.text, "font-family": T.mono, "font-size": "11px" });
    css += R("#minical .fc-other-month .fc-day-number,#minical .fc-other-month .fc-day-top", { color: T.muted });
    css += R("#minical .fc-today .fc-day-number", { background: T.accent, color: T.accentText, "border-radius": T.radius, padding: "0 4px", "font-weight": "800" });
    css += R("#minical .has_event .fc-day-number,#minical .fc-day.has_event .fc-day-number", { color: T.accentLink, "font-weight": "800", "text-decoration": "underline" });
    css += R("#minical .fc-toolbar h2,#minical .fc-header-title h2,#minical .fc-center h2,#minical .fc-header-title",
             { "font-family": T.font, color: T.text, "font-size": "13px", "font-weight": "800", "text-transform": "uppercase" });
    css += R("#minical .fc-button,#minical .fc-toolbar button,#minical .fc-header .fc-button", { ...btn, padding: "0 6px", "box-shadow": "none" });
    css += R("#minical .fc-button *,#minical .fc-toolbar button *", { color: T.btnText, fill: T.btnText });

    // 右侧：课程列表 / 未定日期 / 订阅
    css += R("#right-side .rs-section", { background: "transparent", color: T.text });
    css += R("#right-side .element_toggler,#right-side .rs-section>h2,#right-side .rs-section h2,#calendar-feed-button,#calendar-feed-button *",
             { "font-family": T.font, color: T.text, "font-weight": "700", "text-transform": "uppercase", "font-size": "12px", "letter-spacing": ".04em", background: "transparent", "box-shadow": "none" });
    css += R("#calendar-list-holder,#calendar-list-holder .context_list_context,#calendar-list-holder li.context,#calendar-list-holder .context-list-title," +
             "#calendar-list-holder .context_title,#undated-events,#undated-events *,#select-course-component,#select-course-component *",
             { color: T.text });
    // 列表容器：Canvas 默认是白色圆角框 + 内部滚动，改成和主题一致的面板
    css += R("#calendar-list-holder,#calendar-list-holder .context-list,#calendar-list-holder>ul,#undated-events>ul,#undated-events .undated-events-list",
             { ...panel, padding: "0", "margin-top": "8px", "backdrop-filter": null });
    css += R("#calendar-list-holder .context-list,#calendar-list-holder>ul,#undated-events>ul", { border: "0", "box-shadow": "none", background: "transparent", "border-radius": "0" });
    css += R("#calendar-list-holder li.context,#calendar-list-holder .context-list-item,#undated-events li",
             { background: "transparent", "border-bottom": "1px dashed " + T.line, padding: "6px 8px", margin: "0", "border-radius": "0" });
    css += R("#calendar-list-holder li.context:last-child,#calendar-list-holder .context-list-item:last-child,#undated-events li:last-child", { "border-bottom": "0" });
    css += R("#calendar-list-holder li.context:hover,#calendar-list-holder .context-list-item:hover", { background: T.cellAlt });
    css += R("#calendar-list-holder .context_list_context,#calendar-list-holder .context-list-item a,#calendar-list-holder .context-list-item label,#calendar-list-holder .context_name",
             { color: T.text, "font-family": T.font, "font-size": "12px", "font-weight": "600", "line-height": "1.35", "text-decoration": "none" });
    // 课程色块：底色是 Canvas 按课程颜色内联的，只改形状 / 边框
    css += R("#calendar-list-holder .context-list-toggle-box",
             { width: "14px", height: "14px", "border-radius": T.eventRadius, "box-shadow": T.eventShadow, border: T.eventBorder ? "1px solid " + T.eventBorder : null });
    css += R("#calendar-list-holder li.context.not-checked .context-list-toggle-box", { opacity: ".35" });
    // 右侧的 “⋮” 图标按钮：不能吃主题给 #right-side .Button 的方框样式，保持纯图标
    css += R("#right-side .Button--icon-action,#right-side button.Button--icon-action,#calendar-list-holder .ContextList__MoreBtn,#calendar-list-holder button," +
             "#calendar-list-holder .al-trigger,#undated-events .al-trigger",
             { background: "transparent", "background-image": "none", border: "0", "box-shadow": "none", color: T.muted, "border-radius": T.radius, padding: "2px 6px", transform: "none" });
    css += R("#right-side .Button--icon-action:hover,#calendar-list-holder button:hover,#calendar-list-holder .al-trigger:hover",
             { background: T.cellAlt, color: T.text });
    css += R("#right-side .Button--icon-action *,#calendar-list-holder button *,#calendar-list-holder .al-trigger *", { color: "inherit", fill: "currentColor" });
    css += R("#undated-events a,#undated-events .undated_event_title,#calendar-feed a,#calendar_feed_box a", { color: T.accentLink });

    // 事件详情弹窗 / 编辑对话框
    css += R(".event-details,.popover,.ui-dialog.ui-widget,.ui-dialog.ui-widget-content", { ...panel });
    css += R(".popover.right .arrow:after,.popover.left .arrow:after,.popover.top .arrow:after,.popover.bottom .arrow:after", { "border-right-color": T.bg, "border-left-color": T.bg, "border-top-color": T.bg, "border-bottom-color": T.bg });
    css += R(".popover-title,.event-details-header,.event-details .event-details-header,.ui-dialog .ui-dialog-titlebar,.ui-dialog .ui-widget-header",
             { ...headRow, "border-bottom": "1px solid " + T.line, "border-radius": "0", "font-size": "13px", "background-image": "none" });
    css += R(".popover-title *,.event-details-header *,.event-details-header .event-details-title,.ui-dialog .ui-dialog-title,.ui-dialog .ui-dialog-titlebar *", { color: T.headText, background: "transparent" });
    css += R(".popover-content,.event-details-content,.ui-dialog .ui-dialog-content,.ui-dialog .ui-dialog-content *:not(a):not(button):not(.btn):not(input):not(select):not(textarea)",
             { color: T.text, background: "transparent" });
    css += R(".event-details a,.event-details-links a,.popover-content a,.ui-dialog .ui-dialog-content a:not(.btn):not(.Button)", { color: T.accentLink });
    css += R(".ui-dialog .ui-dialog-buttonpane", { background: "transparent", "border-top": "1px solid " + T.line, "border-radius": "0" });
    css += R(".ui-dialog .btn,.ui-dialog .Button,.ui-dialog .ui-button,.event-details .btn,.event-details .Button,.popover .btn", btn);
    css += R(".ui-dialog .btn-primary,.ui-dialog .Button--primary,.ui-dialog .btn-primary *,.ui-dialog .Button--primary *", btnActive);
    css += R(".ui-dialog input[type=\"text\"],.ui-dialog input[type=\"date\"],.ui-dialog select,.ui-dialog textarea,.ui-dialog .ui-tabs-nav",
             { background: T.cell, color: T.text, "border-color": T.line, "border-radius": T.radius });
    return css;
  },

  _h2r(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; },
  _lerp(a, b, t) {
    const pa = BC.themes._h2r(a), pb = BC.themes._h2r(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
    return `rgb(${r},${g},${bl})`;
  },

  /* ====================== 预设定义 ====================== */
  _defs: {
    /* --- 静态 --- */
    minimal: {
      tagHeader: true,
      calendar: {
        font: "-apple-system,'Segoe UI',Roboto,Helvetica,sans-serif", mono: "-apple-system,'Segoe UI',Roboto,Helvetica,sans-serif",
        text: "#2b2b2b", muted: "#9aa0a6", bg: "#fff", cell: "#fff", cellAlt: "#f6f7f9", today: "#eef3ff", line: "#e6e8eb",
        head: "#fafbfc", headText: "#555", radius: "8px", border: "1px solid #e6e8eb", shadow: "none",
        btnBg: "#fff", btnText: "#2b2b2b", btnBorder: "1px solid #e6e8eb", btnShadow: "none",
        accent: "#2563eb", accentText: "#fff", accentLink: "#2563eb", eventRadius: "6px"
      },
      // 克制的小灰蓝点，快速消失
      trail: { colors: ["#2563eb", "#94a3b8"], shape: "dot", size: 3, count: 1, life: 380, spread: 3, drift: 0.3, alpha: 0.55 },
      css: `
        body.ic-app{background:#f6f7f9!important;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,sans-serif!important;}
        :root{--ic-brand-primary:#2b2b2b!important;--ic-link-color:#2563eb!important;}
        .ic-DashboardCard{border-radius:10px!important;box-shadow:none!important;border:1px solid #e6e8eb!important;}
        .bc-block{box-shadow:none!important;border:1px solid #e6e8eb!important;}
        /* 标题横条：Canvas 自带白底 + 投影，和本主题的无阴影扁平风格冲突 */
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{color:#2b2b2b!important;background:transparent!important;font-weight:700!important;}
        .bc-hdr-btn{background:#fff!important;border:1px solid #e6e8eb!important;
          border-radius:8px!important;box-shadow:none!important;color:#2b2b2b!important;}`
    },
    fresh: {
      tagHeader: true,
      calendar: {
        font: "'Nunito',-apple-system,sans-serif", mono: "'Nunito',-apple-system,sans-serif",
        text: "#0b4a4a", muted: "#8fb3b3", bg: "rgba(255,255,255,.9)", cell: "rgba(255,255,255,.72)", cellAlt: "rgba(255,255,255,.38)",
        today: "#dff7ee", line: "#cfe8e4", head: "#e8f7f0", headText: "#0b6b6b", radius: "14px", border: "0",
        shadow: "0 6px 18px rgba(20,120,120,.12)", btnBg: "#fff", btnText: "#0b6b6b", btnBorder: "0",
        btnShadow: "0 4px 12px rgba(20,120,120,.16)", accent: "#0fa3a3", accentText: "#fff", accentLink: "#0fa3a3", eventRadius: "8px"
      },
      // 薄荷 / 天蓝的小气泡向外扩散
      trail: { colors: ["#0fa3a3", "#7fd8c8", "#9bd0f5"], shape: "ring", size: 6, count: 1, life: 700, spread: 8, drift: 0.4, alpha: 0.7 },
      font: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap",
      css: `
        body.ic-app{background:linear-gradient(135deg,#e8f7f0,#d6eefc)!important;background-attachment:fixed!important;font-family:'Nunito',-apple-system,sans-serif!important;}
        :root{--ic-brand-primary:#0fa3a3!important;--ic-link-color:#0fa3a3!important;}
        .ic-DashboardCard{border-radius:16px!important;box-shadow:0 6px 18px rgba(20,120,120,.12)!important;}
        .bc-block{border-radius:16px!important;box-shadow:0 6px 18px rgba(20,120,120,.10)!important;}
        /* 白色方块横条会盖住渐变背景，去掉底色让渐变透出来 */
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{color:#0b6b6b!important;background:transparent!important;
          font-family:'Nunito',sans-serif!important;font-weight:800!important;}
        .bc-hdr-btn{background:#fff!important;border:0!important;border-radius:999px!important;
          box-shadow:0 4px 12px rgba(20,120,120,.16)!important;color:#0b6b6b!important;}`
    },
    // dark 用整页 invert 滤镜，白横条会自动被反成深色，不需要打标
    dark: {
      // 整页 invert 会把 canvas 再反回来，所以这里按最终看到的颜色写：柔和的蓝白光点
      trail: { colors: ["#8ab4f8", "#c7d2fe", "#e0e7ff"], shape: "dot", size: 4, count: 2, life: 550, spread: 6, drift: 0.5, glow: 8, alpha: 0.7 },
      css: `
        html{background:#fff;filter:invert(.92) hue-rotate(180deg)!important;}
        img,video,iframe,svg,canvas,.ic-avatar,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)!important;}
        body.ic-app{background:#fff!important;}`
    },
    blackwhite: {
      tagHeader: true,
      calendar: {
        text: "#000", muted: "#777", bg: "#fff", cell: "#fff", cellAlt: "#f2f2f2", today: "#e6e6e6", line: "#111",
        head: "#111", headText: "#fff", radius: "0", border: "1px solid #111", shadow: "none",
        btnBg: "#fff", btnText: "#000", btnBorder: "1px solid #111", btnShadow: "none",
        accent: "#000", accentText: "#fff", accentLink: "#000", eventRadius: "0", eventBorder: "#111"
      },
      // 墨点：黑 / 深灰，无光晕
      trail: { colors: ["#111", "#444", "#777"], shape: "dot", size: 4, count: 2, life: 500, spread: 5, drift: 0.5, alpha: 0.75 },
      css: `
        #application{filter:grayscale(1) contrast(1.04)!important;}
        body.ic-app{background:#ffffff!important;}
        :root{--ic-brand-primary:#000!important;--ic-link-color:#000!important;}
        .ic-DashboardCard,.bc-block{border:1px solid #111!important;}
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{color:#000!important;background:transparent!important;font-weight:800!important;}
        .bc-hdr-btn{background:#fff!important;border:1px solid #111!important;
          border-radius:0!important;box-shadow:none!important;color:#000!important;}`
    },
    /* --- 像素风：8-bit 夜景（低分辨率画布放大、关闭平滑）+ 切角像素框 + 硬阴影 ---
     * 调色板取自 Sweetie 16：夜 #1a1c2c / 深蓝 #29366f / 板 #333c57 / 灰蓝 #566c86 / 橙 #ef7d57 / 黄 #ffcd75 / 绿 #a7f070 / 蓝 #41a6f6 / 紫 #5d275d
     * 「像素感」的来源：1) 背景是 1/5 分辨率的离屏画布按 5 倍放大、imageSmoothingEnabled=false，星星 / 云 / 楼 / 月亮全是整像素块；
     *   2) 所有框用 clip-path 切掉 8px 角（= 2 个“像素”），配 4px 深色描边 + 内侧 4px 亮 / 暗斜面，就是老游戏的对话框；
     *   3) 标题 Press Start 2P + 硬阴影，正文 VT323；4) 动画 12fps 抽帧，鼠标拖尾吸附 5px 网格。 */
    pixel: {
      tagHeader: true,
      calendar: {
        font: "'Press Start 2P',monospace", mono: "'VT323',monospace", headSize: "8px", titleSize: "16px",
        text: "#f4f4f4", muted: "#94b0c2", bg: "#29366f", cell: "#333c57", cellAlt: "#1a1c2c", today: "#5d275d", line: "#1a1c2c",
        head: "#1a1c2c", headText: "#ffcd75", radius: "0", border: "4px solid #1a1c2c", shadow: "8px 8px 0 #0b0c15",
        btnBg: "#41a6f6", btnText: "#1a1c2c", btnBorder: "4px solid #1a1c2c", btnShadow: "4px 4px 0 #0b0c15",
        accent: "#ef7d57", accentText: "#1a1c2c", accentLink: "#ffcd75", eventRadius: "0", eventBorder: "#1a1c2c", eventShadow: "3px 3px 0 #0b0c15"
      },
      // 吸附到 5px 网格的像素块（和背景画布同一“像素”尺寸），四色
      trail: { colors: ["#ef7d57", "#ffcd75", "#a7f070", "#41a6f6"], shape: "square", size: 5, snap: 5, count: 2, life: 500, spread: 10, drift: 0, alpha: 1 },
      font: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap",
      css: `
        /* ---- 全局：背景交给画布（bc-fx-active 已把页面底透明），正文 VT323 ---- */
        body.ic-app{font-family:'VT323',monospace!important;font-size:1.2rem!important;color:#f4f4f4!important;}
        :root{--ic-brand-primary:#ef7d57!important;--ic-link-color:#ffcd75!important;}
        .ic-Layout-contentMain,.ic-Dashboard-header *{color:#f4f4f4!important;}
        a:not(.ic-DashboardCard__link):not(.ic-app-header__menu-list-link):not(.btn):not(.Button){color:#ffcd75!important;}
        a:not(.ic-DashboardCard__link):not(.ic-app-header__menu-list-link):hover{color:#a7f070!important;text-decoration:underline dotted!important;}
        h1,h2,h3,.bc-block-title,#bc-gear,#bc-study-btn,.bc-panel-head,.bc-pill,.bc-exam-type,.bc-grade-badge,.bc-card-group-header,
        .bc-today-tag,.bc-latest-kind,.bc-abs-mark,.bc-sec-badge,.bc-exam-group-hd,.bc-block-title .bc-scan-btn{
          font-family:'Press Start 2P',monospace!important;}
        h1,h2,h3{font-size:14px!important;line-height:1.6!important;text-shadow:3px 3px 0 #1a1c2c!important;}
        .bc-block-title{font-size:10px!important;line-height:1.8!important;color:#ffcd75!important;text-shadow:2px 2px 0 #1a1c2c!important;}
        img,.ic-avatar,canvas{image-rendering:pixelated!important;}
        ::selection{background:#ef7d57;color:#1a1c2c;}

        /* ---- 左侧导航：深蓝 + 像素描边 ---- */
        #header.ic-app-header{background:#29366f!important;border-right:4px solid #1a1c2c!important;box-shadow:4px 0 0 #0b0c15!important;}
        #header .ic-app-header__menu-list-link{color:#94b0c2!important;}
        #header .ic-app-header__menu-list-link .menu-item__text{font-family:'Press Start 2P',monospace!important;font-size:7px!important;line-height:1.6!important;}
        #header .ic-icon-svg{fill:currentColor!important;}
        #header .ic-app-header__menu-list-link:hover,#header .ic-app-header__menu-list-item--active>.ic-app-header__menu-list-link{
          color:#ffcd75!important;background:#1a1c2c!important;}
        #header .menu-item__badge{background:#ef7d57!important;color:#1a1c2c!important;border:2px solid #1a1c2c!important;border-radius:0!important;
          font-family:'Press Start 2P',monospace!important;font-size:7px!important;}

        /* ---- 像素框：切角 + 描边 + 内斜面 + 硬阴影（卡片 / 面板 / 侧栏卡 / 弹窗 / 设置面板） ---- */
        .ic-DashboardCard,.bc-block,.bc-msg-popup,#bc-panel,.bc-exam-edit,#bc-study,.bc-exam-group,.bc-exam-item,.bc-today-import{
          background:#333c57!important;color:#f4f4f4!important;border:4px solid #1a1c2c!important;border-radius:0!important;
          box-shadow:inset 4px 4px 0 #566c86,inset -4px -4px 0 #29366f,8px 8px 0 #0b0c15!important;}
        .ic-DashboardCard{overflow:hidden!important;transition:none!important;}
        .ic-DashboardCard:hover{transform:translate(-2px,-2px)!important;}
        .ic-DashboardCard *,.bc-block *{color:#f4f4f4!important;}
        .ic-DashboardCard__header_hero{border-bottom:4px solid #1a1c2c!important;image-rendering:pixelated!important;}
        /* 卡片内区（标题 / 课号 / 学期）是 Canvas 自带的白底，字已刷成浅色，底不跟着变深就是白底白字 */
        .ic-DashboardCard__header_content,.ic-DashboardCard__header,.ic-DashboardCard__box,.ic-DashboardCard__link{background:#333c57!important;}
        .ic-DashboardCard__header-title,.ic-DashboardCard__header-title span{
          font-family:'VT323',monospace!important;font-size:19px!important;line-height:1.2!important;font-weight:700!important;
          color:#ffcd75!important;text-shadow:2px 2px 0 #1a1c2c!important;letter-spacing:.02em!important;}
        .ic-DashboardCard__header-subtitle,.ic-DashboardCard__header-term{font-family:'VT323',monospace!important;font-size:16px!important;color:#c9d6e2!important;text-shadow:none!important;}
        .ic-DashboardCard__action-container{border-top:4px solid #1a1c2c!important;background:#29366f!important;}
        .bc-exam-item{box-shadow:inset 3px 3px 0 #566c86,inset -3px -3px 0 #29366f,3px 3px 0 #0b0c15!important;border-width:3px!important;}
        .bc-exam-item{border-left-color:var(--bc-cc,#1a1c2c)!important;}
        .bc-exam-group{background:#29366f!important;}
        .bc-block-title{border-bottom:4px solid #1a1c2c!important;padding-bottom:8px!important;margin-bottom:12px!important;}
        .bc-list li,.bc-abs-list li.bc-abs-row,.bc-latest-list li.bc-latest-row,.bc-today-list li.bc-today-row{border-bottom:2px dotted #566c86!important;}
        .bc-card-group-header{color:#ffcd75!important;font-size:9px!important;line-height:1.8!important;border-bottom:4px solid #1a1c2c!important;text-shadow:2px 2px 0 #1a1c2c!important;}

        /* ---- 小标签 / 徽章：方块 + 8px 像素字 ---- */
        .bc-pill,.bc-exam-type,.bc-today-tag,.bc-latest-kind,.bc-exam-course-tag,.bc-sec-badge,.bc-cal-type,.bc-latest-rule,.bc-abs-mark,.bc-grade-badge,.bc-bell-badge,.bc-msg-kind,.bc-msg-tag,.bc-row-tag{
          border-radius:0!important;font-family:'Press Start 2P',monospace!important;font-size:7px!important;line-height:1.8!important;
          border:2px solid #1a1c2c!important;box-shadow:2px 2px 0 #0b0c15!important;}
        .bc-pill{background:#41a6f6!important;color:#1a1c2c!important;}
        .bc-pill-bad{background:#ef7d57!important;color:#1a1c2c!important;}
        .bc-exam-type{background:#5d275d!important;color:#ffcd75!important;}
        .bc-grade-badge{background:#1a1c2c!important;color:#a7f070!important;backdrop-filter:none!important;}
        .bc-abs-ok .bc-abs-mark{background:#a7f070!important;color:#1a1c2c!important;border-radius:0!important;}
        .bc-abs-bad .bc-abs-mark{background:#ef7d57!important;color:#1a1c2c!important;border-radius:0!important;}
        .bc-sec-badge{background:#41a6f6!important;color:#1a1c2c!important;}
        .bc-when,.bc-msg-date,.bc-gpa-sub,.bc-abs-sub,.bc-today-sub,.bc-latest-hd,.bc-sec-sub{color:#94b0c2!important;font-family:'VT323',monospace!important;font-size:15px!important;}
        .bc-gpa-num{color:#a7f070!important;text-shadow:4px 4px 0 #1a1c2c!important;font-family:'Press Start 2P',monospace!important;font-size:28px!important;}
        .bc-sbg-num{color:#a7f070!important;font-family:'Press Start 2P',monospace!important;text-shadow:3px 3px 0 #1a1c2c!important;}
        .bc-sbg-track,.bc-sbg-fill,.bc-exam-course-tag,.bc-cal-chip,.bc-links-list li a,.bc-abs-msg{border-radius:0!important;}
        .bc-sbg-track{border:2px solid #1a1c2c!important;height:12px!important;}
        .bc-cal-chip{background:#333c57!important;border:2px solid #1a1c2c!important;border-left:4px solid var(--bc-cc,#ffcd75)!important;color:#f4f4f4!important;font-family:'VT323',monospace!important;font-size:14px!important;}
        .bc-exam-more,.bc-scan-btn,.bc-del,.bc-msg-allread,.bc-clear,.bc-primary-btn,.bc-today-import-btn,.bc-today-reimport{
          background:#41a6f6!important;color:#1a1c2c!important;border:3px solid #1a1c2c!important;border-radius:0!important;
          box-shadow:3px 3px 0 #0b0c15!important;font-family:'Press Start 2P',monospace!important;font-size:7px!important;line-height:1.8!important;padding:4px 8px!important;}
        .bc-primary-btn,.bc-today-import-btn{background:#ef7d57!important;}
        .bc-exam-more:active,.bc-scan-btn:active,.bc-del:active,.bc-primary-btn:active{transform:translate(3px,3px);box-shadow:none!important;}
        .bc-exam-hint,.bc-links-hint{color:#566c86!important;}
        .bc-links-group>summary{color:#ffcd75!important;font-family:'Press Start 2P',monospace!important;font-size:7px!important;line-height:2!important;}
        .bc-links-list li a:hover{background:#29366f!important;}
        .bc-ay>summary{color:#ffcd75!important;}

        /* ---- 右下角按钮：像素方块 ---- */
        #bc-gear,#bc-study-btn{border-radius:0!important;border:4px solid #1a1c2c!important;box-shadow:inset 3px 3px 0 rgba(255,255,255,.35),inset -3px -3px 0 rgba(0,0,0,.35),5px 5px 0 #0b0c15!important;
          font-size:18px!important;}
        #bc-gear{background:#ef7d57!important;}
        #bc-study-btn{background:#41a6f6!important;}
        #bc-gear:hover{transform:none!important;}

        /* ---- 仪表盘标题横条：透明，标题像素字 + 闪烁光标 ---- */
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{color:#ffcd75!important;background:transparent!important;
          font-family:'Press Start 2P',monospace!important;font-size:18px!important;line-height:1.6!important;text-shadow:4px 4px 0 #1a1c2c!important;}
        .bc-hdr-title::before{content:"▶ ";color:#ef7d57;}
        .bc-hdr-title::after{content:"▮";color:#a7f070;margin-left:6px;animation:bc-px-blink 1s steps(1,end) infinite;}
        @keyframes bc-px-blink{50%{opacity:0}}
        .bc-hdr-btn{background:#41a6f6!important;color:#1a1c2c!important;border:4px solid #1a1c2c!important;border-radius:0!important;
          box-shadow:4px 4px 0 #0b0c15!important;font-family:'Press Start 2P',monospace!important;font-size:8px!important;}
        .bc-hdr-btn *{color:#1a1c2c!important;background-color:transparent!important;}
        .bc-hdr-btn svg{fill:#1a1c2c!important;}
        .bc-hdr-btn:active{transform:translate(4px,4px);box-shadow:none!important;}

        /* ---- 设置面板 / 消息弹窗内部 ---- */
        #bc-panel *,.bc-msg-popup *{color:#f4f4f4!important;}
        .bc-panel-head,.bc-msg-head{border-bottom:4px solid #1a1c2c!important;background:#29366f!important;font-size:9px!important;}
        .bc-tabs{border-bottom:4px solid #1a1c2c!important;}
        .bc-tabs button{font-family:'Press Start 2P',monospace!important;font-size:7px!important;border-radius:0!important;}
        .bc-tabs button.bc-tab-active{background:#41a6f6!important;color:#1a1c2c!important;}
        #bc-panel input,#bc-panel select,#bc-panel textarea,#bc-study input,#bc-study select,#bc-study textarea{
          background:#1a1c2c!important;color:#f4f4f4!important;border:3px solid #566c86!important;border-radius:0!important;font-family:'VT323',monospace!important;font-size:16px!important;}
        .bc-theme-card{background:#29366f!important;border:3px solid #1a1c2c!important;border-radius:0!important;}
        .bc-theme-card.bc-sel{border-color:#ffcd75!important;box-shadow:3px 3px 0 #0b0c15!important;}
        .bc-msg-item.bc-unread{background:#29366f!important;}
        .bc-msg-item.bc-read{background:#1a1c2c!important;}
        .bc-row-unread{background:#29366f!important;box-shadow:inset 6px 0 0 #41a6f6!important;}
        .bc-study-tabs button.bc-study-active{background:#41a6f6!important;color:#1a1c2c!important;}
        .bc-study-card{background:#29366f!important;border:4px solid #1a1c2c!important;border-radius:0!important;box-shadow:inset 4px 4px 0 #566c86,6px 6px 0 #0b0c15!important;}
        .bc-study-card.bc-study-flipped{background:#5d275d!important;}
        /* Canvas 自带的浅底小件 */
        .ic-notification,#announcementWrapper .ic-notification{background:#333c57!important;border:4px solid #1a1c2c!important;box-shadow:6px 6px 0 #0b0c15!important;}
        .ic-notification *{color:#f4f4f4!important;background-color:transparent!important;}
        #right-side,#right-side *{color:#f4f4f4!important;}
        #right-side h2,#right-side .todo-list-header{color:#ffcd75!important;font-family:'Press Start 2P',monospace!important;font-size:8px!important;line-height:1.8!important;}`,
      start() {
        const { c, ctx } = BC.themes._canvas("#1a1c2c");
        const S = 5;                               // 1 个“像素” = 5 个屏幕像素
        const off = document.createElement("canvas");
        const octx = off.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        const PAL = { night: "#1a1c2c", deep: "#29366f", mid: "#333c57", haze: "#566c86", orange: "#ef7d57", yellow: "#ffcd75", green: "#a7f070", blue: "#41a6f6", purple: "#5d275d", pale: "#94b0c2", white: "#f4f4f4" };
        let W = 0, H = 0, stars = [], clouds = [], bld = [], windows = [], frame = 0;
        const rnd = (a, b) => a + Math.random() * (b - a);
        const build = () => {
          W = Math.ceil(c.width / S); H = Math.ceil(c.height / S);
          off.width = W; off.height = H;
          stars = Array.from({ length: Math.round(W * H / 120) }, () => ({ x: (Math.random() * W) | 0, y: (Math.random() * H * 0.7) | 0, p: (Math.random() * 40) | 0, big: Math.random() < 0.12 }));
          clouds = Array.from({ length: Math.max(3, (W / 60) | 0) }, () => ({ x: rnd(-40, W), y: rnd(H * 0.08, H * 0.45), w: (rnd(14, 34)) | 0, v: rnd(0.04, 0.12) }));
          // 天际线：从左到右随机宽高的楼，底部 25% 高度以内
          bld = []; windows = [];
          for (let x = 0; x < W;) {
            const w = (rnd(6, 16)) | 0, h = (rnd(H * 0.06, H * 0.26)) | 0;
            bld.push({ x, w, h, shade: Math.random() < 0.5 ? PAL.deep : PAL.night });
            for (let wy = H - h + 3; wy < H - 4; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (Math.random() < 0.35) windows.push({ x: wx, y: wy, on: Math.random() < 0.7 });
            x += w + ((rnd(1, 4)) | 0);
          }
        };
        build();
        const onResize = () => build();
        window.addEventListener("resize", onResize);
        let raf, last = 0;
        const draw = (t) => {
          raf = requestAnimationFrame(draw);
          if (BC.pagestate && BC.pagestate.idle) return;         // 页面失焦 / 不可见：不画
          if (t - last < 83) return; last = t; frame++;            // 12fps 抽帧，才有老游戏的“卡”感
          if (off.width !== Math.ceil(c.width / S)) build();
          // 天空：四条硬边色带
          const bands = [[0, PAL.night], [0.35, "#21243d"], [0.6, PAL.deep], [0.8, PAL.mid]];
          bands.forEach(([f, col], i) => { const y0 = (H * f) | 0, y1 = i + 1 < bands.length ? (H * bands[i + 1][0]) | 0 : H; octx.fillStyle = col; octx.fillRect(0, y0, W, y1 - y0); });
          // 星星：按相位闪
          stars.forEach(s => { const on = ((frame + s.p) % 40) < 30; if (!on) return; octx.fillStyle = s.big ? PAL.white : PAL.pale; octx.fillRect(s.x, s.y, 1, 1); if (s.big) { octx.fillRect(s.x - 1, s.y, 1, 1); octx.fillRect(s.x + 1, s.y, 1, 1); octx.fillRect(s.x, s.y - 1, 1, 1); octx.fillRect(s.x, s.y + 1, 1, 1); } });
          // 月亮：整像素圆 + 暗斑
          const mx = (W * 0.82) | 0, my = (H * 0.16) | 0, r = Math.max(5, (H / 22) | 0);
          for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) { octx.fillStyle = ((x + y) % 7 === 0 && x * x + y * y < r * r * 0.5) ? PAL.pale : PAL.yellow; octx.fillRect(mx + x, my + y, 1, 1); }
          // 云：三块叠成的方块云，慢慢右移
          clouds.forEach(cl => {
            cl.x += cl.v; if (cl.x > W + 10) cl.x = -cl.w - 10;
            const x = cl.x | 0, y = cl.y | 0, w = cl.w, h = Math.max(4, (w / 3) | 0);
            octx.fillStyle = PAL.haze; octx.fillRect(x, y + 2, w, h - 2); octx.fillRect(x + ((w * 0.2) | 0), y, (w * 0.6) | 0, h);
            octx.fillStyle = PAL.pale; octx.fillRect(x + ((w * 0.25) | 0), y + 1, (w * 0.5) | 0, 1);
          });
          // 天际线 + 窗户（窗户偶尔开关）
          bld.forEach(b => { octx.fillStyle = b.shade; octx.fillRect(b.x, H - b.h, b.w, b.h); });
          windows.forEach(w => { if (frame % 60 === 0 && Math.random() < 0.08) w.on = !w.on; if (!w.on) return; octx.fillStyle = PAL.yellow; octx.fillRect(w.x, w.y, 2, 2); });
          // 地面：两行砖
          octx.fillStyle = PAL.night; octx.fillRect(0, H - 4, W, 4);
          octx.fillStyle = PAL.deep; for (let x = (frame / 8 | 0) % 6 - 6; x < W; x += 6) { octx.fillRect(x, H - 4, 3, 1); octx.fillRect(x + 3, H - 2, 3, 1); }
          // 放大到全屏（不平滑）
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(off, 0, 0, W, H, 0, 0, W * S, H * S);
        };
        raf = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("resize", c._bcResize); };
      }
    },

    /* --- 赛博朋克：霓虹 + 扫描线 + 随机故障 --- */
    cyberpunk: {
      calendar: {
        font: "'Orbitron',sans-serif", mono: "monospace",
        text: "#eaf2ff", muted: "#6b7aa8", bg: "#0e0e1f", cell: "#0e0e1f", cellAlt: "#090914", today: "#1a1040", line: "#2a2a4a",
        head: "#12122a", headText: "#00e5ff", radius: "0", border: "1px solid #ff2bd6", shadow: "0 0 14px rgba(255,43,214,.35)",
        btnBg: "#0e0e1f", btnText: "#eaf2ff", btnBorder: "1px solid #ff2bd6", btnShadow: "0 0 8px rgba(255,43,214,.3)",
        accent: "#ff2bd6", accentText: "#fff", accentLink: "#00e5ff", eventRadius: "2px", eventShadow: "0 0 6px rgba(0,229,255,.35)"
      },
      // 青 / 品红霓虹光点，带光晕
      trail: { colors: ["#00e5ff", "#ff2bd6"], shape: "dot", size: 4, count: 3, life: 600, spread: 8, drift: 0.8, glow: 14, alpha: 0.85 },
      tagHeader: true,
      font: "https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&display=swap",
      css: `
        body.ic-app{background:#070713!important;font-family:'Rajdhani','Segoe UI',sans-serif!important;
          font-weight:600!important;color:#eaf2ff!important;}
        :root{--ic-brand-primary:#ff2bd6!important;--ic-link-color:#00e5ff!important;}
        .ic-Layout-contentMain,.ic-Dashboard-header,.ic-Dashboard-header *{color:#eaf2ff!important;}
        h1,h2{font-family:'Orbitron',sans-serif!important;color:#00e5ff!important;text-shadow:0 0 6px rgba(0,229,255,.45)!important;}
        h3,.bc-block-title,.ic-DashboardCard__header-title{font-family:'Orbitron',sans-serif!important;color:#00e5ff!important;text-shadow:none!important;}
        a{color:#00e5ff!important;}
        .ic-DashboardCard,.bc-block{background:#0e0e1f!important;border:1px solid #ff2bd6!important;
          box-shadow:0 0 14px rgba(255,43,214,.35)!important;color:#eaf2ff!important;}
        .ic-DashboardCard *,.bc-block *{color:#eaf2ff!important;}
        .ic-DashboardCard__header-title,.ic-DashboardCard__header-title *{color:#00e5ff!important;}

        /* ---- 白底面板必须一起变深 ----
         * 正文被调成近白的 #eaf2ff 并沿 .ic-Layout-contentMain / body 继承下去，
         * 任何还留着白底的容器就会白底白字。以下是会碰到的几个白底面。 */
        .ic-notification,#announcementWrapper .ic-notification{
          background:#0e0e1f!important;border:1px solid #00e5ff!important;
          box-shadow:0 0 14px rgba(0,229,255,.25)!important;}
        /* 白底其实画在内部的 __content / __message 包裹层上，只给 .ic-notification 上深色
         * 会被子层的白盖住。所以后代一律透明，让根节点的深色透出来；
         * 图标条的底色在下面重新指定（同特异度、靠后覆盖）。 */
        .ic-notification *{color:#eaf2ff!important;background-color:transparent!important;}
        .ic-notification__title,.ic-notification__title *{color:#00e5ff!important;}
        .ic-notification a,.ic-notification a *{color:#ff2bd6!important;}
        .ic-notification__icon{background:#00e5ff!important;}
        .ic-notification__icon,.ic-notification__icon *{color:#070713!important;fill:#070713!important;}

        /* 扩展自己的浮层：挂在 body 下，直接继承 body 的浅色字 */
        #bc-panel,.bc-msg-popup,.bc-exam-edit{background:#0e0e1f!important;border:1px solid #ff2bd6!important;}
        #bc-panel *,.bc-msg-popup *,.bc-exam-edit *{color:#eaf2ff!important;}
        #bc-panel h1,#bc-panel h2,#bc-panel h3,.bc-panel-head{color:#00e5ff!important;}
        .bc-panel-head,.bc-tabs,.bc-row,.bc-order-item,.bc-msg-head,.bc-msg-item{
          border-color:#2a2a4a!important;}
        .bc-tabs button.bc-tab-active{background:#1a1a33!important;color:#00e5ff!important;}
        #bc-panel input,#bc-panel select,#bc-panel textarea,.bc-exam-edit input,.bc-exam-edit select,
        .bc-msg-allread,.bc-scan-btn,.bc-del,.bc-clear{
          background:#070713!important;color:#eaf2ff!important;border-color:#3a3a5e!important;}
        .bc-msg-item:hover{background:#16162e!important;}
        .bc-msg-item.bc-unread{background:#16233f!important;}
        .bc-msg-item.bc-read{background:#0a0a18!important;}
        .bc-msg-kind{background:#22224a!important;}
        .bc-theme-card{background:#12122a!important;border-color:#2a2a4a!important;}
        .bc-theme-card.bc-sel{background:#1a2b4a!important;border-color:#00e5ff!important;}

        /* 浅底小标签：.bc-block * 把字刷成浅色了，底色不跟着变就是浅底浅字 */
        .bc-pill{background:#22224a!important;color:#00e5ff!important;}
        .bc-exam-type{background:#2f1a52!important;color:#d3c2ff!important;}
        .bc-exam-group{background:#12122a!important;}
        .bc-exam-item{background:#16163a!important;box-shadow:none!important;}
        .bc-exam-course-tag{color:#0e0e1f!important;}
        .bc-row-unread{background:#16233f!important;}
        .bc-sbg-row{border-top-color:#2a2a4a!important;}

        /* 仪表盘标题横条（由共享的 _tagHeader 打标）：Canvas 画的白底满宽条 */
        .bc-hdr-strip{background:transparent!important;background-image:none!important;
          box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{
          font-family:'Orbitron',sans-serif!important;color:#00e5ff!important;
          text-shadow:0 0 8px rgba(0,229,255,.4)!important;background:transparent!important;}
        .bc-hdr-btn{background:#0e0e1f!important;border:1px solid #ff2bd6!important;
          box-shadow:0 0 8px rgba(255,43,214,.3)!important;}
        .bc-hdr-btn,.bc-hdr-btn *{color:#eaf2ff!important;background-color:transparent!important;}
        .bc-hdr-btn{background-color:#0e0e1f!important;}
        .bc-hdr-btn svg{fill:#eaf2ff!important;}

        /* 右侧栏在深色页面上直接用浅色字即可，不要给它白底 */
        #right-side,#right-side *{color:#eaf2ff!important;}
        #right-side h2,#right-side .todo-list-header{color:#00e5ff!important;}`,
      start() {
        document.documentElement.classList.add("bc-fx-active");
        document.getElementById(BC.themes.FX_ID)?.remove();
        const ov = document.createElement("div");
        ov.id = BC.themes.FX_ID;
        // 扫描线放到背景层（z-index:-1，在内容后面），暗底色也放这一层
        ov.style.cssText =
          "position:fixed;inset:0;z-index:-1;pointer-events:none;background-color:#070713;" +
          "background-image:repeating-linear-gradient(0deg,rgba(0,229,255,.06) 0,rgba(0,229,255,.06) 1px,transparent 1px,transparent 4px);";
        document.body.appendChild(ov);
        const iv = setInterval(() => {
          if (BC.pagestate && BC.pagestate.idle) return; // 页面失焦时不闪
          const els = [...document.querySelectorAll(".ic-DashboardCard,.bc-block")];
          if (!els.length) return;
          const el = els[Math.floor(Math.random() * els.length)];
          el.classList.add("bc-glitch");
          setTimeout(() => el.classList.remove("bc-glitch"), 420);
        }, 1500);
        return () => clearInterval(iv);
      }
    },

    /* --- 黑客：绿色字幕雨 --- */
    hacker: {
      calendar: {
        font: "'Share Tech Mono',monospace", mono: "'Share Tech Mono',monospace",
        text: "#43d675", muted: "#1f8a4c", bg: "rgba(0,18,6,.92)", cell: "rgba(0,18,6,.85)", cellAlt: "rgba(0,10,3,.85)", today: "#03260f",
        line: "#1f8a4c", head: "#001206", headText: "#43d675", radius: "0", border: "1px solid #1f8a4c", shadow: "0 0 10px rgba(40,200,90,.25)",
        btnBg: "#000", btnText: "#43d675", btnBorder: "1px solid #1f8a4c", btnShadow: "none",
        accent: "#1f8a4c", accentText: "#001206", accentLink: "#43d675", eventRadius: "0", eventBorder: "#1f8a4c"
      },
      // 绿色字符掉落，和背景字幕雨同一套字符
      trail: { colors: ["#43d675", "#28e070", "#9bffc0"], shape: "char", chars: "ｱｲｳｴｵｶｷｸ0123456789ABCDEF<>/$+=*", font: "14px 'Share Tech Mono',monospace",
               count: 1, life: 700, spread: 6, drift: 0.3, gravity: 0.08, glow: 6, alpha: 0.9, min: 6 },
      tagHeader: true,
      font: "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap",
      css: `
        body.ic-app{background:transparent!important;font-family:'Share Tech Mono',monospace!important;color:#43d675!important;}
        :root{--ic-brand-primary:#1f8a4c!important;--ic-link-color:#43d675!important;}
        .ic-Layout-contentMain,.ic-Dashboard-header,.ic-Dashboard-header *{color:#43d675!important;}
        .ic-DashboardCard,.bc-block{background:rgba(0,18,6,.85)!important;border:1px solid #1f8a4c!important;
          box-shadow:0 0 10px rgba(40,200,90,.25)!important;}
        .ic-DashboardCard *,.bc-block *{color:#43d675!important;}
        /* 同赛博朋克：正文是浅绿，白底面板不一起变深就几乎看不清（绿字白底约 2:1） */
        .ic-notification,#announcementWrapper .ic-notification{
          background:#001206!important;border:1px solid #1f8a4c!important;}
        /* 同赛博朋克：白底在内部包裹层上，后代一律透明 */
        .ic-notification *{color:#43d675!important;background-color:transparent!important;}
        .ic-notification__icon{background:#1f8a4c!important;}
        .ic-notification__icon,.ic-notification__icon *{color:#001206!important;fill:#001206!important;}
        #bc-panel,.bc-msg-popup,.bc-exam-edit{background:#001206!important;border:1px solid #1f8a4c!important;}
        #bc-panel *,.bc-msg-popup *,.bc-exam-edit *{color:#43d675!important;}
        #bc-panel input,#bc-panel select,#bc-panel textarea,.bc-exam-edit input,.bc-exam-edit select,
        .bc-msg-allread,.bc-scan-btn,.bc-del,.bc-clear{
          background:#000!important;color:#43d675!important;border-color:#1f8a4c!important;}
        .bc-tabs button.bc-tab-active{background:#03260f!important;}
        .bc-msg-item.bc-unread{background:#03260f!important;}
        .bc-msg-item.bc-read{background:#03130a!important;}
        .bc-msg-item:hover{background:#04200c!important;}
        .bc-theme-card{background:#03190a!important;border-color:#1f8a4c!important;}
        .bc-pill,.bc-exam-type{background:#03260f!important;color:#43d675!important;}
        .bc-exam-group{background:#03190a!important;}
        .bc-exam-item{background:#03260f!important;box-shadow:none!important;}
        .bc-exam-course-tag{color:#001206!important;}
        .bc-row-unread{background:#03260f!important;}
        .bc-sbg-row{border-top-color:#1f8a4c!important;}
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{color:#43d675!important;background:transparent!important;}
        .bc-hdr-btn,.bc-hdr-btn *{color:#43d675!important;background-color:transparent!important;}
        .bc-hdr-btn{background-color:#001206!important;border:1px solid #1f8a4c!important;}
        .bc-hdr-btn svg{fill:#43d675!important;}
        #right-side,#right-side *{color:#43d675!important;}`,
      start() {
        const { c, ctx } = BC.themes._canvas("#000");
        const fs = 16;
        let drops = [];
        const reset = () => { drops = new Array(Math.ceil(c.width / fs)).fill(0).map(() => Math.random() * -40); };
        reset();
        const chars = "ｱｲｳｴｵｶｷｸ0123456789ABCDEF<>/$+=*".split("");
        let raf;
        const draw = () => {
          if (BC.pagestate && BC.pagestate.idle) { raf = requestAnimationFrame(draw); return; } // 页面失焦 / 不可见：只空转不画
          ctx.fillStyle = "rgba(0,0,0,.07)";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.fillStyle = "#28e070";
          ctx.font = fs + "px monospace";
          if (drops.length !== Math.ceil(c.width / fs)) reset();
          for (let i = 0; i < drops.length; i++) {
            ctx.fillText(chars[(Math.random() * chars.length) | 0], i * fs, drops[i] * fs);
            if (drops[i] * fs > c.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
          }
          raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", c._bcResize); };
      }
    },

    /* --- 春夏秋冬：按月份变换 + 飘落粒子 --- */
    seasons: {
      tagHeader: true,
      // 四季背景是画出来的，日历用半透明白 + 毛玻璃让画面透出来
      calendar: {
        text: "#333", muted: "#999", bg: "rgba(255,255,255,.86)", cell: "rgba(255,255,255,.62)", cellAlt: "rgba(255,255,255,.3)",
        today: "rgba(255,255,255,.96)", line: "rgba(0,0,0,.1)", head: "rgba(255,255,255,.72)", headText: "#444",
        radius: "12px", border: "0", shadow: "0 4px 16px rgba(0,0,0,.10)", blur: true,
        btnBg: "rgba(255,255,255,.85)", btnText: "#333", btnBorder: "0", btnShadow: "0 2px 8px rgba(0,0,0,.14)",
        accent: "#333", accentText: "#fff", accentLink: "#0374b5", eventRadius: "6px"
      },
      // 跟背景粒子同一季节：春花瓣 / 夏光斑 / 秋叶 / 冬雪
      trail() {
        const m = new Date().getMonth() + 1;
        const season = m <= 2 || m === 12 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "autumn";
        return {
          spring: { colors: ["#ffb3c8", "#ff8fab", "#ffc9de"], shape: "petal", size: 5, count: 1, life: 900, spread: 8, drift: 0.6, gravity: 0.03, alpha: 0.85 },
          summer: { colors: ["#fff3a8", "#ffe35c", "#bdf0a0"], shape: "spark", size: 4, count: 2, life: 600, spread: 10, drift: 0.5, glow: 6, alpha: 0.85 },
          autumn: { colors: ["#e8843c", "#c75b2a", "#d9a441"], shape: "petal", size: 6, count: 1, life: 1000, spread: 8, drift: 0.6, gravity: 0.04, alpha: 0.85 },
          winter: { colors: ["#ffffff", "#eaf3ff", "#dbe9fb"], shape: "dot", size: 3, count: 2, life: 900, spread: 8, drift: 0.4, gravity: 0.02, glow: 5, alpha: 0.9 }
        }[season];
      },
      // 四季天空都是浅色，正文仍是 Canvas 默认深色，所以横条直接透明即可，让背景画面透出来
      css: `
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title,.bc-hdr-title *{background:transparent!important;
          text-shadow:0 1px 3px rgba(255,255,255,.9)!important;}
        .bc-hdr-btn{background:rgba(255,255,255,.85)!important;border:0!important;
          border-radius:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.14)!important;}`,
      start() {
        const { c, ctx } = BC.themes._canvas();
        const m = new Date().getMonth() + 1;
        const season = m <= 2 || m === 12 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "autumn";
        const CONF = {
          spring: { sky: ["#fde7f0", "#e9f7ec"], colors: ["#ffb3c8", "#ff8fab", "#ffc9de"], shape: "petal" },
          summer: { sky: ["#bfe9ff", "#eaffe0"], colors: ["#fff3a8", "#ffe35c", "#bdf0a0"], shape: "spark" },
          autumn: { sky: ["#ffe9c9", "#ffd2a6"], colors: ["#e8843c", "#c75b2a", "#d9a441"], shape: "leaf" },
          winter: { sky: ["#dfeefc", "#f0f6ff"], colors: ["#ffffff", "#eaf3ff", "#dbe9fb"], shape: "snow" }
        }[season];
        const N = 90;
        const P = Array.from({ length: N }, () => ({
          x: Math.random(), y: Math.random(), r: 3 + Math.random() * 6,
          vy: 0.3 + Math.random() * 1.0, sway: Math.random() * 6, ph: Math.random() * 6.28,
          col: CONF.colors[(Math.random() * CONF.colors.length) | 0], rot: Math.random() * 6.28
        }));
        let raf, f = 0;
        const draw = () => {
          if (BC.pagestate && BC.pagestate.idle) { raf = requestAnimationFrame(draw); return; } // 页面失焦 / 不可见：只空转不画
          const W = c.width, H = c.height;
          const g = ctx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, CONF.sky[0]); g.addColorStop(1, CONF.sky[1]);
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          for (const p of P) {
            const x = p.x * W + Math.sin(f * 0.02 + p.ph) * p.sway;
            const y = (p.y * H + f * p.vy) % (H + 20);
            ctx.fillStyle = p.col; ctx.globalAlpha = 0.85;
            if (CONF.shape === "snow") { ctx.beginPath(); ctx.arc(x, y, p.r * 0.7, 0, 6.3); ctx.fill(); }
            else if (CONF.shape === "spark") { ctx.beginPath(); ctx.arc(x, y, p.r * 0.5, 0, 6.3); ctx.fill(); }
            else {
              ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + f * 0.01);
              if (CONF.shape === "leaf") ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
              else { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.3); ctx.fill(); }
              ctx.restore();
            }
          }
          ctx.globalAlpha = 1; f++;
          raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", c._bcResize); };
      }
    },

    /* --- 日出日落：海岸天空，太阳从海平线升起划过落下，夜里出月亮和星星 --- */
    timeofday: {
      tagHeader: true,
      // 天空夜里近黑，日历用半透明浅色板 + 毛玻璃，白天黑夜都读得清
      calendar: {
        text: "#222", muted: "#8a8f99", bg: "rgba(255,255,255,.84)", cell: "rgba(255,255,255,.6)", cellAlt: "rgba(255,255,255,.28)",
        today: "rgba(255,230,180,.85)", line: "rgba(0,0,0,.1)", head: "rgba(255,255,255,.7)", headText: "#3b3d77",
        radius: "10px", border: "0", shadow: "0 2px 12px rgba(0,0,0,.2)", blur: true,
        btnBg: "rgba(255,255,255,.85)", btnText: "#222", btnBorder: "0", btnShadow: "0 2px 8px rgba(0,0,0,.2)",
        accent: "#3b3d77", accentText: "#fff", accentLink: "#2a4f9e", eventRadius: "6px"
      },
      // 白天：暖阳光斑；夜里：星星闪点
      trail() {
        const h = new Date().getHours();
        const night = h < 6 || h >= 19;
        return night
          ? { colors: ["#ffffff", "#ffe9a8", "#cfe3ff"], shape: "spark", size: 3.5, count: 1, life: 800, spread: 10, drift: 0.3, glow: 8, alpha: 0.9 }
          : { colors: ["#ffd166", "#ffb347", "#fff3c4"], shape: "dot", size: 4, count: 2, life: 600, spread: 8, drift: 0.5, glow: 10, alpha: 0.75 };
      },
      /* 这个主题的天空夜里是 #0b1026 这种近黑色，而正文仍是 Canvas 默认深色。
       * 所以这里不能像 seasons 那样直接透明——那样夜间标题会黑字压黑天。
       * 给一层半透明浅色板 + 模糊，白天黑夜都读得清。 */
      css: `
        .bc-hdr-strip{background:transparent!important;box-shadow:none!important;border:0!important;}
        .bc-hdr-title{background:rgba(255,255,255,.78)!important;backdrop-filter:blur(6px)!important;
          display:inline-block!important;padding:2px 14px!important;border-radius:10px!important;}
        .bc-hdr-title *{background:transparent!important;}
        .bc-hdr-btn{background:rgba(255,255,255,.85)!important;border:0!important;
          border-radius:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.2)!important;}`,
      start() {
        const { c, ctx } = BC.themes._canvas();
        const stars = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random() * 0.6, ph: Math.random() * 6.28 }));
        let raf, f = 0;
        const skyColors = (h) => {
          const s = [[0, "#0b1026", "#10183a"], [5, "#2a335f", "#b9756a"], [7, "#8cb9e8", "#ffe0b0"],
                     [12, "#5aa6e6", "#cdeeff"], [16, "#6a93cf", "#ffe6bd"], [18.5, "#3b3d77", "#ef9a64"],
                     [20, "#1a1c40", "#3a2f5e"], [24, "#0b1026", "#10183a"]];
          let i = 0; while (i < s.length - 1 && h > s[i + 1][0]) i++;
          const a = s[i], b = s[Math.min(i + 1, s.length - 1)];
          const t = Math.min(1, Math.max(0, (h - a[0]) / ((b[0] - a[0]) || 1)));
          return [BC.themes._lerp(a[1], b[1], t), BC.themes._lerp(a[2], b[2], t)];
        };
        const draw = () => {
          if (BC.pagestate && BC.pagestate.idle) { raf = requestAnimationFrame(draw); return; } // 页面失焦 / 不可见：只空转不画
          const W = c.width, H = c.height, horizon = H * 0.66;
          const now = new Date(), hour = now.getHours() + now.getMinutes() / 60;
          const [top, bot] = skyColors(hour);
          // 天空
          const g = ctx.createLinearGradient(0, 0, 0, horizon);
          g.addColorStop(0, top); g.addColorStop(1, bot);
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon);
          const night = hour < 5.5 || hour > 19.5;
          // 星星（夜间）
          if (night) {
            for (const st of stars) {
              ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(f * 0.03 + st.ph));
              ctx.fillStyle = "#fff";
              ctx.fillRect(st.x * W, st.y * horizon, 1.6, 1.6);
            }
            ctx.globalAlpha = 1;
          }
          // 太阳 / 月亮 位置
          let bx, by, isSun;
          if (hour >= 6 && hour <= 18.5) {
            isSun = true; const t = (hour - 6) / 12.5;
            bx = t * W; by = horizon - Math.sin(t * Math.PI) * horizon * 0.8;
          } else {
            isSun = false; const nh = hour < 6 ? hour + 24 : hour; const t = (nh - 18.5) / 11.5;
            bx = t * W; by = horizon - Math.sin(t * Math.PI) * horizon * 0.8;
          }
          const R = 34;
          const glow = ctx.createRadialGradient(bx, by, 4, bx, by, R * 3);
          glow.addColorStop(0, isSun ? "rgba(255,220,120,.9)" : "rgba(220,230,255,.6)");
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bx, by, R * 3, 0, 6.3); ctx.fill();
          ctx.fillStyle = isSun ? "#ffd86b" : "#e8edff";
          ctx.beginPath(); ctx.arc(bx, by, R, 0, 6.3); ctx.fill();
          if (!isSun) { // 月牙阴影
            ctx.fillStyle = top; ctx.beginPath(); ctx.arc(bx + 11, by - 6, R, 0, 6.3); ctx.fill();
          }
          // 海面
          const sg = ctx.createLinearGradient(0, horizon, 0, H);
          sg.addColorStop(0, night ? "#16314d" : "#3a6ea5");
          sg.addColorStop(1, "#0a1c30");
          ctx.fillStyle = sg; ctx.fillRect(0, horizon, W, H - horizon);
          // 倒影
          ctx.globalAlpha = 0.5; ctx.fillStyle = isSun ? "rgba(255,210,110,.5)" : "rgba(220,230,255,.4)";
          for (let y = horizon; y < H; y += 6) {
            const ww = R * (1 + (y - horizon) / 40) * (0.6 + 0.4 * Math.abs(Math.sin(f * 0.08 + y)));
            ctx.fillRect(bx - ww / 2, y, ww, 2);
          }
          ctx.globalAlpha = 1; f++;
          raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", c._bcResize); };
      }
    },

    /* --- 马拉松：Rutgers 红 × 荧光黄的新粗野主义
     *     硬边 2px 黑框 + 实心偏移投影，背景为纯 CSS 层（无 rAF，几乎不吃 CPU）。 --- */
    marathon: {
      tagHeader: true,
      // 日历：白底 2px 黑边 + 实心偏移投影，表头黑底黄字，今天用淡黄
      calendar: {
        font: "'Inter',sans-serif", mono: "'JetBrains Mono',monospace", titleSize: "28px",
        text: "#111", muted: "#888", bg: "#fff", cell: "#fff", cellAlt: "#f4f4f4", today: "#f1fda6", line: "#111",
        head: "#111", headText: "#d3f922", radius: "0", border: "2px solid #111", shadow: "4px 4px 0 #111",
        btnBg: "#fff", btnText: "#111", btnBorder: "2px solid #111", btnShadow: "2px 2px 0 #111",
        accent: "#cc0033", accentText: "#fff", accentLink: "#cc0033", eventRadius: "0", eventBorder: "#111", eventShadow: "2px 2px 0 #111"
      },
      // 硬边方块：红 / 黑 / 黄，不带光晕，符合新粗野主义
      trail: { colors: ["#cc0033", "#111111", "#d3f922"], shape: "square", size: 8, snap: 4, count: 2, life: 450, spread: 12, drift: 0.4, alpha: 0.95 },
      font: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap",
      css: `
        /* ===== 设计令牌：黄 #d3f922 / 红 #cc0033 / 黑 #111 ===== */

        /* ---- 背景层（#bc-fx 由 inject.css 定位为 fixed inset:0 z-index:-1） ---- */
        #bc-fx{
          background-color:#d3f922;
          background-image:
            radial-gradient(circle at 100% 100%,rgba(0,0,0,.10) 10%,transparent 11%),
            radial-gradient(circle at 100% 100%,rgba(0,0,0,.10) 20%,transparent 21%);
          background-size:20px 20px;overflow:hidden;}
        #bc-fx .bc-mt-mark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          font-family:'Inter',sans-serif;font-size:22vw;font-weight:900;letter-spacing:-.045em;
          line-height:1;white-space:nowrap;color:rgba(0,0,0,.045);}
        #bc-fx .bc-mt-sub{position:absolute;top:65%;left:50%;transform:translate(-50%,-50%);
          font-family:'JetBrains Mono',monospace;font-size:1.7vw;font-weight:700;letter-spacing:.18em;
          white-space:nowrap;color:rgba(0,0,0,.10);}
        #bc-fx .bc-mt-ruler{position:absolute;left:104px;top:72px;bottom:72px;width:11px;
          border-left:1px dashed rgba(0,0,0,.3);
          background:repeating-linear-gradient(to bottom,rgba(0,0,0,.3) 0 1px,transparent 1px 64px);}
        #bc-fx .bc-mt-scan{position:absolute;left:0;right:0;height:2px;background:rgba(204,0,51,.4);
          animation:bc-mt-scan 9s linear infinite;}
        @keyframes bc-mt-scan{from{top:-2px}to{top:100%}}
        /* 左侧装饰统一避开 84px 宽的 Canvas 全局导航 */
        #bc-fx .bc-mt-hex{position:absolute;left:136px;bottom:16px;color:rgba(0,0,0,.45);
          font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;}
        #bc-fx .bc-mt-br{position:absolute;width:18px;height:18px;border:3px solid rgba(0,0,0,.75);}
        #bc-fx .bc-mt-br1{top:20px;left:104px;border-right:0;border-bottom:0;}
        #bc-fx .bc-mt-br2{top:20px;right:20px;border-left:0;border-bottom:0;}
        #bc-fx .bc-mt-br3{bottom:20px;left:104px;border-right:0;border-top:0;}
        #bc-fx .bc-mt-br4{bottom:20px;right:20px;border-left:0;border-top:0;}

        /* ---- 全局 ---- */
        body.ic-app{font-family:'Inter',-apple-system,'Segoe UI',Roboto,sans-serif!important;color:#111!important;}
        :root{--ic-brand-primary:#cc0033!important;--ic-link-color:#cc0033!important;}
        .ic-Layout-contentMain,.ic-Dashboard-header,.ic-Dashboard-header *{color:#111!important;}
        /* 按钮形态的链接（.btn / .Button / role=button / InstUI baseButton）排除在外，
         * 否则 Take the Quiz 这种红底主色按钮会变成红底红字 */
        a:not(.ic-DashboardCard__link):not(.ic-app-header__menu-list-link):not(.btn):not(.Button):not([role="button"]):not([class*="baseButton"]){
          color:#cc0033!important;}

        /* ---- 左侧全局导航：Rutgers 红 ---- */
        #header.ic-app-header{background:#cc0033!important;border-right:2px solid #111!important;}
        #header .ic-app-header__menu-list-link{position:relative!important;color:rgba(255,255,255,.72)!important;}
        #header .ic-app-header__menu-list-link .menu-item__text{
          font-size:11px!important;font-weight:600!important;letter-spacing:.02em!important;}
        #header .ic-icon-svg{fill:currentColor!important;}
        #header .ic-app-header__menu-list-link:hover,
        #header .ic-app-header__menu-list-item--active>.ic-app-header__menu-list-link{
          color:#fff!important;background-color:rgba(0,0,0,.16)!important;}
        #header .ic-app-header__menu-list-item--active>.ic-app-header__menu-list-link::before{
          content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#fff;}
        #header .menu-item__badge{background:#fff!important;color:#cc0033!important;
          border:1px solid #111!important;font-weight:700!important;}

        /* ---- 仪表盘标题 / 头部横条 ----
         * 新版 Canvas 头部是 InstUI 组件（类名带哈希，不可依赖），
         * 由 start() 里的 _tagHeader 结构化打上 bc-mt-* 类，这里只认自己的类。 */
        .ic-Dashboard-header__layout{align-items:flex-end!important;}
        .bc-hdr-strip{background:transparent!important;background-image:none!important;
          box-shadow:none!important;border:0!important;
          padding-left:0!important;padding-right:0!important;}
        .bc-hdr-title{display:inline-block!important;margin:0!important;
          background:#fff!important;color:#111!important;
          font-family:'Inter',sans-serif!important;font-size:34px!important;font-weight:900!important;
          letter-spacing:-.01em!important;line-height:1.15!important;padding:4px 20px!important;
          border:2px solid #111!important;box-shadow:4px 4px 0 #111!important;}
        .bc-hdr-title span{color:#111!important;background:transparent!important;}

        /* ---- 按钮：白底硬边 + 按下位移 ---- */
        .bc-hdr-btn,.ic-Dashboard-header__actions .Button,.ic-Dashboard-header__actions .btn,
        #dashboard .btn,#right-side .btn,#right-side .Button{
          background:#fff!important;background-image:none!important;color:#111!important;
          border:2px solid #111!important;border-radius:0!important;
          box-shadow:2px 2px 0 #111!important;font-weight:600!important;}
        .bc-hdr-btn{font-family:'Inter',sans-serif!important;}
        .bc-hdr-btn>span,.bc-hdr-btn span[class*="baseButton"]{
          background:transparent!important;border:0!important;box-shadow:none!important;color:#111!important;}
        .bc-hdr-btn svg{fill:#111!important;color:#111!important;}
        .bc-hdr-btn:active,.ic-Dashboard-header__actions .Button:active,
        .ic-Dashboard-header__actions .btn:active,
        #dashboard .btn:active,#right-side .btn:active,#right-side .Button:active{
          transform:translate(2px,2px);box-shadow:none!important;}
        #right-side .btn-primary,#right-side .Button--primary,.bc-primary-btn{
          background:#cc0033!important;color:#fff!important;border:2px solid #111!important;
          border-radius:0!important;box-shadow:3px 3px 0 #111!important;font-weight:800!important;}
        /* 按钮形态的链接（Take the Quiz / Submit 之类是 <a class="btn">）：
         * 不能吃上面 a{} 的红字规则，否则主色按钮就是红底红字 */
        /* 优先级要压过上面那条带多个 :not(.class) 的链接规则（0,6,1），所以用 html body 前缀 + 重复类名 */
        html body a.btn.btn.btn.btn.btn,html body a.Button.Button.Button.Button.Button,
        html body a[role="button"][role="button"][role="button"][role="button"][role="button"],
        html body a[class*="baseButton"][class*="baseButton"][class*="baseButton"][class*="baseButton"][class*="baseButton"]{
          color:#111!important;}
        html body .btn-primary.btn-primary.btn-primary.btn-primary.btn-primary.btn-primary,
        html body .Button--primary.Button--primary.Button--primary.Button--primary.Button--primary.Button--primary,
        html body .btn-primary *,html body .Button--primary *,
        html body [class*="baseButton"][class*="primary"][class*="primary"][class*="primary"][class*="primary"][class*="primary"],
        html body [class*="baseButton"][class*="primary"] *{
          color:#fff!important;}
        html body .btn-primary,html body .Button--primary{background-color:#cc0033!important;background-image:none!important;
          border:2px solid #111!important;border-radius:0!important;box-shadow:3px 3px 0 #111!important;font-weight:800!important;}
        html body .btn-primary:active,html body .Button--primary:active{transform:translate(3px,3px);box-shadow:none!important;}

        /* ---- 顶部公告 ---- */
        #announcementWrapper .ic-notification,#dashboard .ic-notification{
          background:#fffcf0!important;border:2px solid #111!important;border-radius:4px!important;
          box-shadow:4px 4px 0 #111!important;}
        .ic-notification__icon{background:transparent!important;color:#cc0033!important;}
        .ic-notification__icon i,.ic-notification__icon svg{color:#cc0033!important;fill:#cc0033!important;}
        .ic-notification__title{text-transform:uppercase!important;font-weight:800!important;
          font-size:16px!important;letter-spacing:.02em!important;}
        .ic-notification__message a,.ic-notification__content a{
          color:#cc0033!important;font-weight:600!important;text-decoration:underline!important;}

        /* ---- 课程卡片 ---- */
        .ic-DashboardCard{background:#fff!important;border:2px solid #111!important;border-radius:4px!important;
          box-shadow:4px 4px 0 #111!important;overflow:hidden!important;transition:transform .18s!important;}
        .ic-DashboardCard:hover{transform:translateY(-3px)!important;}
        .ic-DashboardCard *{color:#111!important;}
        .ic-DashboardCard__header_hero{border-bottom:2px solid #111!important;}
        .ic-DashboardCard__header-title,.ic-DashboardCard__header-title span{
          font-weight:800!important;font-size:14px!important;text-transform:uppercase!important;}
        .ic-DashboardCard__header-subtitle,.ic-DashboardCard__header-term{
          font-size:12px!important;color:#666!important;}
        .ic-DashboardCard__action-container{border-top:2px dashed #ddd!important;}
        .bc-card-group-header{font-family:'JetBrains Mono',monospace!important;
          text-transform:uppercase!important;color:#111!important;border-bottom:2px solid #111!important;}

        /* ---- 右侧栏：虚线分隔 + 条码 + 等宽标题 ---- */
        #right-side-wrapper{background:transparent!important;}
        #right-side-wrapper::before{content:'';display:block;height:38px;margin:0 18px 6px 22px;opacity:.85;
          background:repeating-linear-gradient(to right,#111 0 2px,transparent 2px 5px,#111 5px 8px,transparent 8px 10px);}
        #right-side{background:transparent!important;padding-left:22px!important;
          border-left:2px dashed rgba(0,0,0,.35)!important;min-height:calc(100vh - 120px)!important;}
        #right-side h2,#right-side .todo-list-header,#right-side .events_list .title{
          display:inline-block!important;font-family:'JetBrains Mono',monospace!important;
          font-size:15px!important;font-weight:700!important;text-transform:uppercase!important;
          color:#111!important;border-bottom:2px solid #111!important;padding-bottom:3px!important;}

        /* ---- 扩展自身的面板 / 角标 ---- */
        .bc-block{background:#fff!important;border:2px solid #111!important;border-radius:4px!important;
          box-shadow:4px 4px 0 #111!important;padding:18px!important;}
        .bc-block-title{font-weight:900!important;font-size:14px!important;text-transform:uppercase!important;
          letter-spacing:.02em!important;border-bottom:2px dashed #ccc!important;
          padding-bottom:10px!important;margin-bottom:14px!important;}
        .bc-block-title::after{content:" °";color:#cc0033;font-family:'JetBrains Mono',monospace;}
        .bc-pill{background:#111!important;color:#fff!important;border-radius:10px!important;
          font-size:10px!important;font-weight:700!important;}
        .bc-gpa-num{font-size:48px!important;font-weight:900!important;color:#cc0033!important;}
        /* 侧栏差距图：只改字体和几何，状态色是固定的可读性保证，不覆盖 */
        .bc-sbg-num{font-family:'Inter',sans-serif!important;font-weight:900!important;color:#cc0033!important;}
        .bc-sbg-val,.bc-sbg-name{font-family:'JetBrains Mono',monospace!important;}
        .bc-sbg-track{border-radius:0!important;border:1px solid #111!important;}
        .bc-sbg-fill{border-radius:0!important;}
        .bc-sbg-tick{background:#111!important;}
        .bc-when,.bc-msg-date{font-family:'JetBrains Mono',monospace!important;}
        .bc-exam-type{background:#d3f922!important;color:#111!important;
          border:1px solid #111!important;border-radius:0!important;}
        .bc-exam-group{background:#f4f4f4!important;border:1px solid #111!important;border-radius:0!important;}
        .bc-exam-group-hd{border-bottom:2px solid #111!important;font-family:'JetBrains Mono',monospace!important;}
        .bc-exam-item{border:1px solid #111!important;border-left:5px solid var(--bc-cc,#111)!important;
          border-radius:0!important;box-shadow:2px 2px 0 #111!important;}
        .bc-exam-course-tag{border-radius:0!important;border:1px solid #111!important;}
        .bc-cal-chip{border-radius:0!important;border:1px solid #111!important;border-left-width:3px!important;background:#fff!important;}
        .bc-cal-type{border-radius:0!important;}
        .bc-grade-badge{background:#cc0033!important;color:#fff!important;
          border:1px solid #111!important;border-radius:0!important;}
        .bc-bell{background:#fff!important;border:2px solid #111!important;border-radius:0!important;
          box-shadow:2px 2px 0 #111!important;}
        .bc-bell-badge{background:#cc0033!important;border:1px solid #111!important;border-radius:0!important;}
        .bc-scan-btn,.bc-del,.bc-msg-allread,.bc-clear{background:#fff!important;
          border:1px solid #111!important;border-radius:0!important;font-weight:700!important;}
        .bc-msg-popup,#bc-panel,.bc-exam-edit{border:2px solid #111!important;border-radius:4px!important;
          box-shadow:6px 6px 0 #111!important;}
        #bc-gear,#bc-study-btn{background:#cc0033!important;color:#fff!important;border:2px solid #111!important;
          border-radius:0!important;box-shadow:4px 4px 0 #111!important;}`,
      start() {
        document.documentElement.classList.add("bc-fx-active");
        document.getElementById(BC.themes.FX_ID)?.remove();
        const fx = document.createElement("div");
        fx.id = BC.themes.FX_ID;
        fx.innerHTML =
          `<div class="bc-mt-mark">POTATO</div>
           <div class="bc-mt-sub">RUN.EXE // SYSTEM ACTIVE</div>
           <div class="bc-mt-ruler"></div>
           <div class="bc-mt-scan"></div>
           <div class="bc-mt-hex">0xCC0033 // UESC-04</div>
           <span class="bc-mt-br bc-mt-br1"></span><span class="bc-mt-br bc-mt-br2"></span>
           <span class="bc-mt-br bc-mt-br3"></span><span class="bc-mt-br bc-mt-br4"></span>`;
        document.body.appendChild(fx);
        return () => fx.remove();
      }
    }
  }
};
