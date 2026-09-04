/* 学习工具抽屉（右下角 📖）：
 *   1) 页面对话 —— 把当前 Canvas 页面（Page / 作业说明 / 讨论 / 公告 / 大纲 / 文件预览里的 PDF）正文喂给模型，一键总结、生成大纲、就内容提问
 *   2) 闪卡 —— 从页面或选中文字生成问答卡，按课程存成卡组，间隔重复复习（Leitner 盒子）
 *   3) 练习 —— 生成选择题自测，即时判分 + 解析，错题一键存题库
 * 模型调用复用 BC.assistant.call；测验 / 考试作答页面同样不激活（BC.assistant.isBlocked）。 */
BC.study = {
  ID: "bc-study",
  BTN_ID: "bc-study-btn",
  _settings: null,
  _tab: "chat",
  _pageText: "",
  _chat: [],
  _cards: [],       // 本次生成、尚未保存的闪卡
  _quiz: null,      // { items:[{q, options, answer, explain}], idx, picked:[], done }

  // Leitner：盒子 1..5 的复习间隔（天）；「又忘了」回到盒子 1 且 10 分钟后再来
  INTERVALS: [1, 3, 7, 14, 30],

  init(settings) {
    const S = BC.study;
    S._settings = settings;
    const on = settings.assistant && settings.assistant.enabled !== false;
    let btn = document.getElementById(S.BTN_ID);
    if (!on || (BC.assistant && BC.assistant.isBlocked())) { btn?.remove(); document.getElementById(S.ID)?.remove(); return; }
    if (btn) return;
    btn = document.createElement("button");
    btn.id = S.BTN_ID; btn.type = "button"; btn.title = "学习工具：页面对话 / 闪卡 / 练习"; btn.textContent = "📖";
    btn.addEventListener("click", () => S.toggle());
    document.body.appendChild(btn);
  },

  /* ---------- 页面正文 ---------- */
  async pageText() {
    const S = BC.study;
    if (S._pageText) return S._pageText;
    let text = "";
    // 文件预览页：抓文件本体（PDF 用零依赖提取器；文本文件直接读）
    const fm = location.pathname.match(/^(\/courses\/\d+)?\/files\/(\d+)/);
    if (fm) {
      try {
        const r = await fetch(`${location.pathname.replace(/\/(preview|edit)?\/?$/, "")}/download?download_frd=1`, { credentials: "same-origin" });
        const ct = r.headers.get("content-type") || "";
        if (/pdf/i.test(ct)) text = await BC.syllabus.extractPdfText(await r.arrayBuffer());
        else if (/^text\//i.test(ct) || /json|xml|csv/i.test(ct)) text = await r.text();
      } catch (e) { console.warn("[BC] study file", e); }
    }
    if (!text) {
      const sels = [".user_content", "#assignment_show .description", ".discussion-section", ".discussion_entry .message", "#discussion_topic",
                    ".announcement", ".show-content", "#syllabusContainer", "#wiki_page_show", "#content .ig-list", "#content"];
      for (const sel of sels) {
        const nodes = [...document.querySelectorAll(sel)];
        if (!nodes.length) continue;
        text = nodes.map(n => n.innerText || "").join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
        if (text.length > 200) break;
      }
    }
    if (text.length > 40000) text = text.slice(0, 40000) + "\n…（后面已截断）";
    S._pageText = text;
    return text;
  },

  async ctx() { return BC.assistant._context(); },

  /* ---------- 抽屉 ---------- */
  toggle() {
    const S = BC.study;
    const d = document.getElementById(S.ID);
    if (d) { d.remove(); return; }
    S.open();
  },

  async open(tab) {
    const S = BC.study;
    const esc = BC.util.esc;
    if (tab) S._tab = tab;
    document.getElementById(S.ID)?.remove();
    const d = document.createElement("div");
    d.id = S.ID;
    d.innerHTML =
      `<div class="bc-study-head">
         <span class="bc-study-title">📖 学习工具</span>
         <span class="bc-study-ctx"></span>
         <button type="button" class="bc-study-close">✕</button>
       </div>
       <div class="bc-study-tabs">
         <button data-tab="chat">💬 页面对话</button>
         <button data-tab="cards">🃏 闪卡</button>
         <button data-tab="quiz">📝 练习</button>
         <button data-tab="files">📁 资料</button>
         <button data-tab="bank" title="打开题库">📚 题库</button>
       </div>
       <div class="bc-study-body"></div>
       <div class="bc-study-status"></div>`;
    document.body.appendChild(d);
    d.querySelector(".bc-study-close").onclick = () => d.remove();
    d.querySelectorAll(".bc-study-tabs button").forEach(b => b.onclick = () => {
      if (b.dataset.tab === "bank") { BC.assistant.openBank(); return; }
      S._tab = b.dataset.tab; S._renderTab();
    });
    const c = await S.ctx();
    d.querySelector(".bc-study-ctx").textContent = c.course || c.title || "";
    if (!BC.assistant.configured()) S._status("还没配置模型：右下角 ⚙ → 「✨ 助手」填 API key。", true);
    S._renderTab();
  },

  _status(t, err) {
    const el = document.querySelector("#" + BC.study.ID + " .bc-study-status");
    if (!el) return;
    el.textContent = t || ""; el.classList.toggle("bc-ai-err", !!err);
  },

  _renderTab() {
    const S = BC.study;
    const d = document.getElementById(S.ID);
    if (!d) return;
    d.querySelectorAll(".bc-study-tabs button").forEach(b => b.classList.toggle("bc-study-active", b.dataset.tab === S._tab));
    const body = d.querySelector(".bc-study-body");
    body.innerHTML = "";
    ({ chat: S._tabChat, cards: S._tabCards, quiz: S._tabQuiz, files: S._tabFiles }[S._tab] || S._tabChat)(body);
  },

  /* ---------- 4) 资料库：一键获取课程全部文件 + 长文档总结 ---------- */
  _files: null,        // { cid, list:[{id, name, url, size, ct, folder, updated}] }
  _courseSel: "",      // 不在课程页时下拉框选的课程；标签页重建（总结完成后会重画）时靠它恢复选中项，否则会跳回第一门课
  _fileText: {},       // fileId -> 提取出的文本（本页会话缓存）
  CHUNK: 40000,        // 长文档分块字数（约 1 万多 token，现在的模型都吃得下；块越少往返越少）
  PARALLEL: 3,         // 分块小结并行数

  _icon(kind) { return { pdf: "📕", pptx: "📊", docx: "📝", xlsx: "📈", text: "📄", html: "🌐", legacy: "📎", other: "📎" }[kind] || "📎"; },
  _fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : n > 1024 ? Math.round(n / 1024) + " KB" : (n || 0) + " B"; },

  async _courseId() {
    const c = await BC.study.ctx();
    if (c.cid) return c.cid;
    const sel = document.querySelector("#" + BC.study.ID + " .bc-study-course");
    return sel ? sel.value : (BC.study._courseSel || "");
  },

  async _loadFiles(cid) {
    const S = BC.study;
    if (S._files && S._files.cid === cid) return S._files.list;
    let files = [];
    try { files = await BC.api.courseFiles(cid); }
    catch (e) { files = await BC.api.moduleFiles(cid); }        // Files 区被隐藏：退回模块里的文件
    const folders = {};
    (await BC.api.courseFolders(cid)).forEach(f => { folders[f.id] = (f.full_name || f.name || "").replace(/^course files\/?/i, ""); });
    const seen = new Set();
    const list = files.filter(f => f && f.id && !seen.has(f.id) && seen.add(f.id)).map(f => ({
      id: String(f.id), name: f.display_name || f.filename || ("file " + f.id), url: f.url || "", size: f.size || 0,
      ct: f["content-type"] || f.content_type || "", folder: f._module ? "模块 / " + f._module : (folders[f.folder_id] || ""),
      updated: f.updated_at || f.created_at || "", kind: BC.docs.kindOf(f.display_name || f.filename || "", f["content-type"] || "")
    })).sort((a, b) => (a.folder || "").localeCompare(b.folder || "") || a.name.localeCompare(b.name));
    S._files = { cid, list };
    return list;
  },

  async _tabFiles(body) {
    const S = BC.study;
    const esc = BC.util.esc;
    const c = await S.ctx();
    let cid = c.cid;
    // 不在课程页：给个课程下拉
    let courseSel = "";
    if (!cid) {
      const scores = await BC.grades.fetchScores().catch(() => ({}));
      const opts = Object.entries(scores).map(([id, s]) => `<option value="${id}"${String(id) === String(S._courseSel) ? " selected" : ""}>${esc(BC.util.courseTitle(s.name || s.code))}</option>`).join("");
      courseSel = `<select class="bc-study-course">${opts}</select>`;
    }
    body.innerHTML =
      `<div class="bc-study-row">${courseSel}
         <input type="search" class="bc-study-fq" placeholder="搜文件名">
         <select class="bc-study-ftype"><option value="">全部类型</option><option value="pdf">PDF</option><option value="pptx">PPT</option><option value="docx">Word</option><option value="other">其他</option></select>
       </div>
       <div class="bc-study-row">
         <button type="button" class="bc-study-dlall">⬇ 全部下载</button>
         <button type="button" class="bc-study-sumall">✨ 总结全部可读文档</button>
         <span class="bc-study-fcount"></span>
       </div>
       <div class="bc-study-flist"><div class="bc-study-empty">读取文件列表…</div></div>
       <div class="bc-study-sub">已生成的总结</div>
       <div class="bc-study-slist"></div>`;
    const draw = async () => {
      cid = await S._courseId();
      if (!c.cid) S._courseSel = cid;   // 记住下拉框当前选的课
      if (!cid) { body.querySelector(".bc-study-flist").innerHTML = `<div class="bc-study-empty">没有在读课程</div>`; return; }
      let list;
      try { list = await S._loadFiles(cid); } catch (e) { body.querySelector(".bc-study-flist").innerHTML = `<div class="bc-study-empty">读取失败：${esc(e.message)}</div>`; return; }
      const q = body.querySelector(".bc-study-fq").value.trim().toLowerCase();
      const t = body.querySelector(".bc-study-ftype").value;
      const shown = list.filter(f => (!q || f.name.toLowerCase().includes(q)) && (!t || (t === "other" ? !["pdf", "pptx", "docx"].includes(f.kind) : f.kind === t)));
      body.querySelector(".bc-study-fcount").textContent = `${shown.length} / ${list.length} 个文件`;
      const sums = (S._settings.summaries || []).filter(x => String(x.cid) === String(cid));
      const done = new Set(sums.map(x => x.fileId));
      let folder = null, html = "";
      shown.forEach(f => {
        if (f.folder !== folder) { folder = f.folder; html += `<div class="bc-study-folder">📂 ${esc(folder || "根目录")}</div>`; }
        html += `<div class="bc-study-file" data-id="${f.id}">
          <span class="bc-study-ficon">${S._icon(f.kind)}</span>
          <div class="bc-study-fbody"><a href="${esc(f.url)}" target="_blank" rel="noopener" title="${esc(f.name)}">${esc(f.name)}</a>
            <div class="bc-study-fmeta">${S._fmtSize(f.size)}${f.updated ? " · " + BC.util.fmtDate(f.updated) : ""}${done.has(f.id) ? ' · <span class="bc-study-ok">已总结</span>' : ""}</div></div>
          <button type="button" class="bc-study-fdl" title="下载">⬇</button>
          ${BC.docs.summarizable(f.name, f.ct) ? `<button type="button" class="bc-study-fsum" title="生成复习总结">✨</button><button type="button" class="bc-study-fchat" title="在「页面对话」里就这个文件提问">💬</button>` : ""}
        </div>`;
      });
      body.querySelector(".bc-study-flist").innerHTML = html || `<div class="bc-study-empty">没有文件</div>`;
      body.querySelectorAll(".bc-study-file").forEach(el => {
        const f = list.find(x => x.id === el.dataset.id);
        el.querySelector(".bc-study-fdl").onclick = () => S._download(f, c);
        const sb = el.querySelector(".bc-study-fsum"); if (sb) sb.onclick = () => S._summarizeFile(f, c, sb);
        const cb = el.querySelector(".bc-study-fchat"); if (cb) cb.onclick = async () => {
          try { S._status("读取文件…"); const text = await S._extractFile(f); S._pageText = `【文件：${f.name}】\n${text.slice(0, 40000)}`; S._chat = []; S._status(""); S.open("chat"); }
          catch (e) { S._status("读取失败：" + e.message, true); }
        };
      });
      // 已有总结
      body.querySelector(".bc-study-slist").innerHTML = sums.length ? sums.map(x => `
        <details class="bc-study-sum" data-id="${esc(x.id)}">
          <summary>${esc(x.name)} <span class="bc-when">${BC.util.fmtDate(x.ts)} · ${x.chars} 字</span></summary>
          <div class="bc-ai-msg bc-ai-assistant">${BC.assistant._md(x.summary)}</div>
          <div class="bc-study-row"><button type="button" data-copy>复制</button><button type="button" data-md>导出 MD</button><button type="button" data-cards>🃏 生成闪卡</button><button type="button" class="bc-del" data-del>删除</button></div>
        </details>`).join("") : `<div class="bc-study-empty">还没有总结。点文件旁的 ✨。</div>`;
      body.querySelectorAll(".bc-study-sum").forEach(el => {
        const x = sums.find(y => y.id === el.dataset.id);
        el.querySelector("[data-copy]").onclick = () => navigator.clipboard.writeText(x.summary).then(() => S._status("已复制"));
        el.querySelector("[data-md]").onclick = () => S._downloadText(`# ${x.name}\n\n${x.summary}`, x.name.replace(/\.[^.]+$/, "") + " - 总结.md");
        el.querySelector("[data-cards]").onclick = () => { S._tab = "cards"; S._renderTab(); S._genCards(x.summary, 12); };
        el.querySelector("[data-del]").onclick = async () => { await BC.storage.patch(st => { st.summaries = (st.summaries || []).filter(y => y.id !== x.id); }); S._settings.summaries = (S._settings.summaries || []).filter(y => y.id !== x.id); draw(); };
      });
    };
    body.querySelectorAll(".bc-study-fq,.bc-study-ftype,.bc-study-course").forEach(el => el.addEventListener("input", () => { if (el.classList.contains("bc-study-course")) { S._courseSel = el.value; S._files = null; } draw(); }));
    body.querySelector(".bc-study-dlall").onclick = async () => {
      const list = S._files ? S._files.list : [];
      if (!list.length) return;
      if (!confirm(`下载这门课的全部 ${list.length} 个文件到「下载/Better Canvas/${BC.util.courseTitle(c.course) || cid}/」？`)) return;
      let n = 0;
      for (const f of list) { if (await S._download(f, c, true)) n++; S._status(`下载中… ${n} / ${list.length}`); }
      S._status(`已发起 ${n} 个下载，看浏览器下载栏`);
    };
    body.querySelector(".bc-study-sumall").onclick = async () => {
      const list = (S._files ? S._files.list : []).filter(f => BC.docs.summarizable(f.name, f.ct));
      const done = new Set((S._settings.summaries || []).filter(x => String(x.cid) === String(cid)).map(x => x.fileId));
      const todo = list.filter(f => !done.has(f.id));
      if (!todo.length) { S._status("没有待总结的文档", true); return; }
      if (!confirm(`要总结 ${todo.length} 个文档（已总结的跳过）。每个文档会调用一到多次模型，确认继续？`)) return;
      for (let i = 0; i < todo.length; i++) { S._status(`总结中 ${i + 1} / ${todo.length}：${todo[i].name}`); await S._summarizeFile(todo[i], c, null, true); }
      S._status("全部完成"); draw();
    };
    draw();
  },

  _downloadText(text, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  async _download(f, c, quiet) {
    const safe = s => String(s || "").replace(/[\\/:*?"<>|]+/g, "_").trim();
    const filename = ["Better Canvas", safe(BC.util.courseTitle(c.course) || ("course " + (c.cid || ""))), ...(f.folder ? f.folder.split("/").map(safe).filter(Boolean) : []), safe(f.name)].join("/");
    let r;
    try { r = await chrome.runtime.sendMessage({ type: "bc-download", url: f.url, filename }); } catch (e) { r = { ok: false, error: e.message }; }
    if (!r || !r.ok) { if (!quiet) BC.study._status("下载失败：" + (r && r.error || "无响应"), true); return false; }
    if (!quiet) BC.study._status("已开始下载 " + f.name);
    return true;
  },

  async _extractFile(f) {
    const S = BC.study;
    if (S._fileText[f.id]) return S._fileText[f.id];
    const r = await fetch(f.url, { credentials: "same-origin" });
    if (!r.ok) throw new Error(`下载失败 HTTP ${r.status}`);
    const text = (await BC.docs.extract(await r.arrayBuffer(), f.name, r.headers.get("content-type") || f.ct)).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 50) throw new Error("没有提取到文字（可能是扫描件 / 图片型 PDF）");
    S._fileText[f.id] = text;
    return text;
  },

  // 长文档 -> 分块小结（map）-> 合并成一份干净的复习总结（reduce）
  async summarizeText(text, name, onProgress) {
    const S = BC.study;
    const chunks = [];
    for (let i = 0; i < text.length; i += S.CHUNK) chunks.push(text.slice(i, i + S.CHUNK));
    const FINAL = `请把内容整理成一份干净、便于复习的总结，用 Markdown，结构固定为：
## 一句话概览
## 核心概念（每条：术语 — 定义，术语保留英文）
## 重点内容（按原文顺序分小节，要点式，保留关键数字 / 公式 / 步骤）
## 公式与定义速查（如有）
## 可能的考点 / 易错点
## 待澄清的问题（原文没讲清楚的地方）
用中文，不要加任何前言后语。`;
    if (chunks.length === 1) {
      return BC.assistant.call("你是把课程材料整理成复习笔记的助教。只依据给定内容，不编造。",
        [{ role: "user", content: [{ type: "text", text: `${FINAL}\n\n材料《${name}》：\n${text}` }] }]);
    }
    // map 阶段并行跑（PARALLEL 个一组）：等待时间从「块数 × 单次」降到「ceil(块数 / 并行数) × 单次」
    const notes = new Array(chunks.length);
    let done = 0, next = 0;
    onProgress && onProgress(`分块小结 0 / ${chunks.length}`);
    const worker = async () => {
      while (next < chunks.length) {
        const i = next++;
        notes[i] = await BC.assistant.call("你是把课程材料整理成复习笔记的助教。只依据给定内容，不编造。",
          [{ role: "user", content: [{ type: "text", text: `这是材料《${name}》的第 ${i + 1}/${chunks.length} 部分。请提炼要点：概念定义、关键论述、公式 / 步骤、例子、数字，要点式，保留信息密度，控制在 800 字以内，用中文，术语保留英文。\n\n${chunks[i]}` }] }]);
        onProgress && onProgress(`分块小结 ${++done} / ${chunks.length}`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(S.PARALLEL, chunks.length) }, worker));
    onProgress && onProgress("合并总结…");
    return BC.assistant.call("你是把课程材料整理成复习笔记的助教。只依据给定内容，不编造。",
      [{ role: "user", content: [{ type: "text", text: `下面是材料《${name}》各部分的要点小结，请合并去重后${FINAL}\n\n${notes.map((n, i) => `【第 ${i + 1} 部分】\n${n}`).join("\n\n")}` }] }]);
  },

  async _summarizeFile(f, c, btn, quiet) {
    const S = BC.study;
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    try {
      S._status("读取文件…");
      const text = await S._extractFile(f);
      const summary = await S.summarizeText(text, f.name, t => S._status(`${f.name}：${t}`));
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: new Date().toISOString(), cid: c.cid || (S._files && S._files.cid) || "", course: c.course, fileId: f.id, name: f.name, url: f.url, chars: text.length, summary };
      await BC.storage.patch(st => { st.summaries = (st.summaries || []).filter(x => x.fileId !== f.id); st.summaries.unshift(item); if (st.summaries.length > 200) st.summaries.length = 200; });
      S._settings.summaries = [item, ...(S._settings.summaries || []).filter(x => x.fileId !== f.id)];
      if (!quiet) { S._status("总结完成"); S._renderTab(); }
    } catch (e) {
      S._status(`${f.name}：${e.message}`, true);
      if (btn) { btn.disabled = false; btn.textContent = "✨"; }
    }
  },

  /* ---------- 1) 页面对话 ---------- */
  _tabChat(body) {
    const S = BC.study;
    body.innerHTML =
      `<div class="bc-study-row">
         <button type="button" data-act="summary">📄 总结要点</button>
         <button type="button" data-act="outline">🧭 生成大纲</button>
         <button type="button" data-act="terms">🔑 关键术语</button>
         <button type="button" data-act="questions">❓ 可能考什么</button>
       </div>
       <div class="bc-study-src"></div>
       <div class="bc-ai-answer bc-study-answer"></div>
       <div class="bc-study-ask"><input type="text" placeholder="就这个页面提问…（Enter 发送）"><button type="button">发送</button></div>`;
    const PROMPTS = {
      summary: "请用要点总结这个页面的内容：先一句话概括，再列 5–10 条要点，最后写出需要记住的公式 / 定义 / 截止日期（如果有）。",
      outline: "请把这个页面的内容整理成层级大纲（最多三级），每个条目一句话。",
      terms: "请列出这个页面里的关键术语，每个给出简明定义和一个例子，按重要性排序。",
      questions: "根据这个页面的内容，列出 8 个最可能出现在作业或考试里的问题，并给每个问题写一句「答题要点」（不要完整答案）。"
    };
    body.querySelectorAll("[data-act]").forEach(b => b.onclick = () => S._chatSend(PROMPTS[b.dataset.act], true));
    const inp = body.querySelector(".bc-study-ask input");
    const go = () => { const t = inp.value.trim(); if (t) { S._chatSend(t, false); inp.value = ""; } };
    inp.addEventListener("keydown", ev => { if (ev.key === "Enter") go(); });
    body.querySelector(".bc-study-ask button").onclick = go;
    S._renderChat();
    S.pageText().then(t => { const el = body.querySelector(".bc-study-src"); if (el) el.textContent = t ? `已读取页面正文 ${t.length} 字` : "这个页面没有可读取的正文"; });
  },

  _renderChat() {
    const S = BC.study;
    const box = document.querySelector("#" + S.ID + " .bc-study-answer");
    if (!box) return;
    box.innerHTML = S._chat.map(m => `<div class="bc-ai-msg bc-ai-${m.role}">${BC.assistant._md(m.content[0].text.replace(/^\[页面正文\][\s\S]*?\[\/页面正文\]\s*/, ""))}</div>`).join("")
      || `<div class="bc-study-empty">点上面的按钮，或直接提问。</div>`;
    box.scrollTop = box.scrollHeight;
  },

  async _chatSend(text, fresh) {
    const S = BC.study;
    const page = await S.pageText();
    if (!page) { S._status("这个页面没有可读取的正文", true); return; }
    if (fresh) S._chat = [];
    const first = !S._chat.length;
    S._chat.push({ role: "user", content: [{ type: "text", text: first ? `[页面正文]\n${page}\n[/页面正文]\n\n${text}` : text }] });
    S._renderChat();
    S._status("思考中…");
    try {
      const c = await S.ctx();
      const sys = `你是大学课程学习助教。用户会给你一个 Canvas 页面的正文，请只依据这段正文回答；正文里没有的内容明确说明。回答用中文，简洁、分点。${c.course ? "课程：" + c.course + "。" : ""}`;
      const out = await BC.assistant.call(sys, S._chat);
      S._chat.push({ role: "assistant", content: [{ type: "text", text: out }] });
      S._renderChat(); S._status("");
    } catch (e) { S._chat.pop(); S._renderChat(); S._status("失败：" + e.message, true); }
  },

  /* ---------- JSON 宽松解析（各家模型偶尔会带 ```json 围栏或前后说明） ---------- */
  _json(text) {
    const s = String(text || "");
    const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = m ? m[1] : s;
    const start = body.indexOf("["), end = body.lastIndexOf("]");
    if (start < 0 || end <= start) throw new Error("模型没有返回 JSON 数组");
    return JSON.parse(body.slice(start, end + 1));
  },

  /* ---------- 资料选择器（闪卡 / 练习共用）：选课程文件 -> 正文（或已有总结） ---------- */
  MATERIAL_MAX: 30000,
  async _materialPicker(container, onPick) {
    const S = BC.study;
    const esc = BC.util.esc;
    container.innerHTML = `<div class="bc-study-row bc-study-mat"><span class="bc-study-mat-label">从资料：</span><select class="bc-study-mat-sel"><option value="">读取文件列表…</option></select><label><input type="checkbox" class="bc-study-mat-sum" checked> 优先用已有总结</label><button type="button" class="bc-study-mat-go">✨ 生成</button></div>`;
    const sel = container.querySelector(".bc-study-mat-sel");
    const cid = await S._courseId();
    let list = [];
    try { list = cid ? (await S._loadFiles(cid)).filter(f => BC.docs.summarizable(f.name, f.ct)) : []; } catch (e) {}
    const sums = new Set((S._settings.summaries || []).filter(x => String(x.cid) === String(cid)).map(x => x.fileId));
    sel.innerHTML = list.length
      ? `<option value="">选择文件…</option>` + list.map(f => `<option value="${f.id}">${S._icon(f.kind)} ${esc(f.name)}${sums.has(f.id) ? "（已总结）" : ""}</option>`).join("")
      : `<option value="">${cid ? "这门课没有可读的文档" : "不在课程页"}</option>`;
    container.querySelector(".bc-study-mat-go").onclick = async () => {
      const f = list.find(x => x.id === sel.value);
      if (!f) { S._status("先选一个文件", true); return; }
      const useSum = container.querySelector(".bc-study-mat-sum").checked;
      const sum = useSum ? (S._settings.summaries || []).find(x => x.fileId === f.id) : null;
      try {
        let text;
        if (sum) text = sum.summary;
        else { S._status("读取文件…"); text = await S._extractFile(f); if (text.length > S.MATERIAL_MAX) { text = text.slice(0, S.MATERIAL_MAX); S._status(`文件较长，取前 ${S.MATERIAL_MAX} 字（先做总结再生成会更全）`); } }
        await onPick(`【资料：${f.name}】\n${text}`, f);
      } catch (e) { S._status("读取失败：" + e.message, true); }
    };
  },

  /* ---------- 2) 闪卡 ---------- */
  _decks() { return BC.study._settings.flashcards || []; },
  _dueCount(deck) { const now = Date.now(); return deck.cards.filter(c => (c.due || 0) <= now).length; },

  _tabCards(body) {
    const S = BC.study;
    const esc = BC.util.esc;
    const decks = S._decks();
    body.innerHTML =
      `<div class="bc-study-row">
         <button type="button" data-act="page">✨ 从本页生成</button>
         <button type="button" data-act="sel">✨ 从选中文字生成</button>
         <select class="bc-study-n"><option value="8">8 张</option><option value="12" selected>12 张</option><option value="20">20 张</option></select>
       </div>
       <div class="bc-study-matbox"></div>
       <div class="bc-study-gen"></div>
       <div class="bc-study-sub">我的卡组</div>
       <div class="bc-study-decks">${decks.length ? decks.map(d => `
         <div class="bc-study-deck" data-id="${esc(d.id)}">
           <div class="bc-study-deck-hd"><b>${esc(d.title)}</b> <span class="bc-pill">${d.cards.length} 张</span>
             ${S._dueCount(d) ? `<span class="bc-pill bc-pill-bad">${S._dueCount(d)} 待复习</span>` : ""}
             <span class="bc-when">${esc(d.course || "")}</span></div>
           <div class="bc-study-deck-act"><button type="button" data-review>▶ 复习</button><button type="button" data-browse>浏览</button><button type="button" class="bc-del" data-del>删除</button></div>
         </div>`).join("") : `<div class="bc-study-empty">还没有卡组。从本页或选中文字生成一组试试。</div>`}
       </div>`;
    body.querySelector("[data-act=page]").onclick = () => S._genCards(null, +body.querySelector(".bc-study-n").value);
    body.querySelector("[data-act=sel]").onclick = () => {
      const sel = window.getSelection().toString().trim();
      if (sel.length < 20) { S._status("先在页面上选中一段文字（至少 20 字）", true); return; }
      S._genCards(sel, +body.querySelector(".bc-study-n").value);
    };
    S._materialPicker(body.querySelector(".bc-study-matbox"), (text, f) => S._genCards(text, +body.querySelector(".bc-study-n").value, f.name));
    body.querySelectorAll(".bc-study-deck").forEach(el => {
      const deck = decks.find(d => d.id === el.dataset.id);
      el.querySelector("[data-review]").onclick = () => S._review(deck);
      el.querySelector("[data-browse]").onclick = () => S._browse(deck);
      el.querySelector("[data-del]").onclick = async () => { if (!confirm(`删除卡组「${deck.title}」？`)) return; await S._saveDecks(decks.filter(d => d !== deck)); S._renderTab(); };
    });
  },

  async _saveDecks(decks) {
    BC.study._settings.flashcards = decks;
    await BC.storage.patch(st => { st.flashcards = decks; });
  },

  async _genCards(source, n, deckName) {
    const S = BC.study;
    const esc = BC.util.esc;
    const text = source || await S.pageText();
    if (!text) { S._status("这个页面没有可读取的正文", true); return; }
    S._status("生成中…");
    try {
      const c = await S.ctx();
      const out = await BC.assistant.call(
        "你是出题助教。只输出 JSON 数组，不要任何解释或 Markdown 围栏。",
        [{ role: "user", content: [{ type: "text", text:
          `根据下面的内容生成 ${n} 张复习闪卡，覆盖最重要的概念、定义、公式和易错点。每张卡是一个对象 {"q": 问题, "a": 答案}，问题具体、答案简洁（1–3 句），用中文，专业术语保留英文。\n\n内容：\n${text}` }] }]);
      const arr = S._json(out).filter(x => x && x.q && x.a).map(x => ({ id: Math.random().toString(36).slice(2, 8), q: String(x.q), a: String(x.a), box: 1, due: 0 }));
      if (!arr.length) throw new Error("没有生成出有效的卡片");
      S._cards = arr;
      const gen = document.querySelector("#" + S.ID + " .bc-study-gen");
      gen.innerHTML =
        `<div class="bc-study-sub">生成了 ${arr.length} 张（可删掉不要的）</div>
         <ul class="bc-study-cardlist">${arr.map(cd => `<li data-id="${cd.id}"><b>Q:</b> ${esc(cd.q)}<br><b>A:</b> ${esc(cd.a)} <button type="button" class="bc-del">✕</button></li>`).join("")}</ul>
         <div class="bc-study-row"><input type="text" class="bc-study-deckname" value="${esc((deckName || c.title || "闪卡").replace(/\.[^.]+$/, "").slice(0, 40))}" placeholder="卡组名"><button type="button" class="bc-primary-btn bc-study-savedeck">💾 保存为卡组</button></div>`;
      gen.querySelectorAll("li .bc-del").forEach(b => b.onclick = () => { const li = b.closest("li"); S._cards = S._cards.filter(x => x.id !== li.dataset.id); li.remove(); });
      gen.querySelector(".bc-study-savedeck").onclick = async () => {
        if (!S._cards.length) return;
        const decks = S._decks().slice();
        decks.unshift({ id: Date.now().toString(36), ts: new Date().toISOString(), title: gen.querySelector(".bc-study-deckname").value.trim() || "闪卡", course: c.course, cid: c.cid, url: c.url, cards: S._cards });
        await S._saveDecks(decks);
        S._cards = [];
        S._renderTab(); S._status("已保存卡组");
      };
      S._status("");
    } catch (e) { S._status("失败：" + e.message, true); }
  },

  _review(deck) {
    const S = BC.study;
    const esc = BC.util.esc;
    const body = document.querySelector("#" + S.ID + " .bc-study-body");
    const now = Date.now();
    let queue = deck.cards.filter(c => (c.due || 0) <= now);
    if (!queue.length) queue = deck.cards.slice();     // 没有到期的就全部过一遍
    let i = 0, flipped = false;
    const draw = () => {
      if (i >= queue.length) {
        body.innerHTML = `<div class="bc-study-done">🎉 这轮复习完成（${queue.length} 张）</div><div class="bc-study-row"><button type="button" class="bc-study-back">返回卡组</button></div>`;
        body.querySelector(".bc-study-back").onclick = () => S._renderTab();
        return;
      }
      const cd = queue[i];
      body.innerHTML =
        `<div class="bc-study-sub">${esc(deck.title)} · ${i + 1} / ${queue.length} · 盒子 ${cd.box || 1}</div>
         <div class="bc-study-card ${flipped ? "bc-study-flipped" : ""}">
           <div class="bc-study-card-q">${esc(cd.q)}</div>
           ${flipped ? `<div class="bc-study-card-a">${esc(cd.a)}</div>` : `<div class="bc-study-card-hint">点击翻面</div>`}
         </div>
         <div class="bc-study-row bc-study-rate" ${flipped ? "" : "hidden"}>
           <button type="button" data-r="again">😵 又忘了</button><button type="button" data-r="hard">😐 模糊</button>
           <button type="button" data-r="good">🙂 记住了</button><button type="button" data-r="easy">😎 太简单</button>
         </div>
         <div class="bc-study-row"><button type="button" class="bc-study-back">返回卡组</button></div>`;
      body.querySelector(".bc-study-card").onclick = () => { flipped = !flipped; draw(); };
      body.querySelector(".bc-study-back").onclick = () => S._renderTab();
      body.querySelectorAll("[data-r]").forEach(b => b.onclick = async ev => {
        ev.stopPropagation();
        S._rate(cd, b.dataset.r);
        await S._saveDecks(S._decks());
        i++; flipped = false; draw();
      });
    };
    draw();
  },

  // Leitner 升降盒 + 下次复习时间
  _rate(card, r) {
    const S = BC.study;
    const day = 86400000;
    let box = card.box || 1;
    if (r === "again") { box = 1; card.due = Date.now() + 10 * 60000; }
    else {
      if (r === "good") box = Math.min(5, box + 1);
      else if (r === "easy") box = Math.min(5, box + 2);
      card.due = Date.now() + S.INTERVALS[box - 1] * day;
    }
    card.box = box;
    card.reviews = (card.reviews || 0) + 1;
  },

  _browse(deck) {
    const S = BC.study;
    const esc = BC.util.esc;
    const body = document.querySelector("#" + S.ID + " .bc-study-body");
    body.innerHTML =
      `<div class="bc-study-sub">${esc(deck.title)} · ${deck.cards.length} 张</div>
       <ul class="bc-study-cardlist">${deck.cards.map(cd => `<li data-id="${cd.id}"><b>Q:</b> ${esc(cd.q)}<br><b>A:</b> ${esc(cd.a)} <span class="bc-when">盒子 ${cd.box || 1}</span> <button type="button" class="bc-del">✕</button></li>`).join("")}</ul>
       <div class="bc-study-row"><button type="button" class="bc-study-back">返回卡组</button><button type="button" class="bc-study-export">导出 Markdown</button></div>`;
    body.querySelector(".bc-study-back").onclick = () => S._renderTab();
    body.querySelector(".bc-study-export").onclick = () => {
      const md = `# ${deck.title}\n\n` + deck.cards.map(cd => `**Q:** ${cd.q}\n\n**A:** ${cd.a}\n`).join("\n---\n\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" })); a.download = "flashcards.md"; a.click();
    };
    body.querySelectorAll("li .bc-del").forEach(b => b.onclick = async () => { const li = b.closest("li"); deck.cards = deck.cards.filter(x => x.id !== li.dataset.id); li.remove(); await S._saveDecks(S._decks()); });
  },

  /* ---------- 3) 练习题 ---------- */
  _tabQuiz(body) {
    const S = BC.study;
    if (S._quiz) { S._renderQuiz(body); return; }
    body.innerHTML =
      `<div class="bc-study-row">
         <button type="button" data-act="page">✨ 从本页出题</button>
         <button type="button" data-act="sel">✨ 从选中文字出题</button>
         <select class="bc-study-n"><option value="5">5 题</option><option value="8" selected>8 题</option><option value="12">12 题</option></select>
       </div>
       <div class="bc-study-matbox"></div>
       <div class="bc-study-empty">生成选择题自测，答完看解析；错题可以一键存进题库。</div>`;
    S._materialPicker(body.querySelector(".bc-study-matbox"), text => S._genQuiz(text, +body.querySelector(".bc-study-n").value));
    body.querySelector("[data-act=page]").onclick = () => S._genQuiz(null, +body.querySelector(".bc-study-n").value);
    body.querySelector("[data-act=sel]").onclick = () => {
      const sel = window.getSelection().toString().trim();
      if (sel.length < 20) { S._status("先在页面上选中一段文字（至少 20 字）", true); return; }
      S._genQuiz(sel, +body.querySelector(".bc-study-n").value);
    };
  },

  async _genQuiz(source, n) {
    const S = BC.study;
    const text = source || await S.pageText();
    if (!text) { S._status("这个页面没有可读取的正文", true); return; }
    S._status("出题中…");
    try {
      const out = await BC.assistant.call(
        "你是出题助教。只输出 JSON 数组，不要任何解释或 Markdown 围栏。",
        [{ role: "user", content: [{ type: "text", text:
          `根据下面的内容出 ${n} 道单选题，考查理解而不是死记硬背，难度有梯度。每题一个对象：{"q": 题干, "options": [4 个选项], "answer": 正确选项下标(0-3), "explain": 解析（为什么对、其他为什么错）}。用中文，专业术语保留英文。\n\n内容：\n${text}` }] }]);
      const items = S._json(out).filter(x => x && x.q && Array.isArray(x.options) && x.options.length >= 2)
        .map(x => ({ q: String(x.q), options: x.options.map(String), answer: Math.max(0, Math.min(x.options.length - 1, +x.answer || 0)), explain: String(x.explain || "") }));
      if (!items.length) throw new Error("没有生成出有效的题目");
      S._quiz = { items, idx: 0, picked: [], done: false };
      S._status("");
      S._renderQuiz(document.querySelector("#" + S.ID + " .bc-study-body"));
    } catch (e) { S._status("失败：" + e.message, true); }
  },

  _renderQuiz(body) {
    const S = BC.study;
    const esc = BC.util.esc;
    const Q = S._quiz;
    if (Q.done) {
      const right = Q.picked.filter((p, i) => p === Q.items[i].answer).length;
      const wrong = Q.items.map((it, i) => ({ it, i })).filter(({ it, i }) => Q.picked[i] !== it.answer);
      body.innerHTML =
        `<div class="bc-study-done">得分 ${right} / ${Q.items.length}</div>
         ${wrong.length ? `<div class="bc-study-sub">错题</div><ul class="bc-study-cardlist">${wrong.map(({ it, i }) => `<li><b>${i + 1}.</b> ${esc(it.q)}<br><span class="bc-study-ok">正确：${esc(it.options[it.answer])}</span><br><small>${esc(it.explain)}</small></li>`).join("")}</ul>` : `<div class="bc-study-empty">全对 🎉</div>`}
         <div class="bc-study-row">
           ${wrong.length ? `<button type="button" class="bc-primary-btn bc-study-savewrong">💾 错题存题库</button>` : ""}
           <button type="button" class="bc-study-again">再来一组</button>
         </div>`;
      body.querySelector(".bc-study-again").onclick = () => { S._quiz = null; S._renderTab(); };
      const sw = body.querySelector(".bc-study-savewrong");
      if (sw) sw.onclick = async () => {
        const c = await S.ctx();
        await BC.storage.patch(st => {
          st.qbank = st.qbank || [];
          wrong.forEach(({ it }) => st.qbank.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: new Date().toISOString(), url: c.url, title: c.title, course: c.course, cid: c.cid,
            question: `${it.q}\n${it.options.map((o, k) => `${"ABCD"[k] || k}. ${o}`).join("\n")}`, answer: `正确答案：${"ABCD"[it.answer] || it.answer}. ${it.options[it.answer]}\n\n${it.explain}`, note: "练习错题", review: true }));
        });
        sw.textContent = "已存入题库"; sw.disabled = true;
      };
      return;
    }
    const it = Q.items[Q.idx];
    const picked = Q.picked[Q.idx];
    body.innerHTML =
      `<div class="bc-study-sub">第 ${Q.idx + 1} / ${Q.items.length} 题</div>
       <div class="bc-study-q">${esc(it.q)}</div>
       <div class="bc-study-opts">${it.options.map((o, k) => {
         let cls = "";
         if (picked != null) cls = k === it.answer ? "bc-study-opt-right" : (k === picked ? "bc-study-opt-wrong" : "");
         return `<button type="button" data-k="${k}" class="${cls}" ${picked != null ? "disabled" : ""}>${"ABCD"[k] || k}. ${esc(o)}</button>`;
       }).join("")}</div>
       ${picked != null ? `<div class="bc-study-explain">${picked === it.answer ? "✅ 答对了" : "❌ 答错了"}<br>${esc(it.explain)}</div>
         <div class="bc-study-row"><button type="button" class="bc-primary-btn bc-study-next">${Q.idx + 1 < Q.items.length ? "下一题 →" : "查看结果"}</button></div>` : ""}
       <div class="bc-study-row"><button type="button" class="bc-study-quit">放弃本组</button></div>`;
    body.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { Q.picked[Q.idx] = +b.dataset.k; S._renderQuiz(body); });
    const next = body.querySelector(".bc-study-next");
    if (next) next.onclick = () => { if (Q.idx + 1 < Q.items.length) Q.idx++; else Q.done = true; S._renderQuiz(body); };
    body.querySelector(".bc-study-quit").onclick = () => { S._quiz = null; S._renderTab(); };
  }
};
