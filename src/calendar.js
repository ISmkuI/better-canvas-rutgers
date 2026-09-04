/* 日历页：把 settings.examDates 里的期中/期末等考试显示到 Canvas 日历上。
 * Canvas 日历是 FullCalendar 3.x，运行时渲染、内部 API 拿不到，所以走 DOM 注入：
 *   - 月视图 / 周视图全天区：每个 .fc-row 的 .fc-content-skeleton 表格里，thead 一格一天（td[data-date]），
 *     tbody 每行是一层事件。我们在 tbody 末尾追加一行 tr.bc-cal-row，把考试条目放进对应日期的 td。
 *   - 右侧迷你日历 #minical：给有考试的日期打红点。
 *   - 议程视图是纯列表，暂不注入。
 * FullCalendar 每次翻页 / 切视图都会重建 DOM，所以用 MutationObserver 盯着容器、渲染做成幂等。 */
BC.calendar = {
  _obs: null,
  _raf: 0,
  _byDate: {},     // "YYYY-MM-DD" -> [ {cid, idx, type, title, color, course} ]
  _sig: "",        // 当前数据签名，变了才重画

  onCalendar() { return /^\/calendar/.test(location.pathname); },

  TYPE_LABEL: { midterm: "期中", final: "期末", exam: "考试", other: "其他" },

  async init(settings) {
    if (!BC.calendar.onCalendar()) { BC.calendar._stop(); return; }
    await BC.calendar._load(settings);
    if (!BC.calendar._obs) {
      BC.calendar._obs = new MutationObserver(() => BC.calendar._schedule());
      BC.calendar._obs.observe(document.body, { childList: true, subtree: true });
    }
    BC.calendar._schedule();
  },

  // 设置里的考试改了（面板 / 右键编辑）之后调用
  async refresh() {
    if (!BC.calendar.onCalendar()) return;
    await BC.calendar._load(await BC.storage.get());
    document.querySelectorAll(".bc-cal-row").forEach(r => r.remove());
    document.querySelectorAll(".bc-has-exam").forEach(e => { e.classList.remove("bc-has-exam"); e.removeAttribute("data-bc-exams"); });
    BC.calendar._schedule();
  },

  _stop() {
    if (BC.calendar._obs) { BC.calendar._obs.disconnect(); BC.calendar._obs = null; }
  },

  async _load(settings) {
    const examDates = settings.examDates || {};
    const colors = BC.blocks.courseColors(examDates);
    let scores = {};
    try { scores = await BC.grades.fetchScores(); } catch (e) {}
    const byDate = {};
    for (const [cid, list] of Object.entries(examDates)) {
      (list || []).forEach((e, idx) => {
        if (!e.date) return;
        const s = scores[cid] || {};
        (byDate[e.date] = byDate[e.date] || []).push({
          cid, idx, type: e.type, title: e.title || "", color: colors[cid],
          course: BC.util.courseTitle(s.name || s.code || ("课程 " + cid))
        });
      });
    }
    BC.calendar._byDate = byDate;
    BC.calendar._sig = JSON.stringify(byDate);
  },

  _schedule() {
    if (BC.calendar._raf) return;
    BC.calendar._raf = requestAnimationFrame(() => {
      BC.calendar._raf = 0;
      try { BC.calendar._render(); } catch (e) { console.warn("[BC] calendar", e); }
    });
  },

  _chip(it) {
    const esc = BC.util.esc;
    const label = BC.calendar.TYPE_LABEL[it.type] || "考试";
    const a = document.createElement("a");
    a.className = "bc-cal-chip";
    a.href = "/courses/" + it.cid;
    a.style.setProperty("--bc-cc", it.color);
    a.title = `${it.course}\n${label}${it.title ? " · " + it.title : ""}\n右键编辑`;
    a.innerHTML = `<span class="bc-cal-type">${label}</span><span class="bc-cal-title">${esc(it.title || it.course)}</span>`;
    a.addEventListener("contextmenu", ev => {
      ev.preventDefault(); ev.stopPropagation();
      BC.blocks.openExamEditor(it.cid, it.idx, ev.clientX, ev.clientY);
    });
    return a;
  },

  _render() {
    const byDate = BC.calendar._byDate;
    const sig = BC.calendar._sig;

    // ---- 月视图 / 周视图全天区 ----
    document.querySelectorAll("#calendar-app .fc-day-grid .fc-row").forEach(row => {
      const table = row.querySelector(".fc-content-skeleton table");
      if (!table) return;
      const heads = [...table.querySelectorAll("thead td[data-date], thead th[data-date]")];
      if (!heads.length) return;
      const dates = heads.map(td => td.dataset.date);
      const rowSig = sig + "|" + dates.join(",");
      let tr = table.querySelector("tr.bc-cal-row");
      if (tr && tr.dataset.bcSig === rowSig) return;           // 已注入且数据没变
      if (tr) tr.remove();
      if (!dates.some(d => byDate[d])) return;                 // 这一周没有考试

      tr = document.createElement("tr");
      tr.className = "bc-cal-row";
      tr.dataset.bcSig = rowSig;
      dates.forEach(d => {
        const td = document.createElement("td");
        (byDate[d] || []).forEach(it => td.appendChild(BC.calendar._chip(it)));
        tr.appendChild(td);
      });
      let tbody = table.querySelector("tbody");
      if (!tbody) { tbody = document.createElement("tbody"); table.appendChild(tbody); }
      tbody.appendChild(tr);

      // FullCalendar 给 .fc-row 定了固定高度，内容多了会被裁掉：撑开到能放下
      const skel = row.querySelector(".fc-content-skeleton");
      if (skel && skel.offsetHeight > row.clientHeight) row.style.height = skel.offsetHeight + "px";
    });

    // ---- 迷你日历：有考试的日期打点 ----
    document.querySelectorAll("#minical [data-date]").forEach(td => {
      const list = byDate[td.dataset.date];
      if (!list) return;
      if (td.dataset.bcExams === sig) return;
      td.classList.add("bc-has-exam");
      td.dataset.bcExams = sig;
      td.title = list.map(it => `${BC.calendar.TYPE_LABEL[it.type] || "考试"} · ${it.course}${it.title ? " · " + it.title : ""}`).join("\n");
    });
  }
};
