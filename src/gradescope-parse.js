/* Gradescope 页面解析（两处共用）：
 * - gradescope.com 内容脚本（gradescope-scrape.js）直接传 document；
 * - Canvas 侧（gradescope-sync.js）把后台抓回的 HTML 用 DOMParser 解析后传进来。
 * 只做纯解析，不碰存储 / 不弹提示。 */
window.BC = window.BC || {};
BC.gradescopeParse = {
  norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); },

  // 是否登录页（未登录时 gradescope 会把课程页 302 到 /login）
  isLoginDoc(doc) {
    doc = doc || document;
    return !!doc.querySelector('input[name="session[email]"], input#session_email, form[action*="/login"]');
  },

  // 课程页作业表 → [{ name, normName, earned, possible }]
  // 锁定学生作业表（#assignments-student-table / main table.table），避免误抓上传弹窗里的表格；都没有时退到任意表格
  assignmentsFromDoc(doc) {
    doc = doc || document;
    const out = [];
    const seen = new Set();
    const table = doc.querySelector("#assignments-student-table") || doc.querySelector("main table.table");
    const rows = table ? table.querySelectorAll("tbody tr") : doc.querySelectorAll("table tr");
    rows.forEach(tr => {
      const th = tr.querySelector("th");
      if (!th) return;
      const name = (th.textContent || "").trim().replace(/\s+/g, " ");
      if (!name || /^name$/i.test(name)) return;
      const scoreEl = tr.querySelector(".submissionStatus--score");
      const m = ((scoreEl ? scoreEl.textContent : tr.textContent) || "").match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      if (!m) return;
      const nn = BC.gradescopeParse.norm(name);
      if (!nn || seen.has(nn)) return;
      seen.add(nn);
      out.push({ name, normName: nn, earned: parseFloat(m[1]), possible: parseFloat(m[2]) });
    });
    return out;
  },

  // 课程页标题（课程页 h1 通常是课号简称，courseHeader--title 是全名）
  courseTitleFromDoc(doc, fallback) {
    doc = doc || document;
    const el = doc.querySelector("h1, .courseHeader--title, .courseDashboard--title");
    const t = el ? (el.textContent || "").trim().replace(/\s+/g, " ") : "";
    return t || fallback || "";
  }
};
