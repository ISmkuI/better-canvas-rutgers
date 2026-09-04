/* 运行在 gradescope.com：
 * - 抓取课程作业页里的 作业名 + 得分(Status)，存入 chrome.storage.local.bc_gradescope
 * - 记录登录状态（在登录页 = 未登录） */
(function () {
  const KEY = "bc_gradescope";
  const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const getData = () => new Promise(r =>
    chrome.storage.local.get(KEY, d => r(d[KEY] || { loggedIn: false, courses: {}, updatedAt: 0 })));
  const setData = v => new Promise(r => chrome.storage.local.set({ [KEY]: v }, r));

  const isLoginPage = () =>
    /\/login/.test(location.pathname) ||
    !!document.querySelector('form[action*="login"], input[name="session[email]"], input#session_email');

  // 抓取作业表里的 名称 + X / Y 分数（锁定学生作业表，避免误抓上传/弹窗里的表格）
  function scrape() {
    const out = [];
    const seen = new Set();
    const table = document.querySelector("#assignments-student-table") || document.querySelector("main table.table");
    const rows = table ? table.querySelectorAll("tbody tr") : document.querySelectorAll("table tr");
    rows.forEach(tr => {
      const th = tr.querySelector("th");
      if (!th) return;
      const name = th.textContent.trim().replace(/\s+/g, " ");
      if (!name || /^name$/i.test(name)) return;
      const scoreEl = tr.querySelector(".submissionStatus--score");
      const m = (scoreEl ? scoreEl.textContent : tr.textContent).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      if (!m) return;
      const nn = norm(name);
      if (seen.has(nn)) return;
      seen.add(nn);
      out.push({ name, normName: nn, earned: parseFloat(m[1]), possible: parseFloat(m[2]) });
    });
    return out;
  }

  async function run() {
    if (isLoginPage()) {
      const data = await getData();
      data.loggedIn = false; data.updatedAt = Date.now();
      await setData(data);
      return;
    }
    const data = await getData();
    data.loggedIn = true; data.updatedAt = Date.now();
    data.courses = data.courses || {};

    const m = location.pathname.match(/^\/courses\/(\d+)\/?$/);
    if (m) {
      const gsId = m[1];
      const assignments = scrape();
      if (assignments.length) {
        const title = (document.querySelector("h1, .courseHeader--title, .courseDashboard--title") || {})
          .textContent || ("Course " + gsId);
        data.courses[gsId] = {
          id: gsId, name: title.trim().replace(/\s+/g, " "),
          scrapedAt: Date.now(), assignments
        };
        await setData(data);
        BC.toast(`Gradescope：已记录「${data.courses[gsId].name}」${assignments.length} 个成绩`, { type: "success" });
        return;
      }
    }
    await setData(data);
  }

  // 表格可能异步渲染：加载即跑 + 短暂重试
  run();
  let tries = 0;
  const iv = setInterval(() => {
    tries++;
    if (location.pathname.match(/^\/courses\/(\d+)\/?$/) && scrape().length) { run(); clearInterval(iv); }
    if (tries > 6) clearInterval(iv);
  }, 1000);
})();
