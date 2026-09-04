/* WebReg「View / Print Schedule」PDF 导入 -> 每周课表（settings.schedule，source:"webreg"）。
 *
 * 这份 PDF 是浏览器（Skia）打印出来的：文字用 Type0/Identity-H 字体，字符串里是两字节字形号，
 * 要靠每个字体的 ToUnicode CMap 还原；星期靠列位置区分，所以不能只抽纯文本，必须带坐标。
 * 流程：对象表 -> 页面字体 + ToUnicode -> 逐算符跑内容流（q/Q/cm/BT/Tm/Td/Tf/Tj/TJ）得到 {x,y,text}
 *      -> 用 Monday…Friday 表头的 x 划列 -> 每列按 y 排成行 -> 「时间段 / 课名 / 课号(学分) / 教室 校区」四段解析
 *      -> 用课号匹配 Canvas 课程 id -> 同课同时段同教室的合并 days。 */
BC.webreg = {
  SCHEDULE_URL: "https://sims.rutgers.edu/webreg/viewSchedule.htm",
  DAY: { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 },

  /* ---------- 对象 / 字体 ---------- */
  _objects(raw) {
    const objs = {};
    const re = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;
    let m;
    while ((m = re.exec(raw))) objs[m[1]] = { body: m[2], start: m.index };
    return objs;
  },

  async _streamOf(objBody, u8, raw, objStart) {
    const sm = /(?<!end)stream\r?\n/.exec(objBody);
    if (!sm) return null;
    const dictStr = objBody.slice(0, sm.index);
    const dataStart = objStart + objBody.indexOf(sm[0]) + sm[0].length + String(objBody.match(/^\d+\s+0\s+obj/) || "").length;
    // 上面的偏移不可靠（objBody 不含 "N 0 obj" 前缀），改为在 raw 里从对象起点找 stream
    const abs = raw.indexOf(sm[0], objStart) + sm[0].length;
    const endAbs = raw.indexOf("endstream", abs);
    const lm = /\/Length\s+(\d+)(?!\s+0\s+R)/.exec(dictStr);
    const dataEnd = lm && abs + (+lm[1]) <= endAbs ? abs + (+lm[1]) : endAbs;
    const slice = u8.subarray(abs, dataEnd);
    if (/FlateDecode/.test(dictStr)) return BC.syllabus._inflate(slice);
    return slice;
  },

  // 解析 ToUnicode CMap -> Map(code -> string)
  _parseCMap(text) {
    const map = new Map();
    const hex2str = h => {
      // UTF-16BE
      let s = "";
      for (let i = 0; i + 3 < h.length + 1; i += 4) s += String.fromCharCode(parseInt(h.slice(i, i + 4), 16));
      return s;
    };
    let m;
    const reChar = /beginbfchar([\s\S]*?)endbfchar/g;
    while ((m = reChar.exec(text))) {
      const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g; let p;
      while ((p = re.exec(m[1]))) map.set(parseInt(p[1], 16), hex2str(p[2]));
    }
    const reRange = /beginbfrange([\s\S]*?)endbfrange/g;
    while ((m = reRange.exec(text))) {
      const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g; let p;
      while ((p = re.exec(m[1]))) {
        const lo = parseInt(p[1], 16), hi = parseInt(p[2], 16);
        if (p[4] != null) {
          const base = parseInt(p[4], 16);
          for (let c = lo; c <= hi && c - lo < 65536; c++) map.set(c, String.fromCharCode(base + (c - lo)));
        } else {
          const arr = (p[5].match(/<([0-9A-Fa-f]+)>/g) || []).map(x => hex2str(x.slice(1, -1)));
          arr.forEach((s, i) => map.set(lo + i, s));
        }
      }
    }
    return map;
  },

  // 页面字体资源：{ F4: { twoByte, map } }
  async _fonts(raw, u8, objs) {
    const fonts = {};
    const resolve = ref => { const r = /^\s*(\d+)\s+0\s+R/.exec(ref); return r ? objs[r[1]] : null; };
    // 找第一个 /Type /Page（不是 Pages）
    const page = Object.values(objs).find(o => /\/Type\s*\/Page\b/.test(o.body) && !/\/Type\s*\/Pages/.test(o.body));
    if (!page) return fonts;
    let res = page.body;
    const rref = /\/Resources\s+(\d+\s+0\s+R)/.exec(res);
    if (rref) res = (resolve(rref[1]) || {}).body || "";
    let fontDict = null;
    const fd = /\/Font\s*(<<[\s\S]*?>>|\d+\s+0\s+R)/.exec(res);
    if (fd) fontDict = fd[1].startsWith("<<") ? fd[1] : ((resolve(fd[1]) || {}).body || "");
    if (!fontDict) return fonts;
    const re = /\/(\w+)\s+(\d+)\s+0\s+R/g; let m;
    while ((m = re.exec(fontDict))) {
      const fo = objs[m[2]];
      if (!fo) continue;
      const twoByte = /\/Subtype\s*\/Type0/.test(fo.body) || /Identity-H/.test(fo.body);
      let map = new Map();
      const tu = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(fo.body);
      if (tu && objs[tu[1]]) {
        try {
          const bytes = await BC.webreg._streamOf(objs[tu[1]].body, u8, raw, objs[tu[1]].start);
          if (bytes) map = BC.webreg._parseCMap(BC.syllabus._latin1(bytes));
        } catch (e) {}
      }
      fonts[m[1]] = { twoByte, map };
    }
    return fonts;
  },

  /* ---------- 内容流 -> 带坐标的文字片段 ---------- */
  _tokenize(s) {
    const toks = [];
    let i = 0; const n = s.length;
    const isWs = c => c === " " || c === "\n" || c === "\r" || c === "\t" || c === "\f" || c === "\0";
    const isDelim = c => "()<>[]{}/%".includes(c);
    const readArray = () => {           // 已经消费了 "["
      const arr = [];
      while (i < n) {
        const c = s[i];
        if (isWs(c)) { i++; continue; }
        if (c === "]") { i++; break; }
        arr.push(readToken());
      }
      return { t: "arr", v: arr };
    };
    const readToken = () => {
      const c = s[i];
      if (c === "[") { i++; return readArray(); }
      if (c === "(") {
        let depth = 0, j = i, out = "";
        for (; j < n; j++) {
          const ch = s[j];
          if (ch === "\\") { j++; const nx = s[j];
            if (nx === "n") out += "\n"; else if (nx === "r") out += "\r"; else if (nx === "t") out += "\t";
            else if (nx >= "0" && nx <= "7") { let oct = nx; for (let k = 0; k < 2 && s[j + 1] >= "0" && s[j + 1] <= "7"; k++) oct += s[++j]; out += String.fromCharCode(parseInt(oct, 8) & 255); }
            else out += nx; continue; }
          if (ch === "(") { depth++; if (depth > 1) out += ch; continue; }
          if (ch === ")") { depth--; if (depth === 0) { j++; break; } out += ch; continue; }
          out += ch;
        }
        i = j;
        return { t: "str", v: out };
      }
      if (c === "<") {
        if (s[i + 1] === "<") { // dict：跳到匹配的 >>
          let depth = 0, j = i;
          for (; j < n - 1; j++) { if (s[j] === "<" && s[j + 1] === "<") { depth++; j++; } else if (s[j] === ">" && s[j + 1] === ">") { depth--; j++; if (depth === 0) { j++; break; } } }
          i = j; return { t: "dict" };
        }
        const j = s.indexOf(">", i);
        const h = s.slice(i + 1, j).replace(/\s+/g, "");
        let out = "";
        for (let k = 0; k + 1 < h.length + 1; k += 2) out += String.fromCharCode(parseInt(h.substr(k, 2).padEnd(2, "0"), 16));
        i = j + 1;
        return { t: "str", v: out };
      }
      if (c === "/") { let j = i + 1; while (j < n && !isWs(s[j]) && !isDelim(s[j])) j++; const v = s.slice(i + 1, j); i = j; return { t: "name", v }; }
      if (c === "%") { while (i < n && s[i] !== "\n") i++; return { t: "cmt" }; }
      if (c === "{" || c === "}" || c === ")" || c === ">" || c === "]") { i++; return { t: "junk" }; }
      // number or operator
      let j = i; while (j < n && !isWs(s[j]) && !isDelim(s[j])) j++;
      const w = s.slice(i, j); i = j;
      if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) return { t: "num", v: parseFloat(w) };
      return { t: "op", v: w };
    };
    while (i < n) {
      if (isWs(s[i])) { i++; continue; }
      const tk = readToken();
      if (tk.t !== "cmt" && tk.t !== "junk") toks.push(tk);
    }
    return toks;
  },

  _mul(m1, m2) { // 先 m1 再 m2
    return [
      m1[0] * m2[0] + m1[1] * m2[2], m1[0] * m2[1] + m1[1] * m2[3],
      m1[2] * m2[0] + m1[3] * m2[2], m1[2] * m2[1] + m1[3] * m2[3],
      m1[4] * m2[0] + m1[5] * m2[2] + m2[4], m1[4] * m2[1] + m1[5] * m2[3] + m2[5]
    ];
  },

  _decode(str, font) {
    if (!font) return str;
    let out = "";
    if (font.twoByte) {
      for (let i = 0; i + 1 < str.length; i += 2) {
        const code = (str.charCodeAt(i) << 8) | str.charCodeAt(i + 1);
        const u = font.map.get(code);
        out += u != null ? u : "";
      }
    } else {
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const u = font.map.get(code);
        out += u != null ? u : str[i];
      }
    }
    return out;
  },

  // 跑内容流，返回 runs: [{x, y, size, text}]；y 已翻成「越大越靠下」
  _runs(content, fonts) {
    const I = [1, 0, 0, 1, 0, 0];
    let ctm = I.slice(), stack = [], tm = I.slice(), tlm = I.slice(), font = null, size = 0, TL = 0;
    const runs = [];
    let cur = null;
    const toks = BC.webreg._tokenize(content);
    let ops = [];
    const nums = () => ops.filter(t => t.t === "num").map(t => t.v);
    const pos = () => {
      const M = BC.webreg._mul(tm, ctm);
      return { x: M[4], y: -M[5], size: size * Math.hypot(M[0], M[1]) || size };
    };
    const show = str => {
      const text = BC.webreg._decode(str, font);
      if (!text) return;
      const p = pos();
      if (cur && Math.abs(p.y - cur.y) < Math.max(1, cur.size * 0.5)) cur.text += text;
      else { cur = { x: p.x, y: p.y, size: p.size, text }; runs.push(cur); }
    };
    for (const tk of toks) {
      if (tk.t !== "op") { ops.push(tk); continue; }
      const op = tk.v, a = nums();
      switch (op) {
        case "q": stack.push(ctm.slice()); break;
        case "Q": ctm = stack.pop() || I.slice(); break;
        case "cm": if (a.length >= 6) ctm = BC.webreg._mul(a.slice(-6), ctm); break;
        case "BT": tm = I.slice(); tlm = I.slice(); cur = null; break;
        case "ET": cur = null; break;
        case "Tf": { const nm = ops.find(t => t.t === "name"); font = nm ? fonts[nm.v] : null; size = a[a.length - 1] || size; break; }
        case "Tm": if (a.length >= 6) { tlm = a.slice(-6); tm = tlm.slice(); } break;
        case "Td": tlm = BC.webreg._mul([1, 0, 0, 1, a[0] || 0, a[1] || 0], tlm); tm = tlm.slice(); break;
        case "TD": TL = -(a[1] || 0); tlm = BC.webreg._mul([1, 0, 0, 1, a[0] || 0, a[1] || 0], tlm); tm = tlm.slice(); break;
        case "TL": TL = a[0] || 0; break;
        case "T*": tlm = BC.webreg._mul([1, 0, 0, 1, 0, -TL], tlm); tm = tlm.slice(); break;
        case "Tj": { const s = ops.find(t => t.t === "str"); if (s) show(s.v); break; }
        case "'": case "\"": { tlm = BC.webreg._mul([1, 0, 0, 1, 0, -TL], tlm); tm = tlm.slice(); const s = ops.filter(t => t.t === "str").pop(); if (s) show(s.v); break; }
        case "TJ": { const arr = ops.find(t => t.t === "arr"); if (arr) arr.v.forEach(e => { if (e.t === "str") show(e.v); }); break; }
      }
      ops = [];
    }
    return runs;
  },

  // 整个 PDF -> runs（所有页面内容流）
  async textRuns(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const raw = BC.syllabus._latin1(u8);
    const objs = BC.webreg._objects(raw);
    const fonts = await BC.webreg._fonts(raw, u8, objs);
    const runs = [];
    for (const o of Object.values(objs)) {
      if (!/stream/.test(o.body) || /\/Length1|\/Subtype\s*\/Image|begincmap/.test(o.body)) continue;
      let bytes;
      try { bytes = await BC.webreg._streamOf(o.body, u8, raw, o.start); } catch (e) { continue; }
      if (!bytes) continue;
      const s = BC.syllabus._latin1(bytes);
      if (!/\bBT\b/.test(s) || /begincmap/.test(s)) continue;
      runs.push(...BC.webreg._runs(s, fonts));
    }
    return runs;
  },

  /* ---------- 课表解析 ---------- */
  _to24(t) {
    const m = /(\d{1,2}):(\d{2})\s*([AP])M/i.exec(t);
    if (!m) return "";
    let h = +m[1]; const mi = m[2]; const pm = m[3].toUpperCase() === "P";
    if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12;
    return `${String(h).padStart(2, "0")}:${mi}`;
  },

  parseRuns(runs) {
    const TIME = /^(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)$/i;
    const CODE = /(\d{2}:\d{3}:\d{3}:[A-Z0-9]{1,3}):(\d{4,6})\s*\(([\d.]+)\)/;
    // 表头
    const heads = runs.filter(r => BC.webreg.DAY[r.text.trim().toLowerCase()] != null);
    if (heads.length < 2) throw new Error("没有找到 Monday…Friday 表头，这不像 WebReg 的课表 PDF");
    // 只取同一行的表头（避免别处出现的星期词）
    const headY = heads.map(h => h.y).sort((a, b) => a - b)[Math.floor(heads.length / 2)];
    const cols = heads.filter(h => Math.abs(h.y - headY) < h.size).sort((a, b) => a.x - b.x)
      .map(h => ({ day: BC.webreg.DAY[h.text.trim().toLowerCase()], cx: h.x + h.text.length * h.size * 0.3 }));
    const gap = cols.length > 1 ? (cols[cols.length - 1].cx - cols[0].cx) / (cols.length - 1) : 100;
    const bounds = cols.map((c, i) => i === 0 ? c.cx - gap * 0.55 : (cols[i - 1].cx + c.cx) / 2);
    const right = cols[cols.length - 1].cx + gap * 0.55;
    // 表格下边界：By Arrangement 那行
    const cut = runs.find(r => /^By Arrangement/i.test(r.text.trim()));
    const yMax = cut ? cut.y - 1 : Infinity;

    // 分列
    const perCol = cols.map(() => []);
    runs.forEach(r => {
      if (r.y <= headY + 1 || r.y >= yMax) return;
      if (r.x < bounds[0] || r.x > right) return;
      let ci = 0; for (let i = 0; i < bounds.length; i++) if (r.x >= bounds[i]) ci = i;
      perCol[ci].push(r);
    });

    const entries = [];
    perCol.forEach((items, ci) => {
      items.sort((a, b) => (a.y - b.y) || (a.x - b.x));
      // 合并同一行
      const lines = [];
      items.forEach(r => {
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.y - r.y) < Math.max(1, r.size * 0.6)) last.text += " " + r.text.trim();
        else lines.push({ y: r.y, text: r.text.trim() });
      });
      let cur = null;
      lines.forEach(l => {
        const t = l.text.replace(/\s+/g, " ").trim();
        const tm = TIME.exec(t);
        if (tm) { cur = { day: cols[ci].day, start: BC.webreg._to24(tm[1]), end: BC.webreg._to24(tm[2]), nameLines: [], code: "", index: "", credits: "", locLines: [] }; entries.push(cur); return; }
        if (!cur) return;
        const cm = CODE.exec(t);
        if (cm && !cur.code) { cur.code = cm[1]; cur.index = cm[2]; cur.credits = cm[3];
          const before = t.slice(0, cm.index).trim(); if (before) cur.nameLines.push(before);
          const after = t.slice(cm.index + cm[0].length).trim(); if (after) cur.locLines.push(after); return; }
        if (!cur.code) cur.nameLines.push(t); else cur.locLines.push(t);
      });
    });

    return entries.filter(e => e.start && e.end).map(e => ({
      day: e.day, start: e.start, end: e.end, code: e.code, index: e.index, credits: e.credits,
      name: e.nameLines.join(" ").replace(/\s+/g, " ").trim(),
      location: e.locLines.join(" ").replace(/\s+/g, " ").trim()
    }));
  },

  // 课号 -> Canvas 课程 id（Canvas 课名形如 "2026FA - COMPUTER ARCHITECTURE 01:198:211:05-08"）
  matchCourse(code, scores) {
    if (!code) return "";
    const parts = code.split(":");             // SS DDD CCC SEC
    const base = parts.slice(0, 3).join(":");
    const sec = parts[3] || "";
    const cands = Object.entries(scores || {}).map(([cid, s]) => ({ cid, text: `${s.name || ""} ${s.code || ""}` }));
    const exact = cands.find(c => c.text.includes(code));
    if (exact) return exact.cid;
    const secPrefix = cands.find(c => c.text.includes(base + ":") && new RegExp(base.replace(/[:]/g, "\\:") + ":[A-Z0-9-]*" + sec).test(c.text));
    if (secPrefix) return secPrefix.cid;
    const byBase = cands.filter(c => c.text.includes(base));
    return byBase.length === 1 ? byBase[0].cid : (byBase[0] ? byBase[0].cid : "");
  },

  // 同课同时段同教室的合并 days
  merge(entries, scores) {
    const map = new Map();
    entries.forEach(e => {
      const key = `${e.code || e.name}|${e.start}|${e.end}|${e.location}`;
      if (!map.has(key)) {
        // section = 课号第四段（01:198:206:02:11528 -> "02"），index = 第五段；右侧栏「课程 Section」卡直接用
        map.set(key, {
          cid: BC.webreg.matchCourse(e.code, scores), code: e.code, section: (e.code || "").split(":")[3] || "", index: e.index || "",
          name: e.name, days: [], start: e.start, end: e.end, location: e.location, credits: e.credits, source: "webreg"
        });
      }
      const it = map.get(key);
      if (!it.days.includes(e.day)) it.days.push(e.day);
    });
    return [...map.values()].map(it => ({ ...it, days: it.days.sort((a, b) => a - b) }))
      .sort((a, b) => a.start.localeCompare(b.start));
  },

  // 文件 -> 写入 settings.schedule（替换旧的 webreg 条目，保留手填）
  async importFile(file) {
    const runs = await BC.webreg.textRuns(await file.arrayBuffer());
    if (!runs.length) throw new Error("没能从 PDF 里读到文字。请在 WebReg 的 View / Print Schedule 页用浏览器“打印 → 另存为 PDF”。");
    const parsed = BC.webreg.parseRuns(runs);
    if (!parsed.length) throw new Error("没有解析到任何课程时段。请确认是 WebReg 的课表 PDF。");
    let scores = {};
    try { scores = await BC.grades.fetchScores(); } catch (e) {}
    const merged = BC.webreg.merge(parsed, scores);
    // 用 Canvas 里的全名替代 PDF 里被截断的课名（COMPUTER ARCHITECTUR）
    merged.forEach(it => { const s = scores[it.cid]; if (s && s.name) it.name = s.name.replace(/^\d{4}[A-Z]{2}\s*-\s*/, ""); });
    await BC.storage.patch(st => {
      st.schedule = (st.schedule || []).filter(x => x.source !== "webreg").concat(merged);
      st.scheduleImportedAt = new Date().toISOString();
    });
    return { count: merged.length, matched: merged.filter(it => it.cid).length, entries: merged };
  },

  // 弹文件选择框，导入后刷新面板；status(fn) 收进度文字
  pickAndImport(status) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "application/pdf,.pdf";
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0];
      inp.remove();
      if (!f) return;
      status && status("解析中…");
      try {
        const r = await BC.webreg.importFile(f);
        status && status(`已导入 ${r.count} 门课的时段${r.matched < r.count ? `（${r.count - r.matched} 条没匹配到 Canvas 课程，仍会显示）` : ""}`);
        BC.bus.refreshBlocks();
      } catch (e) {
        status && status("导入失败：" + (e.message || e));
      }
    });
    inp.click();
  }
};
