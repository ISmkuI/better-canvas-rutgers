/* 阅读器导出：把书内链接改成导出文件内部的跳转。
 * 提取时每一节记下 anchors = { ids:[元素 id…], heads:[{ text, id, level }…] }（见 reader-export.js extract）。
 * 合并时对每个 <a href>：
 *   1) "#frag"                    → 本节里的 frag
 *   2) "…/ch02.xhtml#frag"        → 哪一节有 id=frag 就跳哪一节（EPUB 的 id 全书基本唯一）
 *   3) "…/ch02.xhtml"（无锚点）    → 文件名和某一节的文档地址对得上就跳那一节（各节地址都一样的阅读器不适用，自动跳过）
 *   4) 链接文字 = 某一节的标题      → 跳那一节（目录页就是这种：条目文字和章节标题一样）
 * 都对不上的（外部网址）保持原样。
 * 后台（Markdown）和打印页（PDF）共用：background.js importScripts，print.html <script>。 */
const ReaderLinks = {
  norm(t) {
    return String(t || "").toLowerCase().replace(/^\s*(chapter|part|section|unit|appendix|module|lesson|第)\s*/u, "")
      .replace(/[^\p{L}\p{N}]+/gu, "");
  },
  normNoDigits(t) { return this.norm(t).replace(/\p{N}+/gu, ""); },
  fileOf(url) {
    try { const p = new URL(String(url), "https://x/").pathname; return decodeURIComponent(p.split("/").pop() || "").toLowerCase(); } catch (e) { return ""; }
  },
  // GitHub 风格的标题锚点（Markdown 用）
  slug(text, used) {
    let s = String(text || "").toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
    if (!s) s = "section";
    if (used) { let k = s, n = 1; while (used.has(k)) k = s + "-" + (n++); used.add(k); s = k; }
    return s;
  },
  // 建索引。sections[i] 至少要有 url 和 anchors
  index(sections) {
    const idToSec = new Map(), fileCount = new Map(), fileToSec = new Map(), headKey = new Map(), headKey2 = new Map();
    const usedSlugs = new Set(), slugs = [];   // slugs[i] = Map(headText -> slug)，Markdown 用
    sections.forEach((s, i) => {
      const a = s.anchors || {};
      (a.ids || []).forEach(id => { if (id && !idToSec.has(id)) idToSec.set(id, i); });
      const f = this.fileOf(s.url);
      if (f) { fileCount.set(f, (fileCount.get(f) || 0) + 1); if (!fileToSec.has(f)) fileToSec.set(f, i); }
      const m = new Map();
      (a.heads || []).forEach(h => {
        const k = this.norm(h.text), k2 = this.normNoDigits(h.text);
        if (k.length >= 3 && !headKey.has(k)) headKey.set(k, { i, id: h.id || "" });
        if (k2.length >= 6 && !headKey2.has(k2)) headKey2.set(k2, { i, id: h.id || "" });
        if (!m.has(h.text)) m.set(h.text, this.slug(h.text, usedSlugs));
      });
      slugs.push(m);
    });
    for (const [f, n] of fileCount) if (n > 1) fileToSec.delete(f);   // 各节地址相同（同一个 wrapper.html）时文件名没有区分度
    return { idToSec, fileToSec, headKey, headKey2, slugs, sections };
  },
  // 返回 { i, id } 或 null。i = 目标节，id = 目标元素 id（空 = 节开头）
  resolve(idx, i, href, text) {
    href = String(href || "").trim();
    if (!href || /^(javascript:|mailto:|tel:|data:)/i.test(href)) return null;
    if (href.startsWith("#")) {
      const id = decodeURIComponent(href.slice(1));
      if (idx.idToSec.has(id)) return { i: idx.idToSec.get(id), id };
      return null;
    }
    let u = null; try { u = new URL(href, "https://x/"); } catch (e) { return null; }
    const frag = u.hash ? decodeURIComponent(u.hash.slice(1)) : "";
    if (frag && idx.idToSec.has(frag)) return { i: idx.idToSec.get(frag), id: frag };
    const f = this.fileOf(href);
    if (f && idx.fileToSec.has(f)) return { i: idx.fileToSec.get(f), id: "" };
    const k = this.norm(text), k2 = this.normNoDigits(text);
    if (k.length >= 3 && idx.headKey.has(k)) return idx.headKey.get(k);
    if (k2.length >= 6 && idx.headKey2.has(k2)) return idx.headKey2.get(k2);
    return null;
  },
  // Markdown：把 [文字](地址) 改成 [文字](#锚点)。每一节开头由 buildMarkdown 放一个 <a id="bc-s{i}"></a>
  rewriteMarkdown(idx, i, md) {
    return String(md || "").replace(/(^|[^!])\[([^\]\n]+)\]\(([^)\s]+)\)/g, (m, pre, text, href) => {
      const r = this.resolve(idx, i, href, text);
      if (!r) return m;
      let anchor = "bc-s" + r.i;
      if (r.id) {
        const sec = idx.sections[r.i], h = ((sec.anchors || {}).heads || []).find(x => x.id === r.id);
        if (h && idx.slugs[r.i].has(h.text)) anchor = idx.slugs[r.i].get(h.text);
      }
      return `${pre}[${text}](#${anchor})`;
    });
  },
  // 打印页：sectionEl 是第 i 节的容器。先给节内所有 id 加前缀避免各节撞车，再改写链接
  rewriteDom(idx, i, sectionEl) {
    const pre = "bc-s" + i + "-";
    sectionEl.querySelectorAll("[id]").forEach(el => { el.id = pre + el.id; });
    sectionEl.querySelectorAll("a[name]").forEach(el => { if (!el.id) el.id = pre + el.getAttribute("name"); });
    sectionEl.querySelectorAll("a[href]").forEach(a => {
      const r = this.resolve(idx, i, a.getAttribute("href"), a.textContent);
      if (!r) return;
      a.setAttribute("href", "#" + (r.id ? "bc-s" + r.i + "-" + r.id : "bc-s" + r.i));
      a.removeAttribute("target");
    });
  }
};
