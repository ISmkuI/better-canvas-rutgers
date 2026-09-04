/* 文档文字提取（零依赖）：PDF / PPTX / DOCX / XLSX / TXT / MD / CSV / HTML。
 * PPTX、DOCX、XLSX 都是 zip 包里的 XML：这里自带一个最小 zip 读取器（中央目录 + deflate-raw 解压），
 * 然后从 slide / document / sharedStrings 里抠出文本节点。PDF 走 BC.syllabus.extractPdfText。 */
BC.docs = {
  kindOf(name, ct) {
    const n = (name || "").toLowerCase();
    if (/\.pdf$/.test(n) || /pdf/i.test(ct || "")) return "pdf";
    if (/\.pptx$/.test(n)) return "pptx";
    if (/\.docx$/.test(n)) return "docx";
    if (/\.xlsx$/.test(n)) return "xlsx";
    if (/\.(txt|md|markdown|csv|tsv|json|log)$/.test(n) || /^text\//i.test(ct || "")) return "text";
    if (/\.(html?|htm)$/.test(n) || /html/i.test(ct || "")) return "html";
    if (/\.(ppt|doc|xls)$/.test(n)) return "legacy";   // 二进制老格式，不支持
    return "other";
  },
  summarizable(name, ct) { return ["pdf", "pptx", "docx", "xlsx", "text", "html"].includes(BC.docs.kindOf(name, ct)); },

  /* ---------- 最小 zip 读取器 ---------- */
  async unzip(arrayBuffer, filter) {
    const u8 = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);
    // 找 End of Central Directory（从尾部找签名 0x06054b50）
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) {
      if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("不是 zip 文件");
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const out = {};
    const dec = new TextDecoder("utf-8");
    for (let k = 0; k < count; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), cmtLen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
      p += 46 + nameLen + extraLen + cmtLen;
      if (filter && !filter(name)) continue;
      const lnameLen = dv.getUint16(local + 26, true), lextraLen = dv.getUint16(local + 28, true);
      const dataStart = local + 30 + lnameLen + lextraLen;
      const data = u8.subarray(dataStart, dataStart + csize);
      let bytes;
      if (method === 0) bytes = data;
      else if (method === 8) {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      } else continue;
      out[name] = bytes;
    }
    return out;
  },

  _xmlText(xml, tag) {
    // 抠出 <tag ...>文本</tag>，解 XML 实体
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, "g");
    const parts = []; let m;
    while ((m = re.exec(xml))) parts.push(m[1]);
    return parts.map(BC.docs._unent);
  },
  _unent(s) {
    return String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&amp;/g, "&");
  },

  async pptx(arrayBuffer) {
    const files = await BC.docs.unzip(arrayBuffer, n => /^ppt\/(slides|notesSlides)\/[^/]+\.xml$/.test(n));
    const dec = new TextDecoder("utf-8");
    const num = n => +((n.match(/(\d+)\.xml$/) || [])[1] || 0);
    const slides = Object.keys(files).filter(n => n.startsWith("ppt/slides/")).sort((a, b) => num(a) - num(b));
    const notes = {};
    Object.keys(files).filter(n => n.startsWith("ppt/notesSlides/")).forEach(n => { notes[num(n)] = n; });
    return slides.map(n => {
      const xml = dec.decode(files[n]);
      // 按段落 <a:p> 分行，段内 <a:t> 拼接
      const paras = (xml.match(/<a:p\b[\s\S]*?<\/a:p>/g) || []).map(p => BC.docs._xmlText(p, "a:t").join("")).filter(t => t.trim());
      let s = `--- 第 ${num(n)} 页 ---\n${paras.join("\n")}`;
      const nn = notes[num(n)];
      if (nn) { const nt = BC.docs._xmlText(dec.decode(files[nn]), "a:t").join(" ").trim(); if (nt) s += `\n[备注] ${nt}`; }
      return s;
    }).join("\n\n");
  },

  async docx(arrayBuffer) {
    const files = await BC.docs.unzip(arrayBuffer, n => n === "word/document.xml");
    if (!files["word/document.xml"]) throw new Error("docx 里没有 document.xml");
    const xml = new TextDecoder("utf-8").decode(files["word/document.xml"]);
    return (xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || []).map(p => BC.docs._xmlText(p, "w:t").join("")).filter(t => t.trim()).join("\n");
  },

  async xlsx(arrayBuffer) {
    const files = await BC.docs.unzip(arrayBuffer, n => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
    const dec = new TextDecoder("utf-8");
    const shared = files["xl/sharedStrings.xml"] ? (dec.decode(files["xl/sharedStrings.xml"]).match(/<si>[\s\S]*?<\/si>/g) || []).map(si => BC.docs._xmlText(si, "t").join("")) : [];
    return Object.keys(files).filter(n => n.startsWith("xl/worksheets/")).sort().map(n => {
      const xml = dec.decode(files[n]);
      const rows = (xml.match(/<row\b[\s\S]*?<\/row>/g) || []).map(r =>
        (r.match(/<c\b[^>]*>[\s\S]*?<\/c>/g) || []).map(c => {
          const v = (c.match(/<v>([^<]*)<\/v>/) || [])[1];
          if (v == null) return (c.match(/<t[^>]*>([^<]*)<\/t>/) || [])[1] || "";
          return /t="s"/.test(c) ? (shared[+v] || "") : v;
        }).join("\t"));
      return `--- ${n.replace(/^xl\/worksheets\//, "")} ---\n${rows.join("\n")}`;
    }).join("\n\n");
  },

  html(text) {
    const d = document.createElement("div");
    d.innerHTML = String(text).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "");
    return (d.innerText || d.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  },

  // 统一入口：arrayBuffer + 文件名 (+ content-type) -> 纯文本
  async extract(arrayBuffer, name, ct) {
    const kind = BC.docs.kindOf(name, ct);
    if (kind === "pdf") return BC.syllabus.extractPdfText(arrayBuffer);
    if (kind === "pptx") return BC.docs.pptx(arrayBuffer);
    if (kind === "docx") return BC.docs.docx(arrayBuffer);
    if (kind === "xlsx") return BC.docs.xlsx(arrayBuffer);
    const text = new TextDecoder("utf-8").decode(new Uint8Array(arrayBuffer));
    if (kind === "html") return BC.docs.html(text);
    if (kind === "text") return text;
    if (kind === "legacy") throw new Error("老版 .ppt/.doc/.xls 是二进制格式，暂不支持；请老师提供 pptx/docx 或先转成 PDF");
    throw new Error("不支持的文件类型");
  }
};
