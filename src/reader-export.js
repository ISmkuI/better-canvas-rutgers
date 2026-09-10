/* 阅读器导出（Pearson eText / Revel / EPUB 网页阅读器 → PDF / Markdown）
 *
 * 两部分：
 *   1) bcReaderPage(cmd, opts) —— 会被 chrome.scripting.executeScript 序列化后注入目标 frame（MAIN world，能看到页面自己的
 *      MathJax 对象），所以它必须完全自包含：不能引用这个文件里的其它任何东西，也不能用 chrome.* API。
 *      cmd: "probe"（这个 frame 像不像正文）| "signature"（内容指纹，翻页后判断是否换页）| "extract"（自动滚动 + 提取）| "next"（找并点「下一页」）
 *      opts.via: "self" 直接用本 frame 的 document；"wrapper" 穿透 mosaic-book 的 shadow DOM / 同源 iframe 找真正的正文文档（降级探测）
 *   2) ReaderExport —— 后台任务：枚举 frame → 打分定位正文 → 循环「滚动加载 → 提取 → 翻页 → 等新内容」→ 合并 → 打开打印页 / 下载 .md
 * background.js 用 importScripts 加载本文件（在 i18n.js 之后：下面的词条登记和 ReaderExport 里的提示文案都靠 BC.t）。
 * bcReaderPage 里没有面向用户的文案（只有注释和「下一页」按钮的匹配正则），所以注入函数不用带语言参数。 */

BC.i18n.add({
  "#{id} {url} 注入失败：{err}": "#{id} {url} injection failed: {err}",
  "#{id} {url} 无结果": "#{id} {url} no result",
  "#{id} {url} 字数 {n}{shell}": "#{id} {url} chars {n}{shell}",
  "｜内层 字数 {n}{shell}": " | inner chars {n}{shell}",
  "外壳": "shell",
  "第 {n} 节图片太大没能落盘，改用原链接（{err}）": "Section {n}: images too large to store, using original links instead ({err})",
  "后台被浏览器回收过，接着上次的进度继续…": "Background worker was recycled by the browser; resuming from last progress…",
  "定位正文…": "Locating content…",
  "还没找到书页正文，等它加载…（{n} 个 frame）": "Content not found yet, waiting for it to load… ({n} frames)",
  "只找到阅读器外壳，书页所在的 frame 注入不了或还没加载": "only the reader shell was found; the frame holding the page could not be injected or has not loaded",
  "这个页面上没有像书页的内容": "nothing on this page looks like book content",
  "阅读器页面已经不在了：{why}。看「导出日志」里各 frame 的探测结果；注入失败多半是没授权那个域名": "The reader page is gone: {why}. See the per-frame probe results in the export log; injection failures usually mean that domain is not authorized",
  "没找到书页正文：{why}。看「导出日志」里各 frame 的探测结果；注入失败多半是没授权那个域名": "Content not found: {why}. See the per-frame probe results in the export log; injection failures usually mean that domain is not authorized",
  "第 {n} 节：滚动加载 + 提取…": "Section {n}: scrolling to load + extracting…",
  "内容出现重复，判断已到末尾": "Repeated content detected; assuming end of book",
  "提取失败（frame 可能已经跳转）": "Extraction failed (the frame may have navigated away)",
  "第 {n} 节完成": "Section {n} done",
  "已达到最多 {n} 节的上限": "Reached the limit of {n} sections",
  "第 {n} 节完成，找「下一页」…": "Section {n} done, looking for \"Next\"…",
  "下一页": "Next",
  "已点「{label}」，等待加载…": "Clicked \"{label}\", waiting for it to load…",
  "翻页后没有新内容，{s} 秒后重试（{k}/3）…": "No new content after turning the page; retrying in {s} s ({k}/3)…",
  "点了「下一页」但内容一直没有变化（重试 3 次），视为已到末尾": "Clicked \"Next\" but the content never changed (3 retries); assuming end of book",
  "「下一页」按钮消失，视为已到末尾": "The \"Next\" button disappeared; assuming end of book",
  "翻页后找不到书页正文了（等了 30 秒）": "Content not found after turning the page (waited 30 s)",
  "没有提取到内容": "No content was extracted",
  "第 {next} 节出错，只导出前 {n} 节：{err}": "Section {next} failed; exporting only the first {n} sections: {err}",
  "已下载 Markdown（{n} 节）": "Markdown downloaded ({n} sections)",
  "已打开打印页（{n} 节）": "Print page opened ({n} sections)",
  "> 来源：{url}  ": "> Source: {url}  ",
  "> 导出时间：{time}  ·  {n} 节": "> Exported: {time}  ·  {n} sections",
  "第 {n} 节": "Section {n}",
  "后台被回收后没能继续（超时）": "Could not resume after the background worker was recycled (timed out)"
});

function bcReaderPage(cmd, opts) {
  opts = opts || {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- 文档定位 ---------- */
  function deepAll(root, sel, out) {           // querySelectorAll，连 open shadow DOM 一起找
    out = out || [];
    try { root.querySelectorAll(sel).forEach(e => out.push(e)); } catch (e) {}
    try { root.querySelectorAll("*").forEach(e => { if (e.shadowRoot) deepAll(e.shadowRoot, sel, out); }); } catch (e) {}
    return out;
  }
  function docText(d) { try { return (d.body && d.body.innerText) || ""; } catch (e) { return ""; } }
  function resolveWrapper() {                  // 外层探测：mosaic-book → shadowRoot → iframe.favre；否则挑正文最长的同源 iframe
    try {
      const mb = document.querySelector("mosaic-book");
      const sr = mb && mb.shadowRoot;
      const f = sr && (sr.querySelector("iframe.favre") || sr.querySelector("iframe"));
      if (f && f.contentDocument && f.contentDocument.body) return f.contentDocument;
    } catch (e) {}
    let best = null, bestLen = 0;
    for (const f of deepAll(document, "iframe")) {
      try {
        const d = f.contentDocument;
        if (!d || !d.body) continue;
        const n = docText(d).length;
        if (n > bestLen) { best = d; bestLen = n; }
      } catch (e) {}
    }
    return best;
  }
  function getDoc() {
    if (opts.via === "wrapper") { const d = resolveWrapper(); if (d) return d; }
    return document;
  }

  /* ---------- 探测 / 指纹 ---------- */
  function probe(d) {
    const q = s => { try { return d.querySelectorAll(s).length; } catch (e) { return 0; } };
    const text = docText(d);
    return {
      href: d.location.href, title: d.title || "", textLen: text.length,
      paras: q("p"), imgs: q("img"),
      math: q("mjx-container, .MathJax, .katex, math, script[type^='math/']"),
      epub: q("[epub\\:type], section[role=doc-chapter], [class*=epub], [id*=epub], body.epub, .chapter, .section") ,
      // 像阅读器外壳：装着 mosaic-book，或者有一个占了大块视口的 iframe（正文在它里面），或者一堆按钮
      shell: q("mosaic-book") > 0 || bigIframe(d) || q("button") > 40
    };
  }
  function bigIframe(d) {
    try {
      const win = d.defaultView, area = Math.max(1, win.innerWidth * win.innerHeight);
      return deepAll(d, "iframe").some(f => { const r = f.getBoundingClientRect(); return r.width * r.height > area * 0.2; });
    } catch (e) { return false; }
  }
  function signature(d) {
    const text = docText(d).replace(/\s+/g, " ");
    const mid = Math.floor(text.length / 2);
    return { href: d.location.href, title: d.title || "", len: text.length, head: text.slice(0, 300), mid: text.slice(Math.max(0, mid - 150), mid + 150), tail: text.slice(-300) };
  }

  /* ---------- 自动滚动：把懒加载的图片和 MathJax 懒渲染（mjx-lazy）都逼出来 ---------- */
  function scrollRoot(d) {
    let best = d.scrollingElement || d.documentElement, bestH = best.scrollHeight - best.clientHeight;
    const win = d.defaultView; let n = 0;
    for (const el of d.querySelectorAll("*")) {
      if (++n > 4000) break;
      try {
        const cs = win.getComputedStyle(el);
        if (!/auto|scroll/.test(cs.overflowY)) continue;
        const h = el.scrollHeight - el.clientHeight;
        if (h > bestH + 50 && el.clientHeight > 100) { best = el; bestH = h; }
      } catch (e) {}
    }
    return best;
  }
  function pendingCount(d) {
    let n = 0;
    try { n += d.querySelectorAll("mjx-lazy").length; } catch (e) {}
    try { d.querySelectorAll("img[src]").forEach(i => { if (!i.complete) n++; }); } catch (e) {}
    return n;
  }
  async function autoScroll(d) {
    const win = d.defaultView, el = scrollRoot(d);
    const isRoot = el === d.scrollingElement || el === d.documentElement || el === d.body;
    const step = Math.max(50, +opts.scrollStep || 400), interval = Math.max(10, +opts.scrollInterval || 120);
    const t0 = Date.now(), maxMs = Math.max(5000, +opts.scrollMaxMs || 150000);
    const setY = y => { if (isRoot) win.scrollTo(0, y); else el.scrollTop = y; };
    let pos = 0;
    while (Date.now() - t0 < maxMs) {
      const maxY = el.scrollHeight - el.clientHeight;
      pos = Math.min(pos + step, Math.max(0, maxY));
      setY(pos);
      await sleep(interval);
      if (pos >= el.scrollHeight - el.clientHeight - 2) {
        let waited = 0;                                 // 到底了：还有占位符 / 没加载完的图就再等等
        while (pendingCount(d) > 0 && waited < 8000) { await sleep(250); waited += 250; }
        if (el.scrollHeight - el.clientHeight - 2 > pos) continue;   // 懒加载把页面撑长了，接着滚
        break;
      }
    }
    setY(0);
    try { const MJ = win.MathJax; if (MJ && MJ.startup && MJ.startup.promise) await Promise.race([MJ.startup.promise, sleep(5000)]); } catch (e) {}
    await sleep(300);
  }

  /* ---------- MathML → LaTeX ---------- */
  const SYM = {
    "α":"\\alpha","β":"\\beta","γ":"\\gamma","δ":"\\delta","ε":"\\varepsilon","ϵ":"\\epsilon","ζ":"\\zeta","η":"\\eta","θ":"\\theta","ϑ":"\\vartheta",
    "ι":"\\iota","κ":"\\kappa","λ":"\\lambda","μ":"\\mu","ν":"\\nu","ξ":"\\xi","π":"\\pi","ρ":"\\rho","ϱ":"\\varrho","σ":"\\sigma","ς":"\\varsigma",
    "τ":"\\tau","υ":"\\upsilon","φ":"\\varphi","ϕ":"\\phi","χ":"\\chi","ψ":"\\psi","ω":"\\omega",
    "Γ":"\\Gamma","Δ":"\\Delta","Θ":"\\Theta","Λ":"\\Lambda","Ξ":"\\Xi","Π":"\\Pi","Σ":"\\Sigma","Υ":"\\Upsilon","Φ":"\\Phi","Ψ":"\\Psi","Ω":"\\Omega",
    "×":"\\times","·":"\\cdot","⋅":"\\cdot","∗":"\\ast","−":"-","–":"-","±":"\\pm","∓":"\\mp","÷":"\\div","≤":"\\le","⩽":"\\le","≥":"\\ge","⩾":"\\ge","≠":"\\ne",
    "≈":"\\approx","≡":"\\equiv","∼":"\\sim","≃":"\\simeq","≅":"\\cong","∝":"\\propto","≪":"\\ll","≫":"\\gg",
    "→":"\\to","←":"\\leftarrow","↔":"\\leftrightarrow","⇒":"\\Rightarrow","⇐":"\\Leftarrow","⇔":"\\Leftrightarrow","↦":"\\mapsto","↑":"\\uparrow","↓":"\\downarrow",
    "∑":"\\sum","∏":"\\prod","∐":"\\coprod","∫":"\\int","∬":"\\iint","∭":"\\iiint","∮":"\\oint","∂":"\\partial","∇":"\\nabla","∞":"\\infty",
    "∈":"\\in","∉":"\\notin","∋":"\\ni","⊂":"\\subset","⊃":"\\supset","⊆":"\\subseteq","⊇":"\\supseteq","∪":"\\cup","∩":"\\cap","∅":"\\emptyset","∖":"\\setminus",
    "∀":"\\forall","∃":"\\exists","∄":"\\nexists","∧":"\\wedge","∨":"\\vee","¬":"\\neg","⊕":"\\oplus","⊗":"\\otimes","⊥":"\\perp","∥":"\\parallel","∠":"\\angle",
    "…":"\\ldots","⋯":"\\cdots","⋮":"\\vdots","⋱":"\\ddots","′":"'","″":"''","‴":"'''","∘":"\\circ","°":"^\\circ","√":"\\surd","ℏ":"\\hbar","ℓ":"\\ell",
    "ℝ":"\\mathbb{R}","ℕ":"\\mathbb{N}","ℤ":"\\mathbb{Z}","ℚ":"\\mathbb{Q}","ℂ":"\\mathbb{C}","ℙ":"\\mathbb{P}","ℵ":"\\aleph","ℜ":"\\Re","ℑ":"\\Im",
    "⟨":"\\langle","⟩":"\\rangle","‖":"\\|","∣":"|","{":"\\{","}":"\\}","∴":"\\therefore","∵":"\\because","†":"\\dagger","∠":"\\angle","⊙":"\\odot",
    "\u2061":"","\u2062":"","\u2063":",","\u2064":"","\u00a0":" ","\u200b":""
  };
  const FUNCS = /^(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|coth|log|ln|lg|exp|lim|max|min|sup|inf|det|dim|ker|deg|gcd|arg|Pr|sgn|hom|mod)$/;
  const BIGOP = /^\\(sum|prod|coprod|int|iint|iiint|oint|lim|max|min|sup|inf|bigcup|bigcap)$/;
  const VARIANT = { bold: "\\mathbf", normal: "\\mathrm", "double-struck": "\\mathbb", script: "\\mathcal", fraktur: "\\mathfrak", "sans-serif": "\\mathsf", monospace: "\\mathtt", "bold-italic": "\\boldsymbol" };
  const escText = s => s.replace(/([{}\\])/g, "\\$1");
  const fence = s => { s = (s || "").trim(); if (!s) return "."; return SYM[s] || s; };
  function mmlToTex(n) {
    if (!n) return "";
    if (n.nodeType === 3) return n.nodeValue.trim().split("").map(c => SYM[c] !== undefined ? SYM[c] : c).join("");
    if (n.nodeType !== 1) return "";
    const tag = (n.localName || n.nodeName).toLowerCase().replace(/^m:/, "");
    const kids = [...n.childNodes].filter(c => c.nodeType === 1 || (c.nodeType === 3 && c.nodeValue.trim()));
    const K = i => mmlToTex(kids[i]);
    const all = () => kids.map(mmlToTex).filter(Boolean).join(" ");
    const txt = () => (n.textContent || "").trim();
    switch (tag) {
      case "semantics": {
        const ann = kids.find(k => (k.localName || "").toLowerCase() === "annotation" && /tex/i.test(k.getAttribute("encoding") || ""));
        if (ann) return ann.textContent.trim();
        return kids.length ? K(0) : "";
      }
      case "annotation": case "annotation-xml": case "mglyph": case "mphantom": return "";
      case "math": case "mrow": case "mstyle": case "mpadded": case "maction": {
        if (kids.length === 3 && kids[1] && (kids[1].localName || "").toLowerCase() === "mtable") {
          const o = kids[0].textContent.trim(), c = kids[2].textContent.trim();
          const rows = mtableRows(kids[1]);
          if (o === "(" && c === ")") return "\\begin{pmatrix}" + rows + "\\end{pmatrix}";
          if (o === "[" && c === "]") return "\\begin{bmatrix}" + rows + "\\end{bmatrix}";
          if (o === "|" && c === "|") return "\\begin{vmatrix}" + rows + "\\end{vmatrix}";
        }
        if (kids.length === 2 && kids[0].textContent.trim() === "{" && (kids[1].localName || "").toLowerCase() === "mtable")
          return "\\begin{cases}" + mtableRows(kids[1]) + "\\end{cases}";
        return kids.length === 1 ? K(0) : all();
      }
      case "mi": {
        const t = txt(); const v = n.getAttribute("mathvariant");
        if (FUNCS.test(t)) return "\\" + t;
        if (t.length === 1 && SYM[t]) return v && VARIANT[v] && v !== "normal" ? VARIANT[v] + "{" + SYM[t] + "}" : SYM[t];
        if (v && VARIANT[v]) return VARIANT[v] + "{" + t + "}";
        if (t.length > 1 && /^[A-Za-z]+$/.test(t)) return "\\mathrm{" + t + "}";
        return t.split("").map(c => SYM[c] !== undefined ? SYM[c] : c).join("");
      }
      case "mn": return txt();
      case "mo": { const t = txt(); if (SYM[t] !== undefined) return SYM[t]; return t.split("").map(c => SYM[c] !== undefined ? SYM[c] : c).join(""); }
      case "mtext": { const t = (n.textContent || "").replace(/\s+/g, " "); return t.trim() ? "\\text{" + escText(t) + "}" : "\\ "; }
      case "mspace": return "\\,";
      case "ms": return "\\text{``" + escText(txt()) + "''}";
      case "msup": return "{" + K(0) + "}^{" + K(1) + "}";
      case "msub": return "{" + K(0) + "}_{" + K(1) + "}";
      case "msubsup": return "{" + K(0) + "}_{" + K(1) + "}^{" + K(2) + "}";
      case "mfrac": {
        const thin = n.getAttribute("linethickness");
        if (thin === "0" || thin === "0px") return "\\binom{" + K(0) + "}{" + K(1) + "}";
        return "\\frac{" + K(0) + "}{" + K(1) + "}";
      }
      case "msqrt": return "\\sqrt{" + all() + "}";
      case "mroot": return "\\sqrt[" + K(1) + "]{" + K(0) + "}";
      case "mover": {
        const base = K(0), acc = kids[1] ? kids[1].textContent.trim() : "";
        if (BIGOP.test(base)) return base + "^{" + K(1) + "}";
        if (acc === "^" || acc === "ˆ") return "\\hat{" + base + "}";
        if (acc === "¯" || acc === "‾" || acc === "_" || acc === "―" || acc === "−") return "\\overline{" + base + "}";
        if (acc === "→" || acc === "⃗") return "\\vec{" + base + "}";
        if (acc === "˙" || acc === ".") return "\\dot{" + base + "}";
        if (acc === "¨") return "\\ddot{" + base + "}";
        if (acc === "~" || acc === "˜") return "\\tilde{" + base + "}";
        if (acc === "⏞") return "\\overbrace{" + base + "}";
        return "\\overset{" + K(1) + "}{" + base + "}";
      }
      case "munder": {
        const base = K(0), acc = kids[1] ? kids[1].textContent.trim() : "";
        if (BIGOP.test(base)) return base + "_{" + K(1) + "}";
        if (acc === "_" || acc === "̲" || acc === "―") return "\\underline{" + base + "}";
        if (acc === "⏟") return "\\underbrace{" + base + "}";
        return "\\underset{" + K(1) + "}{" + base + "}";
      }
      case "munderover": { const base = K(0); return (BIGOP.test(base) ? base : "{" + base + "}") + "_{" + K(1) + "}^{" + K(2) + "}"; }
      case "mtable": return "\\begin{matrix}" + mtableRows(n) + "\\end{matrix}";
      case "mtr": case "mlabeledtr": return kids.map(mmlToTex).join(" & ");
      case "mtd": return all();
      case "mfenced": {
        const o = n.hasAttribute("open") ? n.getAttribute("open") : "(", c = n.hasAttribute("close") ? n.getAttribute("close") : ")";
        const sep = (n.getAttribute("separators") || ",").replace(/\s/g, "") || ",";
        const inner = kids.map(mmlToTex).join(sep[0]);
        return "\\left" + fence(o) + inner + "\\right" + fence(c);
      }
      case "menclose": return "\\boxed{" + all() + "}";
      case "mmultiscripts": return all();
      default: return all();
    }
  }
  function mtableRows(t) {
    return [...t.childNodes].filter(r => /^(mtr|mlabeledtr)$/i.test(r.localName || "")).map(mmlToTex).join(" \\\\ ");
  }
  function parseMml(str) { try { return new DOMParser().parseFromString(String(str), "text/xml").documentElement; } catch (e) { return null; } }

  /* 在活 DOM 上给每个公式节点打 data-bc-tex / data-bc-display，来源按可靠度排：
   * MathJax 3 的 startup.document.math（原始 TeX）→ MathJax 2 的 <script type="math/tex"> → annotation(x-tex) → <math alttext> → MathML 结构反推 */
  function tagTex(d, marks) {
    const win = d.defaultView;
    const setTex = (el, tex, disp) => { if (!el || !tex) return; el.setAttribute("data-bc-tex", String(tex).trim()); el.setAttribute("data-bc-display", disp ? "1" : "0"); marks.push(el); };
    try {
      const MJ = win.MathJax, mdoc = MJ && MJ.startup && MJ.startup.document;
      if (mdoc && mdoc.math) for (const item of mdoc.math) {
        if (!item.typesetRoot || !item.math) continue;
        let tex = item.math;
        if (item.inputJax && /mathml/i.test(item.inputJax.name || "")) tex = mmlToTex(parseMml(item.math));
        setTex(item.typesetRoot, tex, !!item.display);
      }
    } catch (e) {}
    try {
      d.querySelectorAll('script[type^="math/tex"], script[type^="math/mml"], script[type^="math/asciimath"]').forEach(s => {
        const disp = /mode=display/.test(s.type);
        let tex = s.textContent || "";
        if (/math\/mml/.test(s.type)) tex = mmlToTex(parseMml(tex));
        const prev = s.previousElementSibling;
        const host = prev && /(^|\s)MathJax(_Display|_SVG|_CHTML)?(\s|$)/.test(prev.className || "") ? prev : s;
        if (!host.hasAttribute("data-bc-tex")) setTex(host, tex, disp);
      });
    } catch (e) {}
    try {
      d.querySelectorAll("mjx-container, .katex, math, .MathJax").forEach(el => {
        if (el.hasAttribute("data-bc-tex") || el.closest("[data-bc-tex]")) return;
        const ann = el.querySelector('annotation[encoding="application/x-tex"], annotation[encoding="TeX"], annotation[encoding="LaTeX"]');
        let tex = ann ? ann.textContent : "";
        if (!tex) { const m = el.localName === "math" ? el : el.querySelector("math"); if (m) tex = m.getAttribute("alttext") || mmlToTex(m); }
        if (!tex) return;
        const disp = el.getAttribute("display") === "true" || el.getAttribute("display") === "block" || el.classList.contains("katex-display") || el.classList.contains("MathJax_Display")
          || !!(el.parentElement && (el.parentElement.classList.contains("katex-display") || el.parentElement.classList.contains("MathJax_Display")));
        setTex(el, tex, disp);
      });
    } catch (e) {}
  }

  /* ---------- 样式收集：CSSOM 序列化（含 MathJax 动态插入的表），剔除 @media print、解开 @media screen ---------- */
  function absUrls(css, href) {
    return css.replace(/url\((['"]?)(?!data:|https?:|blob:|#|\/\/)([^'")]+)\1\)/g, (m, q, u) => { try { return "url(" + q + new URL(u, href).href + q + ")"; } catch (e) { return m; } });
  }
  const rewriteSel = sel => String(sel).replace(/(^|[\s>+~,(])(html|body)(?![\w-])/gi, "$1.bc-$2").replace(/:root/g, ".bc-html");
  const fixStyle = css => css.replace(/(?:-webkit-|-moz-)?user-select\s*:[^;]+;?/g, "").trim();
  function serializeRules(rules, href) {
    let s = "";
    for (const r of rules) {
      const t = r.type;
      if (t === 6) continue;                                  // @page：打印页自己定
      if (t === 3) { try { if (r.styleSheet && r.styleSheet.cssRules) s += serializeRules(r.styleSheet.cssRules, r.styleSheet.href || href); } catch (e) {} continue; }
      if (t === 4) {
        const m = (r.media && r.media.mediaText || "").toLowerCase();
        const isPrint = /\bprint\b/.test(m), isScreen = /\bscreen\b/.test(m) || /\ball\b/.test(m);
        if (opts.breakPrint !== false) {
          if (isPrint && !isScreen) continue;                 // 纯 print 规则：十有八九是「打印时白屏」
          if (isPrint || /^\s*(only\s+)?(screen|all)\s*$/.test(m)) { s += serializeRules(r.cssRules, href); continue; }  // 解开，打印时也按屏幕样式来
        }
        s += "@media " + r.media.mediaText + "{\n" + serializeRules(r.cssRules, href) + "}\n"; continue;
      }
      if (t === 12) { s += "@supports " + r.conditionText + "{\n" + serializeRules(r.cssRules, href) + "}\n"; continue; }
      if (t === 1) { const st = fixStyle(r.style.cssText || ""); if (st) s += rewriteSel(r.selectorText) + "{" + st + "}\n"; continue; }
      if (t === 7 || t === 5) { s += r.cssText + "\n"; continue; }   // keyframes / font-face
      try { s += r.cssText + "\n"; } catch (e) {}
    }
    return absUrls(s, href);
  }
  async function collectCss(d) {
    const out = [], seen = new Set(), base = d.baseURI;
    let sheets = [];
    try { sheets = [...d.styleSheets]; } catch (e) {}
    try { sheets.push(...(d.adoptedStyleSheets || [])); } catch (e) {}
    for (const sh of sheets) {
      let media = ""; try { media = (sh.media && sh.media.mediaText || "").toLowerCase(); } catch (e) {}
      if (opts.breakPrint !== false && /\bprint\b/.test(media) && !/\bscreen\b|\ball\b/.test(media)) continue;   // <style media="print">
      let rules = null; try { rules = sh.cssRules; } catch (e) { rules = null; }
      let text = "";
      if (rules) text = serializeRules(rules, sh.href || base);
      else if (sh.href) {                                     // 跨域表读不到 cssRules：直接拉文本
        try {
          const r = await fetch(sh.href, { credentials: "include" });
          if (r.ok) {
            text = await r.text();
            if (opts.breakPrint !== false) text = stripPrintBlocks(text);
            text = absUrls(text.replace(/(^|[\s,}])(html|body)(?=[\s.#\[:>,{])/g, "$1.bc-$2"), sh.href);
          }
        } catch (e) {}
      }
      if (!text.trim()) continue;
      const key = text.length + ":" + text.slice(0, 300) + text.slice(-300);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push("/* " + (sh.href || "inline") + " */\n" + text);
    }
    return out.join("\n\n");
  }
  function stripPrintBlocks(css) {                            // 纯文本 CSS：按大括号配平删掉 @media print{...}
    let out = "", i = 0;
    while (i < css.length) {
      const m = /@media[^{]*\bprint\b[^{]*\{/g; m.lastIndex = i;
      const hit = m.exec(css);
      if (!hit) { out += css.slice(i); break; }
      out += css.slice(i, hit.index);
      let depth = 1, j = hit.index + hit[0].length;
      while (j < css.length && depth > 0) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
      i = j;
    }
    return out;
  }

  /* ---------- 克隆后处理：URL 绝对化、图片内联 ---------- */
  function absolutize(root, base) {
    const fix = (el, attr) => { const v = el.getAttribute(attr); if (!v || /^(data:|blob:|#|javascript:)/i.test(v)) return; try { el.setAttribute(attr, new URL(v, base).href); } catch (e) {} };
    root.querySelectorAll("img[src], source[src], video[src], audio[src], embed[src], iframe[src]").forEach(el => { el.removeAttribute("loading"); fix(el, "src"); });
    root.querySelectorAll("img[data-src]").forEach(el => { if (!el.getAttribute("src")) { el.setAttribute("src", el.getAttribute("data-src")); fix(el, "src"); } });
    root.querySelectorAll("[srcset]").forEach(el => {
      const v = el.getAttribute("srcset").split(",").map(p => { const [u, dsc] = p.trim().split(/\s+/); try { return new URL(u, base).href + (dsc ? " " + dsc : ""); } catch (e) { return p; } }).join(", ");
      el.setAttribute("srcset", v);
    });
    root.querySelectorAll("a[href], link[href], area[href]").forEach(el => fix(el, "href"));
    root.querySelectorAll("image").forEach(el => { fix(el, "href"); const x = el.getAttribute("xlink:href"); if (x && !/^(data:|#)/.test(x)) { try { el.setAttribute("xlink:href", new URL(x, base).href); } catch (e) {} } });
    root.querySelectorAll("[style*='url(']").forEach(el => el.setAttribute("style", absUrls(el.getAttribute("style"), base)));
  }
  async function inlineImages(root) {
    // 单节的提取结果要经 executeScript 返回给后台，单条上限 64MiB（base64 再胀 1/3），预算留在 20MB 以内
    const PER = 6 * 1024 * 1024, TOTAL = 20 * 1024 * 1024; let used = 0;
    const els = [...root.querySelectorAll("img[src], image[href]")];
    root.querySelectorAll("picture > source").forEach(s => s.remove());
    const cache = new Map();
    const toData = async url => {
      if (cache.has(url)) return cache.get(url);
      const p = (async () => {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 15000);
        try {
          const r = await fetch(url, { credentials: "include", signal: ctl.signal });
          if (!r.ok) return "";
          const b = await r.blob();
          if (b.size > PER || used + b.size > TOTAL) return "";
          used += b.size;
          return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(""); fr.readAsDataURL(b); });
        } catch (e) { return ""; } finally { clearTimeout(tm); }
      })();
      cache.set(url, p); return p;
    };
    let idx = 0;
    const worker = async () => {
      while (idx < els.length) {
        const el = els[idx++]; const attr = el.tagName.toLowerCase() === "img" ? "src" : "href";
        const u = el.getAttribute(attr); if (!u || /^data:/.test(u)) continue;
        const data = await toData(u);
        if (data) { el.setAttribute("data-bc-orig", u); el.setAttribute(attr, data); el.removeAttribute("srcset"); el.removeAttribute("sizes"); }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }

  /* ---------- HTML → Markdown ---------- */
  const BLOCK = new Set(["p","div","section","article","main","aside","header","footer","h1","h2","h3","h4","h5","h6","ul","ol","li","blockquote","pre","hr","table","figure","figcaption","dl","dt","dd","details","summary","form","fieldset","nav","address","center","tr","tbody","thead","tfoot","caption"]);
  const escMd = s => s.replace(/([\\*_`~\[\]])/g, "\\$1");
  const hidden = el => el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true" || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(el.getAttribute("style") || "")
    || /(^|\s)(MathJax_Preview|sr-only|visually-hidden|katex-mathml|mjx-assistive-mml)(\s|$)/.test(el.className && el.className.baseVal !== undefined ? "" : (el.className || ""));
  const wrap = (m, s) => { const t = s.trim(); if (!t) return s; const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0]; return lead + m + t + m + trail; };
  function texOf(el) {
    const tex = (el.getAttribute("data-bc-tex") || "").trim();
    if (!tex) return "";
    return el.getAttribute("data-bc-display") === "1" ? "\n\n$$\n" + tex + "\n$$\n\n" : "$" + tex + "$";
  }
  function inlineNodes(nodes) {
    let out = "";
    for (const c of nodes) {
      if (c.nodeType === 3) { out += escMd(c.nodeValue.replace(/\s+/g, " ")); continue; }
      if (c.nodeType !== 1 || hidden(c)) continue;
      if (c.hasAttribute("data-bc-tex")) { out += texOf(c); continue; }
      const t = c.tagName.toLowerCase();
      if (t === "br") { out += "  \n"; continue; }
      if (t === "img") { out += "![" + (c.getAttribute("alt") || "").replace(/[\[\]]/g, "") + "](" + (c.getAttribute("src") || "") + ")"; continue; }
      if (t === "a") { const h = c.getAttribute("href"); const inner = inlineNodes(c.childNodes); out += h && inner.trim() ? "[" + inner.trim() + "](" + h + ")" : inner; continue; }
      if (t === "strong" || t === "b") { out += wrap("**", inlineNodes(c.childNodes)); continue; }
      if (t === "em" || t === "i" || t === "cite" || t === "dfn" || t === "var") { out += wrap("*", inlineNodes(c.childNodes)); continue; }
      if (t === "code" || t === "kbd" || t === "samp" || t === "tt") { out += "`" + c.textContent.replace(/`/g, "\\`") + "`"; continue; }
      if (t === "s" || t === "del" || t === "strike") { out += wrap("~~", inlineNodes(c.childNodes)); continue; }
      if (t === "sup") { out += "<sup>" + inlineNodes(c.childNodes).trim() + "</sup>"; continue; }
      if (t === "sub") { out += "<sub>" + inlineNodes(c.childNodes).trim() + "</sub>"; continue; }
      if (t === "script" || t === "style" || t === "template" || t === "noscript" || t === "svg" || t === "canvas" || t === "button" || t === "input" || t === "select" || t === "textarea") continue;
      if (BLOCK.has(t)) { out += "\n\n" + block(c) + "\n\n"; continue; }
      out += inlineNodes(c.childNodes);
    }
    return out;
  }
  function blocks(el, sep) {
    const parts = []; let run = [];
    const flush = () => { if (run.length) { const s = inlineNodes(run).replace(/[ \t]+/g, " ").trim(); if (s) parts.push(s); run = []; } };
    for (const c of el.childNodes) {
      if (c.nodeType === 1 && !hidden(c) && (BLOCK.has(c.tagName.toLowerCase()) || c.getAttribute("data-bc-display") === "1")) { flush(); const b = block(c); if (b.trim()) parts.push(b); }
      else if (c.nodeType === 3 || c.nodeType === 1) run.push(c);
    }
    flush();
    return parts.join(sep || "\n\n");
  }
  function list(el, depth) {
    const ol = el.tagName.toLowerCase() === "ol"; let i = +(el.getAttribute("start") || 1);
    const lines = [];
    for (const li of el.children) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const prefix = ol ? (i++) + ". " : "- ";
      const body = blocks(li, "\n").split("\n");
      lines.push("  ".repeat(depth) + prefix + (body[0] || ""));
      for (let k = 1; k < body.length; k++) lines.push(body[k] ? "  ".repeat(depth) + " ".repeat(prefix.length) + body[k] : "");
    }
    return lines.join("\n");
  }
  function table(el) {
    const rows = [...el.querySelectorAll("tr")].filter(tr => tr.closest("table") === el);
    if (!rows.length) return "";
    const cell = c => inlineNodes(c.childNodes).replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|").trim();
    const grid = rows.map(tr => [...tr.children].filter(c => /^t[hd]$/i.test(c.tagName)).map(cell));
    const w = Math.max(...grid.map(r => r.length));
    if (!w) return "";
    const line = r => "| " + Array.from({ length: w }, (_, i) => r[i] || "").join(" | ") + " |";
    const out = [line(grid[0]), "|" + " --- |".repeat(w), ...grid.slice(1).map(line)];
    const cap = el.querySelector("caption");
    return (cap ? "**" + inlineNodes(cap.childNodes).trim() + "**\n\n" : "") + out.join("\n");
  }
  function block(el) {
    const t = el.tagName.toLowerCase();
    if (el.hasAttribute("data-bc-tex")) return texOf(el).trim();
    if (/^h[1-6]$/.test(t)) return "#".repeat(+t[1]) + " " + inlineNodes(el.childNodes).replace(/\s+/g, " ").trim();
    if (t === "p" || t === "dt" || t === "summary" || t === "address" || t === "center") { const s = blocks(el); return t === "dt" ? "**" + s + "**" : s; }
    if (t === "ul" || t === "ol") return list(el, 0);
    if (t === "li") return blocks(el);
    if (t === "blockquote") return blocks(el).split("\n").map(l => "> " + l).join("\n");
    if (t === "pre") return "```\n" + el.textContent.replace(/\n$/, "") + "\n```";
    if (t === "hr") return "---";
    if (t === "table") return table(el);
    if (t === "figcaption") return "*" + inlineNodes(el.childNodes).replace(/\s+/g, " ").trim() + "*";
    if (t === "dd") return blocks(el).split("\n").map(l => "    " + l).join("\n");
    if (t === "caption" || t === "tr" || t === "thead" || t === "tbody" || t === "tfoot") return "";
    return blocks(el);
  }
  function toMarkdown(body) { return blocks(body).replace(/\n{3,}/g, "\n\n").trim(); }

  /* ---------- 单页提取 ---------- */
  async function extract(d) {
    const win = d.defaultView, marks = [];
    // 两类标记：rm = 一定删（脚本等）；ui = 「清理界面」猜出来的阅读器控件，删完发现正文少了一半以上就整体放弃这一类
    const mark = (el, kind) => { el.setAttribute("data-bc-x", kind || "rm"); marks.push(el); };
    const keep = el => el.closest("mjx-container, .MathJax, .katex, math, svg");
    d.querySelectorAll("script, noscript, template, link[rel=preload], link[rel=prefetch]").forEach(el => mark(el, "rm"));
    if (opts.cleanUI !== false) {
      /* 只删明确是控件的东西。EPUB 正文里 <nav>（目录页整页就是一个 nav）、class="sidebar"（教材补充栏）、role=complementary（旁注）
       * 都是内容，不能按名字删；阅读器自己的工具条靠「固定 / 粘性定位」这一条抓。 */
      const sels = ["[role=toolbar]", "[role=menu]", "[role=menubar]", "[role=tooltip]", "[aria-modal=true]", "[role=dialog]",
        "[class*=toolbar i]", "[id*=toolbar i]", "[class*=navbar i]", "[class*=popover i]",
        "button", "input", "select", "textarea", "video", "audio", "iframe"];
      const textLen = el => { try { return (el.innerText || "").trim().length; } catch (e) { return 0; } };
      d.querySelectorAll(sels.join(",")).forEach(el => {
        if (keep(el)) return;
        // 名字像控件但里面一大段文字的（比如 class="toolbar-note" 的正文块），不删
        if (!/^(button|input|select|textarea|video|audio|iframe)$/i.test(el.tagName) && textLen(el) > 300) return;
        mark(el, "ui");
      });
      let n = 0;
      for (const el of d.body.querySelectorAll("*")) {                    // 固定 / 粘性定位的浮层（阅读器工具条大多如此）
        if (++n > 6000) break;
        try { const p = win.getComputedStyle(el).position; if ((p === "fixed" || p === "sticky") && !keep(el)) mark(el, "ui"); } catch (e) {}
      }
    }
    if (opts.wantHtml) d.querySelectorAll("canvas").forEach(c => { try { c.setAttribute("data-bc-canvas", c.toDataURL("image/png")); marks.push(c); } catch (e) {} });
    const texMarks = [];
    tagTex(d, texMarks);

    const body = d.body.cloneNode(true);
    marks.forEach(e => e.removeAttribute("data-bc-x"));
    body.querySelectorAll("[data-bc-x=rm]:not([data-bc-tex])").forEach(e => e.remove());
    const uiEls = [...body.querySelectorAll("[data-bc-x=ui]:not([data-bc-tex])")];
    if (uiEls.length) {
      // 保险：清理前后比一下文字量，删掉一半以上说明猜错了（把正文当成了控件），这一页放弃清理
      const before = (body.textContent || "").replace(/\s+/g, " ").trim().length;
      uiEls.forEach(e => e.remove());
      const after = (body.textContent || "").replace(/\s+/g, " ").trim().length;
      if (before > 200 && after < before * 0.5) {
        const fresh = d.body.cloneNode(true);
        fresh.querySelectorAll("[data-bc-x=rm]:not([data-bc-tex])").forEach(e => e.remove());
        fresh.querySelectorAll("script, button, input, select, textarea, video, audio, iframe").forEach(e => { if (!keep(e)) e.remove(); });
        body.replaceChildren(...fresh.childNodes);
      }
    }
    body.querySelectorAll("[data-bc-x]").forEach(e => e.removeAttribute("data-bc-x"));
    absolutize(body, d.baseURI);
    // 书内链接改写要用的锚点信息：这一节里所有元素 id + 各级标题（文字 / 自己或最近祖先的 id）
    const anchors = { ids: [], heads: [] };
    body.querySelectorAll("[id]").forEach((e, i) => { if (i < 5000 && e.id) anchors.ids.push(e.id); });
    body.querySelectorAll("h1, h2, h3, h4, [role=heading]").forEach(h => {
      if (anchors.heads.length >= 300) return;
      const text = (h.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;
      const holder = h.closest("[id]");
      anchors.heads.push({ text: text.slice(0, 200), id: holder ? holder.id : "", level: /^h\d$/i.test(h.tagName) ? +h.tagName[1] : 2 });
    });
    let md = "";
    if (opts.wantMd) md = toMarkdown(body);
    let html = "", css = "";
    if (opts.wantHtml) {
      body.querySelectorAll("canvas[data-bc-canvas]").forEach(c => { const img = d.createElement("img"); img.src = c.getAttribute("data-bc-canvas"); img.width = c.width; img.height = c.height; c.replaceWith(img); });
      body.querySelectorAll("[data-bc-tex]").forEach(e => { e.removeAttribute("data-bc-tex"); e.removeAttribute("data-bc-display"); });
      body.querySelectorAll("script").forEach(s => s.remove());
      await inlineImages(body);
      css = await collectCss(d);
      html = body.innerHTML;
      // 兜底：整节还是太大（超过 executeScript 返回值上限）就从最大的图开始换回原链接
      const LIMIT = 40 * 1024 * 1024;
      if (html.length + css.length > LIMIT) {
        const inl = [...body.querySelectorAll("[data-bc-orig]")].sort((a, b) => (b.getAttribute("src") || b.getAttribute("href") || "").length - (a.getAttribute("src") || a.getAttribute("href") || "").length);
        let size = html.length + css.length;
        for (const el of inl) {
          if (size <= LIMIT) break;
          const attr = el.tagName.toLowerCase() === "img" ? "src" : "href";
          size -= (el.getAttribute(attr) || "").length;
          el.setAttribute(attr, el.getAttribute("data-bc-orig"));
        }
      }
      // data-bc-orig（内联前的原链接）留在 HTML 里：落盘超配额时后台靠它把图换回链接
      html = body.innerHTML;
    }
    texMarks.forEach(e => { e.removeAttribute("data-bc-tex"); e.removeAttribute("data-bc-display"); });
    marks.forEach(e => { if (e.tagName && e.tagName.toLowerCase() === "canvas") e.removeAttribute("data-bc-canvas"); });
    const h = d.querySelector("h1, h2, [role=heading]");
    return {
      title: (d.title || "").trim(), heading: h ? (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200) : "",
      url: d.location.href, base: d.baseURI,
      htmlClass: d.documentElement.className || "", bodyClass: d.body.className || "", bodyId: d.body.id || "",
      html, css, md, anchors
    };
  }

  /* ---------- 下一页 ---------- */
  function visible(el) {
    try {
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      return cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05 && cs.pointerEvents !== "none";
    } catch (e) { return false; }
  }
  function disabled(el) {
    return !!(el.disabled || el.getAttribute("aria-disabled") === "true" || /(^|\s)(disabled|inactive|is-disabled)(\s|$)/i.test(el.className || "")
      || el.closest("[aria-disabled=true], [disabled], .disabled"));
  }
  const NEXT_TEXT = /^(next|next page|next section|next chapter|next »|next ›|next →|continue|下一页|下一节|下一章|下页|›|»|→|❯|>)$/i;
  const NEXT_LABEL = /\bnext\b|下一/i;
  const PREV_LABEL = /\bprev|previous|\bback\b|上一/i;
  function findNext(root) {
    const cands = [];
    for (const s of (opts.nextSelectors || [])) { try { deepAll(root, s).forEach(e => cands.push(e)); } catch (e) {} }
    deepAll(root, "button, a, [role=button], [role=link]").forEach(e => {
      const t = (e.textContent || "").replace(/\s+/g, " ").trim();
      const al = ((e.getAttribute("aria-label") || "") + " " + (e.getAttribute("title") || "")).trim();
      if (NEXT_TEXT.test(t) || NEXT_LABEL.test(al)) cands.push(e);
    });
    for (const e of cands) {
      let el = e.matches("button, a, [role=button], [role=link], input[type=button], input[type=submit]") ? e : (e.closest("button, a, [role=button], [role=link]") || null);
      if (!el) { const inner = e.querySelectorAll("button, a, [role=button]"); if (inner.length === 1) el = inner[0]; }
      if (!el || disabled(el) || !visible(el)) continue;
      const label = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "") + " " + (el.className || "") + " " + (el.id || "")).toLowerCase();
      if (PREV_LABEL.test(label) && !NEXT_LABEL.test(label)) continue;
      return el;
    }
    return null;
  }
  function clickNext() {
    const roots = [getDoc()];
    if (roots[0] !== document) roots.push(document);
    try { if (window.parent !== window && window.parent.document) roots.push(window.parent.document); } catch (e) {}
    for (const r of roots) {
      const el = findNext(r);
      if (!el) continue;
      const label = ((el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim()).slice(0, 60);
      try { el.scrollIntoView({ block: "center", inline: "center" }); } catch (e) {}
      try { el.click(); } catch (e) { try { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: r.defaultView })); } catch (e2) {} }
      return { clicked: true, label, href: el.getAttribute("href") || "" };
    }
    return { clicked: false };
  }

  /* ---------- 分发 ---------- */
  return (async () => {
    try {
      if (cmd === "probe") {
        const self = probe(document);
        const w = resolveWrapper();
        return { self, wrapper: w && w !== document ? probe(w) : null };
      }
      const d = getDoc();
      if (cmd === "signature") return signature(d);
      if (cmd === "next") return clickNext();
      if (cmd === "extract") {
        if (opts.forceLazy !== false) await autoScroll(d);
        return await extract(d);
      }
      return { error: "unknown cmd " + cmd };
    } catch (e) { return { error: (e && e.message) || String(e) }; }
  })();
}

/* ======================= 后台任务 ======================= */
const ReaderExport = {
  DEFAULTS: {
    cleanUI: true, breakPrint: true, forceLazy: true, scrollInterval: 120, scrollStep: 400,
    continuous: false, maxPages: 300, pageTimeout: 60000, pageDelay: 1500,
    nextSelectors: [
      ".next-chapter", ".next-page", ".next-section", "[aria-label='Next']", "[aria-label='Next page']", "[aria-label='Next Page']", "[aria-label='Next section']",
      "[aria-label*='next' i]", "[title*='next' i]", "a[rel=next]", "link[rel=next]", "button.next", "a.next", "#next", "[data-testid*='next' i]", "[data-test*='next' i]",
      ".pagination-next", ".page-next", "[class*='next' i]"
    ]
  },
  jobs: new Map(),      // tabId -> job（内存副本；同时持久化到 storage.session，后台被回收后弹窗还能看到，也用来断点续跑）
  KEY: tabId => "bc_reader_job_" + tabId,
  RESUME_AGE: 15 * 60 * 1000,

  async status(tabId) {
    if (this.jobs.has(tabId)) return this.jobs.get(tabId);
    try { return (await chrome.storage.session.get(this.KEY(tabId)))[this.KEY(tabId)] || null; } catch (e) { return null; }
  },
  async progress(tabId, job) {
    job.ts = Date.now();
    try { chrome.action.setBadgeBackgroundColor({ tabId, color: job.status === "error" ? "#c62828" : "#cc0033" }); } catch (e) {}
    try { chrome.action.setBadgeText({ tabId, text: job.status === "running" ? String(job.pages || "…") : (job.status === "error" ? "!" : "") }); } catch (e) {}
    try { await chrome.storage.session.set({ [this.KEY(tabId)]: job }); } catch (e) {}
    try { chrome.runtime.sendMessage({ type: "bc-reader-progress", tabId, job }).catch(() => {}); } catch (e) {}
  },

  async frames(tabId) {
    const fs = await chrome.webNavigation.getAllFrames({ tabId });
    return (fs || []).filter(f => /^(https?:|blob:|about:blank|about:srcdoc)/.test(f.url || ""));
  },
  async exec(tabId, frameId, cmd, opts) {
    const r = await chrome.scripting.executeScript({ target: { tabId, frameIds: [frameId] }, world: "MAIN", func: bcReaderPage, args: [cmd, opts || {}] });
    const v = r && r[0] ? r[0].result : undefined;
    if (v && v.error) throw new Error(v.error);
    return v;
  },
  score(q) {
    if (!q) return -Infinity;
    // 不到 200 字也可能是正文（章节扉页、只有一张图的页）：只要有段落 / 图 / 公式 / EPUB 标记就算候选，空白 frame 才排除
    if (q.textLen < 200 && !(q.paras || q.imgs || q.math || q.epub)) return -Infinity;
    return q.textLen + Math.min(q.paras, 200) * 20 + (q.math ? 3000 : 0) + (q.epub ? 3000 : 0) - (q.shell ? 4000 : 0);
  },
  // 枚举 frame，各自探测「本 frame」和「外层穿透到的正文文档」，打分取最高
  async locate(tabId, opts) {
    const frames = await this.frames(tabId);
    const cands = [], report = [];
    for (const f of frames) {
      let p = null;
      const u = (f.url || "").replace(/^https?:\/\//, "").slice(0, 70);
      try { p = await this.exec(tabId, f.frameId, "probe", opts); }
      catch (e) { report.push(BC.t("#{id} {url} 注入失败：{err}", { id: f.frameId, url: u, err: (e && e.message || e).toString().slice(0, 80) })); continue; }
      if (!p) { report.push(BC.t("#{id} {url} 无结果", { id: f.frameId, url: u })); continue; }
      const shellTag = q => q.shell ? " " + BC.t("外壳") : "";
      report.push(BC.t("#{id} {url} 字数 {n}{shell}", { id: f.frameId, url: u, n: p.self.textLen, shell: shellTag(p.self) })
        + (p.wrapper ? BC.t("｜内层 字数 {n}{shell}", { n: p.wrapper.textLen, shell: shellTag(p.wrapper) }) : ""));
      for (const via of ["self", "wrapper"]) {
        const s = this.score(p[via]);
        if (s > -Infinity) cands.push({ frameId: f.frameId, parentFrameId: f.parentFrameId, via, score: s, info: p[via] });
      }
    }
    // 像外壳的 frame 永远排在不像外壳的后面：目录抽屉一打开，外壳的文字量能压过任何扣分，光靠分数会选错
    cands.sort((a, b) => (a.info.shell ? 1 : 0) - (b.info.shell ? 1 : 0) || b.score - a.score || (a.via === "self" ? -1 : 1));
    // 外壳绝不当正文用：宁可报错，也不能把外壳抓一百多遍
    const best = cands.find(c => !c.info.shell) || null;
    return { best, frames, report, shellOnly: !best && cands.length > 0 };
  },
  /* 找书页正文；找不到（书页还在加载、frame 刚换掉）就每 2 秒再找一次，最多等 waitMs。
   * prev 给了的话：上次的正文 frame 还在且仍像正文就直接沿用（新一节可能很短，过不了 200 字门槛，也不该因此重新打分） */
  async findContent(tabId, opts, prev, waitMs, onWait) {
    const t0 = Date.now();
    let loc = null;
    for (;;) {
      if (prev) {
        try {
          const p = await this.exec(tabId, prev.frameId, "probe", { via: prev.via });
          const q = p && p[prev.via];
          if (q && !q.shell && q.textLen >= 50) return { best: prev, frames: await this.frames(tabId), report: [] };
        } catch (e) {}
      }
      loc = await this.locate(tabId, opts);
      if (loc.best) return loc;
      if (prev && loc.frames.some(f => f.frameId === prev.frameId) && !loc.shellOnly) { loc.best = prev; return loc; }   // 还是那个 frame，只是内容太短
      if (Date.now() - t0 >= waitMs) return loc;
      if (onWait) await onWait(loc);
      await new Promise(r => setTimeout(r, 2000));
    }
  },
  sigKey(s) { return s ? [s.href, s.len, s.head, s.mid, s.tail].join("|") : ""; },
  // 真换页了吗：头 / 中 / 尾三段里至少两段不同，或者长度差很多。只有一段变（外壳里的页码计数、时间戳）不算
  changedEnough(a, b) {
    if (!a || !b) return true;
    const diff = (a.head !== b.head) + (a.mid !== b.mid) + (a.tail !== b.tail);
    return diff >= 2 || Math.abs(a.len - b.len) > 40 || a.href !== b.href;
  },

  // 翻页：先在正文 frame 的祖先（阅读器外壳，Pearson 的 Next 在最外层）里找，再正文 frame 自己，最后其它 frame
  async clickNext(tabId, target, frames, opts) {
    const byId = new Map(frames.map(f => [f.frameId, f]));
    const order = [];
    let cur = byId.get(target.frameId);
    const ancestors = [];
    while (cur && cur.parentFrameId >= 0 && byId.has(cur.parentFrameId)) { cur = byId.get(cur.parentFrameId); ancestors.push(cur.frameId); }
    order.push(...ancestors.reverse());          // 最外层优先
    order.push(target.frameId);
    frames.forEach(f => { if (!order.includes(f.frameId)) order.push(f.frameId); });
    for (const fid of order) {
      try {
        const r = await this.exec(tabId, fid, "next", { via: fid === target.frameId ? target.via : "self", nextSelectors: opts.nextSelectors });
        if (r && r.clicked) return r;
      } catch (e) {}
    }
    return null;
  },
  // 等新一节内容出现：指纹变了且连续 3 次（1.5 秒）稳定；frame 跳转 / 被换掉时重新定位
  async waitChange(tabId, target, refSig, opts) {
    const t0 = Date.now(); let last = "", stable = 0, cur = target;
    while (Date.now() - t0 < (opts.pageTimeout || 60000)) {
      await new Promise(r => setTimeout(r, 500));
      let sig = null;
      try { sig = await this.exec(tabId, cur.frameId, "signature", { via: cur.via }); }
      catch (e) { try { const loc = await this.locate(tabId, opts); if (loc.best) cur = loc.best; } catch (e2) {} continue; }
      const key = this.sigKey(sig);
      if (!sig || sig.len < 50 || !this.changedEnough(refSig, sig)) { stable = 0; last = key; continue; }
      if (key === last) { if (++stable >= 2) return true; } else { stable = 0; last = key; }
    }
    return false;
  },
  // 内联图片落盘超出配额时，把 data: 换回原链接（extract 留了 data-bc-orig）
  stripInline(html) {
    return String(html || "").replace(/<(img|image)\b[^>]*>/g, tag => {
      const m = /\sdata-bc-orig="([^"]*)"/.exec(tag);
      if (!m) return tag;
      return tag.replace(/\s(src|href)="data:[^"]*"/, ` $1="${m[1]}"`).replace(m[0], "");
    });
  },
  async store(jobId, i, sec) {
    try { await ReaderDB.putSection(jobId, i, sec); return ""; }
    catch (e) {
      const light = Object.assign({}, sec, { html: this.stripInline(sec.html) });
      await ReaderDB.putSection(jobId, i, light);
      return BC.t("第 {n} 节图片太大没能落盘，改用原链接（{err}）", { n: i + 1, err: e && e.message || e });
    }
  },

  /* 主流程。job 里带着断点续跑需要的一切（jobId / 已抓节数 / 见过的指纹 / 选项），每抓完一节就持久化到 storage.session；
   * service worker 被浏览器回收后重启时（见文件末尾）读到 status=running 的 job 就接着跑。
   * 中途出错（frame 没了、标签页关了……）不再把已抓的几十节一起扔掉：有多少导出多少，错误写进 warn。 */
  async run({ tabId, mode, opts, resume }) {
    opts = Object.assign({}, this.DEFAULTS, opts || {});
    opts.wantHtml = mode === "pdf"; opts.wantMd = mode === "md";
    const job = resume ? Object.assign({}, resume, { status: "running", msg: BC.t("后台被浏览器回收过，接着上次的进度继续…"), resumed: (resume.resumed || 0) + 1 })
      : { status: "running", pages: 0, msg: BC.t("定位正文…"), warn: "", mode, tabId, opts, jobId: String(Date.now()), seen: [], resumed: 0 };
    const jobId = job.jobId, seen = new Set(job.seen || []);
    this.jobs.set(tabId, job); await this.progress(tabId, job);
    // 步骤日志同时存进 job（最近 60 条），弹窗里能直接看，不用去翻 service worker 的控制台
    job.log = job.log || [];
    const log = (...a) => {
      console.log("[BC reader]", jobId, ...a);
      job.log.push(new Date().toTimeString().slice(0, 8) + " " + a.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" "));
      if (job.log.length > 60) job.log.splice(0, job.log.length - 60);
    };
    if (resume) log("resumed from section", resume.pages);
    let fatal = null;
    try {
      if (!resume) await ReaderDB.purge(24 * 3600 * 1000).catch(() => {});   // 顺手清掉一天前没打印的旧数据
      let loc = await this.findContent(tabId, opts, null, 30000, async l => {
        job.msg = BC.t("还没找到书页正文，等它加载…（{n} 个 frame）", { n: l.frames.length }); await this.progress(tabId, job);
      });
      (loc.report || []).forEach(r => log("frame", r));
      if (!loc.best) {
        const why = BC.t(loc.shellOnly ? "只找到阅读器外壳，书页所在的 frame 注入不了或还没加载" : "这个页面上没有像书页的内容");
        throw new Error(BC.t(resume ? "阅读器页面已经不在了：{why}。看「导出日志」里各 frame 的探测结果；注入失败多半是没授权那个域名"
                                     : "没找到书页正文：{why}。看「导出日志」里各 frame 的探测结果；注入失败多半是没授权那个域名", { why }));
      }
      log("chosen frame", loc.best.frameId, loc.best.via, "text", loc.best.info.textLen, (loc.best.info.href || "").slice(0, 100));
      const max = opts.continuous ? Math.max(1, +opts.maxPages || 300) : 1;
      let skipExtract = false;
      for (let i = job.pages; i < max; i++) {
        const t = loc.best;
        job.msg = BC.t("第 {n} 节：滚动加载 + 提取…", { n: i + 1 }); await this.progress(tabId, job);
        const sig0 = await this.exec(tabId, t.frameId, "signature", { via: t.via });
        const key0 = this.sigKey(sig0);
        if (seen.has(key0)) {
          // 续跑时当前页可能就是上次抓完但还没翻过去的那页：跳过提取直接翻页；其它情况就是绕回来了 = 到末尾
          if (resume && i === resume.pages) { skipExtract = true; log("resume: page already captured, turning page"); }
          else { job.warn = BC.t("内容出现重复，判断已到末尾"); break; }
        }
        if (!skipExtract) {
          seen.add(key0);
          const sec = await this.exec(tabId, t.frameId, "extract", Object.assign({}, opts, { via: t.via }));
          if (!sec) throw new Error(BC.t("提取失败（frame 可能已经跳转）"));
          const rec = { title: sec.title, heading: sec.heading, url: sec.url, htmlClass: sec.htmlClass, bodyClass: sec.bodyClass, bodyId: sec.bodyId, html: sec.html || "", css: sec.css || "", md: sec.md || "", anchors: sec.anchors || { ids: [], heads: [] } };
          const w = await this.store(jobId, i, rec);
          if (w) job.warn = job.warn ? job.warn + BC.i18n.pick("；", "; ") + w : w;
          job.pages = i + 1; job.seen = [...seen];
          log("section", i + 1, "html", rec.html.length, "md", rec.md.length);
        }
        const skipped = skipExtract; skipExtract = false;
        job.msg = BC.t("第 {n} 节完成", { n: job.pages }); await this.progress(tabId, job);   // 这一步落盘的进度就是断点
        if (!opts.continuous) break;
        if (i === max - 1) { job.warn = BC.t("已达到最多 {n} 节的上限", { n: max }); break; }
        const ref = await this.exec(tabId, t.frameId, "signature", { via: t.via }).catch(() => sig0);
        job.msg = BC.t("第 {n} 节完成，找「下一页」…", { n: job.pages }); await this.progress(tabId, job);
        let clicked = await this.clickNext(tabId, t, loc.frames, opts);
        if (!clicked) { log("no next button, end"); break; }                 // 没有「下一页」= 书末
        job.msg = BC.t("已点「{label}」，等待加载…", { label: clicked.label || BC.t("下一页") }); await this.progress(tabId, job);
        let changed = await this.waitChange(tabId, t, ref, opts);
        // 没反应不急着收尾：有的阅读器加载中会吞掉点击，有的接口被连续翻页刷到限流（400）要缓一缓。歇一会再点，最多三次
        for (let k = 0; !changed && k < 3; k++) {
          const pause = [5000, 15000, 30000][k];
          log("no change after click, retry", k + 1, "after", pause, "ms");
          job.msg = BC.t("翻页后没有新内容，{s} 秒后重试（{k}/3）…", { s: pause / 1000, k: k + 1 }); await this.progress(tabId, job);
          await new Promise(r => setTimeout(r, pause));
          clicked = await this.clickNext(tabId, t, loc.frames, opts);
          if (!clicked) { log("next button gone during retry"); break; }
          changed = await this.waitChange(tabId, t, ref, opts);
        }
        if (!changed) { job.warn = BC.t(clicked ? "点了「下一页」但内容一直没有变化（重试 3 次），视为已到末尾" : "「下一页」按钮消失，视为已到末尾"); break; }
        loc = await this.findContent(tabId, opts, t, 30000);
        if (!loc.best) { (loc.report || []).forEach(r => log("frame", r)); throw new Error(BC.t("翻页后找不到书页正文了（等了 30 秒）")); }
        if (loc.best.frameId !== t.frameId || loc.best.via !== t.via) log("content frame changed ->", loc.best.frameId, loc.best.via);
        if (opts.pageDelay > 0) await new Promise(r => setTimeout(r, Math.min(60000, +opts.pageDelay)));   // 每节之间歇一下，别把阅读器接口刷炸
        if (skipped) i--;                                                   // 跳过的那轮没占用节号
      }
    } catch (e) { fatal = e; log("error", e && e.message); }

    // 收尾：有多少导出多少
    try {
      if (!job.pages) throw fatal || new Error(BC.t("没有提取到内容"));
      if (fatal) job.warn = BC.t("第 {next} 节出错，只导出前 {n} 节：{err}", { next: job.pages + 1, n: job.pages, err: fatal.message || fatal });
      const first = await ReaderDB.getSection(jobId, 0);
      const title = ((first && (first.title || first.heading)) || "reader-export").trim();
      if (mode === "md") {
        const secs = [];
        for (let i = 0; i < job.pages; i++) { const s = await ReaderDB.getSection(jobId, i); if (s) secs.push(s); }
        const md = this.buildMarkdown(title, secs);
        await this.download(md, this.safeName(title) + ".md");
        ReaderDB.remove(jobId).catch(() => {});
        job.msg = BC.t("已下载 Markdown（{n} 节）", { n: secs.length });
      } else {
        await ReaderDB.putDoc({ id: jobId, title, ts: Date.now(), warn: job.warn, count: job.pages });
        await chrome.tabs.create({ url: chrome.runtime.getURL("print/print.html#" + jobId) });
        job.msg = BC.t("已打开打印页（{n} 节）", { n: job.pages });
      }
      job.status = "done";
    } catch (e) {
      job.status = "error"; job.msg = (e && e.message) || String(e);
      ReaderDB.remove(jobId).catch(() => {});
    }
    job.seen = [];                                   // 结束后不用再存指纹（几百节的指纹字符串不小）
    await this.progress(tabId, job);
    setTimeout(() => { if (this.jobs.get(tabId) === job) this.jobs.delete(tabId); try { chrome.action.setBadgeText({ tabId, text: "" }); } catch (e) {} }, 90000);
    return job;
  },

  buildMarkdown(title, sections) {
    const out = ["# " + title, "", BC.t("> 来源：{url}  ", { url: sections[0].url }),
      BC.t("> 导出时间：{time}  ·  {n} 节", { time: new Date().toLocaleString(BC.i18n.locale()), n: sections.length }), ""];
    const sameTitle = sections.every(s => (s.title || "") === (sections[0].title || ""));
    const idx = typeof ReaderLinks !== "undefined" ? ReaderLinks.index(sections) : null;   // 书内链接 → 文内锚点
    sections.forEach((s, i) => {
      if (sections.length > 1) {
        const h = s.heading || (!sameTitle && s.title) || "";
        out.push("", "---", "", `<a id="bc-s${i}"></a>`, "");
        if (!/^#{1,6}\s/.test(s.md || "")) out.push(`## ${h || BC.t("第 {n} 节", { n: i + 1 })}`, "");   // 正文自己没有标题才补一个
      }
      out.push(idx ? ReaderLinks.rewriteMarkdown(idx, i, s.md) : (s.md || ""));
    });
    return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
  },
  safeName(s) { return String(s || "export").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "export"; },
  // service worker 里没有 URL.createObjectURL：用 base64 data: URL 交给 downloads
  async download(text, filename) {
    const bytes = new TextEncoder().encode(text);
    let bin = ""; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    const url = "data:text/markdown;charset=utf-8;base64," + btoa(bin);
    return chrome.downloads.download({ url, filename: "PotatoCanvas/" + filename, conflictAction: "uniquify", saveAs: false });
  },

  // 后台每次启动都跑一遍：有 status=running 且不太旧的 job 就是上次被回收时没跑完的，接着跑
  async resumePending() {
    let all = {};
    try { all = await chrome.storage.session.get(null); } catch (e) { return; }
    for (const [k, job] of Object.entries(all)) {
      if (!k.startsWith("bc_reader_job_") || !job || job.status !== "running") continue;
      if (Date.now() - (job.ts || 0) > this.RESUME_AGE || (job.resumed || 0) >= 20) {
        job.status = "error"; job.msg = BC.t("后台被回收后没能继续（超时）"); await this.progress(job.tabId, job); continue;
      }
      console.log("[BC reader] resuming job", job.jobId, "from section", job.pages);
      const p = this.run({ tabId: job.tabId, mode: job.mode, opts: job.opts, resume: job });
      (typeof keepAlive === "function" ? keepAlive(p) : p).catch(() => {});
    }
  }
};
ReaderExport.resumePending();
