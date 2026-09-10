/* 自定义仪表盘面板（持久化、顺序固定）：
 *   - dueThisWeek   本周截止的未提交作业
 *   - gpa           当前 GPA 估算
 *   - examCountdown 各门课期中/期末倒计时
 * 注入到 #dashboard 顶部一个固定容器中。 */
BC.i18n.add({
  "加载失败": "Failed to load",
  "已过": "Overdue",
  "今天": "Today",
  "明天": "Tomorrow",
  "{n}天": "{n} days",
  "今天截止": "Due today",
  "作业": "Assignment",
  "📅 本周截止": "📅 Due this week",
  "本周没有待交作业 🎉": "Nothing due this week 🎉",
  "🎯 当前 GPA（估算）": "🎯 GPA estimate",
  "基于 {n} 门在读课程 · 分数线因课而异，仅供参考": "Based on {n} active courses · cutoffs vary by course, for reference only",
  "本周内": "This week",
  "两周内": "Within 2 weeks",
  "一个月内": "Within a month",
  "更远": "Later",
  "期中": "Midterm",
  "期末": "Final",
  "考试": "Exam",
  "其他": "Other",
  "课程 {id}": "Course {id}",
  "（未命名）": "(untitled)",
  "还有 {n} 条…": "{n} more…",
  "收起": "Collapse",
  "暂无": "None",
  "⏳ 期中/期末倒计时": "⏳ Exam countdown",
  "扫描所有课程 Syllabus 自动识别": "Scan every course syllabus to detect exam dates",
  "扫描 Syllabus": "Scan syllabus",
  "右键条目可编辑": "Right-click an item to edit",
  "暂无日期。点击右上“扫描 Syllabus”自动识别，或在设置里手动添加。": "No dates yet. Click \"Scan syllabi\" at the top right to detect them, or add them manually in Settings.",
  "扫描中…": "Scanning…",
  "识别到 {n} 条": "{n} found",
  "私信": "Message",
  "公告": "Announcement",
  "共 {n} 条": "{n} total",
  "近 {n} 天无通知": "No notices in the last {n} days",
  "🧑‍🏫 教授请假": "🧑‍🏫 Professor absence",
  "{n} 门有通知": "{n} with notices",
  "全部正常": "All clear",
  "没有找到在读课程。": "No active courses found.",
  "📨 最新消息": "📨 Latest messages",
  "{n} 未读": "{n} unread",
  "无未读": "No unread",
  "只显示当前学期课程的消息，可在设置「面板」里关": "Only showing messages from current-term courses; turn this off under Settings › Panels",
  "这门课最近没有公告或私信。": "No recent announcements or messages for this course.",
  "最近 {n} 天没有公告或私信。": "No announcements or messages in the last {n} days.",
  "最新在前": "Newest first",
  "最早在前": "Oldest first",
  "未读优先": "Unread first",
  "重要优先": "Important first",
  "按课程": "By course",
  "排序方式": "Sort order",
  "全部课程": "All courses",
  "只看某一门课的消息": "Course filter",
  "{n} 节": "{n} classes",
  "进行中": "In progress",
  "下一节": "Next",
  "全天": "All day",
  "还没有导入课表": "No schedule imported yet",
  "打开": "Open",
  "浏览器「打印」→ 目标选「另存为 PDF」": "Browser \"Print\" → set the destination to \"Save as PDF\"",
  "点下面按钮选择那个 PDF": "Click the button below and pick that PDF",
  "📄 导入 WebReg 课表 PDF": "📄 Import WebReg schedule PDF",
  "📆 今日课程": "📆 Today's classes",
  "从 WebReg 课表 PDF 导入 / 重新导入每周课表": "Import / re-import the weekly schedule from a WebReg schedule PDF",
  "重新导入": "Re-import",
  "导入课表": "Import schedule",
  "今天没有课 🎉": "No classes today 🎉",
  "课表来自 WebReg 导入 + Canvas 日历事件；可在设置「面板」里补手填的课。": "Schedule comes from the WebReg import + Canvas calendar events; add classes by hand under Settings › Panels.",
  "编辑考试": "Edit exam",
  "名字": "Name",
  "例：Exam 1": "e.g. Exam 1",
  "时间": "Date",
  "类型": "Type",
  "删除": "Delete",
  "取消": "Cancel",
  "保存": "Save",
  "删除这条考试日期？": "Delete this exam date?",
  "{a}–{b} 学年": "{a}–{b} academic year",
  "未分类学期": "Unsorted terms",
  "📚 历史课程": "📚 Past courses",
  "没有找到课程。": "No courses found."
});

BC.blocks = {
  CONTAINER_ID: "bc-blocks",

  // 有限并发的 map：list 里的项最多同时跑 limit 个 fn，结果按原顺序返回（单项失败记为 undefined，不打断其他项）
  async _pmap(list, limit, fn) {
    const items = [...list];
    const out = new Array(items.length);
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const i = next++;
        try { out[i] = await fn(items[i], i); }
        catch (e) { out[i] = undefined; console.warn("[BC] pmap item " + i, e); }
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
    return out;
  },

  // 加载骨架：几条宽度不一的闪烁条（宽度类 w40/w60/w75/w90 循环），面板出现时先占位，数据回来后整块 innerHTML 覆盖
  _skel(lines) {
    const ws = ["w60", "w90", "w75", "w40"];
    const rows = Array.from({ length: lines }, (_, i) => `<div class="bc-skel-line ${ws[i % ws.length]}"></div>`).join("");
    return `<div class="bc-skel" aria-busy="true" aria-hidden="true">${rows}</div>`;
  },
  // 倒计时面板是整行的：两行、每行四个短药丸
  _skelPills(rows, per) {
    const r = Array.from({ length: rows }, () =>
      `<div class="bc-skel-row">${Array.from({ length: per }, () => `<div class="bc-skel-line bc-skel-pill"></div>`).join("")}</div>`).join("");
    return `<div class="bc-skel" aria-busy="true" aria-hidden="true">${r}</div>`;
  },
  // 各面板的骨架行数（没列出的用 3 行）
  SKEL_LINES: { dueThisWeek: 4, gpa: 3, absence: 4, latest: 4, today: 3, history: 3 },

  // Rutgers 风格的百分比 -> GPA 估算（不同教授分数线不同，仅作参考）
  pctToGpa(p) {
    if (p == null) return null;
    if (p >= 90) return 4.0;
    if (p >= 85) return 3.5;
    if (p >= 80) return 3.0;
    if (p >= 75) return 2.5;
    if (p >= 70) return 2.0;
    if (p >= 60) return 1.0;
    return 0.0;
  },

  async render(settings) {
    if (!settings.blocks.enabled) {
      const old = document.getElementById(BC.blocks.CONTAINER_ID);
      if (old) old.remove();
      return;
    }
    const dash = document.getElementById("dashboard");
    if (!dash) return;

    // 迁移：旧设置里可能没有新增的 block，补进 order
    ["dueThisWeek", "gpa", "examCountdown", "absence", "latest", "today", "history"].forEach(k => {
      if (!settings.blocks.order.includes(k)) {
        settings.blocks.order.push(k);
        if (settings.blocks.visible[k] === undefined) settings.blocks.visible[k] = true;
      }
    });
    // 一次性迁移：新加的横向面板要放到指定面板右边（倒计时是整行，追加到末尾就掉到下一行了）
    const place = (key, after, flag) => {
      if (settings.blocks[flag]) return;
      const o = settings.blocks.order.filter(k => k !== key);
      const i = o.indexOf(after);
      o.splice(i < 0 ? o.length : i + 1, 0, key);
      settings.blocks.order = o;
      settings.blocks[flag] = true;
      BC.storage.patch(st => { st.blocks.order = o; st.blocks[flag] = true; }).catch(() => {});
    };
    place("absence", "gpa", "absencePlaced");
    place("latest", "absence", "latestPlaced");
    place("today", "latest", "todayPlaced");

    let cont = document.getElementById(BC.blocks.CONTAINER_ID);
    if (!cont) {
      cont = document.createElement("div");
      cont.id = BC.blocks.CONTAINER_ID;
      // 放在公告区之后、卡片容器之前
      const anchor = document.getElementById("announcementWrapper") || dash.firstChild;
      anchor.parentNode.insertBefore(cont, anchor.nextSibling);
    }
    cont.innerHTML = "";

    const renderers = {
      dueThisWeek: BC.blocks._dueThisWeek,
      gpa: BC.blocks._gpa,
      examCountdown: BC.blocks._examCountdown,
      absence: BC.blocks._absence,
      latest: BC.blocks._latest,
      today: BC.blocks._today,
      history: BC.blocks._history
    };
    for (const key of settings.blocks.order) {
      if (!settings.blocks.visible[key] || !renderers[key]) continue;
      if (key === "history" && settings.blocks.historyInSidebar !== false) continue; // 由 renderSidebarHistory 画到右侧栏
      const card = document.createElement("div");
      card.className = "bc-block";
      card.dataset.block = key;
      card.innerHTML = `<div class="bc-block-body">${key === "examCountdown" ? BC.blocks._skelPills(2, 4) : BC.blocks._skel(BC.blocks.SKEL_LINES[key] || 3)}</div>`;
      cont.appendChild(card);
      renderers[key](card, settings).catch(e => {
        card.querySelector(".bc-block-body").textContent = BC.t("加载失败");
        console.warn("[BC] block " + key, e);
      });
    }
  },

  // 历史课程作为右侧栏底部的一张卡（settings.blocks.historyInSidebar）
  SIDEBAR_HISTORY_ID: "bc-sb-history",
  async renderSidebarHistory(settings) {
    const old = document.getElementById(BC.blocks.SIDEBAR_HISTORY_ID);
    const show = settings.blocks.enabled && settings.blocks.visible.history !== false &&
                 settings.blocks.historyInSidebar !== false && BC.dash.onDashboard();
    if (!show) { old?.remove(); return; }
    const side = await BC.util.waitFor("#right-side", { timeout: 8000 });
    if (!side) return;
    const card = document.createElement("div");
    card.className = "bc-block bc-sb-history";
    card.id = BC.blocks.SIDEBAR_HISTORY_ID;
    card.dataset.block = "history";
    card.innerHTML = `<div class="bc-block-body">${BC.blocks._skel(3)}</div>`;
    if (old) old.remove();
    side.appendChild(card);   // 右侧栏最下面
    try { await BC.blocks._history(card); }
    catch (e) { card.querySelector(".bc-block-body").textContent = BC.t("加载失败"); console.warn("[BC] sidebar history", e); }
  },

  async _dueThisWeek(card, settings) {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 86400000);
    let items = [];
    try {
      items = await BC.api.plannerItems(now.toISOString(), end.toISOString());
    } catch (e) {}
    const due = items.filter(it => {
      const sub = it.submissions;
      const done = sub && (sub.submitted || sub.excused || sub.graded);
      return (it.plannable_date) && !done && it.plannable_type !== "announcement";
    }).sort((a, b) => new Date(a.plannable_date) - new Date(b.plannable_date));

    const rows = due.slice(0, 12).map(it => {
      const d = BC.util.daysUntil(it.plannable_date);   // 日历日：同一天的中午 / 深夜截止都算同一天
      // 临期分级高亮：今天 / 已过 = 红，明天 = 橙，两天内 = 黄
      const tier = d == null ? "" : d <= 0 ? "bc-due-today" : d === 1 ? "bc-due-soon" : d <= 2 ? "bc-due-near" : "";
      const urgent = d != null && d <= 1;
      const when = d == null ? "" : d < 0 ? BC.t("已过") : d === 0 ? BC.t("今天") : d === 1 ? BC.t("明天") : BC.t("{n}天", { n: d });
      return `<li class="${urgent ? "bc-urgent " : ""}${tier}">
        ${d != null && d <= 0 ? `<span class="bc-due-flag" title="${BC.t("今天截止")}">⚠</span>` : ""}
        <a href="${BC.util.esc(it.html_url || "#")}">${BC.util.esc(it.plannable && it.plannable.title || BC.t("作业"))}</a>
        <span class="bc-when" title="${BC.util.esc(it.plannable_date)}">${BC.util.fmtDateTime(it.plannable_date)}${when ? ` · ${when}` : ""}</span>
      </li>`;
    }).join("");

    card.innerHTML =
      `<div class="bc-block-title">${BC.t("📅 本周截止")} <span class="bc-pill">${due.length}</span></div>
       <div class="bc-block-body">${due.length ? `<ul class="bc-list">${rows}</ul>` : BC.t("本周没有待交作业 🎉")}</div>`;
  },

  async _gpa(card, settings) {
    const scores = await BC.grades.fetchScores();
    // “其他课程”（无课号）不计入
    const counted = Object.values(scores).filter(s => BC.groups.countsForGpa(s));
    const vals = counted.map(s => s.score).filter(v => v != null);
    const gpas = vals.map(BC.blocks.pctToGpa).filter(v => v != null);
    const avg = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length) : null;
    const detail = counted
      .filter(s => s.score != null)
      .map(s => `${s.score}%${s.grade ? " (" + s.grade + ")" : ""}`)
      .slice(0, 8).join(BC.i18n.pick("、", ", "));

    card.innerHTML =
      `<div class="bc-block-title">${BC.t("🎯 当前 GPA（估算）")}</div>
       <div class="bc-block-body">
         <div class="bc-gpa-num">${avg != null ? avg.toFixed(2) : "—"}</div>
         <div class="bc-gpa-sub">${BC.t("基于 {n} 门在读课程 · 分数线因课而异，仅供参考", { n: gpas.length })}</div>
         <div class="bc-gpa-detail">${BC.util.esc(detail)}</div>
       </div>`;
  },

  // 课程配色：按课程 id 顺序固定分配，保证每次渲染同一门课颜色不变。
  // 全部选偏深的色，既能做白底上的文字（日历条目），也能做白字的底（面板标签）。
  COURSE_PALETTE: ["#c92a2a", "#1864ab", "#2b7a3b", "#b35c00", "#6741d9", "#0b7285", "#c2255c", "#3b5bdb", "#862e9c", "#087f5b"],

  // 时间大类（按剩余天数上限划分，顺序即横向摆放顺序）；label 是中文键，渲染时过 BC.t
  EXAM_GROUPS: [
    { key: "week",  label: "本周内",   max: 7 },
    { key: "two",   label: "两周内",   max: 14 },
    { key: "month", label: "一个月内", max: 30 },
    { key: "later", label: "更远",     max: Infinity }
  ],

  // 课程 id -> 颜色（按 id 升序固定分配；倒计时面板和日历页共用，保证同一门课到处同色）
  courseColors(examDates) {
    const cids = Object.entries(examDates || {}).filter(([, l]) => l && l.length).map(([cid]) => cid).sort((a, b) => +a - +b);
    const out = {};
    cids.forEach((cid, i) => { out[cid] = BC.blocks.COURSE_PALETTE[i % BC.blocks.COURSE_PALETTE.length]; });
    return out;
  },

  async _examCountdown(card, settings) {
    const esc = BC.util.esc;
    const all = [];
    for (const [cid, list] of Object.entries(settings.examDates || {})) {
      list.forEach((e, idx) => {
        const d = BC.util.daysUntil(e.date);
        if (d == null || d < -1) return; // 跳过已过去
        all.push({ ...e, cid, idx, days: d }); // idx：在 examDates[cid] 里的位置，右键编辑用
      });
    }
    all.sort((a, b) => a.days - b.days);
    const typeLabel = { midterm: "期中", final: "期末", exam: "考试", other: "其他" };

    // 课程名 + 颜色
    let scores = {};
    try { scores = await BC.grades.fetchScores(); } catch (e) {}
    const cids = [...new Set(all.map(e => e.cid))].sort((a, b) => +a - +b);
    const colors = BC.blocks.courseColors(settings.examDates);
    const course = {};
    cids.forEach(cid => {
      const s = scores[cid] || {};
      const t = BC.util.courseTitle(s.name || s.code || BC.t("课程 {id}", { id: cid }));
      course[cid] = { color: colors[cid], code: t, name: t };
    });

    // 按时间大类分桶
    const buckets = BC.blocks.EXAM_GROUPS.map(g => ({ ...g, items: [] }));
    for (const e of all) {
      const g = buckets.find(b => e.days <= b.max);
      if (g) g.items.push(e);
    }

    const PER_GROUP = 10;
    const item = e => {
      const c = course[e.cid];
      const urgent = e.days <= 7;
      return `<li class="bc-exam-item${urgent ? " bc-urgent" : ""}" style="--bc-cc:${c.color}" data-cid="${esc(e.cid)}" data-idx="${e.idx}">
        <div class="bc-exam-item-hd">
          <span class="bc-exam-course-tag" title="${esc(c.name)}">${esc(c.code)}</span>
          <span class="bc-exam-type">${BC.t(typeLabel[e.type] || "考试")}</span>
          <span class="bc-exam-days">${e.days <= 0 ? BC.t("今天") : BC.t("{n}天", { n: e.days })}</span>
        </div>
        <a class="bc-exam-item-title" href="/courses/${e.cid}" title="${esc(e.title || "")}">${esc(e.title || BC.t("（未命名）"))}</a>
        <span class="bc-when">${BC.util.fmtDate(e.date)}</span>
      </li>`;
    };

    // 全部渲染，超出 PER_GROUP 的先隐藏；点“还有 N 条”每次再展开 PER_GROUP 条
    const groupsHtml = buckets.map(g => {
      const lis = g.items.map((e, i) => item(e).replace('class="bc-exam-item', `class="bc-exam-item${i >= PER_GROUP ? " bc-exam-hidden" : ""}`)).join("");
      const more = g.items.length > PER_GROUP
        ? `<button class="bc-exam-more" type="button">${BC.t("还有 {n} 条…", { n: g.items.length - PER_GROUP })}</button>` : "";
      return `<div class="bc-exam-group bc-exam-group-${g.key}${g.items.length ? "" : " bc-exam-group-empty"}">
        <div class="bc-exam-group-hd">${BC.t(g.label)} <span class="bc-pill">${g.items.length}</span></div>
        ${g.items.length ? `<ul class="bc-exam-items">${lis}</ul>${more}` : `<div class="bc-exam-none">${BC.t("暂无")}</div>`}
      </div>`;
    }).join("");

    const legend = cids.map(cid => {
      const c = course[cid];
      return `<a class="bc-exam-legend-item" href="/courses/${cid}" title="${esc(c.name)}" style="--bc-cc:${c.color}">
        <i class="bc-exam-dot"></i>${esc(c.code)}</a>`;
    }).join("");

    card.innerHTML =
      `<div class="bc-block-title">${BC.t("⏳ 期中/期末倒计时")}
         <button class="bc-scan-btn" title="${BC.t("扫描所有课程 Syllabus 自动识别")}">${BC.t("扫描 Syllabus")}</button>
       </div>
       <div class="bc-block-body">${all.length
          ? `<div class="bc-exam-legend">${legend}<span class="bc-exam-hint">${BC.t("右键条目可编辑")}</span></div><div class="bc-exam-groups">${groupsHtml}</div>`
          : BC.t("暂无日期。点击右上“扫描 Syllabus”自动识别，或在设置里手动添加。")}</div>`;

    // 右键条目 -> 编辑名字 / 时间 / 类型
    card.querySelectorAll(".bc-exam-item").forEach(li => {
      li.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        BC.blocks.openExamEditor(li.dataset.cid, +li.dataset.idx, ev.clientX, ev.clientY);
      });
    });

    card.querySelectorAll(".bc-exam-more").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.closest(".bc-exam-group");
        const hidden = group.querySelectorAll(".bc-exam-item.bc-exam-hidden");
        if (hidden.length) {
          // 向下再展开一批
          [...hidden].slice(0, PER_GROUP).forEach(li => li.classList.remove("bc-exam-hidden"));
          const left = hidden.length - Math.min(PER_GROUP, hidden.length);
          btn.textContent = left > 0 ? BC.t("还有 {n} 条…", { n: left }) : BC.t("收起");
        } else {
          // 已全部展开：折回默认条数
          group.querySelectorAll(".bc-exam-item").forEach((li, i) => { if (i >= PER_GROUP) li.classList.add("bc-exam-hidden"); });
          btn.textContent = BC.t("还有 {n} 条…", { n: group.querySelectorAll(".bc-exam-item").length - PER_GROUP });
          group.scrollIntoView({ block: "nearest" });
        }
      });
    });

    card.querySelector(".bc-scan-btn").addEventListener("click", async (ev) => {
      const btn = ev.target;
      btn.disabled = true; btn.textContent = BC.t("扫描中…");
      const found = await BC.blocks.scanAllSyllabi();
      btn.textContent = BC.t("识别到 {n} 条", { n: found });
      setTimeout(() => BC.bus.refreshBlocks(), 800);
    });
  },

  /* 教授请假：列出全部在读课程，公告 / 私信里（消息回看窗口内）出现请假 / 停课关键词的课打 ×，否则 ✔。
   * 关键词在 settings.absenceWords，可在设置面板里改。 */
  async _absence(card, settings) {
    const esc = BC.util.esc;
    // 成绩表和消息并行拉（消息内部也要课程 id，走 fetchScores 的 in-flight 去重）
    const [scores, byCourse] = await Promise.all([
      BC.grades.fetchScores(),
      BC.messages.fetchAll(settings).catch(() => ({}))
    ]);
    const words = (settings.absenceWords || BC.DEFAULTS.absenceWords || []).map(w => w.toLowerCase()).filter(Boolean);
    const hit = m => {
      const t = `${m.title || ""} ${m.body || ""}`.toLowerCase();
      return words.some(w => t.includes(w));
    };

    const rows = Object.entries(scores).map(([cid, s]) => {
      const msgs = (byCourse[cid] || []).filter(hit);   // fetchAll 已按时间倒序
      return { cid, name: BC.util.courseTitle(s.name || s.code || BC.t("课程 {id}", { id: cid })), code: s.code || "", msgs };
    }).sort((a, b) => (b.msgs.length - a.msgs.length) || a.name.localeCompare(b.name));

    const lookback = settings.messages.lookbackDays || 21;
    const html = rows.map(r => {
      const bad = r.msgs.length > 0;
      const m = r.msgs[0];
      const sub = bad
        ? `<a class="bc-abs-msg" href="${esc(m.url || "#")}" title="${esc(m.body || "")}">${m.kind === "inbox" ? BC.t("私信") : BC.t("公告")} · ${esc(m.title)}</a>
           <span class="bc-when">${BC.util.fmtDate(m.date)}${r.msgs.length > 1 ? ` · ${BC.t("共 {n} 条", { n: r.msgs.length })}` : ""}</span>`
        : `<span class="bc-abs-sub">${BC.t("近 {n} 天无通知", { n: lookback })}</span>`;
      return `<li class="bc-abs-row ${bad ? "bc-abs-bad" : "bc-abs-ok"}">
        <span class="bc-abs-mark">${bad ? "✕" : "✔"}</span>
        <div class="bc-abs-body">
          <a class="bc-abs-name" href="/courses/${r.cid}" title="${esc(r.name)}">${esc(r.name)}</a>
          <div class="bc-abs-detail">${sub}</div>
        </div>
      </li>`;
    }).join("");

    const badCount = rows.filter(r => r.msgs.length).length;
    card.innerHTML =
      `<div class="bc-block-title">${BC.t("🧑‍🏫 教授请假")}
         <span class="bc-pill ${badCount ? "bc-pill-bad" : ""}">${badCount ? BC.t("{n} 门有通知", { n: badCount }) : BC.t("全部正常")}</span>
       </div>
       <div class="bc-block-body">${rows.length ? `<ul class="bc-list bc-abs-list">${html}</ul>` : BC.t("没有找到在读课程。")}</div>`;
  },

  /* 最新消息：所有课程的公告 + 私信合并，按时间倒序取前 N 条，左右两栏横向摆放。
   * 未读加圆点，命中重要关键词（测验 / 换教室 / 请假 / 截止）的按规则颜色标左边条。 */
  LATEST_MAX: 10,

  // 当前学期 = 在读课程里最新的那个学期（按 parseTerm 的 学年 + 季节排序）；识别不出学期名的课不算
  currentTerm(scores) {
    let best = null;
    for (const s of Object.values(scores || {})) {
      const p = BC.blocks.parseTerm(s.term);
      if (!p) continue;
      const key = p.ayStart * 10 + p.order;
      if (!best || key > best.key) best = { key, name: s.term };
    }
    return best ? best.name : "";
  },

  async _latest(card, settings) {
    const esc = BC.util.esc;
    const [scores, byCourse] = await Promise.all([
      BC.grades.fetchScores(),
      BC.messages.fetchAll(settings).catch(() => ({}))
    ]);
    // 只看当前学期：老学期的课（Advising、往年课）以及没有学期的课程不显示
    const term = settings.blocks.latestCurrentTermOnly !== false ? BC.blocks.currentTerm(scores) : "";
    const all = [];
    for (const [cid, list] of Object.entries(byCourse)) {
      const s = scores[cid] || {};
      if (term && (s.term || "") !== term) continue;
      list.forEach(m => all.push({ ...m, cid, course: BC.util.courseTitle(s.name || s.code || BC.t("课程 {id}", { id: cid })) }));
    }
    // 标题右侧的两个下拉：排序方式 + 只看某一门课，选择存在设置里（blocks.latestSort / blocks.latestCourse）
    const courses = [...new Map(all.map(m => [m.cid, m.course])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
    let pick = settings.blocks.latestCourse || "";
    if (pick && !courses.some(c => c[0] === pick)) pick = "";           // 选过的课这学期没消息 / 不在了：退回全部
    const sortMode = settings.blocks.latestSort || "newest";
    const filtered = pick ? all.filter(m => m.cid === pick) : all;
    // 解析不了的日期排最后。列表是两列网格、按行流动（见 inject.css grid-auto-flow: row），
    // 所以阅读顺序就是：第 1 条左上、第 2 条右上、第 3 条第二行左……
    const ts = m => { const t = Date.parse(m.date || ""); return isNaN(t) ? -Infinity : t; };
    const byTitle = (a, b) => String(a.title).localeCompare(String(b.title));
    const cmp = {
      newest: (a, b) => ts(b) - ts(a) || byTitle(a, b),
      oldest: (a, b) => ts(a) - ts(b) || byTitle(a, b),
      unread: (a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0) || ts(b) - ts(a) || byTitle(a, b),
      course: (a, b) => a.course.localeCompare(b.course) || ts(b) - ts(a) || byTitle(a, b),
      important: (a, b) => (b.rule ? 1 : 0) - (a.rule ? 1 : 0) || ts(b) - ts(a) || byTitle(a, b)
    }[sortMode] || ((a, b) => ts(b) - ts(a));
    filtered.sort(cmp);
    const shown = filtered.slice(0, BC.blocks.LATEST_MAX);
    const unread = filtered.filter(m => m.unread).length;

    const rows = shown.map(m => {
      const color = m.rule ? m.rule.color : "";
      return `<li class="bc-latest-row${m.unread ? " bc-latest-unread" : ""}" ${color ? `style="--bc-rule:${esc(color)}"` : ""}>
        <div class="bc-latest-hd">
          <span class="bc-latest-kind">${m.kind === "inbox" ? BC.t("私信") : BC.t("公告")}</span>
          <span class="bc-latest-course" title="${esc(scores[m.cid] && scores[m.cid].name || m.course)}">${esc(m.course)}</span>
          ${m.rule ? `<span class="bc-latest-rule">${esc(BC.t(m.rule.label))}</span>` : ""}
          <span class="bc-when">${BC.util.fmtDate(m.date)}</span>
        </div>
        <a class="bc-latest-title" href="${esc(m.url || "#")}" title="${esc(m.body || "")}">${esc(m.title)}</a>
      </li>`;
    }).join("");

    card.innerHTML =
      `<div class="bc-block-title">${BC.t("📨 最新消息")}
         <span class="bc-pill ${unread ? "bc-pill-bad" : ""}">${unread ? BC.t("{n} 未读", { n: unread }) : BC.t("无未读")}</span>
         <span class="bc-latest-ctl">
           ${term ? `<span class="bc-latest-term" title="${BC.t("只显示当前学期课程的消息，可在设置「面板」里关")}">${esc(term)}</span>` : ""}
         </span>
       </div>
       <div class="bc-block-body">${shown.length ? `<ul class="bc-list bc-latest-list">${rows}</ul>`
          : pick ? BC.t("这门课最近没有公告或私信。") : BC.t("最近 {n} 天没有公告或私信。", { n: settings.messages.lookbackDays || 21 })}</div>`;

    // 排序 / 课程下拉：改了就存设置并只重画这一块（消息有缓存，不会重新拉接口）
    const ctl = card.querySelector(".bc-latest-ctl");
    const save = async (key, val) => { settings.blocks[key] = val; await BC.storage.set(settings); BC.blocks._latest(card, settings); };
    const sortSel = BC.ui.select(sortMode, [
      ["newest", BC.t("最新在前")], ["oldest", BC.t("最早在前")], ["unread", BC.t("未读优先")], ["important", BC.t("重要优先")], ["course", BC.t("按课程")]
    ], v => save("latestSort", v));
    sortSel.title = BC.t("排序方式");
    const courseSel = BC.ui.select(pick, [["", BC.t("全部课程")], ...courses.map(([cid, name]) => [cid, name])], v => save("latestCourse", v));
    courseSel.title = BC.t("只看某一门课的消息");
    ctl.append(sortSel, courseSel);
  },

  /* 今日课程表：两个来源合并 —— 设置里手填的每周课表（settings.schedule）+ Canvas 日历里今天的课程事件。
   * 按开始时间排序；正在上的标「进行中」，下一节标「下一节」，已结束的变淡。 */
  WEEKDAY: ["日", "一", "二", "三", "四", "五", "六"],
  WEEKDAY_EN: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  async _today(card, settings) {
    const esc = BC.util.esc;
    const now = new Date();
    const wd = now.getDay();
    const hhmm = d => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const toMin = t => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ""); return m ? (+m[1]) * 60 + (+m[2]) : null; };
    const scores = await BC.grades.fetchScores();
    const title = BC.util.courseTitle;
    const nameOf = cid => { const s = scores[cid] || {}; return title(s.name || s.code || BC.t("课程 {id}", { id: cid })); };

    const items = [];
    // 1) 手填 / WebReg 导入的课表
    (settings.schedule || []).forEach(it => {
      if (!it || !(it.days || []).includes(wd)) return;
      items.push({ cid: it.cid, name: title(it.name) || nameOf(it.cid), start: it.start || "", end: it.end || "", loc: it.location || "", src: it.source || "manual" });
    });
    // 2) Canvas 日历事件（今天 00:00–23:59，本地时区）
    try {
      const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
      const d1 = new Date(now); d1.setHours(23, 59, 59, 999);
      const evs = await BC.api.calendarEvents(Object.keys(scores), d0.toISOString(), d1.toISOString());
      evs.forEach(e => {
        if (e.hidden || e.workflow_state === "deleted") return;
        const cid = BC.util.idFromContextCode(e.context_code);
        const s = e.start_at ? new Date(e.start_at) : null, en = e.end_at ? new Date(e.end_at) : null;
        items.push({
          cid, name: title(e.title) || nameOf(cid), course: cid ? nameOf(cid) : "",
          start: e.all_day || !s ? "" : hhmm(s), end: e.all_day || !en ? "" : hhmm(en),
          loc: e.location_name || "", url: e.html_url, src: "canvas", allDay: !!e.all_day
        });
      });
    } catch (e) {}

    // 去重：同一门课同一开始时间只留一条（课表条目排在前面优先），Canvas 事件里的地点 / 链接补进去
    const byKey = new Map();
    items.forEach(it => {
      const k = it.cid ? `${it.cid}|${it.start}` : `${it.name.toLowerCase()}|${it.start}`;
      const prev = byKey.get(k);
      if (!prev) { byKey.set(k, it); return; }
      if (!prev.loc && it.loc) prev.loc = it.loc;
      if (!prev.end && it.end) prev.end = it.end;
      if (!prev.url && it.url) prev.url = it.url;
    });
    const list = [...byKey.values()].sort((a, b) => (toMin(a.start) ?? -1) - (toMin(b.start) ?? -1));

    const nowMin = now.getHours() * 60 + now.getMinutes();
    let nextMarked = false;
    const rows = list.map(it => {
      const s = toMin(it.start), e = toMin(it.end);
      let st = "";
      if (s != null && e != null && nowMin >= s && nowMin < e) st = "now";
      else if (e != null && nowMin >= e) st = "past";
      else if (s != null && nowMin < s && !nextMarked) { st = "next"; nextMarked = true; }
      const tag = st === "now" ? `<span class="bc-today-tag bc-today-tag-now">${BC.t("进行中")}</span>`
                : st === "next" ? `<span class="bc-today-tag bc-today-tag-next">${BC.t("下一节")}</span>` : "";
      const time = it.allDay ? BC.t("全天") : it.start ? `${esc(it.start)}${it.end ? "–" + esc(it.end) : ""}` : "—";
      const title = it.url ? `<a href="${esc(it.url)}">${esc(it.name)}</a>` : `<a href="/courses/${esc(it.cid || "")}">${esc(it.name)}</a>`;
      const sub = [it.course && it.course !== it.name ? it.course : "", it.loc].filter(Boolean).join(" · ");
      return `<li class="bc-today-row bc-today-${st || "later"}">
        <span class="bc-today-time">${time}</span>
        <div class="bc-today-body">
          <div class="bc-today-name">${title}${tag}</div>
          ${sub ? `<div class="bc-today-sub">${esc(sub)}</div>` : ""}
        </div>
      </li>`;
    }).join("");

    // 还没导入 WebReg 课表 -> 引导：去 WebReg 打印课表为 PDF，再点这里导入
    const imported = (settings.schedule || []).some(it => it && it.source === "webreg");
    const webreg = BC.webreg ? BC.webreg.SCHEDULE_URL : "https://sims.rutgers.edu/webreg/viewSchedule.htm";
    const guide = imported ? "" :
      `<div class="bc-today-import">
         <div class="bc-today-import-hd">${BC.t("还没有导入课表")}</div>
         <ol class="bc-today-import-steps">
           <li>${BC.t("打开")} <a href="${webreg}" target="_blank" rel="noopener noreferrer">WebReg · View / Print Schedule ↗</a></li>
           <li>${BC.t("浏览器「打印」→ 目标选「另存为 PDF」")}</li>
           <li>${BC.t("点下面按钮选择那个 PDF")}</li>
         </ol>
         <button type="button" class="bc-today-import-btn">${BC.t("📄 导入 WebReg 课表 PDF")}</button>
         <div class="bc-today-import-status"></div>
       </div>`;

    card.innerHTML =
      `<div class="bc-block-title">${BC.t("📆 今日课程")}
         <span class="bc-pill">${BC.i18n.pick("周" + BC.blocks.WEEKDAY[wd], BC.blocks.WEEKDAY_EN[wd])} · ${BC.t("{n} 节", { n: list.length })}</span>
         <button class="bc-scan-btn bc-today-reimport" title="${BC.t("从 WebReg 课表 PDF 导入 / 重新导入每周课表")}">${imported ? BC.t("重新导入") : BC.t("导入课表")}</button>
       </div>
       <div class="bc-block-body">
         ${list.length ? `<ul class="bc-list bc-today-list">${rows}</ul>` : `<div class="bc-today-empty">${BC.t("今天没有课 🎉")}</div>`}
         ${guide}
         ${!list.length && imported ? `<div class="bc-today-hint">${BC.t("课表来自 WebReg 导入 + Canvas 日历事件；可在设置「面板」里补手填的课。")}</div>` : ""}
       </div>`;

    const status = card.querySelector(".bc-today-import-status");
    const setStatus = t => { if (status) status.textContent = t; else { const b = card.querySelector(".bc-today-reimport"); if (b) b.textContent = t; } };
    card.querySelectorAll(".bc-today-import-btn,.bc-today-reimport").forEach(b => {
      b.addEventListener("click", () => { if (BC.webreg) BC.webreg.pickAndImport(setStatus); });
    });
  },

  // 右键编辑弹层：改 settings.examDates[cid][idx] 的 title / date / type，或删除
  async openExamEditor(cid, idx, x, y) {
    document.getElementById("bc-exam-edit")?.remove();
    const s = await BC.storage.get();
    const e = (s.examDates[cid] || [])[idx];
    if (!e) return;
    const esc = BC.util.esc;
    const types = [["midterm", "期中"], ["final", "期末"], ["exam", "考试"], ["other", "其他"]];

    const box = document.createElement("div");
    box.id = "bc-exam-edit";
    box.className = "bc-exam-edit";
    box.innerHTML =
      `<div class="bc-exam-edit-hd">${BC.t("编辑考试")}</div>
       <label>${BC.t("名字")}<input type="text" class="bc-ee-title" value="${esc(e.title || "")}" placeholder="${BC.t("例：Exam 1")}"></label>
       <label>${BC.t("时间")}<input type="date" class="bc-ee-date" value="${esc(e.date || "")}"></label>
       <label>${BC.t("类型")}<select class="bc-ee-type">${types.map(([v, l]) =>
         `<option value="${v}"${e.type === v ? " selected" : ""}>${BC.t(l)}</option>`).join("")}</select></label>
       <div class="bc-exam-edit-btns">
         <button type="button" class="bc-del bc-ee-del">${BC.t("删除")}</button>
         <button type="button" class="bc-ee-cancel">${BC.t("取消")}</button>
         <button type="button" class="bc-ee-save">${BC.t("保存")}</button>
       </div>`;
    document.body.appendChild(box);

    // 贴着鼠标显示，但不出视口
    const r = box.getBoundingClientRect();
    box.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px";
    box.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";

    const close = () => {
      box.remove();
      document.removeEventListener("mousedown", onDoc, true);
      document.removeEventListener("keydown", onKey, true);
    };
    const onDoc = ev => { if (!box.contains(ev.target)) close(); };
    const onKey = ev => {
      if (ev.key === "Escape") { ev.preventDefault(); close(); }
      else if (ev.key === "Enter" && ev.target.tagName !== "SELECT" && ev.target.tagName !== "BUTTON") { ev.preventDefault(); save(); }
    };
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onKey, true);

    const save = async () => {
      const dateIn = box.querySelector(".bc-ee-date");
      if (!dateIn.value) { dateIn.focus(); return; }
      await BC.storage.patch(st => {
        const cur = (st.examDates[cid] || [])[idx];
        if (!cur) return;
        cur.title = box.querySelector(".bc-ee-title").value.trim();
        cur.date = dateIn.value;
        cur.type = box.querySelector(".bc-ee-type").value;
        cur.source = "manual"; // 手动改过的条目，扫描 Syllabus 时按手动条目保留
      });
      close();
      BC.bus.refreshBlocks();
    };
    box.querySelector(".bc-ee-save").onclick = save;
    box.querySelector(".bc-ee-cancel").onclick = close;
    box.querySelector(".bc-ee-del").onclick = async () => {
      if (!confirm(BC.t("删除这条考试日期？"))) return;
      await BC.storage.patch(st => { (st.examDates[cid] || []).splice(idx, 1); });
      close();
      BC.bus.refreshBlocks();
    };
    box.querySelector(".bc-ee-title").focus();
  },

  // 解析学期名 -> { ayStart(学年起始年), order(学期内排序), season, year }
  parseTerm(name) {
    if (!name) return null;
    const ym = name.match(/(20\d{2})/);
    if (!ym) return null;
    const year = +ym[1];
    const s = name.toLowerCase();
    let season = "", order = 5;
    if (/fall|秋/.test(s)) { season = "Fall"; order = 1; }
    else if (/winter|冬/.test(s)) { season = "Winter"; order = 2; }
    else if (/spring|春/.test(s)) { season = "Spring"; order = 3; }
    else if (/summer|夏/.test(s)) { season = "Summer"; order = 4; }
    // 学年从秋季开始：Fall Y 属于 Y–Y+1；Spring/Summer/Winter Y 属于 (Y-1)–Y
    const ayStart = season === "Fall" ? year : year - 1;
    return { ayStart, order, season, year };
  },

  async _history(card) {
    let courses = [];
    try { courses = await BC.api.allCourses(); } catch (e) {}
    // 分组：学年 -> 学期 -> 课程
    const ays = {};
    courses.forEach(c => {
      const tn = (c.term && c.term.name) || "";
      const p = BC.blocks.parseTerm(tn);
      const ayKey = p ? String(p.ayStart) : "_none";
      const ayLabel = p ? BC.t("{a}–{b} 学年", { a: p.ayStart, b: p.ayStart + 1 }) : BC.t("未分类学期");
      const ayStart = p ? p.ayStart : -1;
      const semKey = tn || "_other";
      const semLabel = tn || BC.t("其他");
      const semOrder = p ? p.order : 99;
      const en = (c.enrollments || []).find(e => e.type === "student") || (c.enrollments || [])[0];
      const score = en ? (en.computed_current_score ?? null) : null;

      ays[ayKey] = ays[ayKey] || { label: ayLabel, start: ayStart, count: 0, sems: {} };
      const ay = ays[ayKey];
      ay.sems[semKey] = ay.sems[semKey] || { label: semLabel, order: semOrder, courses: [] };
      ay.sems[semKey].courses.push({ id: c.id, name: BC.util.courseTitle(c.name || c.course_code || BC.t("课程 {id}", { id: c.id })), score });
      ay.count++;
    });

    const ayList = Object.values(ays).sort((a, b) => b.start - a.start);
    let html = "";
    ayList.forEach((ay) => {
      const sems = Object.values(ay.sems).sort((a, b) => a.order - b.order);
      html += `<details class="bc-ay">
        <summary>${BC.util.esc(ay.label)} <span class="bc-pill">${ay.count}</span></summary>`;
      sems.forEach(sem => {
        html += `<div class="bc-sem"><div class="bc-sem-title">${BC.util.esc(sem.label)}</div><ul class="bc-list">`;
        sem.courses.forEach(c => {
          const sc = c.score != null ? `<span class="bc-when">${c.score}%</span>` : "";
          html += `<li><a href="/courses/${c.id}">${BC.util.esc(c.name)}</a>${sc}</li>`;
        });
        html += `</ul></div>`;
      });
      html += `</details>`;
    });

    card.innerHTML =
      `<div class="bc-block-title">${BC.t("📚 历史课程")} <span class="bc-pill">${courses.length}</span></div>
       <div class="bc-block-body">${ayList.length ? html : BC.t("没有找到课程。")}</div>`;
  },

  // 扫描所有在读课程的 syllabus，把结果合并进 settings.examDates
  async scanAllSyllabi() {
    const scores = await BC.grades.fetchScores();
    const ids = Object.keys(scores);
    let count = 0;
    // 每门课要打 Course Summary + syllabus 正文 +（最多 3 个）PDF 好几个接口，并发上限 3；扫描完再一次性写入设置
    const scanned = await BC.blocks._pmap(ids, 3, async cid => {
      try { return await BC.syllabus.scanCourse(cid); } catch (e) { return []; }
    });
    await BC.storage.patch(s => {
      ids.forEach((cid, i) => {
        const items = scanned[i] || [];
        if (!items.length) return;
        const existing = s.examDates[cid] || [];
        // 去重：保留手动条目，补充自动条目
        const keys = new Set(existing.map(e => e.type + e.date));
        for (const it of items) {
          if (!keys.has(it.type + it.date)) { existing.push(it); count++; }
        }
        s.examDates[cid] = existing;
      });
    });
    return count;
  }
};
