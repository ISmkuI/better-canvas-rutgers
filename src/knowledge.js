/* 知识库（BC.kb）：把「特定材料」（课程文件 / 本页正文 / 本地文件 / 粘贴文本 / 已生成的总结）切成片段存在本机，
 * 提问时先在本机检索出最相关的几段，连同问题一起交给模型，让回答依据材料而不是模型的常识。
 *
 * 检索：BM25 纯词法，零依赖、离线、对所有模型服务都一样可用（各家 embedding 接口不统一，也不想为检索多花一次调用）。
 *   英文按词 + 极简去后缀（-s / -ing / -ed / -e，只求查询和材料两边一致），去停用词；中日韩按二元组。
 * 存储：chrome.storage.local（manifest 有 unlimitedStorage；顶层 Canvas 页、New Quizzes iframe、其它网站共用同一份）。
 *   每份材料一个键 bc_kb_<id>：{ ...meta, chunks:[string] }；目录 bc_kb_index：[meta]（不含正文，列表只读目录）。
 *   meta = { id, cid, course, name, source(file|page|upload|text|summary), key(去重用，如 file:123), ts, chars, n }
 * 作用域：在课程页时用「该课的材料 + 没归课程的通用材料」，不在课程页时用全部。
 * 索引在内存里按作用域懒建（_idx），材料增删后作废。
 * 语言：界面文案走 BC.t（界面语言）；发给模型的说明（prompt / context 里的片段标签）走回答语言——调用方可传 lang，
 *   不传则用 BC.assistant._replyLang()（设置里的回答语言，auto = 界面语言）。 */
BC.i18n.add({
  "内容太短（不到 50 字）": "Content too short (under 50 characters)", "没有可用的文字": "No usable text", "未命名": "Untitled",
  "第 {n} 段": "part {n}"
});
BC.kb = {
  INDEX_KEY: "bc_kb_index",
  CHUNK: 700,        // 每段目标字数
  OVERLAP: 80,       // 超长段落硬切时的重叠
  TOPK: 8,           // 取最相关的段数
  CTX_MAX: 9000,     // 一次带给模型的片段总字数上限
  _idx: {},

  _get(keys) { return new Promise(r => chrome.storage.local.get(keys, r)); },
  _set(obj) { return new Promise(r => chrome.storage.local.set(obj, r)); },
  _del(keys) { return new Promise(r => chrome.storage.local.remove(keys, r)); },

  async index() { return (await BC.kb._get(BC.kb.INDEX_KEY))[BC.kb.INDEX_KEY] || []; },
  inScope(m, cid) { return !cid || !m.cid || String(m.cid) === String(cid); },
  async list(cid) { return (await BC.kb.index()).filter(m => BC.kb.inScope(m, cid)); },
  async get(id) { return (await BC.kb._get("bc_kb_" + id))["bc_kb_" + id] || null; },
  async stats(cid) {
    const l = await BC.kb.list(cid);
    return { docs: l.length, chunks: l.reduce((s, m) => s + (m.n || 0), 0), chars: l.reduce((s, m) => s + (m.chars || 0), 0) };
  },

  /* ---------- 写入 ---------- */
  // 同一来源（key 相同、同一课程）再次添加 -> 覆盖旧的
  async add({ cid, course, name, source, key, text }) {
    const K = BC.kb;
    text = String(text || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
    if (text.length < 50) throw new Error(BC.t("内容太短（不到 50 字）"));
    const chunks = K.chunk(text);
    if (!chunks.length) throw new Error(BC.t("没有可用的文字"));
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const meta = { id, cid: cid ? String(cid) : "", course: course || "", name: String(name || BC.t("未命名")).slice(0, 120), source: source || "text",
                   key: key || "", ts: new Date().toISOString(), chars: text.length, n: chunks.length };
    const old = await K.index();
    const dup = key ? old.filter(m => m.key === key && m.cid === meta.cid) : [];
    if (dup.length) await K._del(dup.map(m => "bc_kb_" + m.id));
    await K._set({ ["bc_kb_" + id]: { ...meta, chunks }, [K.INDEX_KEY]: [meta, ...old.filter(m => !dup.includes(m))] });
    K._idx = {};
    return meta;
  },
  async remove(id) {
    const K = BC.kb;
    await K._del("bc_kb_" + id);
    await K._set({ [K.INDEX_KEY]: (await K.index()).filter(m => m.id !== id) });
    K._idx = {};
  },
  async removeAll(cid) {
    const K = BC.kb;
    const all = await K.index();
    const gone = all.filter(m => K.inScope(m, cid));
    if (gone.length) await K._del(gone.map(m => "bc_kb_" + m.id));
    await K._set({ [K.INDEX_KEY]: all.filter(m => !gone.includes(m)) });
    K._idx = {};
    return gone.length;
  },

  /* ---------- 切块：按空行分段累积到 CHUNK 字；超长段落按句末硬切并留重叠 ---------- */
  chunk(text) {
    const K = BC.kb;
    const paras = String(text || "").split(/\n\s*\n|\n(?=--- )/).map(p => p.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
    const out = [];
    let cur = "";
    const flush = () => { if (cur.trim().length > 20) out.push(cur.trim()); cur = ""; };
    for (let p of paras) {
      while (p.length > K.CHUNK * 1.5) {
        const head = p.slice(0, K.CHUNK);
        const m = head.match(/^[\s\S]*[。！？；.!?;]\s?/);
        const cut = m && m[0].length > K.CHUNK / 3 ? m[0].length : K.CHUNK;
        flush();
        out.push(p.slice(0, cut).trim());
        p = p.slice(Math.max(0, cut - K.OVERLAP)).trim();
      }
      if (cur && cur.length + p.length + 1 > K.CHUNK) flush();
      cur += (cur ? "\n" : "") + p;
    }
    flush();
    return out;
  },

  /* ---------- 分词 ---------- */
  STOP: new Set(("a an the of to in on for and or is are was were be been being by with as at from that this these those it its into than then so if not no nor do does did " +
    "but can could should would will shall may might must have has had what which who whom whose how when where why we you they he she i me my our your their them his her us " +
    "about over under between also each per vs etc via any all some such only very just more most other another there here out up down off").split(" ")),
  _stem(w) {
    w = w.replace(/'s$|'$/, "");
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
    if (w.length >= 5 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
    if (w.length > 2 && /e$/.test(w)) w = w.slice(0, -1);   // use / uses / using 都归到 us
    return w;
  },
  tokens(s) {
    const K = BC.kb;
    const out = [];
    const str = String(s || "").toLowerCase().normalize("NFKC");
    for (const w of str.match(/[a-z0-9]+(?:[.'\-+#][a-z0-9]+)*/g) || []) {
      if (w.length < 2 && !/\d/.test(w)) continue;
      if (K.STOP.has(w)) continue;
      out.push(K._stem(w));
    }
    for (const run of str.match(/[㐀-鿿぀-ヿ가-힯]+/g) || []) {
      if (run.length === 1) out.push(run);
      for (let i = 0; i + 1 < run.length; i++) out.push(run.slice(i, i + 2));
    }
    return out;
  },

  /* ---------- 索引 + BM25 ---------- */
  async _build(cid) {
    const K = BC.kb;
    const metas = await K.list(cid);
    const key = cid || "*";
    const sig = metas.map(m => m.id).sort().join(",");
    if (K._idx[key] && K._idx[key].sig === sig) return K._idx[key];
    const docs = metas.length ? await K._get(metas.map(m => "bc_kb_" + m.id)) : {};
    const chunks = [], df = new Map();
    let total = 0;
    for (const m of metas) {
      const d = docs["bc_kb_" + m.id];
      if (!d) continue;
      d.chunks.forEach((text, i) => {
        const tf = new Map();
        const toks = K.tokens(text);
        toks.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
        for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
        chunks.push({ id: m.id, name: m.name, i, text, tf, len: toks.length });
        total += toks.length;
      });
    }
    return (K._idx[key] = { sig, chunks, df, avg: total / (chunks.length || 1), docs: metas.length });
  },
  async search(cid, query, k) {
    const K = BC.kb;
    const idx = await K._build(cid);
    const q = [...new Set(K.tokens(query))];
    if (!idx.chunks.length || !q.length) return [];
    const k1 = 1.5, b = 0.75, N = idx.chunks.length;
    return idx.chunks.map(c => {
      let s = 0;
      for (const t of q) {
        const f = c.tf.get(t);
        if (!f) continue;
        const n = idx.df.get(t) || 0;
        s += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * c.len / idx.avg));
      }
      return { c, s };
    }).filter(x => x.s > 0).sort((a, b2) => b2.s - a.s).slice(0, k || K.TOPK).map(x => ({ ...x.c, score: x.s }));
  },

  // 回答语言（发给模型的文字用）："zh" | "en"
  lang(l) {
    if (l === "zh" || l === "en") return l;
    return BC.assistant && BC.assistant._replyLang ? BC.assistant._replyLang() : BC.i18n.lang;
  },
  // 组装给模型的材料片段（编号 [n]）+ 引用列表；没命中返回 null。lang 可选（见 lang()）
  async context(cid, query, lang) {
    const K = BC.kb;
    const hits = await K.search(cid, query);
    if (!hits.length) return null;
    const en = K.lang(lang) === "en";
    const picked = [];
    let used = 0;
    for (const h of hits) { if (picked.length && used + h.text.length > K.CTX_MAX) break; picked.push(h); used += h.text.length; }
    const text = picked.map((h, n) => (en ? `[${n + 1}] (${h.name} · part ${h.i + 1})` : `[${n + 1}]（${h.name} · 第 ${h.i + 1} 段）`) + `\n${h.text}`).join("\n\n");
    return { text, sources: picked.map((h, n) => ({ n: n + 1, id: h.id, name: h.name, i: h.i })) };
  },
  // 给系统提示用的一段说明 + 片段。lang 可选（见 lang()）
  prompt(ctx, lang) {
    if (BC.kb.lang(lang) === "en") {
      return "Below are the passages from the student's knowledge base most relevant to the question (sorted by relevance, numbered [n]). Base your answer on these passages first, " +
        "and cite the passage number at the end of the sentence wherever you use one (e.g. [1]). For anything the passages do not cover, say explicitly that " +
        "\"the materials do not mention this\", then supplement with general knowledge and mark it as a supplement.\n[Passages]\n" + ctx.text + "\n[/Passages]";
    }
    return "下面是学生知识库里与问题最相关的材料片段（按相关度排序，编号 [n]）。回答时优先依据这些片段，用到哪段就在句末标注编号（如 [1]）；" +
      "片段里没有涉及的内容要明确说「材料里没有提到」，再用一般知识补充并说明这是补充。\n[材料片段]\n" + ctx.text + "\n[/材料片段]";
  },
  // 检索没命中时给模型的说明（study.js 的页面对话用）
  missPrompt(lang) {
    return BC.kb.lang(lang) === "en"
      ? "(This search matched no passages in the materials: tell the student plainly that the materials contain nothing relevant and suggest rephrasing or adding materials; do not answer from thin air.)"
      : "（这次检索没有命中任何材料片段：请直接告诉学生材料里没有相关内容，并建议换个问法或补充材料，不要凭空回答。）";
  },
  // 界面上的引用列表（界面语言）
  sourcesLine(sources) {
    const esc = BC.util.esc;
    return sources.map(s => `<span class="bc-ai-src" title="${esc(s.name)} · ${esc(BC.t("第 {n} 段", { n: s.i + 1 }))}">[${s.n}] ${esc(s.name.length > 28 ? s.name.slice(0, 26) + "…" : s.name)} §${s.i + 1}</span>`).join(" ");
  }
};
