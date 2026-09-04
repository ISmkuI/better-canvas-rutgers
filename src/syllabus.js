/* 期中/期末日期识别：
 *  1) 自动扫描课程 Syllabus 正文
 *  2) 解析上传的文本/文档内容
 *  3) 手动填写（在设置面板里）
 * 统一产出 {type, title, date} 写入 settings.examDates[courseId]。 */
BC.syllabus = {
  MONTHS: {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8,
    sep: 9, sept: 9, oct: 10, nov: 11, dec: 12
  },

  EXAM_WORDS: [
    { type: "midterm", words: ["midterm", "mid-term", "mid term", "期中"] },
    { type: "final",   words: ["final exam", "final examination", "finals", "期末"] },
    // 单独一个 "final" 很常见（"Final - Thursday, December 18th"），但 final grade /
    // final project / final draft 这类不是考试，靠 not 列表排掉
    { type: "final",   words: ["final"],
      not: ["grade", "grades", "grading", "project", "paper", "draft", "report", "essay",
            "presentation", "submission", "version", "answer", "answers", "score", "scores",
            "week", "day", "deadline"] },
    { type: "exam",    words: ["exam", "quiz", "test", "考试", "测验"] }
  ],

  // 一行里所有考试关键词的位置（已排掉 final grade / final project 这类误报）
  _keywordsIn(low) {
    const out = [];
    for (const e of BC.syllabus.EXAM_WORDS) {
      for (const w of e.words) {
        let i = low.indexOf(w);
        while (i >= 0) {
          let ok = true;
          if (e.not) {
            const after = low.slice(i + w.length, i + w.length + 16).replace(/^[\s:：·,，-]+/, "");
            if (e.not.some(nw => after.startsWith(nw))) ok = false;
          }
          if (ok) out.push({ s: i, e: i + w.length, type: e.type });
          i = low.indexOf(w, i + 1);
        }
      }
    }
    return out;
  },

  // 从一段纯文本里抽取候选日期（返回 ISO 字符串或 null）
  parseDate(fragment, fallbackYear) {
    const f = fragment.toLowerCase();
    const yr = fallbackYear || new Date().getFullYear();

    // 1) Month DD[, YYYY]  例: October 14, 2025 / Oct 14
    let m = f.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?/);
    if (m) {
      const mo = BC.syllabus.MONTHS[m[1]];
      const day = +m[2];
      const year = m[3] ? +m[3] : yr;
      return BC.syllabus._iso(year, mo, day);
    }
    // 2) DD[st/nd/rd/th] Month
    m = f.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:\s*,?\s*(\d{4}))?/);
    if (m) {
      const day = +m[1];
      const mo = BC.syllabus.MONTHS[m[2]];
      const year = m[3] ? +m[3] : yr;
      return BC.syllabus._iso(year, mo, day);
    }
    // 3) MM/DD[/YYYY]
    m = f.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (m) {
      const mo = +m[1], day = +m[2];
      let year = m[3] ? +m[3] : yr;
      if (year < 100) year += 2000;
      if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) return BC.syllabus._iso(year, mo, day);
    }
    return null;
  },

  _iso(y, mo, d) {
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  },

  // 从文本里提取 考试类 条目（通用性优先）：逐行处理，把每个日期关联到“同一行内最近的考试关键词”。
  // 适配各种老师格式：Midterm on March 11 / Final Exam Dec 15 / Quiz 2 on 2/14 / 多个 Midterm；
  // 表格里只有日期的周区间(无关键词)会被忽略，也不会跨单元格误判相邻周。
  extractFromText(text) {
    const year = new Date().getFullYear();
    const T = (text || "").replace(/ /g, " ");
    const MO = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
    const dateRe = new RegExp(
      `((?:${MO})[a-z]*\\.?\\s+\\d{1,2}(?:\\s*,?\\s*\\d{4})?)` +    // Month DD[, YYYY]
      `|(\\d{1,2}(?:st|nd|rd|th)\\s+(?:${MO})[a-z]*\\.?(?:\\s*,?\\s*\\d{4})?)` + // DDth Month
      `|(\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?)`,                          // MM/DD[/YYYY]
      "gi");
    const MAXGAP = 60; // 关键词与日期在同一行内的最大字符间距
    const found = [];
    const seen = new Set();
    // 逐行处理：HTML 已按单元格/段落插入换行，避免跨单元格误判相邻周
    const lines = String(T || text || "").split(/\r?\n/);
    for (let line of lines) {
      line = line.replace(/\s+/g, " ").trim();
      if (line.length < 3) continue;
      const low = line.toLowerCase();
      const kws = BC.syllabus._keywordsIn(low);
      if (!kws.length) continue;
      dateRe.lastIndex = 0;
      let m;
      while ((m = dateRe.exec(line))) {
        const iso = BC.syllabus.parseDate(m[0], year);
        if (!iso) continue;
        const dS = m.index, dE = m.index + m[0].length;
        // 关联到同一行内“最近”的关键词
        let best = null, gap = Infinity;
        for (const k of kws) {
          const g = k.s > dE ? k.s - dE : (dS > k.e ? dS - k.e : 0);
          if (g < gap) { gap = g; best = k; }
        }
        if (!best || gap > MAXGAP) continue;
        const key = best.type + iso;
        if (seen.has(key)) continue;
        seen.add(key);
        // 行级切分后行尾会挂着单元格分隔符，去掉再当标题
        const title = line.replace(/(?:\s*·\s*)+$/, "").slice(0, 80);
        found.push({ type: best.type, title, date: iso, source: "syllabus" });
      }
    }
    return found;
  },

  // 标题里直接命中考试关键词 -> 类型；命不中返回 null
  matchType(s) {
    // 走 _keywordsIn 而不是直接 includes：否则「Final Project」这类作业名会被当成期末考
    const k = BC.syllabus._keywordsIn(String(s || "").toLowerCase());
    return k.length ? k[0].type : null;   // 顺序仍是 midterm > final > exam
  },

  /* DOM -> 逐行文本。
   * 单元格之间用 · 连接、只在行末换行：syllabus 表格最常见的排版就是「日期一格、Midterm 另一格」，
   * 按单元格断行会让这种行永远匹配不上；而整表连成一行又会让上一行的日期粘到下一行的关键词上。
   * 行级切分两头都避开了。 */
  _lineify(root) {
    const el = root.cloneNode(true);
    el.querySelectorAll("script,style,noscript").forEach(n => n.remove());
    // 先把原文里的换行压平：Canvas 的 HTML 是带缩进的，</td> 和下一个 <td> 之间那个
    // 换行文本节点会原样进 textContent，把一行拆成两行——必须在插结构分隔符之前抹掉
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) n.nodeValue = n.nodeValue.replace(/\s+/g, " ");
    el.querySelectorAll("br").forEach(b => b.replaceWith("\n"));
    el.querySelectorAll("td,th").forEach(c => c.append(" · "));
    el.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,section,article").forEach(n => {
      if (!n.closest("td,th")) n.append("\n");   // 单元格内的块元素不能断行，否则又拆散了行
    });
    el.querySelectorAll("tr").forEach(n => n.append("\n"));
    return (el.textContent || "").replace(/[ \t ]+/g, " ");
  },

  onSyllabusPage() { return /^\/courses\/\d+\/assignments\/syllabus\/?$/.test(location.pathname); },
  courseIdFromPath() { const m = location.pathname.match(/\/courses\/(\d+)/); return m ? m[1] : null; },

  /* Course Summary：作业 + 日历事件。这里是结构化数据（标题 + 精确日期），
   * 不用正则去猜，标题命中关键词就直接采用它的日期，比解析散文可靠得多。 */
  async _summaryItems(courseId) {
    const out = [];
    const add = (title, when) => {
      if (!title || !when) return;
      const type = BC.syllabus.matchType(title);
      if (!type) return;
      const d = new Date(when);
      if (isNaN(d)) return;
      // 用本地日期：due_at 是 UTC，晚上截止的作业直接切前 10 位会错一天
      out.push({
        type, title: String(title).slice(0, 80),
        date: BC.syllabus._iso(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        source: "summary"
      });
    };
    const [assigns, events] = await Promise.all([
      BC.api.getAll(`/api/v1/courses/${courseId}/assignments?per_page=100`, { max: 200 }).catch(() => []),
      BC.api.getAll(
        `/api/v1/calendar_events?context_codes[]=course_${courseId}&type=event&all_events=true&per_page=100`,
        { max: 100 }
      ).catch(() => [])
    ]);
    assigns.forEach(a => add(a.name, a.due_at));
    events.forEach(e => add(e.title, e.start_at));
    return out;
  },

  // 当前已渲染的 syllabus 页面文本（正文 + Course Summary 表格）
  renderedPageText() {
    const parts = [];
    const desc = document.getElementById("course_syllabus");
    if (desc) parts.push(BC.syllabus._lineify(desc));
    const tbl = document.querySelector("#syllabus, table.syllabus, #syllabusContainer table");
    if (tbl) parts.push(BC.syllabus._lineify(tbl));
    if (!parts.length) {
      const c = document.getElementById("content");
      if (c) parts.push(BC.syllabus._lineify(c));
    }
    return parts.join("\n");
  },
  scanRenderedPage() { return BC.syllabus.extractFromText(BC.syllabus.renderedPageText()); },

  /* 有考试关键词、但整行解析不出日期的行。
   * 最常见的原因是老师留了占位符（"Exam 1 - Wednesday October ?th"）或干脆写 TBA。
   * 这些行不能自动入库，但把它们连同月份提示交给用户手工补一个日期，
   * 比只报「识别 0 条」有用得多。 */
  findUndated(text) {
    const MO = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*/;
    const out = [], seen = new Set();
    for (let line of String(text || "").split(/\r?\n/)) {
      line = line.replace(/\s+/g, " ").trim();
      if (line.length < 3) continue;
      const low = line.toLowerCase();
      const kws = BC.syllabus._keywordsIn(low);
      if (!kws.length) continue;
      if (BC.syllabus.parseDate(line)) continue;      // 这行有日期，归 extractFromText 管
      const title = line.replace(/(?:\s*·\s*)+$/, "").slice(0, 80);
      const key = kws[0].type + title;
      if (seen.has(key)) continue;
      seen.add(key);
      const m = low.match(MO);
      out.push({ type: kws[0].type, title, month: m ? BC.syllabus.MONTHS[m[1]] : null });
    }
    return out;
  },

  dedupe(list) {
    const seen = new Set(), out = [];
    for (const it of list) {
      const k = it.type + it.date;
      if (seen.has(k)) continue;
      seen.add(k); out.push(it);
    }
    return out;
  },

  // 只要 items 的旧签名，给 blocks.scanAllSyllabi 用
  async scanCourse(courseId) {
    return (await BC.syllabus.scanCourseDetailed(courseId)).items;
  },

  // 扫描一门课：Course Summary + syllabus 正文 + 正文里链接的同源 PDF +（若正停在该页）已渲染内容
  // 返回 { items 能直接入库的, undated 有考试关键词但没日期的 }
  async scanCourseDetailed(courseId) {
    // Course Summary 放最前：它的标题是作业/事件原名，比从散文里切出来的整行干净，
    // dedupe 保留先出现的，所以同一个 type+date 会优先用这份标题
    const items = await BC.syllabus._summaryItems(courseId);

    let text = "";
    const div = document.createElement("div");
    try {
      div.innerHTML = (await BC.api.syllabus(courseId)) || "";
      text += BC.syllabus._lineify(div);
    } catch (e) { /* 没有 syllabus 或无权限 */ }

    // 找正文里的 PDF 链接（同源才能 fetch，跨域 files 域会被 CORS 挡，静默跳过）
    const links = [...div.querySelectorAll("a[href]")]
      .map(a => a.getAttribute("href"))
      .filter(h => h && /\.pdf(\?|$)/i.test(h));
    for (const href of links.slice(0, 3)) {
      try {
        const url = href.startsWith("http") ? href : location.origin + href;
        if (new URL(url).origin !== location.origin) continue;
        const buf = await (await fetch(url, { credentials: "same-origin" })).arrayBuffer();
        text += "\n" + await BC.syllabus.extractPdfText(buf);
      } catch (e) { /* 跳过取不到/解析失败的 PDF */ }
    }
    if (BC.syllabus.onSyllabusPage() && BC.syllabus.courseIdFromPath() === String(courseId)) {
      text += "\n" + BC.syllabus.renderedPageText();
    }
    if (text.trim()) items.push(...BC.syllabus.extractFromText(text));

    return { items: BC.syllabus.dedupe(items), undated: BC.syllabus.findUndated(text) };
  },

  // 读取上传文件的纯文本（支持 .txt/.csv/.html/.md/.ics 和 .pdf；Word/PPT 仍需另存）
  async readFileText(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      return BC.syllabus.extractPdfText(await file.arrayBuffer());
    }
    if (/\.(docx?|pptx?)$/.test(name)) {
      throw new Error("Word/PPT 暂不支持，请另存为 PDF 或 .txt，或把文字粘贴到文本框");
    }
    return file.text();
  },

  /* ---------- PDF 文本提取（零依赖：DecompressionStream 解 FlateDecode + 内容流取文字） ---------- */
  _latin1(u8) {
    let s = "";
    const CH = 8192;
    for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return s;
  },

  async _inflate(bytes) {
    // DecompressionStream 对压缩数据后面的多余字节（endstream 前的换行）会直接报错，先把尾部空白裁掉
    let end = bytes.length;
    while (end > 0 && (bytes[end - 1] === 0x0a || bytes[end - 1] === 0x0d || bytes[end - 1] === 0x20 || bytes[end - 1] === 0x09)) end--;
    const body = bytes.subarray(0, end);
    for (const fmt of ["deflate", "deflate-raw"]) {
      try {
        const stream = new Blob([body]).stream().pipeThrough(new DecompressionStream(fmt));
        const ab = await new Response(stream).arrayBuffer();
        return new Uint8Array(ab);
      } catch (e) { /* 换格式重试 */ }
    }
    return null;
  },

  _decodeLiteral(s) {
    // 去掉外层括号并反转义
    s = s.slice(1, -1);
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "\\") {
        const n = s[++i];
        if (n === "n") out += "\n";
        else if (n === "r") out += "\r";
        else if (n === "t") out += "\t";
        else if (n === "b" || n === "f") out += " ";
        else if (n >= "0" && n <= "7") {
          let oct = n;
          for (let k = 0; k < 2 && s[i + 1] >= "0" && s[i + 1] <= "7"; k++) oct += s[++i];
          out += String.fromCharCode(parseInt(oct, 8) & 0xff);
        } else out += n; // \( \) \\ 等
      } else out += c;
    }
    return out;
  },

  _decodeHex(s) {
    const h = s.slice(1, -1).replace(/\s+/g, "");
    let out = "";
    for (let i = 0; i + 1 < h.length; i += 2) out += String.fromCharCode(parseInt(h.substr(i, 2), 16));
    return out;
  },

  // 从内容流文本里取 Tj / TJ / ' / " 显示的文字
  _pdfText(content) {
    const out = [];
    const re = /(\[(?:[^\]\\]|\\.)*\]|\((?:[^()\\]|\\.|\([^()]*\))*\)|<[0-9A-Fa-f\s]*>)\s*(TJ|Tj|'|")/g;
    let m;
    while ((m = re.exec(content))) {
      const op = m[1];
      if (op[0] === "[") {
        let piece = "";
        const inner = op.match(/\((?:[^()\\]|\\.|\([^()]*\))*\)|<[0-9A-Fa-f\s]*>/g) || [];
        inner.forEach(p => { piece += p[0] === "(" ? BC.syllabus._decodeLiteral(p) : BC.syllabus._decodeHex(p); });
        out.push(piece);
      } else if (op[0] === "(") {
        out.push(BC.syllabus._decodeLiteral(op));
      } else {
        out.push(BC.syllabus._decodeHex(op));
      }
    }
    return out.join("\n");
  },

  async extractPdfText(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const raw = BC.syllabus._latin1(u8);
    let collected = "";
    const reStream = /(?<!end)stream\r?\n/g;   // 别把 endstream\n 也当成流开头
    let m;
    while ((m = reStream.exec(raw))) {
      const dataStart = m.index + m[0].length;
      const end = raw.indexOf("endstream", dataStart);
      if (end < 0) continue;
      const dictStart = raw.lastIndexOf("<<", m.index);
      const dict = dictStart >= 0 ? raw.slice(dictStart, m.index) : "";
      // 有 /Length 就按长度精确切，避免把尾部换行带进去
      const lm = /\/Length\s+(\d+)(?!\s+0\s+R)/.exec(dict);
      const dataEnd = lm && dataStart + (+lm[1]) <= end ? dataStart + (+lm[1]) : end;
      const slice = u8.subarray(dataStart, dataEnd);
      if (/FlateDecode/.test(dict)) {
        const inf = await BC.syllabus._inflate(slice);
        if (inf) collected += BC.syllabus._latin1(inf) + "\n";
      } else if (!/(DCTDecode|JPXDecode|CCITTFaxDecode|JBIG2Decode|Image)/.test(dict)) {
        collected += raw.slice(dataStart, end) + "\n";
      }
    }
    const text = BC.syllabus._pdfText(collected);
    if (!text.trim()) {
      throw new Error("没能从该 PDF 提取到文字（可能是扫描件或特殊字体）。请改用文本/手动添加。");
    }
    return text;
  }
};
