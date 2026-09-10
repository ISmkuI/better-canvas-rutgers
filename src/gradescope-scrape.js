/* 运行在 gradescope.com（用户自己浏览时的页内抓取；后台定时抓取见 background.js 的 bc-gs-fetch）：
 * - 抓取课程作业页里的 作业名 + 得分(Status)，存入 chrome.storage.local.bc_gradescope
 * - 记录登录状态（在登录页 = 未登录；其它页面 = 已登录）
 * 解析逻辑在 gradescope-parse.js（与 Canvas 侧共用）。 */
BC.i18n.add({
  "Gradescope：已记录「{name}」{n} 个成绩": "Gradescope: recorded {n} grades for \"{name}\""
});

(function () {
  const KEY = "bc_gradescope";
  const P = BC.gradescopeParse;
  const getData = () => new Promise(r =>
    chrome.storage.local.get(KEY, d => r(d[KEY] || { loggedIn: false, courses: {}, updatedAt: 0 })));
  const setData = v => new Promise(r => chrome.storage.local.set({ [KEY]: v }, r));

  const isLoginPage = () => /\/login/.test(location.pathname) || P.isLoginDoc(document);
  const courseId = () => { const m = location.pathname.match(/^\/courses\/(\d+)\/?$/); return m ? m[1] : ""; };

  async function run() {
    const data = await getData();
    data.courses = data.courses || {};
    if (isLoginPage()) {
      data.loggedIn = false; data.updatedAt = Date.now();
      await setData(data);
      return;
    }
    data.loggedIn = true; data.updatedAt = Date.now();

    const gsId = courseId();
    if (gsId) {
      const assignments = P.assignmentsFromDoc(document);
      if (assignments.length) {
        const prev = data.courses[gsId] || {};
        data.courses[gsId] = {
          id: gsId,
          name: P.courseTitleFromDoc(document, "Course " + gsId),
          shortname: prev.shortname || "", termHint: prev.termHint || "",
          scrapedAt: Date.now(), assignments
        };
        await setData(data);
        BC.toast(BC.t("Gradescope：已记录「{name}」{n} 个成绩", { name: data.courses[gsId].name, n: assignments.length }), { type: "success" });
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
    if (courseId() && P.assignmentsFromDoc(document).length) { run(); clearInterval(iv); }
    if (tries > 6) clearInterval(iv);
  }, 1000);
})();
