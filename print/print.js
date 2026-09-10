/* 打印页：从 IndexedDB（后台逐节写入，见 reader-export.js / reader-db.js）逐节读出正文 HTML + 提取到的 CSS 装进 DOM，
 * 等图片和字体就绪后唤起 window.print()，用户选「另存为 PDF」。打印过后删掉这次导出的数据。
 * 不经 runtime 消息取数据：单条消息上限 64MiB，整本书带内联图片会超。
 * 界面文案走 BC.i18n（print.html 先加载 ../src/i18n.js）：静态文本用 data-i18n 标记，动态文本用 BC.t。 */
BC.i18n.add({
  "导出 PDF · PotatoCanvas": "Export PDF · PotatoCanvas",
  "正在装载…": "Loading…",
  "每节另起一页": "Page break between sections",
  "🖨 打印 / 另存为 PDF": "🖨 Print / Save as PDF",
  "出错": "Error",
  "读取导出数据失败：{err}": "Failed to read export data: {err}",
  "导出数据已过期或已被清理，请回到阅读器重新导出": "Export data has expired or been cleared; go back to the reader and export again",
  "导出": "Export",
  "装载第 {i} / {n} 节…": "Loading section {i} / {n}…",
  "{n} 节 · 等待图片与字体加载…": "{n} sections · waiting for images and fonts…",
  "（{warn}）": " ({warn})",
  "就绪：{n} 节{warn} · 打印对话框里选「另存为 PDF」": "Ready: {n} sections{warn} · choose \"Save as PDF\" in the print dialog"
});
// 静态文本按 data-i18n 翻译（中文原文就是元素内容，所以 zh 什么都不用做）
function applyI18n() {
  document.documentElement.lang = BC.i18n.lang;
  if (BC.i18n.lang !== "en") return;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = BC.t(el.dataset.i18n); });
}
(async () => {
  await BC.i18n.init().catch(() => {});
  applyI18n();
  const id = location.hash.slice(1);
  const status = document.getElementById("bc-status");
  const btn = document.getElementById("bc-print");
  const root = document.getElementById("bc-root");
  const brk = document.getElementById("bc-break");
  const fail = msg => { status.textContent = BC.t("出错"); root.innerHTML = `<div id="bc-err">${String(msg).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</div>`; };

  let doc = null;
  try { doc = await ReaderDB.getDoc(id); } catch (e) { return fail(BC.t("读取导出数据失败：{err}", { err: e.message })); }
  if (!doc) return fail(BC.t("导出数据已过期或已被清理，请回到阅读器重新导出"));
  document.title = (doc.title || BC.t("导出")) + " · PDF";

  const esc = s => String(s || "").replace(/"/g, "&quot;");
  const seen = new Set();
  const style = document.createElement("style");
  document.head.appendChild(style);
  const secEls = [], metas = [];
  for (let i = 0; i < doc.count; i++) {
    status.textContent = BC.t("装载第 {i} / {n} 节…", { i: i + 1, n: doc.count });
    let s = null;
    try { s = await ReaderDB.getSection(id, i); } catch (e) {}
    if (!s) { secEls.push(null); metas.push({ url: "", anchors: { ids: [], heads: [] } }); continue; }
    if (s.css && !seen.has(s.css)) { seen.add(s.css); style.textContent += s.css + "\n\n"; }   // 各节 CSS 去重后合并
    const sec = document.createElement("section");
    sec.className = "bc-sec"; sec.id = "bc-s" + i;
    sec.innerHTML = `<div class="bc-html ${esc(s.htmlClass)}"><div class="bc-body ${esc(s.bodyClass)}"${s.bodyId ? ` id="${esc(s.bodyId)}"` : ""}>${s.html || ""}</div></div>`;
    root.appendChild(sec);
    secEls.push(sec); metas.push({ url: s.url || "", anchors: s.anchors || { ids: [], heads: [] } });
  }
  // 书内链接 → 文内锚点（目录条目、交叉引用点了跳到对应位置，而不是跳回阅读网）；各节 id 加前缀避免撞车
  try {
    const idx = ReaderLinks.index(metas);
    secEls.forEach((el, i) => { if (el) ReaderLinks.rewriteDom(idx, i, el); });
  } catch (e) { console.warn("[BC] relink", e); }

  brk.onchange = () => document.body.classList.toggle("bc-nobreak", !brk.checked);
  btn.onclick = () => window.print();
  window.addEventListener("afterprint", () => { ReaderDB.remove(id).catch(() => {}); });

  status.textContent = BC.t("{n} 节 · 等待图片与字体加载…", { n: doc.count });
  const imgs = [...root.querySelectorAll("img")];
  const wait = Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
  await Promise.race([wait, new Promise(r => setTimeout(r, 20000))]);
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 5000))]); } catch (e) {}
  await new Promise(r => setTimeout(r, 400));

  status.textContent = BC.t("就绪：{n} 节{warn} · 打印对话框里选「另存为 PDF」", { n: doc.count, warn: doc.warn ? BC.t("（{warn}）", { warn: doc.warn }) : "" });
  btn.disabled = false;
  window.print();
})();
