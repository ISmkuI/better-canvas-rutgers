/* 运行在 Canvas：打开某门课 Grades 页时，把 Gradescope 抓到的分数
 * 填入「没有分数」的作业的 what-if(预估分数)；已有分数的不动。 */
BC.gradescope = {
  KEY: "bc_gradescope",
  norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); },
  onGradesPage() { return /^\/courses\/\d+\/grades/.test(location.pathname); },
  getData() { return new Promise(r => chrome.storage.local.get(BC.gradescope.KEY, d => r(d[BC.gradescope.KEY] || null))); },
  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },

  async maybeSync() {
    if (!BC.gradescope.onGradesPage()) return;
    BC.gradescope._injectButton();
    if (!document.getElementById("bc-gs-auto")) {
      const flag = document.createElement("div");
      flag.id = "bc-gs-auto"; flag.style.display = "none";
      document.body.appendChild(flag);
      BC.gradescope.sync(false);
    }
  },

  async sync(manual) {
    const data = await BC.gradescope.getData();
    if (!data || data.loggedIn === false || !data.courses || !Object.keys(data.courses).length) {
      BC.toast("Gradescope 未登录，无法同步 Gradescope 的成绩进 Grades。请先在 gradescope.com 登录并打开课程页。",
        { type: "error", duration: 7000 });
      return;
    }
    const map = BC.gradescope._buildMap(data);
    if (!Object.keys(map).length) {
      if (manual) BC.toast("没有可匹配的 Gradescope 成绩。请确认已在 Gradescope 打开过对应课程页。", { type: "error" });
      return;
    }
    await BC.gradescope._fill(map, manual);
  },

  // 选出与当前 Canvas 课程最匹配的 gs 课程；选不到就合并全部
  _buildMap(data) {
    const courses = Object.values(data.courses);
    const canvasName = BC.gradescope._canvasCourseName();
    let chosen = null;
    if (canvasName) {
      const cn = BC.gradescope.norm(canvasName);
      const codes = cn.match(/\d{3,}/g) || [];
      const toks = cn.split(" ").filter(w => w.length >= 4);
      chosen = courses.find(c => {
        const gn = BC.gradescope.norm(c.name);
        if (!gn) return false;
        return codes.some(code => gn.includes(code)) || toks.some(t => gn.includes(t));
      });
    }
    const src = chosen ? [chosen] : courses;
    const map = {};
    src.forEach(c => c.assignments.forEach(a => { map[a.normName] = a; }));
    return map;
  },

  _canvasCourseName() {
    // 收集多处课程名（面包屑课程链接 + 标题里的课程全名）以提高匹配命中率
    const parts = [];
    document.querySelectorAll("#breadcrumbs a").forEach(a => {
      if (/\/courses\/\d+$/.test(a.getAttribute("href") || "")) {
        const e = a.querySelector(".ellipsible");
        parts.push((e ? e.textContent : a.textContent).trim());
      }
    });
    const t = document.title.match(/Grades for [^:]*:\s*(.+)$/i);
    if (t) parts.push(t[1].trim());
    return parts.join(" ");
  },

  _hasScore(row) {
    const g = row.querySelector(".assignment_score .grade, .assignment_score .score, .grade");
    if (!g) return false;
    // 取纯文本，存在数字即认为已有分数（已评分或已填过 what-if）
    return /\d/.test((g.textContent || "").replace(/[^\d.]/g, ""));
  },

  async _fill(map, manual) {
    const rows = document.querySelectorAll("#grades_summary tr.student_assignment, tr.student_assignment");
    let filled = 0, skipped = 0, matched = 0;
    for (const row of rows) {
      const nameEl = row.querySelector(".title a, th.title a, .title");
      if (!nameEl) continue;
      const nn = BC.gradescope.norm(nameEl.textContent);
      let a = map[nn];
      if (!a) {
        const k = Object.keys(map).find(k => k && (k.includes(nn) || nn.includes(k)) && Math.abs(k.length - nn.length) <= 6);
        if (k) a = map[k];
      }
      if (!a) continue;
      matched++;
      if (BC.gradescope._hasScore(row)) { skipped++; continue; }
      if (await BC.gradescope._setWhatIf(row, a.earned)) { filled++; await BC.gradescope._delay(140); }
    }
    if (filled) {
      BC.toast(`已从 Gradescope 同步 ${filled} 个预估分数` + (skipped ? `（${skipped} 个已有分数未改动）` : ""),
        { type: "success" });
    } else if (manual) {
      BC.toast(matched ? `匹配到 ${matched} 个作业，但都已有分数，未改动。` : "未匹配到可同步的作业。",
        { type: "info" });
    }
  },

  // 触发 Canvas 原生 what-if 编辑：点开分数 -> 填值 -> 回车/失焦提交
  async _setWhatIf(row, value) {
    const cell = row.querySelector(".assignment_score");
    if (!cell) return false;
    const grade = cell.querySelector(".grade");
    if (!grade) return false;
    grade.click(); // Canvas 用委托事件监听 .grade 点击，原生 click 会冒泡触发
    await BC.gradescope._delay(60);
    const input = cell.querySelector('input.grade, input.score, input[type="text"], input[type="number"]')
      || cell.querySelector("input");
    if (!input) return false;
    input.focus();
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    // 构造带 keyCode/which 的 Enter（KeyboardEvent 构造器会忽略这两个，需手动定义）
    const enter = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" });
    Object.defineProperty(enter, "keyCode", { get: () => 13 });
    Object.defineProperty(enter, "which", { get: () => 13 });
    input.dispatchEvent(enter);
    await BC.gradescope._delay(20);
    input.blur(); // Canvas 在 blur 时也会重新计算 what-if，作为兜底提交
    return true;
  },

  _injectButton() {
    if (document.getElementById("bc-gs-btn")) return;
    const host = document.querySelector("#grades_summary") || document.querySelector("#content");
    if (!host) return;
    const btn = document.createElement("button");
    btn.id = "bc-gs-btn";
    btn.textContent = "🔄 从 Gradescope 同步预估分数";
    btn.style.cssText =
      "margin:10px 0;padding:8px 14px;border:1px solid #1c7ed6;background:#1c7ed6;color:#fff;" +
      "border-radius:8px;cursor:pointer;font:13px system-ui,sans-serif;";
    btn.addEventListener("click", () => BC.gradescope.sync(true));
    host.parentNode.insertBefore(btn, host);
  }
};
