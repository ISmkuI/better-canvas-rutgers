/* 运行在 Canvas：打开某门课 Grades 页时，把 Gradescope 的分数
 * 填入「没有分数」的作业的 what-if(预估分数)；已有分数的不动。
 * 数据来源：先让后台（background.js bc-gs-fetch）带 cookie 抓 gradescope.com 的课程页（用户在 gradescope.com 登录一次并勾选
 * Remember me 后，后台每 6 小时访问一次维持会话）；后台说未登录时退回用户自己浏览 gradescope.com 时抓到的旧数据。
 * 设置：gradescope.enabled（关 = 不显示按钮也不同步）、gradescope.autoSync（关 = 只保留手动按钮）。 */
BC.i18n.add({
  "Gradescope 未登录，无法同步成绩。请在 {url} 登录一次并勾选 Remember me，之后扩展会在后台保持登录并自动抓取。":
    "Not logged in to Gradescope, so grades can't be synced. Log in once at {url} with \"Remember me\" checked; the extension will then keep the session alive and fetch in the background.",
  "Gradescope 会话已失效，本次用的是上次抓到的旧数据。请在 {url} 重新登录并勾选 Remember me。":
    "The Gradescope session has expired; using previously fetched data. Log in again at {url} with \"Remember me\" checked.",
  "正在从 Gradescope 抓取成绩…": "Fetching grades from Gradescope…",
  "没有可匹配的 Gradescope 成绩。请确认已在 Gradescope 打开过对应课程页。": "No matching Gradescope grades. Make sure you've opened the corresponding course page on Gradescope.",
  "已从 Gradescope 同步 {n} 个预估分数": "Synced {n} what-if scores from Gradescope",
  "（{n} 个已有分数未改动）": " ({n} already had scores and were left unchanged)",
  "匹配到 {n} 个作业，但都已有分数，未改动。": "Matched {n} assignments, but all already have scores; nothing changed.",
  "未匹配到可同步的作业。": "No assignments matched for syncing.",
  "🔄 从 Gradescope 同步预估分数": "🔄 Sync what-if scores from Gradescope"
});

BC.gradescope = {
  KEY: "bc_gradescope",
  TOAST_KEY: "bc_gs_toast_at",          // 上次自动同步弹「未登录」提示的时间（24 小时最多一次）
  TOAST_EVERY: 24 * 60 * 60 * 1000,
  LOGIN_URL: "https://www.gradescope.com/login",
  norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); },
  onGradesPage() { return /^\/courses\/\d+\/grades/.test(location.pathname); },
  getData() { return new Promise(r => chrome.storage.local.get(BC.gradescope.KEY, d => r(d[BC.gradescope.KEY] || null))); },
  setData(v) { return new Promise(r => chrome.storage.local.set({ [BC.gradescope.KEY]: v }, r)); },
  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },

  async maybeSync() {
    if (!BC.gradescope.onGradesPage()) return;
    let g = {};
    try { g = (await BC.storage.get()).gradescope || {}; } catch (e) {}
    if (g.enabled === false) return;
    BC.gradescope._injectButton();
    if (g.autoSync === false) return;
    if (!document.getElementById("bc-gs-auto")) {
      const flag = document.createElement("div");
      flag.id = "bc-gs-auto"; flag.style.display = "none";
      document.body.appendChild(flag);
      BC.gradescope.sync(false);
    }
  },

  async sync(manual) {
    if (manual) BC.toast(BC.t("正在从 Gradescope 抓取成绩…"), { type: "info", duration: 2500 });
    const { data, loggedIn } = await BC.gradescope.refresh(manual);
    const hasCourses = !!(data && data.courses && Object.keys(data.courses).length);
    if (loggedIn === false) {
      // 未登录：有旧数据就静默用旧数据（手动时提醒一下已过期）；没有旧数据就提示登录（自动同步 24 小时最多一次）
      if (!hasCourses) { await BC.gradescope._loginToast(manual, false); return; }
      if (manual) await BC.gradescope._loginToast(true, true);
    } else if (!hasCourses) {
      if (manual) BC.toast(BC.t("没有可匹配的 Gradescope 成绩。请确认已在 Gradescope 打开过对应课程页。"), { type: "error" });
      return;
    }
    const map = BC.gradescope._buildMap(data);
    if (!Object.keys(map).length) {
      if (manual) BC.toast(BC.t("没有可匹配的 Gradescope 成绩。请确认已在 Gradescope 打开过对应课程页。"), { type: "error" });
      return;   // 自动同步时没匹配到不算错误，静默
    }
    await BC.gradescope._fill(map, manual);
  },

  /* 向后台要最新数据并合并进 bc_gradescope；返回 { data, loggedIn }。
   * loggedIn: true = 后台抓到了；false = 后台说未登录；null = 后台没回应/出错（用旧数据，不改登录状态）。 */
  async refresh(force) {
    const data = (await BC.gradescope.getData()) || { loggedIn: false, courses: {}, updatedAt: 0 };
    data.courses = data.courses || {};
    let res = null;
    try {
      res = await chrome.runtime.sendMessage({ type: "bc-gs-fetch", courseHint: BC.gradescope._canvasCourseName(), force: !!force });
    } catch (e) { res = null; }
    if (!res || !res.ok) return { data, loggedIn: null };
    if (!res.loggedIn) {
      data.loggedIn = false; data.updatedAt = Date.now();
      await BC.gradescope.setData(data);
      return { data, loggedIn: false };
    }
    const parser = new DOMParser();
    (res.courses || []).forEach(c => {
      if (!c || !c.id) return;
      const doc = parser.parseFromString(c.html || "", "text/html");
      const assignments = BC.gradescopeParse.assignmentsFromDoc(doc);
      if (!assignments.length) return;   // 抓不到学生作业表（比如教师端课程页）：保留之前的记录
      const title = [c.shortname, c.name].filter(Boolean).join(" ").trim()
        || BC.gradescopeParse.courseTitleFromDoc(doc, "Course " + c.id);
      data.courses[c.id] = {
        id: String(c.id), name: title, shortname: c.shortname || "", termHint: c.termHint || "",
        scrapedAt: Date.now(), assignments
      };
    });
    data.loggedIn = true; data.updatedAt = Date.now(); data.lastFetch = Date.now();
    await BC.gradescope.setData(data);
    return { data, loggedIn: true };
  },

  // 「未登录」提示：手动同步总是弹；自动同步 24 小时最多一次（时间记在 chrome.storage.local.bc_gs_toast_at）
  async _loginToast(manual, stale) {
    if (!manual) {
      const last = (await new Promise(r => chrome.storage.local.get(BC.gradescope.TOAST_KEY, r)))[BC.gradescope.TOAST_KEY] || 0;
      if (Date.now() - last < BC.gradescope.TOAST_EVERY) return;
      await new Promise(r => chrome.storage.local.set({ [BC.gradescope.TOAST_KEY]: Date.now() }, r));
    }
    const key = stale
      ? "Gradescope 会话已失效，本次用的是上次抓到的旧数据。请在 {url} 重新登录并勾选 Remember me。"
      : "Gradescope 未登录，无法同步成绩。请在 {url} 登录一次并勾选 Remember me，之后扩展会在后台保持登录并自动抓取。";
    BC.toast(BC.t(key, { url: BC.gradescope.LOGIN_URL }), { type: "error", duration: 9000 });
  },

  /* 选出与当前 Canvas 课程最匹配的 gs 课程（按课号数字 / 长词命中数打分）。
   * 只有一门课时直接用它；多门课且都不匹配时返回空表——不再把所有课的作业混在一起，避免同名作业（Homework 1）串课填错分。 */
  _buildMap(data) {
    const courses = Object.values(data.courses || {}).filter(c => c && Array.isArray(c.assignments));
    const canvasName = BC.gradescope._canvasCourseName();
    let chosen = null;
    if (canvasName && courses.length) {
      const cn = BC.gradescope.norm(canvasName);
      const codes = [...new Set(cn.match(/\d{3,}/g) || [])].filter(c => !/^(19|20)\d\d$/.test(c));   // 年份不算课号
      const toks = [...new Set(cn.split(" ").filter(w => w.length >= 4 && !/^\d+$/.test(w)))];
      let best = 0;
      courses.forEach(c => {
        const gn = BC.gradescope.norm([c.shortname, c.name].filter(Boolean).join(" "));
        if (!gn) return;
        const score = codes.filter(code => gn.includes(code)).length * 2 + toks.filter(t => gn.includes(t)).length;
        if (score > best) { best = score; chosen = c; }
      });
    }
    const src = chosen ? [chosen] : (courses.length === 1 ? courses : []);
    const map = {};
    src.forEach(c => c.assignments.forEach(a => { if (a && a.normName) map[a.normName] = a; }));
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
      BC.toast(BC.t("已从 Gradescope 同步 {n} 个预估分数", { n: filled }) + (skipped ? BC.t("（{n} 个已有分数未改动）", { n: skipped }) : ""),
        { type: "success" });
    } else if (manual) {
      BC.toast(matched ? BC.t("匹配到 {n} 个作业，但都已有分数，未改动。", { n: matched }) : BC.t("未匹配到可同步的作业。"),
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
    btn.textContent = BC.t("🔄 从 Gradescope 同步预估分数");
    btn.style.cssText =
      "margin:10px 0;padding:8px 14px;border:1px solid #1c7ed6;background:#1c7ed6;color:#fff;" +
      "border-radius:8px;cursor:pointer;font:13px system-ui,sans-serif;";
    btn.addEventListener("click", () => BC.gradescope.sync(true));
    host.parentNode.insertBefore(btn, host);
  }
};
