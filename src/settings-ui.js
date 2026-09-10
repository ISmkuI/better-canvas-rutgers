/* 设置界面：右下角齿轮按钮 + 分栏设置面板 +（课程页）期中期末小面板 */
BC.i18n.add({
  // 通用
  "清除": "Clear",
  "删除": "Delete",
  "添加": "Add",
  "失败": "Failed",
  "默认": "Default",
  "其他": "Other",
  "课程": "Course",
  "课程 {cid}": "Course {cid}",
  "加载课程…": "Loading courses…",
  "PotatoCanvas 设置": "PotatoCanvas Settings",
  "🎨 外观": "🎨 Appearance",
  "🃏 卡片": "🃏 Cards",
  "📊 面板": "📊 Panels",
  "🔔 消息": "🔔 Messages",
  "⏳ 期中期末": "⏳ Exams",
  "✨ 助手": "✨ Assistant",
  // 外观
  "预设主题风格": "Theme presets",
  "自定义微调（覆盖在预设之上）": "Custom tweaks (applied on top of the preset)",
  "启用主题美化": "Enable theme styling",
  "鼠标拖尾": "Cursor trail",
  "样式跟随预设主题；未选预设时不显示": "Style follows the preset theme; hidden when no preset is selected",
  "强调色（链接/按钮）": "Accent color (links / buttons)",
  "左侧导航背景": "Left nav background",
  "左侧导航文字": "Left nav text",
  "页面背景色": "Page background color",
  "页面背景图 URL": "Page background image URL",
  "https://…图片地址": "https://… image URL",
  "填了背景图会覆盖背景色": "A background image overrides the background color",
  "卡片圆角(px)": "Card corner radius (px)",
  "卡片加大阴影": "Larger card shadow",
  "卡片风格": "Card style",
  "扁平描边": "Flat outline",
  "毛玻璃": "Frosted glass",
  // 卡片
  "卡片右上角显示成绩": "Show grade on cards",
  "成绩放在哪": "Grade placement",
  "卡片右边小框（总评 / GPA / 班级均分 / Section）": "Box beside the card (total / GPA / class average / section)",
  "卡片头部角标": "Badge on the card header",
  "同时显示 得分/总分": "Also show points earned / total",
  "显示班级成绩范围": "Show class grade range",
  "用每个作业的班级最低 / 平均 / 最高分，按本课的分组权重和丢分规则算出总评的最差 / 平均 / 最好情况，显示在卡片头部右下角。老师关掉「显示成绩分布」的课没有数据。": "Uses each assignment's class low / mean / high with this course's group weights and drop rules to estimate the worst / average / best total, shown at the bottom right of the card header. No data for courses where the instructor hides score distributions.",
  "按课程类型分组卡片": "Group cards by subject",
  "按 Rutgers 科目代码(如 198)归类": "Grouped by Rutgers subject code (e.g. 198)",
  "成绩取自 Canvas 在读课程的当前总评；得分/总分按已评分作业累加（未按权重）。需使用经典 Dashboard（卡片视图）。": "Grades come from the current total of active Canvas courses; points earned / total sum the graded assignments (unweighted). Requires the classic Dashboard (card view).",
  // 面板
  "📅 本周截止作业": "📅 Due this week",
  "🎯 当前 GPA": "🎯 Current GPA",
  "⏳ 期中/期末倒计时": "⏳ Exam countdown",
  "🧑‍🏫 教授请假": "🧑‍🏫 Professor absence",
  "📨 最新消息": "📨 Latest messages",
  "📆 今日课程": "📆 Today's classes",
  "📚 历史课程": "📚 Past courses",
  "启用自定义面板": "Enable custom panels",
  "右侧栏课程卡": "Sidebar course card",
  "插在 View Grades 按钮上方": "Inserted above the View Grades button",
  "课程卡内容": "Course card content",
  "课程 Section（课号第四段）": "Course section (4th part of the course code)",
  "GPA 与各科差距": "GPA and per-course gaps",
  "Section 如 01:198:206:02 里的 02；导入 WebReg 课表后还会显示 index 号": "Section is the 02 in 01:198:206:02; after importing a WebReg schedule the index number is shown too",
  "隐藏右侧栏 To Do": "Hide sidebar To Do",
  "Canvas 自带的待办列表；「本周截止」面板已覆盖它": "Canvas's built-in to-do list; the \"Due this week\" panel already covers it",
  "隐藏右侧栏 Recent Feedback": "Hide sidebar Recent Feedback",
  "历史课程放右侧栏": "Past courses in the sidebar",
  "关掉则回到仪表盘整行显示": "When off, shown as a full-width row on the dashboard",
  "最新消息只看当前学期": "Latest messages: current term only",
  "自动识别在读课程里最新的学期；Advising 之类没有学期的课不显示": "Detects the latest term among active courses; courses without a term (e.g. Advising) are hidden",
  "右侧栏 常用网站导航": "Sidebar quick links",
  "Rutgers 学生常用站点，点击新标签页打开": "Sites Rutgers students use often; open in a new tab",
  "其他页面也显示导航": "Show links on other pages too",
  "默认只在仪表盘": "Dashboard only by default",
  "每周课表（「今日课程」面板；Canvas 日历里有的课不用填）": "Weekly schedule (for the \"Today's classes\" panel; skip classes already on the Canvas calendar)",
  "请假 / 停课关键词": "Absence / cancellation keywords",
  "professor absence, no class, 停课…": "professor absence, no class, …",
  "「教授请假」面板按这些词扫描公告 / 私信，命中的课打 ×": "The \"Professor absence\" panel scans announcements / messages for these words and marks matching courses with ×",
  "Gradescope 成绩同步": "Gradescope grade sync",
  "在课程 Grades 页显示同步按钮，把 Gradescope 分数填进还没有分数的作业的预估分数": "Show a sync button on course Grades pages and fill Gradescope scores into the what-if score of ungraded assignments",
  "打开 Grades 页自动同步": "Auto-sync when opening a Grades page",
  "关掉后只保留手动按钮": "When off, only the manual button remains",
  "后台保持 Gradescope 登录": "Keep Gradescope logged in (background)",
  "每 6 小时访问一次 gradescope.com 维持会话；需先在 gradescope.com 登录并勾选 Remember me": "Visits gradescope.com every 6 hours to keep the session alive; log in once at gradescope.com with \"Remember me\" checked first",
  // 每周课表编辑器
  "还没有手填的课。": "No manually added classes yet.",
  "周{days}": "{days}",
  "手填": "Manual",
  "自定义名称…": "Custom name…",
  "课程名（选“自定义”时填）": "Course name (when \"Custom\" is selected)",
  "地点（可选）": "Location (optional)",
  "📄 导入 WebReg 课表 PDF": "📄 Import WebReg schedule PDF",
  "在 {link} 页用浏览器「打印 → 另存为 PDF」，再选这个文件。重新导入会替换上次导入的条目，手填的保留。": "On the {link} page use the browser's \"Print → Save as PDF\", then pick that file. Re-importing replaces the previously imported entries; manual ones are kept.",
  // 常用网站编辑器
  "分组（如 校园生活）": "Group (e.g. Campus life)",
  "图标": "Icon",
  "名称": "Name",
  "恢复默认列表": "Restore default list",
  "恢复为默认的 Rutgers 常用网站列表？": "Restore the default list of Rutgers sites?",
  // 助手
  "双击 / 选中 / 右键选中的文字 / 快捷键 {kbd}（可在 chrome://extensions/shortcuts 改）弹出讲解浮窗，可截图提问、追问、存入题库。API key 只存在本机，从你的浏览器直连模型接口。": "Double-click / select / right-click selected text / press {kbd} (changeable at chrome://extensions/shortcuts) to open the explanation popup; you can ask with a screenshot, follow up, and save to the question bank. The API key stays on this device and requests go straight from your browser to the model API.",
  "正在作答的测验 / 考试页面不会激活": "Not active on quiz / exam pages you are taking",
  "（经典 Quiz 作答页、New Quizzes 作答界面、任何作答表单），这条规则写死在代码里；测验列表、介绍页和交卷后的结果回看页可以用。": " (classic Quiz taking pages, the New Quizzes taking view, any answer form); this rule is hard-coded. Quiz lists, intro pages and post-submission result pages still work.",
  "知识库": "Knowledge base",
  "：📖 学习工具 → 🧠 知识库 里添加课程资料 / 本页正文 / 本地文件 / 粘贴笔记；助手浮窗里「🧠 知识库」亮着时，讲解就依据这些材料（本机检索，只把最相关的片段发给模型）。": ": add course files / this page's text / local files / pasted notes under 📖 Study tools → 🧠 Knowledge base; when \"🧠 Knowledge base\" is lit in the assistant popup, explanations are grounded in those materials (searched locally; only the most relevant snippets are sent to the model).",
  "启用学习助手": "Enable study assistant",
  "触发方式": "Trigger",
  "双击 + 选中后小按钮": "Double-click + button after selecting",
  "只双击": "Double-click only",
  "只选中后小按钮": "Button after selecting only",
  "右键选中文字弹出助手菜单": "Right-click selected text for the assistant menu",
  "右键点在选中的文字上时用助手菜单代替浏览器默认菜单；点在选区外不受影响": "Replaces the browser's context menu when right-clicking on selected text; clicks outside the selection are unaffected",
  "回答语言": "Reply language",
  "跟随界面语言": "Follow UI language",
  // 新手教程
  "📖 新手教程": "📖 Getting started",
  "页内导览": "In-page tour",
  "安装引导页": "Setup guide",
  "页内导览在仪表盘上逐个介绍功能；引导页可重新选外观、配置助手": "The tour walks through features on the dashboard; the setup guide lets you re-pick a theme and configure the assistant",
  "中文": "Chinese",
  "打开页面自动识别讲座视频": "Auto-detect lecture videos on page load",
  "找到后在右下角 📖 上显示数量": "Shows the count on the 📖 button at the bottom right",
  "在所有网站启用": "Enable on all websites",
  "（双击 / 选中 / 右键 / 快捷键 / 右下角 📖）：{state}。需要授权访问所有网站，浏览器只允许在扩展弹窗里授权：点浏览器工具栏的扩展图标，在弹窗里切换「在所有网站启用助手」。": " (double-click / select / right-click / shortcut / 📖 at the bottom right): {state}. This needs permission for all sites, which the browser only lets you grant from the extension popup: click the extension icon in the toolbar and toggle \"Enable assistant on all websites\".",
  "已开启": "On",
  "未开启": "Off",
  "手填模型名": "Model name",
  "🔄 拉取列表": "🔄 Fetch list",
  "从该服务的接口拉取当前可用的模型": "Fetch the currently available models from this provider's API",
  "自定义…": "Custom…",
  "拉取中…": "Fetching…",
  "无响应": "No response",
  "接口没有返回模型": "The API returned no models",
  "✓ {n} 个": "✓ {n} models",
  "拉取模型列表失败：{msg}": "Failed to fetch the model list: {msg}",
  "接口地址 Base URL": "Base URL",
  "https://…/v1（自定义 / 反代时填）": "https://…/v1 (for custom / proxy endpoints)",
  "自定义域名需要授权访问：填好后点下面「授权域名」": "Custom domains need permission: after filling it in, click \"Grant domain\" below",
  "模型服务": "Provider",
  "模型": "Model",
  "列表外的模型选「自定义…」再填名字": "For a model not in the list, choose \"Custom…\" and type its name",
  "显示 / 隐藏": "Show / hide",
  "测试连接": "Test connection",
  "授权域名": "Grant domain",
  "📚 打开题库（{n}）": "📚 Open question bank ({n})",
  "测试中…": "Testing…",
  "连接成功：{t}": "Connected: {t}",
  "失败：{msg}": "Failed: {msg}",
  "先填一个合法的 Base URL": "Enter a valid Base URL first",
  "已授权 {origin}": "Granted {origin}",
  "未授权": "Not granted",
  "未授权：{err}": "Not granted: {err}",
  // 消息
  "启用消息铃铛": "Enable message bell",
  "包含课程公告": "Include course announcements",
  "包含收件箱私信": "Include inbox messages",
  "回看天数": "Look-back days",
  "重要消息关键词（命中即按对应颜色高亮，逗号分隔）：": "Important message keywords (matches are highlighted in the given color; comma-separated):",
  // 期中期末
  "为每门课维护期中/期末等日期。可自动扫描 Syllabus、上传文本、或手动添加。": "Keep midterm / final dates for each course. Scan syllabi automatically, upload text, or add them manually.",
  "🔍 扫描所有课程 Syllabus": "🔍 Scan all course syllabi",
  "扫描中…": "Scanning…",
  "完成，新增 {n} 条": "Done, {n} added",
  "未找到课程。": "No courses found.",
  "期中": "Midterm",
  "期末": "Final",
  "考试": "Exam",
  "标题(可选)": "Title (optional)",
  "或把 syllabus 文字粘贴到这里…": "Or paste the syllabus text here…",
  "解析文本": "Parse text",
  "扫描本课 Syllabus": "Scan this course's syllabus",
  "未识别到日期": "No dates found",
  "新增 {n} 条": "{n} added",
  "Syllabus 新增 {n} 条": "{n} added from the syllabus",
  "扫描失败": "Scan failed",
  // 课程页小面板
  "⏳ 本课期中/期末": "⏳ Exams for this course",
  "扫描 Syllabus": "Scan syllabus",
  "暂无，扫描 Syllabus 或在下方手动添加。": "None yet. Scan the syllabus or add one below.",
  "以下 {n} 处提到了考试但没有可解析的日期（多半是老师还没填），补上日期即可添加：": "{n} exam mentions below have no parseable date (probably not set yet); fill in a date to add them:",
  "识别 {n} 条": "{n} found",
  " · {n} 处待补": " · {n} need a date"
});
BC.ui = {
  /* ---------- 小工具：表单控件 ---------- */
  row(labelText, control, hint) {
    const r = document.createElement("label");
    r.className = "bc-row";
    r.innerHTML = `<span class="bc-row-label">${BC.util.esc(labelText)}${hint ? `<small>${BC.util.esc(hint)}</small>` : ""}</span>`;
    r.appendChild(control);
    return r;
  },
  color(val, on) {
    const wrap = document.createElement("span");
    wrap.className = "bc-colorwrap";
    const c = document.createElement("input");
    c.type = "color"; c.value = val || "#cc0033";
    const clear = document.createElement("button");
    clear.type = "button"; clear.className = "bc-clear"; clear.textContent = BC.t("清除");
    c.addEventListener("input", () => on(c.value));
    clear.addEventListener("click", () => on(""));
    wrap.append(c, clear);
    return wrap;
  },
  text(val, on, ph) {
    const i = document.createElement("input");
    i.type = "text"; i.value = val || ""; i.placeholder = ph || "";
    i.addEventListener("change", () => on(i.value.trim()));
    return i;
  },
  toggle(val, on) {
    const i = document.createElement("input");
    i.type = "checkbox"; i.checked = !!val;
    i.className = "bc-toggle";
    i.addEventListener("change", () => on(i.checked));
    return i;
  },
  number(val, on, min, max) {
    const i = document.createElement("input");
    i.type = "number"; i.value = val ?? ""; if (min != null) i.min = min; if (max != null) i.max = max;
    i.style.width = "80px";
    i.addEventListener("change", () => on(i.value === "" ? "" : +i.value));
    return i;
  },
  select(val, options, on) {
    const s = document.createElement("select");
    options.forEach(([v, t]) => {
      const o = document.createElement("option"); o.value = v; o.textContent = t;
      if (v === val) o.selected = true; s.appendChild(o);
    });
    s.addEventListener("change", () => on(s.value));
    return s;
  },

  /* ---------- 齿轮按钮 ---------- */
  injectGearButton() {
    if (document.getElementById("bc-gear")) return;
    const b = document.createElement("button");
    b.id = "bc-gear";
    b.title = BC.t("PotatoCanvas 设置");
    b.textContent = "⚙";
    b.addEventListener("click", () => BC.ui.openPanel());
    document.body.appendChild(b);
  },

  /* ---------- 主面板 ---------- */
  async openPanel() {
    document.getElementById("bc-panel-overlay")?.remove();
    const s = await BC.storage.get();

    const overlay = document.createElement("div");
    overlay.id = "bc-panel-overlay";
    overlay.innerHTML = `
      <div id="bc-panel">
        <div class="bc-panel-head">
          <strong>${BC.t("PotatoCanvas 设置")}</strong>
          <button class="bc-panel-close">✕</button>
        </div>
        <div class="bc-tabs">
          <button data-tab="theme" class="bc-tab-active">${BC.t("🎨 外观")}</button>
          <button data-tab="cards">${BC.t("🃏 卡片")}</button>
          <button data-tab="blocks">${BC.t("📊 面板")}</button>
          <button data-tab="messages">${BC.t("🔔 消息")}</button>
          <button data-tab="exam">${BC.t("⏳ 期中期末")}</button>
          <button data-tab="assistant">${BC.t("✨ 助手")}</button>
        </div>
        <div class="bc-tab-body"></div>
      </div>`;
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector(".bc-panel-close").addEventListener("click", () => overlay.remove());
    document.body.appendChild(overlay);

    const body = overlay.querySelector(".bc-tab-body");
    const tabs = overlay.querySelectorAll(".bc-tabs button");
    const renderTab = (name) => {
      tabs.forEach(t => t.classList.toggle("bc-tab-active", t.dataset.tab === name));
      body.innerHTML = "";
      ({ theme: BC.ui.tabTheme, cards: BC.ui.tabCards, blocks: BC.ui.tabBlocks,
         messages: BC.ui.tabMessages, exam: BC.ui.tabExam, assistant: BC.ui.tabAssistant }[name])(body, s);
    };
    tabs.forEach(t => t.addEventListener("click", () => renderTab(t.dataset.tab)));
    renderTab("theme");
  },

  // 改设置 + 即时刷新
  async _save(s, refresh) {
    await BC.storage.set(s);
    if (refresh) refresh();
  },

  /* ---------- 外观 ---------- */
  tabTheme(body, s) {
    const t = s.theme;
    const saveLive = async () => { await BC.storage.set(s); BC.themes.apply(t.preset, s); BC.theme.apply(s); };

    // 界面语言：auto 跟随浏览器 / 系统；改完刷新整套界面并重开面板
    s.ui = s.ui || {};
    body.append(BC.ui.row("界面语言 / Language", BC.ui.select(s.ui.lang || "auto",
      [["auto", "跟随系统 / System (" + (BC.i18n.detect() === "zh" ? "中文" : "English") + ")"], ["zh", "中文"], ["en", "English"]],
      async v => { s.ui.lang = v; await BC.storage.set(s); BC.i18n.setLang(v); await BC.bus.refreshAll(); BC.ui.openPanel(); })));

    // 新手教程：页内导览（tour.js，仪表盘上重放；不在仪表盘就清标记后跳过去）/ 安装引导页（onboarding/，由 background 打开）
    const tut = document.createElement("span");
    tut.style.cssText = "display:inline-flex;gap:6px;margin-left:auto;";
    const tourBtn = document.createElement("button");
    tourBtn.type = "button"; tourBtn.className = "bc-clear"; tourBtn.textContent = BC.t("页内导览");
    tourBtn.onclick = async () => {
      document.getElementById("bc-panel-overlay")?.remove();
      if (BC.dash && BC.dash.onDashboard() && BC.tour) { BC.tour.start(true); return; }
      await new Promise(res => chrome.storage.local.set({ bc_tour_done: false }, res));
      location.href = "/";
    };
    const obBtn = document.createElement("button");
    obBtn.type = "button"; obBtn.className = "bc-clear"; obBtn.textContent = BC.t("安装引导页");
    obBtn.onclick = () => { try { chrome.runtime.sendMessage({ type: "bc-open-onboarding" }); } catch (e) {} };
    tut.append(tourBtn, obBtn);
    body.append(BC.ui.row(BC.t("📖 新手教程"), tut, BC.t("页内导览在仪表盘上逐个介绍功能；引导页可重新选外观、配置助手")));

    // 预设主题画廊
    const galTitle = document.createElement("div");
    galTitle.className = "bc-section-title";
    galTitle.textContent = BC.t("预设主题风格");
    const gal = document.createElement("div");
    gal.className = "bc-theme-gallery";
    BC.themes.list().forEach(p => {
      const card = document.createElement("button");
      card.className = "bc-theme-card" + (t.preset === p.id ? " bc-sel" : "");
      card.innerHTML = `<span class="bc-theme-emoji">${p.emoji}</span>
        <span class="bc-theme-name">${BC.util.esc(BC.t(p.name))}</span>
        <small>${BC.util.esc(BC.t(p.desc))}</small>`;
      card.onclick = async () => {
        t.preset = p.id;
        // 换预设时清掉之前手调的页面背景 / 导航色 / 强调色：它们是按上一个外观调的，留着会盖住预设
        //（典型：白色页面背景 + 暗夜预设 = 浅字压白底）。要微调可以在下面重新选。
        if (p.id) { t.pageBg = ""; t.pageBgImage = ""; t.navBg = ""; t.navText = ""; t.accent = ""; }
        gal.querySelectorAll(".bc-theme-card").forEach(c => c.classList.remove("bc-sel"));
        card.classList.add("bc-sel");
        await saveLive();
        BC.ui.openPanel();   // 重绘面板，让下面的自定义控件显示清空后的值
      };
      gal.appendChild(card);
    });
    body.append(galTitle, gal);

    const customTitle = document.createElement("div");
    customTitle.className = "bc-section-title";
    customTitle.textContent = BC.t("自定义微调（覆盖在预设之上）");
    body.append(customTitle);

    body.append(
      BC.ui.row(BC.t("启用主题美化"), BC.ui.toggle(t.enabled, async v => { t.enabled = v; await saveLive(); })),
      BC.ui.row(BC.t("鼠标拖尾"), BC.ui.toggle(t.cursorTrail !== false, async v => { t.cursorTrail = v; await saveLive(); }), BC.t("样式跟随预设主题；未选预设时不显示")),
      BC.ui.row(BC.t("强调色（链接/按钮）"), BC.ui.color(t.accent, async v => { t.accent = v; await saveLive(); })),
      BC.ui.row(BC.t("左侧导航背景"), BC.ui.color(t.navBg, async v => { t.navBg = v; await saveLive(); })),
      BC.ui.row(BC.t("左侧导航文字"), BC.ui.color(t.navText, async v => { t.navText = v; await saveLive(); })),
      BC.ui.row(BC.t("页面背景色"), BC.ui.color(t.pageBg, async v => { t.pageBg = v; await saveLive(); })),
      BC.ui.row(BC.t("页面背景图 URL"), BC.ui.text(t.pageBgImage, async v => { t.pageBgImage = v; await saveLive(); }, BC.t("https://…图片地址")), BC.t("填了背景图会覆盖背景色")),
      BC.ui.row(BC.t("卡片圆角(px)"), BC.ui.number(t.cardRadius, async v => { t.cardRadius = v; await saveLive(); }, 0, 40)),
      BC.ui.row(BC.t("卡片加大阴影"), BC.ui.toggle(t.cardShadow, async v => { t.cardShadow = v; await saveLive(); })),
      BC.ui.row(BC.t("卡片风格"), BC.ui.select(t.cardStyle, [["default", BC.t("默认")], ["flat", BC.t("扁平描边")], ["glass", BC.t("毛玻璃")]],
        async v => { t.cardStyle = v; await saveLive(); }))
    );
  },

  /* ---------- 卡片 ---------- */
  // 卡片上成绩相关的东西全部拆掉（角标 / 右侧小框 / 留出的右边距），改完设置后 refreshCards 重画
  _clearCardGrades() {
    document.querySelectorAll(".bc-grade-badge, .bc-class-badge, .bc-side").forEach(e => e.remove());
    document.querySelectorAll(".ic-DashboardCard.bc-has-side").forEach(c => c.classList.remove("bc-has-side"));
  },
  tabCards(body, s) {
    body.append(
      BC.ui.row(BC.t("卡片右上角显示成绩"), BC.ui.toggle(s.cards.showGrade, async v => {
        s.cards.showGrade = v; await BC.storage.set(s);
        BC.ui._clearCardGrades();
        BC.bus.refreshCards();
      })),
      BC.ui.row(BC.t("成绩放在哪"), BC.ui.select(s.cards.layout || "side", [["side", BC.t("卡片右边小框（总评 / GPA / 班级均分 / Section）")], ["badge", BC.t("卡片头部角标")]], async v => {
        s.cards.layout = v; await BC.storage.set(s);
        document.querySelectorAll(".bc-grade-badge, .bc-class-badge, .bc-side").forEach(e => e.remove());
        document.querySelectorAll(".ic-DashboardCard.bc-has-side").forEach(c => c.classList.remove("bc-has-side"));
        BC.bus.refreshCards();
      })),
      BC.ui.row(BC.t("同时显示 得分/总分"), BC.ui.toggle(s.cards.showPoints, async v => {
        s.cards.showPoints = v; await BC.storage.set(s);
        BC.ui._clearCardGrades();
        BC.bus.refreshCards();
      })),
      BC.ui.row(BC.t("显示班级成绩范围"), BC.ui.toggle(s.cards.showClassRange !== false, async v => {
        s.cards.showClassRange = v; await BC.storage.set(s);
        BC.ui._clearCardGrades();
        BC.bus.refreshCards();
      }), BC.t("用每个作业的班级最低 / 平均 / 最高分，按本课的分组权重和丢分规则算出总评的最差 / 平均 / 最好情况，显示在卡片头部右下角。老师关掉「显示成绩分布」的课没有数据。")),
      BC.ui.row(BC.t("按课程类型分组卡片"), BC.ui.toggle(s.cards.groupBySubject, async v => {
        s.cards.groupBySubject = v; await BC.storage.set(s);
        if (BC.groups) BC.groups.apply(s);
      }), BC.t("按 Rutgers 科目代码(如 198)归类"))
    );
    const note = document.createElement("p");
    note.className = "bc-note";
    note.textContent = BC.t("成绩取自 Canvas 在读课程的当前总评；得分/总分按已评分作业累加（未按权重）。需使用经典 Dashboard（卡片视图）。");
    body.appendChild(note);
  },

  /* ---------- 自定义面板 ---------- */
  tabBlocks(body, s) {
    const labels = { dueThisWeek: "📅 本周截止作业", gpa: "🎯 当前 GPA", examCountdown: "⏳ 期中/期末倒计时", absence: "🧑‍🏫 教授请假", latest: "📨 最新消息", today: "📆 今日课程", history: "📚 历史课程" };
    body.append(BC.ui.row(BC.t("启用自定义面板"), BC.ui.toggle(s.blocks.enabled, async v => {
      s.blocks.enabled = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    })));
    body.append(BC.ui.row(BC.t("右侧栏课程卡"), BC.ui.toggle(s.sidebar.gpaChart, async v => {
      s.sidebar.gpaChart = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    }), BC.t("插在 View Grades 按钮上方")));
    body.append(BC.ui.row(BC.t("课程卡内容"), BC.ui.select(s.sidebar.rightCard || "section",
      [["section", BC.t("课程 Section（课号第四段）")], ["gpa", BC.t("GPA 与各科差距")]],
      async v => { s.sidebar.rightCard = v; await BC.storage.set(s); BC.bus.refreshBlocks(); }),
      BC.t("Section 如 01:198:206:02 里的 02；导入 WebReg 课表后还会显示 index 号")));
    const list = document.createElement("div");
    list.className = "bc-order";
    const draw = () => {
      list.innerHTML = "";
      s.blocks.order.forEach((key, idx) => {
        const item = document.createElement("div");
        item.className = "bc-order-item";
        const tg = BC.ui.toggle(s.blocks.visible[key], async v => {
          s.blocks.visible[key] = v; await BC.storage.set(s); BC.bus.refreshBlocks();
        });
        const up = document.createElement("button"); up.textContent = "↑"; up.disabled = idx === 0;
        const dn = document.createElement("button"); dn.textContent = "↓"; dn.disabled = idx === s.blocks.order.length - 1;
        up.onclick = async () => { [s.blocks.order[idx - 1], s.blocks.order[idx]] = [s.blocks.order[idx], s.blocks.order[idx - 1]]; await BC.storage.set(s); draw(); BC.bus.refreshBlocks(); };
        dn.onclick = async () => { [s.blocks.order[idx + 1], s.blocks.order[idx]] = [s.blocks.order[idx], s.blocks.order[idx + 1]]; await BC.storage.set(s); draw(); BC.bus.refreshBlocks(); };
        item.append(tg, Object.assign(document.createElement("span"), { textContent: BC.t(labels[key]), className: "bc-order-name" }), up, dn);
        list.appendChild(item);
      });
    };
    draw();
    body.appendChild(list);

    body.append(BC.ui.row(BC.t("隐藏右侧栏 To Do"), BC.ui.toggle(s.sidebar.hideTodo !== false, async v => {
      s.sidebar.hideTodo = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    }), BC.t("Canvas 自带的待办列表；「本周截止」面板已覆盖它")));
    body.append(BC.ui.row(BC.t("隐藏右侧栏 Recent Feedback"), BC.ui.toggle(s.sidebar.hideFeedback !== false, async v => {
      s.sidebar.hideFeedback = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    })));
    body.append(BC.ui.row(BC.t("历史课程放右侧栏"), BC.ui.toggle(s.blocks.historyInSidebar !== false, async v => {
      s.blocks.historyInSidebar = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    }), BC.t("关掉则回到仪表盘整行显示")));
    body.append(BC.ui.row(BC.t("最新消息只看当前学期"), BC.ui.toggle(s.blocks.latestCurrentTermOnly !== false, async v => {
      s.blocks.latestCurrentTermOnly = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    }), BC.t("自动识别在读课程里最新的学期；Advising 之类没有学期的课不显示")));

    // 右侧栏常用网站导航
    body.append(BC.ui.row(BC.t("右侧栏 常用网站导航"), BC.ui.toggle(s.sidebar.links !== false, async v => {
      s.sidebar.links = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    }), BC.t("Rutgers 学生常用站点，点击新标签页打开")));
    body.append(BC.ui.row(BC.t("其他页面也显示导航"), BC.ui.toggle(!!s.sidebar.linksEverywhere, async v => {
      s.sidebar.linksEverywhere = v; await BC.storage.set(s); BC.bus.refreshBlocks();
    }), BC.t("默认只在仪表盘")));
    body.appendChild(BC.ui._linksEditor(s));

    // 每周课表（今日课程面板）
    const schTitle = document.createElement("div");
    schTitle.className = "bc-section-title";
    schTitle.textContent = BC.t("每周课表（「今日课程」面板；Canvas 日历里有的课不用填）");
    body.append(schTitle, BC.ui._scheduleEditor(s));

    // 教授请假面板的关键词（逗号分隔）
    const words = (s.absenceWords || BC.DEFAULTS.absenceWords || []).join(", ");
    body.append(BC.ui.row(BC.t("请假 / 停课关键词"), BC.ui.text(words, async v => {
      s.absenceWords = v.split(/[,，\n]/).map(w => w.trim()).filter(Boolean);
      await BC.storage.set(s); BC.bus.refreshBlocks();
    }, BC.t("professor absence, no class, 停课…")), BC.t("「教授请假」面板按这些词扫描公告 / 私信，命中的课打 ×")));

    // Gradescope → Canvas 成绩同步（gradescope-sync.js / background.js bc-gs-fetch）
    s.gradescope = s.gradescope || {};
    body.append(BC.ui.row(BC.t("Gradescope 成绩同步"), BC.ui.toggle(s.gradescope.enabled !== false, async v => {
      s.gradescope.enabled = v; await BC.storage.set(s);
    }), BC.t("在课程 Grades 页显示同步按钮，把 Gradescope 分数填进还没有分数的作业的预估分数")));
    body.append(BC.ui.row(BC.t("打开 Grades 页自动同步"), BC.ui.toggle(s.gradescope.autoSync !== false, async v => {
      s.gradescope.autoSync = v; await BC.storage.set(s);
    }), BC.t("关掉后只保留手动按钮")));
    body.append(BC.ui.row(BC.t("后台保持 Gradescope 登录"), BC.ui.toggle(s.gradescope.keepAlive !== false, async v => {
      s.gradescope.keepAlive = v; await BC.storage.set(s);
    }), BC.t("每 6 小时访问一次 gradescope.com 维持会话；需先在 gradescope.com 登录并勾选 Remember me")));
  },

  // 每周课表编辑器：课程下拉 + 星期勾选 + 起止时间 + 地点
  _scheduleEditor(s) {
    // 星期缩写：中文拼成「周一三五」，英文用空格分开 "Mo We Fr"
    const WD = BC.i18n.pick(["日", "一", "二", "三", "四", "五", "六"], ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
    const wrap = document.createElement("div");
    wrap.className = "bc-sched-editor";
    const list = document.createElement("div");
    list.className = "bc-links-editor-list";
    const draw = () => {
      list.innerHTML = "";
      const arr = s.schedule || [];
      if (!arr.length) { list.innerHTML = `<small>${BC.t("还没有手填的课。")}</small>`; return; }
      arr.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "bc-exam-row";
        const days = [1, 2, 3, 4, 5, 6, 0].filter(d => (it.days || []).includes(d)).map(d => WD[d]).join(BC.i18n.pick("", " "));
        row.innerHTML = `<span class="bc-exam-rt"><b>${BC.util.esc(it.name || BC.t("课程 {cid}", { cid: it.cid }))}</b>
            <small>· ${BC.util.esc(BC.t("周{days}", { days }))} ${BC.util.esc(it.start || "")}${it.end ? "–" + BC.util.esc(it.end) : ""}${it.location ? " · " + BC.util.esc(it.location) : ""}</small></span>
          <small>${it.source === "webreg" ? "WebReg" : BC.t("手填")}</small>
          <button class="bc-del">${BC.t("删除")}</button>`;
        row.querySelector(".bc-del").onclick = async () => { s.schedule.splice(i, 1); await BC.storage.set(s); draw(); BC.bus.refreshBlocks(); };
        list.appendChild(row);
      });
    };
    draw();

    const add = document.createElement("div");
    add.className = "bc-exam-add bc-sched-add";
    const courseSel = document.createElement("select");
    courseSel.innerHTML = `<option value="">${BC.t("加载课程…")}</option>`;
    BC.api.activeCourses().then(cs => {
      courseSel.innerHTML = cs.map(c => `<option value="${c.id}">${BC.util.esc(c.course_code || c.name || c.id)}</option>`).join("") +
        `<option value="_custom">${BC.t("自定义名称…")}</option>`;
    }).catch(() => { courseSel.innerHTML = `<option value="_custom">${BC.t("自定义名称…")}</option>`; });
    const nameIn = BC.ui.text("", () => {}, BC.t("课程名（选“自定义”时填）"));
    const dayBox = document.createElement("span");
    dayBox.className = "bc-sched-days";
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      const lab = document.createElement("label");
      const cb = document.createElement("input"); cb.type = "checkbox"; cb.value = d;
      lab.append(cb, document.createTextNode(WD[d]));
      dayBox.appendChild(lab);
    });
    const startIn = document.createElement("input"); startIn.type = "time";
    const endIn = document.createElement("input"); endIn.type = "time";
    const locIn = BC.ui.text("", () => {}, BC.t("地点（可选）"));
    const addBtn = document.createElement("button"); addBtn.textContent = BC.t("添加"); addBtn.className = "bc-primary-btn";
    addBtn.onclick = async () => {
      const days = [...dayBox.querySelectorAll("input:checked")].map(i => +i.value);
      if (!days.length || !startIn.value) { (days.length ? startIn : dayBox).focus?.(); return; }
      const cid = courseSel.value && courseSel.value !== "_custom" ? courseSel.value : "";
      const name = cid ? courseSel.selectedOptions[0].textContent : (nameIn.value.trim() || BC.t("课程"));
      s.schedule = s.schedule || [];
      s.schedule.push({ cid, name, days, start: startIn.value, end: endIn.value, location: locIn.value.trim() });
      await BC.storage.set(s);
      nameIn.value = locIn.value = ""; startIn.value = endIn.value = "";
      dayBox.querySelectorAll("input").forEach(i => i.checked = false);
      draw(); BC.bus.refreshBlocks();
    };
    add.append(courseSel, nameIn, dayBox, startIn, document.createTextNode("–"), endIn, locIn, addBtn);

    // WebReg PDF 导入
    const imp = document.createElement("div");
    imp.className = "bc-exam-tools";
    const impBtn = document.createElement("button"); impBtn.className = "bc-primary-btn"; impBtn.textContent = BC.t("📄 导入 WebReg 课表 PDF");
    const impStatus = document.createElement("span"); impStatus.className = "bc-status";
    const impHint = document.createElement("small");
    const impLink = `<a href="${BC.webreg ? BC.webreg.SCHEDULE_URL : "#"}" target="_blank" rel="noopener noreferrer">WebReg · View / Print Schedule</a>`;
    impHint.innerHTML = BC.t("在 {link} 页用浏览器「打印 → 另存为 PDF」，再选这个文件。重新导入会替换上次导入的条目，手填的保留。", { link: impLink });
    impBtn.onclick = () => BC.webreg && BC.webreg.pickAndImport(t => { impStatus.textContent = t; draw(); });
    const impRow = document.createElement("div"); impRow.className = "bc-exam-row"; impRow.append(impBtn, impStatus);
    imp.append(impRow, impHint);

    wrap.append(list, imp, add);
    return wrap;
  },

  // 常用网站链接编辑器：列表（可删）+ 添加行 + 恢复默认
  _linksEditor(s) {
    const wrap = document.createElement("div");
    wrap.className = "bc-links-editor";
    const list = document.createElement("div");
    list.className = "bc-links-editor-list";
    const save = async (arr) => { s.links = arr; await BC.storage.set(s); draw(); BC.bus.refreshBlocks(); };
    const draw = () => {
      const items = BC.links.list(s);
      list.innerHTML = "";
      items.forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "bc-exam-row";
        row.innerHTML = `<span>${BC.util.esc(it.emoji || "🔗")}</span>
          <span class="bc-exam-rt" title="${BC.util.esc(it.url)}"><b>${BC.util.esc(it.name ? BC.t(it.name) : it.url)}</b> <small>· ${BC.util.esc(BC.t(it.group || "其他"))}</small></span>
          <button class="bc-del">${BC.t("删除")}</button>`;
        row.querySelector(".bc-del").onclick = () => { const arr = items.slice(); arr.splice(i, 1); save(arr); };
        list.appendChild(row);
      });
    };
    draw();

    const add = document.createElement("div");
    add.className = "bc-exam-add";
    const groups = [...new Set(BC.links.list(s).map(it => it.group).filter(Boolean))];
    const gIn = BC.ui.text("", () => {}, BC.t("分组（如 校园生活）"));
    gIn.setAttribute("list", "bc-links-groups");
    const dl = document.createElement("datalist"); dl.id = "bc-links-groups";
    groups.forEach(g => { const o = document.createElement("option"); o.value = g; dl.appendChild(o); });
    const eIn = BC.ui.text("", () => {}, BC.t("图标")); eIn.style.width = "48px";
    const nIn = BC.ui.text("", () => {}, BC.t("名称"));
    const uIn = BC.ui.text("", () => {}, "https://…");
    const addBtn = document.createElement("button"); addBtn.textContent = BC.t("添加"); addBtn.className = "bc-primary-btn";
    addBtn.onclick = () => {
      const url = uIn.value.trim();
      if (!/^https?:\/\//i.test(url)) { uIn.focus(); return; }
      const arr = BC.links.list(s).slice();
      arr.push({ group: gIn.value.trim() || "其他", emoji: eIn.value.trim() || "🔗", name: nIn.value.trim() || url, url });
      gIn.value = eIn.value = nIn.value = uIn.value = "";
      save(arr);
    };
    add.append(gIn, dl, eIn, nIn, uIn, addBtn);

    const reset = document.createElement("button"); reset.textContent = BC.t("恢复默认列表"); reset.className = "bc-del";
    reset.onclick = () => { if (confirm(BC.t("恢复为默认的 Rutgers 常用网站列表？"))) save(null); };

    wrap.append(list, add, reset);
    return wrap;
  },

  /* ---------- 学习助手 ---------- */
  tabAssistant(body, s) {
    const a = s.assistant = s.assistant || BC.util.clone(BC.DEFAULTS.assistant);
    const save = async () => { await BC.storage.set(s); if (BC.assistant) BC.assistant.init(s); };
    const P = BC.assistant ? BC.assistant.PRESETS : {};

    const note = document.createElement("div");
    note.className = "bc-note";
    note.innerHTML = BC.t("双击 / 选中 / 右键选中的文字 / 快捷键 {kbd}（可在 chrome://extensions/shortcuts 改）弹出讲解浮窗，可截图提问、追问、存入题库。API key 只存在本机，从你的浏览器直连模型接口。", { kbd: "<b>Alt+Shift+A</b>" }) + "<br>" +
      `<b>${BC.t("正在作答的测验 / 考试页面不会激活")}</b>${BC.t("（经典 Quiz 作答页、New Quizzes 作答界面、任何作答表单），这条规则写死在代码里；测验列表、介绍页和交卷后的结果回看页可以用。")}<br>` +
      `<b>${BC.t("知识库")}</b>${BC.t("：📖 学习工具 → 🧠 知识库 里添加课程资料 / 本页正文 / 本地文件 / 粘贴笔记；助手浮窗里「🧠 知识库」亮着时，讲解就依据这些材料（本机检索，只把最相关的片段发给模型）。")}`;
    body.appendChild(note);

    body.append(BC.ui.row(BC.t("启用学习助手"), BC.ui.toggle(a.enabled !== false, async v => { a.enabled = v; await save(); })));
    body.append(BC.ui.row(BC.t("触发方式"), BC.ui.select(a.trigger || "both",
      [["both", BC.t("双击 + 选中后小按钮")], ["dblclick", BC.t("只双击")], ["select", BC.t("只选中后小按钮")]],
      async v => { a.trigger = v; await save(); })));
    body.append(BC.ui.row(BC.t("右键选中文字弹出助手菜单"), BC.ui.toggle(a.contextMenu !== false, async v => { a.contextMenu = v; await save(); }), BC.t("右键点在选中的文字上时用助手菜单代替浏览器默认菜单；点在选区外不受影响")));
    // 回答语言：auto / 空 = 跟随界面语言（assistant.js 里按 BC.i18n.lang 处理）
    body.append(BC.ui.row(BC.t("回答语言"), BC.ui.select(a.lang === "zh" || a.lang === "en" ? a.lang : "auto",
      [["auto", BC.t("跟随界面语言")], ["zh", BC.t("中文")], ["en", "English"]], async v => { a.lang = v; await save(); })));
    body.append(BC.ui.row(BC.t("打开页面自动识别讲座视频"), BC.ui.toggle(a.autoDetectVideos !== false, async v => { a.autoDetectVideos = v; await save(); }), BC.t("找到后在右下角 📖 上显示数量")));
    const ev = document.createElement("div"); ev.className = "bc-note";
    ev.innerHTML = `<b>${BC.t("在所有网站启用")}</b>` + BC.t("（双击 / 选中 / 右键 / 快捷键 / 右下角 📖）：{state}。需要授权访问所有网站，浏览器只允许在扩展弹窗里授权：点浏览器工具栏的扩展图标，在弹窗里切换「在所有网站启用助手」。", { state: a.everywhere ? BC.t("已开启") : BC.t("未开启") });
    body.appendChild(ev);

    // 模型：按服务给下拉选项，列表外的选「自定义…」手填
    const modelSel = document.createElement("select");
    const modelIn = BC.ui.text("", async v => { a.model = v.trim(); await save(); }, BC.t("手填模型名"));
    modelIn.classList.add("bc-model-in");
    const refreshBtn = document.createElement("button"); refreshBtn.className = "bc-del"; refreshBtn.textContent = BC.t("🔄 拉取列表"); refreshBtn.title = BC.t("从该服务的接口拉取当前可用的模型");
    const modelWrap = document.createElement("span"); modelWrap.className = "bc-key-wrap"; modelWrap.append(modelSel, modelIn, refreshBtn);
    // 拉取过的列表按服务缓存在设置里（a.modelCache[provider]），优先于内置列表
    const buildModels = () => {
      const p = P[a.provider] || P.custom;
      const list = (a.modelCache && a.modelCache[a.provider] && a.modelCache[a.provider].length) ? a.modelCache[a.provider] : (p.models || []);
      if (!a.model && list.length) a.model = list[0];      // 先补默认，再判断是否在列表里
      const inList = list.includes(a.model);
      modelSel.innerHTML = list.map(m => `<option value="${BC.util.esc(m)}">${BC.util.esc(m)}</option>`).join("") + `<option value="_custom">${BC.t("自定义…")}</option>`;
      modelSel.value = inList ? a.model : "_custom";
      modelIn.hidden = modelSel.value !== "_custom";
      modelIn.value = modelSel.value === "_custom" ? (a.model || "") : "";
    };
    modelSel.addEventListener("change", async () => {
      if (modelSel.value === "_custom") { modelIn.hidden = false; modelIn.value = ""; modelIn.focus(); return; }
      modelIn.hidden = true; a.model = modelSel.value; await save();
    });
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true; refreshBtn.textContent = BC.t("拉取中…");
      try {
        const r = await chrome.runtime.sendMessage({ type: "bc-models", provider: a.provider, apiKey: a.apiKey, baseUrl: a.baseUrl });
        if (!r || !r.ok) throw new Error(r && r.error || BC.t("无响应"));
        if (!r.models.length) throw new Error(BC.t("接口没有返回模型"));
        a.modelCache = a.modelCache || {};
        a.modelCache[a.provider] = r.models;
        if (!r.models.includes(a.model)) a.model = r.models.find(m => m === (P[a.provider] || {}).model) || r.models[0];
        buildModels(); await save();
        refreshBtn.textContent = BC.t("✓ {n} 个", { n: r.models.length });
      } catch (e) { refreshBtn.textContent = BC.t("失败"); refreshBtn.title = e.message; alert(BC.t("拉取模型列表失败：{msg}", { msg: e.message })); }
      refreshBtn.disabled = false;
      setTimeout(() => { refreshBtn.textContent = BC.t("🔄 拉取列表"); }, 2500);
    };
    const baseRow = BC.ui.row(BC.t("接口地址 Base URL"), BC.ui.text(a.baseUrl || "", async v => { a.baseUrl = v.replace(/\/+$/, ""); await save(); }, BC.t("https://…/v1（自定义 / 反代时填）")),
      BC.t("自定义域名需要授权访问：填好后点下面「授权域名」"));
    body.append(BC.ui.row(BC.t("模型服务"), BC.ui.select(a.provider || "anthropic", Object.entries(P).map(([k, p]) => [k, BC.t(p.name)]),
      async v => { a.provider = v; a.model = (P[v].models || [])[0] || ""; buildModels(); await save(); })));
    buildModels();
    body.append(BC.ui.row(BC.t("模型"), modelWrap, BC.t("列表外的模型选「自定义…」再填名字")));

    const keyIn = document.createElement("input");
    keyIn.type = "password"; keyIn.value = a.apiKey || ""; keyIn.placeholder = "sk-…"; keyIn.autocomplete = "off";
    keyIn.addEventListener("change", async () => { a.apiKey = keyIn.value.trim(); await save(); });
    const eye = document.createElement("button"); eye.textContent = "👁"; eye.className = "bc-del"; eye.title = BC.t("显示 / 隐藏");
    eye.onclick = () => { keyIn.type = keyIn.type === "password" ? "text" : "password"; };
    const keyWrap = document.createElement("span"); keyWrap.className = "bc-key-wrap"; keyWrap.append(keyIn, eye);
    body.append(BC.ui.row("API key", keyWrap));
    body.append(baseRow);

    const tools = document.createElement("div");
    tools.className = "bc-exam-tools";
    const testBtn = document.createElement("button"); testBtn.className = "bc-primary-btn"; testBtn.textContent = BC.t("测试连接");
    const permBtn = document.createElement("button"); permBtn.className = "bc-del"; permBtn.textContent = BC.t("授权域名");
    const bankBtn = document.createElement("button"); bankBtn.className = "bc-del"; bankBtn.textContent = BC.t("📚 打开题库（{n}）", { n: (s.qbank || []).length });
    const status = document.createElement("span"); status.className = "bc-status";
    testBtn.onclick = async () => {
      status.textContent = BC.t("测试中…");
      try { const t = await BC.assistant.test(a); status.textContent = BC.t("连接成功：{t}", { t: String(t).slice(0, 40) }); }
      catch (e) { status.textContent = BC.t("失败：{msg}", { msg: e.message }); }
    };
    permBtn.onclick = async () => {
      let origin;
      try { origin = new URL(a.baseUrl).origin + "/*"; } catch (e) { status.textContent = BC.t("先填一个合法的 Base URL"); return; }
      const r = await chrome.runtime.sendMessage({ type: "bc-permission", origin });
      status.textContent = r && r.ok ? BC.t("已授权 {origin}", { origin }) : (r && r.error ? BC.t("未授权：{err}", { err: r.error }) : BC.t("未授权"));
    };
    bankBtn.onclick = () => { document.getElementById("bc-panel-overlay")?.remove(); BC.assistant.openBank(); };
    const row = document.createElement("div"); row.className = "bc-exam-row"; row.append(testBtn, permBtn, bankBtn, status);
    tools.appendChild(row);
    body.appendChild(tools);
  },

  /* ---------- 消息 ---------- */
  tabMessages(body, s) {
    body.append(
      BC.ui.row(BC.t("启用消息铃铛"), BC.ui.toggle(s.messages.enabled, async v => {
        s.messages.enabled = v; await BC.storage.set(s);
        document.querySelectorAll(".bc-bell").forEach(e => e.remove()); BC.bus.refreshMessages();
      })),
      BC.ui.row(BC.t("包含课程公告"), BC.ui.toggle(s.messages.sources.announcements, async v => {
        s.messages.sources.announcements = v; await BC.storage.set(s);
        document.querySelectorAll(".bc-bell").forEach(e => e.remove()); BC.bus.refreshMessages();
      })),
      BC.ui.row(BC.t("包含收件箱私信"), BC.ui.toggle(s.messages.sources.inbox, async v => {
        s.messages.sources.inbox = v; await BC.storage.set(s);
        document.querySelectorAll(".bc-bell").forEach(e => e.remove()); BC.bus.refreshMessages();
      })),
      BC.ui.row(BC.t("回看天数"), BC.ui.number(s.messages.lookbackDays, async v => {
        s.messages.lookbackDays = v || 21; await BC.storage.set(s);
        document.querySelectorAll(".bc-bell").forEach(e => e.remove()); BC.bus.refreshMessages();
      }, 1, 120))
    );
    const h = document.createElement("p"); h.className = "bc-note";
    h.textContent = BC.t("重要消息关键词（命中即按对应颜色高亮，逗号分隔）：");
    body.appendChild(h);
    s.importantRules.forEach(rule => {
      const ctrl = BC.ui.text(rule.words.join(", "), async v => {
        rule.words = v.split(",").map(w => w.trim()).filter(Boolean); await BC.storage.set(s);
        document.querySelectorAll(".bc-bell").forEach(e => e.remove()); BC.bus.refreshMessages();
      });
      const r = BC.ui.row(BC.t(rule.label), ctrl);
      r.querySelector(".bc-row-label").insertAdjacentHTML("afterbegin",
        `<span class="bc-swatch" style="background:${rule.color}"></span>`);
      body.appendChild(r);
    });
  },

  /* ---------- 期中期末 ---------- */
  async tabExam(body, s) {
    body.innerHTML = `<p class="bc-note">${BC.t("为每门课维护期中/期末等日期。可自动扫描 Syllabus、上传文本、或手动添加。")}</p>`;
    const scanBtn = document.createElement("button");
    scanBtn.className = "bc-primary-btn";
    scanBtn.textContent = BC.t("🔍 扫描所有课程 Syllabus");
    scanBtn.onclick = async () => {
      scanBtn.disabled = true; scanBtn.textContent = BC.t("扫描中…");
      const n = await BC.blocks.scanAllSyllabi();
      scanBtn.textContent = BC.t("完成，新增 {n} 条", { n });
      BC.bus.refreshBlocks();
      setTimeout(() => BC.ui._renderExamList(body, s), 600);
    };
    body.appendChild(scanBtn);

    const listWrap = document.createElement("div");
    listWrap.className = "bc-exam-wrap";
    body.appendChild(listWrap);
    await BC.ui._renderExamList(body, s);
  },

  async _renderExamList(body, s) {
    const wrap = body.querySelector(".bc-exam-wrap");
    wrap.textContent = BC.t("加载课程…");
    let courses = [];
    try { courses = await BC.api.activeCourses(); } catch (e) {}
    const names = {}; courses.forEach(c => names[c.id] = c.name || c.course_code || BC.t("课程 {cid}", { cid: c.id }));
    // 也把已有日期里出现过、但不在在读列表的课程补上
    Object.keys(s.examDates).forEach(id => { if (!names[id]) names[id] = BC.t("课程 {cid}", { cid: id }); });

    wrap.innerHTML = "";
    const ids = Object.keys(names).sort((a, b) => (names[a] || "").localeCompare(names[b] || ""));
    if (!ids.length) { wrap.textContent = BC.t("未找到课程。"); return; }

    ids.forEach(cid => {
      const box = document.createElement("details");
      box.className = "bc-exam-course";
      const list = s.examDates[cid] || [];
      box.innerHTML = `<summary>${BC.util.esc(names[cid])} <span class="bc-pill">${list.length}</span></summary>`;
      const inner = document.createElement("div"); inner.className = "bc-exam-inner";

      const redraw = () => {
        inner.querySelectorAll(".bc-exam-row").forEach(e => e.remove());
        (s.examDates[cid] || []).forEach((e, i) => {
          const row = document.createElement("div"); row.className = "bc-exam-row";
          row.innerHTML = `<span>${BC.t({ midterm: "期中", final: "期末", exam: "考试", other: "其他" }[e.type] || e.type)}</span>
            <span class="bc-exam-rt" title="${BC.util.esc(e.title || "")}">${BC.util.esc((e.title || "").slice(0, 28))}</span>
            <span>${BC.util.esc(e.date)}</span>
            <small>${e.source || ""}</small>
            <button class="bc-del">${BC.t("删除")}</button>`;
          row.querySelector(".bc-del").onclick = async () => {
            s.examDates[cid].splice(i, 1); await BC.storage.set(s); redraw(); BC.bus.refreshBlocks();
          };
          inner.insertBefore(row, addRow);
        });
      };

      // 手动添加行
      const addRow = document.createElement("div"); addRow.className = "bc-exam-add";
      const typeSel = BC.ui.select("midterm", [["midterm", BC.t("期中")], ["final", BC.t("期末")], ["exam", BC.t("考试")], ["other", BC.t("其他")]], () => {});
      const titleIn = document.createElement("input"); titleIn.placeholder = BC.t("标题(可选)"); titleIn.type = "text";
      const dateIn = document.createElement("input"); dateIn.type = "date";
      const addBtn = document.createElement("button"); addBtn.textContent = BC.t("添加"); addBtn.className = "bc-primary-btn";
      addBtn.onclick = async () => {
        if (!dateIn.value) return;
        s.examDates[cid] = s.examDates[cid] || [];
        s.examDates[cid].push({ type: typeSel.value, title: titleIn.value || "", date: dateIn.value, source: "manual" });
        await BC.storage.set(s); titleIn.value = ""; dateIn.value = ""; redraw(); BC.bus.refreshBlocks();
      };
      addRow.append(typeSel, titleIn, dateIn, addBtn);
      inner.appendChild(addRow);

      // 上传/粘贴解析
      const tools = document.createElement("div"); tools.className = "bc-exam-tools";
      const file = document.createElement("input"); file.type = "file"; file.accept = ".pdf,.txt,.csv,.html,.md,.ics";
      const ta = document.createElement("textarea"); ta.placeholder = BC.t("或把 syllabus 文字粘贴到这里…");
      const parseBtn = document.createElement("button"); parseBtn.textContent = BC.t("解析文本"); parseBtn.className = "bc-primary-btn";
      const scanOne = document.createElement("button"); scanOne.textContent = BC.t("扫描本课 Syllabus");
      const status = document.createElement("small"); status.className = "bc-status";
      const ingest = async (text) => {
        const found = BC.syllabus.extractFromText(text);
        if (!found.length) { status.textContent = BC.t("未识别到日期"); return; }
        s.examDates[cid] = s.examDates[cid] || [];
        const keys = new Set(s.examDates[cid].map(e => e.type + e.date));
        let n = 0; found.forEach(f => { if (!keys.has(f.type + f.date)) { s.examDates[cid].push(f); n++; } });
        await BC.storage.set(s); status.textContent = BC.t("新增 {n} 条", { n }); redraw(); BC.bus.refreshBlocks();
      };
      file.onchange = async () => {
        if (!file.files[0]) return;
        try { await ingest(await BC.syllabus.readFileText(file.files[0])); }
        catch (e) { status.textContent = e.message; }
      };
      parseBtn.onclick = () => ta.value.trim() && ingest(ta.value);
      scanOne.onclick = async () => {
        status.textContent = BC.t("扫描中…");
        try {
          const items = await BC.syllabus.scanCourse(cid);
          s.examDates[cid] = s.examDates[cid] || [];
          const keys = new Set(s.examDates[cid].map(e => e.type + e.date));
          let n = 0; items.forEach(f => { if (!keys.has(f.type + f.date)) { s.examDates[cid].push(f); n++; } });
          await BC.storage.set(s); status.textContent = BC.t("Syllabus 新增 {n} 条", { n }); redraw(); BC.bus.refreshBlocks();
        } catch (e) { status.textContent = BC.t("扫描失败"); }
      };
      tools.append(scanOne, file, ta, parseBtn, status);
      inner.appendChild(tools);

      box.appendChild(inner);
      redraw();
      wrap.appendChild(box);
    });
  },

  /* ---------- 课程主页 + Syllabus 页的小面板 ---------- */
  async injectCoursePagePanel() {
    // Syllabus 页也挂同一个面板：扫描按钮、已识别列表、手动添加、上传解析都用得上
    const m = location.pathname.match(/^\/courses\/(\d+)(?:\/assignments\/syllabus)?\/?$/);
    if (!m) return;
    if (document.getElementById("bc-course-exam")) return;
    const cid = m[1];
    const host = document.getElementById("content") || document.getElementById("not_right_side");
    if (!host) return;

    const s = await BC.storage.get();
    const panel = document.createElement("div");
    panel.id = "bc-course-exam";
    panel.className = "bc-block";
    panel.innerHTML = `<div class="bc-block-title">${BC.t("⏳ 本课期中/期末")}
      <button class="bc-scan-btn">${BC.t("扫描 Syllabus")}</button></div>
      <div class="bc-block-body"><div class="bc-course-exam-list"></div>
      <div class="bc-undated"></div>
      <div class="bc-course-exam-add"></div></div>`;
    host.insertBefore(panel, host.firstChild);

    const listEl = panel.querySelector(".bc-course-exam-list");
    const draw = async () => {
      const cur = (await BC.storage.get()).examDates[cid] || [];
      listEl.innerHTML = cur.length
        ? cur.map((e, i) => `<div class="bc-exam-row">
            <span>${BC.t({ midterm: "期中", final: "期末", exam: "考试", other: "其他" }[e.type] || e.type)}</span>
            <span class="bc-exam-rt">${BC.util.esc((e.title || "").slice(0, 30))}</span>
            <span>${BC.util.esc(e.date)}</span>
            <button class="bc-del" data-i="${i}">${BC.t("删除")}</button></div>`).join("")
        : `<small>${BC.t("暂无，扫描 Syllabus 或在下方手动添加。")}</small>`;
      listEl.querySelectorAll(".bc-del").forEach(b => b.onclick = async () => {
        await BC.storage.patch(st => st.examDates[cid].splice(+b.dataset.i, 1)); draw();
      });
    };

    const addWrap = panel.querySelector(".bc-course-exam-add");
    const typeSel = BC.ui.select("midterm", [["midterm", BC.t("期中")], ["final", BC.t("期末")], ["exam", BC.t("考试")], ["other", BC.t("其他")]], () => {});
    const titleIn = document.createElement("input"); titleIn.type = "text"; titleIn.placeholder = BC.t("标题(可选)");
    const dateIn = document.createElement("input"); dateIn.type = "date";
    const file = document.createElement("input"); file.type = "file"; file.accept = ".pdf,.txt,.csv,.html,.md";
    const addBtn = document.createElement("button"); addBtn.className = "bc-primary-btn"; addBtn.textContent = BC.t("添加");
    addBtn.onclick = async () => {
      if (!dateIn.value) return;
      await BC.storage.patch(st => {
        st.examDates[cid] = st.examDates[cid] || [];
        st.examDates[cid].push({ type: typeSel.value, title: titleIn.value || "", date: dateIn.value, source: "manual" });
      });
      titleIn.value = ""; dateIn.value = ""; draw();
    };
    file.onchange = async () => {
      if (!file.files[0]) return;
      try {
        const text = await BC.syllabus.readFileText(file.files[0]);
        const found = BC.syllabus.extractFromText(text);
        await BC.storage.patch(st => {
          st.examDates[cid] = st.examDates[cid] || [];
          const keys = new Set(st.examDates[cid].map(e => e.type + e.date));
          found.forEach(f => { if (!keys.has(f.type + f.date)) st.examDates[cid].push(f); });
        });
        draw();
      } catch (e) { alert(e.message); }
    };
    addWrap.append(typeSel, titleIn, dateIn, addBtn, file);

    /* 有考试关键词但没日期的行：列出来 + 一个日期框，补上就能入库。
     * 老师写 "Exam 1 - Wednesday October ?th" 这种占位符时，光报「识别 0 条」没法用。 */
    const undatedEl = panel.querySelector(".bc-undated");
    const TYPES = { midterm: "期中", final: "期末", exam: "考试", other: "其他" };
    const drawUndated = (list) => {
      undatedEl.innerHTML = "";
      if (!list || !list.length) return;
      const hd = document.createElement("div");
      hd.className = "bc-undated-hd";
      hd.textContent = BC.t("以下 {n} 处提到了考试但没有可解析的日期（多半是老师还没填），补上日期即可添加：", { n: list.length });
      undatedEl.appendChild(hd);
      list.forEach(u => {
        const row = document.createElement("div");
        row.className = "bc-exam-row";
        const d = document.createElement("input");
        d.type = "date";
        // 有月份提示就预填该月 1 号，用户只改日；否则留空
        if (u.month) {
          const y = new Date().getFullYear();
          d.value = `${y}-${String(u.month).padStart(2, "0")}-01`;
        }
        const add = document.createElement("button");
        add.className = "bc-primary-btn"; add.textContent = BC.t("添加");
        add.onclick = async () => {
          if (!d.value) return;
          await BC.storage.patch(st => {
            st.examDates[cid] = st.examDates[cid] || [];
            st.examDates[cid].push({ type: u.type, title: u.title, date: d.value, source: "syllabus" });
          });
          row.remove(); draw();
        };
        row.innerHTML = `<span>${BC.t(TYPES[u.type] || u.type)}</span>` +
                        `<span class="bc-exam-rt">${BC.util.esc(u.title)}</span>`;
        row.append(d, add);
        undatedEl.appendChild(row);
      });
    };

    panel.querySelector(".bc-scan-btn").onclick = async (ev) => {
      ev.target.disabled = true; ev.target.textContent = BC.t("扫描中…");
      try {
        const { items, undated } = await BC.syllabus.scanCourseDetailed(cid);
        await BC.storage.patch(st => {
          st.examDates[cid] = st.examDates[cid] || [];
          const keys = new Set(st.examDates[cid].map(e => e.type + e.date));
          items.forEach(f => { if (!keys.has(f.type + f.date)) st.examDates[cid].push(f); });
        });
        ev.target.textContent = BC.t("识别 {n} 条", { n: items.length }) + (undated.length ? BC.t(" · {n} 处待补", { n: undated.length }) : "");
        drawUndated(undated);
      } catch (e) { ev.target.textContent = BC.t("失败"); }
      ev.target.disabled = false;
      draw();
    };

    draw();
  }
};
