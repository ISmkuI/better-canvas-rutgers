/* 学习工具抽屉（右下角 📖）：
 *   1) 页面对话 —— 把当前 Canvas 页面（Page / 作业说明 / 讨论 / 公告 / 大纲 / 文件预览里的 PDF）正文喂给模型，一键总结、生成大纲、就内容提问
 *   2) 闪卡 —— 从页面或选中文字生成问答卡，按课程存成卡组，间隔重复复习（Leitner 盒子）
 *   3) 练习 —— 生成选择题自测，即时判分 + 解析，错题一键存题库
 * 模型调用复用 BC.assistant.call；测验 / 考试作答页面同样不激活（BC.assistant.isBlocked）。 */
// 英文词条（键 = 中文原文；界面语言为英文时 BC.t 取这里的译文）。发给模型的提示词不在这里，见各处 S._L(zh, en)。
BC.i18n.add({
  "学习工具：页面对话 / 闪卡 / 练习": "Study tools: page chat / flashcards / practice",
  "发现 {n} 个讲座视频 → 🎬 视频": "Found {n} lecture videos → 🎬 Videos",
  "🎬 本页有 {n} 个讲座视频，点右下角 📖 → 视频 可下载 / 转写": "🎬 This page has {n} lecture videos — click 📖 (bottom right) → Videos to download / transcribe",
  "📖 学习工具": "📖 Study tools",
  "💬 页面对话": "💬 Page chat",
  "🧠 知识库": "🧠 Knowledge base",
  "🃏 闪卡": "🃏 Flashcards",
  "📝 练习": "📝 Practice",
  "📁 资料": "📁 Files",
  "🎬 视频": "🎬 Videos",
  "📚 题库": "📚 Question bank",
  "打开题库": "Open question bank",
  "还没配置模型：右下角 ⚙ → 「✨ 助手」填 API key。": "No model configured yet: bottom-right ⚙ → \"✨ Assistant\" and enter an API key.",
  "{n} 字": "{n} chars",
  // 知识库
  "知识库模块没有加载": "Knowledge base module is not loaded",
  "全部课程": "All courses",
  "根据知识库提问…（Enter 发送）": "Ask the knowledge base… (Enter to send)",
  "发送": "Send",
  "添加材料": "Add materials",
  "📁 课程资料": "📁 Course files",
  "📄 本页正文": "📄 This page",
  "⬆ 本地文件": "⬆ Local files",
  "✍ 粘贴文本": "✍ Paste text",
  "✨ 已有总结": "✨ Existing summaries",
  "材料": "Materials",
  "清空": "Clear",
  "双击页面文字呼出的助手浮窗里，「🧠 知识库」亮着时讲解就会依据这些材料（有材料时默认开启）。检索在本机完成，每次只把最相关的几段发给模型；材料只存在这台电脑上。": "In the assistant popup (double-click page text), explanations draw on these materials while \"🧠 Knowledge base\" is lit (on by default once you have materials). Retrieval runs locally and only the few most relevant passages are sent to the model; materials stay on this computer.",
  "{n} 份 · {chars}": "{n} items · {chars}",
  "0 份": "0 items",
  "范围：{course} + 通用": "Scope: {course} + general",
  "所选课程": "selected course",
  "范围：全部材料": "Scope: all materials",
  "课程 {id}": "Course {id}",
  "通用": "General",
  "{n} 段": "{n} chunks",
  "从知识库删除": "Remove from knowledge base",
  "还没有材料。用上面的按钮添加：课程里的 PDF / PPT / Word、本页正文、本地文件或粘贴的笔记。": "No materials yet. Use the buttons above to add course PDFs / PPTs / Word docs, this page's text, local files, or pasted notes.",
  "先选一门课": "Pick a course first",
  "读取文件列表…": "Loading file list…",
  "读取失败：{msg}": "Load failed: {msg}",
  "这门课没有可读的文档": "This course has no readable documents",
  "已在库": "already added",
  "➕ 添加选中": "➕ Add selected",
  "全选": "Select all",
  "全不选": "Select none",
  "收起": "Collapse",
  "没有选中文件": "No files selected",
  "读取 {i} / {n}：{name}": "Reading {i} / {n}: {name}",
  "{name}：{msg}": "{name}: {msg}",
  "已加入 {ok} / {n} 份材料": "Added {ok} / {n} materials",
  "材料名称（如：第 3 章笔记）": "Material name (e.g. Chapter 3 notes)",
  "把笔记 / 讲义 / 教材段落粘贴到这里…": "Paste notes / handouts / textbook passages here…",
  "➕ 加入知识库": "➕ Add to knowledge base",
  "粘贴 {date}": "Pasted {date}",
  "已加入知识库": "Added to knowledge base",
  "读取本页正文…": "Reading this page…",
  "这个页面没有可读取的正文": "This page has no readable text",
  "页面": "Page",
  "已加入：{name}（{chars}）": "Added: {name} ({chars})",
  "解析 {i} / {n}：{name}": "Parsing {i} / {n}: {name}",
  "这个页面环境只能读文本文件（PDF / Office 请在 Canvas 页面里添加）": "Only text files can be read from this page (add PDF / Office files from a Canvas page)",
  "没有可用的总结（在「📁 资料」里对文档点 ✨ 生成）": "No summaries available (open \"📁 Files\" and click ✨ on a document to generate one)",
  "（总结）": " (summary)",
  "已加入 {n} 份总结": "Added {n} summaries",
  "删除{scope}的 {n} 份材料？": "Delete {n} materials ({scope})?",
  "这门课 + 通用": "this course + general",
  "全部": "all",
  "📎 依据：": "📎 Sources: ",
  "先添加材料，再在下面提问：回答只依据知识库里的内容，并标注出处。": "Add materials first, then ask below: answers rely only on the knowledge base and cite their sources.",
  "知识库还没有材料，先添加": "The knowledge base is empty — add materials first",
  "检索知识库…": "Searching knowledge base…",
  "思考中…": "Thinking…",
  "失败：{msg}": "Failed: {msg}",
  // 讲座视频
  "🔍 扫描本页视频": "🔍 Scan this page",
  "⬇ 全部下载": "⬇ Download all",
  "或粘贴 MediaSpace / Kaltura 视频链接": "Or paste a MediaSpace / Kaltura video link",
  "添加": "Add",
  "扫描中…": "Scanning…",
  "建议先在页面里点一下播放再扫描：播放器开始播放后才会拿到真正可用的媒体地址，下载会直接用它。只能拿到你有权观看且没有 DRM 的视频；拿不到时仍可用字幕做转写和总结。": "Tip: press play on the page once before scanning — the player only exposes a truly usable media URL after playback starts, and the download uses it directly. Only videos you're allowed to watch and that have no DRM can be fetched; when that fails you can still transcribe and summarize from captions.",
  "{n} 个视频": "{n} videos",
  "已总结": "Summarized",
  "下载 MP4（直链）": "Download MP4 (direct link)",
  "HLS 分段下载（直链被关时用；边下边写入你选的文件）": "HLS segment download (when direct links are disabled; streams into the file you choose)",
  "拉取字幕 / 转写": "Fetch captions / transcript",
  "用字幕总结这节课": "Summarize this lecture from captions",
  "诊断信息（下载失败时发给开发者）": "Diagnostics (send to the developer if a download fails)",
  "这个页面没找到 Kaltura 视频。打开有视频的页面再扫描，或粘贴链接。": "No Kaltura videos found on this page. Open a page with a video and scan again, or paste a link.",
  "拉取字幕…": "Fetching captions…",
  "字幕 {n} 字，已带到页面对话": "Transcript ({n} chars) loaded into Page chat",
  "（讲座字幕）": " (lecture transcript)",
  "总结完成，在「📁 资料」的已生成总结里": "Summary done — see generated summaries under \"📁 Files\"",
  "已找到视频但还没抓到播放地址：先播放几秒，再扫描一次": "Videos found but no playback URL captured yet: play for a few seconds, then scan again",
  "没找到视频。先播放几秒再扫描；仍没有就点「显示本页 iframe」把地址发给开发者。": "No videos found. Play for a few seconds and scan again; if still nothing, click \"Show page iframes\" and send the addresses to the developer.",
  "显示本页 iframe": "Show page iframes",
  "（本页没有 iframe）": "(no iframes on this page)",
  "这个链接里没有 entry_id（形如 1_abc12345）": "No entry_id in this link (should look like 1_abc12345)",
  "Canvas 自带媒体没有字幕接口": "Canvas native media has no captions API",
  "这个视频没有字幕 / 转写": "This video has no captions / transcript",
  "字幕内容为空": "Captions are empty",
  "解析直链…": "Resolving direct link…",
  "视频": "Videos",
  "下载 API 无响应": "Download API did not respond",
  "已开始下载": "Download started",
  "已开始下载（{size}）": "Download started ({size})",
  "　→ 点 🎞 用 HLS 分段下载": " → click 🎞 for HLS segment download",
  "直链被关或需要更高权限，改用旁边的 🎞 HLS 分段下载": "Direct link disabled or needs higher permission — use the 🎞 HLS segment download next to it",
  "先扫描到视频": "Scan for videos first",
  "已取消": "Cancelled",
  "选文件夹失败（{msg}），改为：直链走浏览器下载，HLS 先攒内存": "Folder picker failed ({msg}); falling back to browser downloads for direct links and in-memory buffering for HLS",
  "这个浏览器不支持选文件夹，HLS 视频会先攒在内存再逐个保存。继续下载 {n} 个视频？": "This browser can't pick a folder; HLS videos will be buffered in memory and saved one by one. Download {n} videos?",
  "全部下载 {i} / {n}：{name}": "Download all {i} / {n}: {name}",
  "无直链，改用 HLS": "No direct link, using HLS",
  "直链 {size}": "Direct {size}",
  "直接拉取被拒，改走浏览器下载": "Direct fetch rejected, using browser download",
  "完成（直链）": "Done (direct link)",
  "已交给浏览器下载（默认下载目录）": "Handed to browser download (default downloads folder)",
  "Canvas 媒体没有直链": "Canvas media has no direct link",
  "HLS {k}/{n} 段 · {size}": "HLS {k}/{n} segments · {size}",
  "完成（HLS {n} 段 · {size}{ts}）": "Done (HLS {n} segments · {size}{ts})",
  "全部下载完成：成功 {ok}，失败 {fail}": "Download all finished: {ok} succeeded, {fail} failed",
  "（HLS 已写入你选的文件夹，直链在浏览器默认下载目录 PotatoCanvas/…）": " (HLS written to the folder you chose; direct links went to the browser's default downloads folder, PotatoCanvas/…)",
  "（HLS 已写入你选的文件夹）": " (HLS written to the folder you chose)",
  "，看浏览器下载栏": " — see the browser download bar",
  "读取播放列表…": "Reading playlist…",
  "浏览器不支持流式保存，先攒在内存里…": "Browser doesn't support streaming save; buffering in memory…",
  "{i} / {n} 段 · {size}": "{i} / {n} segments · {size}",
  "完成：{n} 段 · {size} · {sec} 秒": "Done: {n} segments · {size} · {sec} s",
  "（.ts 文件，VLC / PotPlayer 直接播；要 .mp4 用 ffmpeg -i in.ts -c copy out.mp4）": " (.ts file — plays in VLC / PotPlayer; for .mp4 run ffmpeg -i in.ts -c copy out.mp4)",
  "HLS 失败：{msg}": "HLS failed: {msg}",
  // 资料库
  "模块 / {m}": "Modules / {m}",
  "搜文件名": "Search file names",
  "全部类型": "All types",
  "其他": "Other",
  "✨ 总结全部可读文档": "✨ Summarize all readable documents",
  "已生成的总结": "Generated summaries",
  "没有在读课程": "No active courses",
  "{a} / {b} 个文件": "{a} / {b} files",
  "根目录": "Root",
  "下载": "Download",
  "生成复习总结": "Generate review summary",
  "在「页面对话」里就这个文件提问": "Ask about this file in Page chat",
  "没有文件": "No files",
  "读取文件…": "Reading file…",
  "复制": "Copy",
  "导出 MD": "Export MD",
  "🃏 生成闪卡": "🃏 Make flashcards",
  "删除": "Delete",
  "还没有总结。点文件旁的 ✨。": "No summaries yet. Click ✨ next to a file.",
  "已复制": "Copied",
  " - 总结.md": " - summary.md",
  "下载这门课的全部 {n} 个文件到「下载/PotatoCanvas/{dir}/」？": "Download all {n} files of this course to \"Downloads/PotatoCanvas/{dir}/\"?",
  "下载中… {n} / {total}": "Downloading… {n} / {total}",
  "已发起 {n} 个下载，看浏览器下载栏": "Started {n} downloads — see the browser download bar",
  "没有待总结的文档": "No documents left to summarize",
  "要总结 {n} 个文档（已总结的跳过）。每个文档会调用一到多次模型，确认继续？": "Summarize {n} documents (already summarized ones are skipped). Each document calls the model one or more times. Continue?",
  "总结中 {i} / {n}：{name}": "Summarizing {i} / {n}: {name}",
  "全部完成": "All done",
  "下载失败：{msg}": "Download failed: {msg}",
  "无响应": "No response",
  "已开始下载 {name}": "Download started: {name}",
  "下载失败 HTTP {status}": "Download failed: HTTP {status}",
  "没有提取到文字（可能是扫描件 / 图片型 PDF）": "No text extracted (possibly a scanned / image-only PDF)",
  "分块小结 {i} / {n}": "Chunk notes {i} / {n}",
  "合并总结…": "Merging summary…",
  "总结完成": "Summary done",
  // 页面对话
  "📄 总结要点": "📄 Summarize",
  "🧭 生成大纲": "🧭 Outline",
  "🔑 关键术语": "🔑 Key terms",
  "❓ 可能考什么": "❓ Likely exam topics",
  "就这个页面提问…（Enter 发送）": "Ask about this page… (Enter to send)",
  "已读取页面正文 {n} 字": "Page text loaded: {n} chars",
  "点上面的按钮，或直接提问。": "Click a button above, or just ask.",
  "模型没有返回 JSON 数组": "The model did not return a JSON array",
  // 资料选择器
  "从资料：": "From files:",
  "优先用已有总结": "Prefer existing summary",
  "✨ 生成": "✨ Generate",
  "选择文件…": "Choose a file…",
  "（已总结）": " (summarized)",
  "不在课程页": "Not on a course page",
  "先选一个文件": "Pick a file first",
  "文件较长，取前 {n} 字（先做总结再生成会更全）": "File is long — using the first {n} chars (summarize it first for fuller coverage)",
  // 闪卡
  "✨ 从本页生成": "✨ From this page",
  "✨ 从选中文字生成": "✨ From selection",
  "{n} 张": "{n} cards",
  "我的卡组": "My decks",
  "{n} 待复习": "{n} due",
  "▶ 复习": "▶ Review",
  "浏览": "Browse",
  "还没有卡组。从本页或选中文字生成一组试试。": "No decks yet. Generate one from this page or from selected text.",
  "先在页面上选中一段文字（至少 20 字）": "Select some text on the page first (at least 20 characters)",
  "删除卡组「{title}」？": "Delete deck \"{title}\"?",
  "生成中…": "Generating…",
  "没有生成出有效的卡片": "No valid cards were generated",
  "生成了 {n} 张（可删掉不要的）": "Generated {n} cards (remove any you don't want)",
  "闪卡": "Flashcards",
  "卡组名": "Deck name",
  "💾 保存为卡组": "💾 Save as deck",
  "已保存卡组": "Deck saved",
  "🎉 这轮复习完成（{n} 张）": "🎉 Review round complete ({n} cards)",
  "返回卡组": "Back to decks",
  "盒子 {n}": "Box {n}",
  "点击翻面": "Click to flip",
  "😵 又忘了": "😵 Forgot",
  "😐 模糊": "😐 Fuzzy",
  "🙂 记住了": "🙂 Got it",
  "😎 太简单": "😎 Too easy",
  "导出 Markdown": "Export Markdown",
  // 练习
  "✨ 从本页出题": "✨ From this page",
  "✨ 从选中文字出题": "✨ From selection",
  "{n} 题": "{n} questions",
  "生成选择题自测，答完看解析；错题可以一键存进题库。": "Generate a multiple-choice self-test with explanations; wrong answers can be saved to the question bank in one click.",
  "出题中…": "Writing questions…",
  "没有生成出有效的题目": "No valid questions were generated",
  "得分 {a} / {b}": "Score {a} / {b}",
  "错题": "Wrong answers",
  "正确：": "Correct: ",
  "全对 🎉": "All correct 🎉",
  "💾 错题存题库": "💾 Save wrong answers to bank",
  "再来一组": "Another round",
  "正确答案：": "Correct answer: ",
  "练习错题": "Practice mistake",
  "已存入题库": "Saved to question bank",
  "第 {i} / {n} 题": "Question {i} / {n}",
  "✅ 答对了": "✅ Correct",
  "❌ 答错了": "❌ Wrong",
  "下一题 →": "Next →",
  "查看结果": "See results",
  "放弃本组": "Quit this round"
});

BC.study = {
  ID: "bc-study",
  BTN_ID: "bc-study-btn",
  _settings: null,
  _tab: "chat",
  _gateOn: false,   // 高级功能门（src/gate.js，弹窗里输小时密码解锁）；🎬 视频标签 / 自动识别只在解锁且 advanced.videos 打开时出现
  _pageText: "",
  _chat: [],
  _cards: [],       // 本次生成、尚未保存的闪卡
  _quiz: null,      // { items:[{q, options, answer, explain}], idx, picked:[], done }

  // Leitner：盒子 1..5 的复习间隔（天）；「又忘了」回到盒子 1 且 10 分钟后再来
  INTERVALS: [1, 3, 7, 14, 30],

  // 发给模型的提示词按回答语言二选一（settings.assistant.lang，auto = 界面语言）；界面文案另走 BC.t
  _L(zh, en) { return BC.assistant && BC.assistant._replyLang && BC.assistant._replyLang() === "en" ? en : zh; },

  init(settings) {
    const S = BC.study;
    S._settings = settings;
    const on = settings.assistant && settings.assistant.enabled !== false;
    let btn = document.getElementById(S.BTN_ID);
    if (!on || (BC.assistant && BC.assistant.isBlocked())) { btn?.remove(); document.getElementById(S.ID)?.remove(); return; }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = S.BTN_ID; btn.type = "button"; btn.title = BC.t("学习工具：页面对话 / 闪卡 / 练习"); btn.textContent = "📖";
      btn.addEventListener("click", () => S.toggle());
      document.body.appendChild(btn);
    }
    // SPA 换页也会再进来：路径变了就重新识别（旧列表 / 角标清掉）
    if (S._autoPath !== location.pathname) {
      S._autoPath = location.pathname; S._videos = null; S._toasted = false; S._pageText = "";
      btn.querySelector(".bc-study-badge")?.remove(); btn.title = BC.t("学习工具：页面对话 / 闪卡 / 练习");
    }
    // 高级功能门：先按上次读到的状态渲染，异步读一次存储；别处解锁 / 解绑时跟着变。BC.gate 在某些注入路径下可能不存在
    if (BC.gate && !S._gateHooked) { S._gateHooked = true; BC.gate.onChange(on => S._gateApply(on)); }
    if (BC.gate) BC.gate.isUnlocked().then(on => S._gateApply(on)).catch(() => {});
    // 弹窗里切 advanced.videos 时立刻生效（main.js 设置变化只刷主题，不会重新 init）
    if (!S._settingsHooked) {
      S._settingsHooked = true;
      try {
        chrome.storage.onChanged.addListener((c, area) => {
          if (area !== "local" || !c.bc_settings || !S._settings) return;
          S._settings.advanced = (c.bc_settings.newValue || {}).advanced;
          S._syncVideosTab();
        });
      } catch (e) {}
    }
    S._syncVideosTab();
    if (settings.assistant.autoDetectVideos !== false) S._autoDetect();
  },
  _autoPath: "",

  /* ---------- 高级功能门：讲座视频 ---------- */
  _gateHooked: false,
  _videosOn() {
    const S = BC.study;
    const adv = S._settings && S._settings.advanced;
    // BC.kaltura 不存在（商店版不含 kaltura.js）时视频标签 / 自动识别一律不出现
    return !!(BC.kaltura && S._gateOn && S._settings && !(adv && adv.videos === false));
  },
  _gateApply(on) {
    const S = BC.study;
    if (on === S._gateOn) return;
    S._gateOn = on;
    if (!S._settings) return;
    if (on) { S._toasted = false; if (S._settings.assistant && S._settings.assistant.autoDetectVideos !== false) S._autoDetect(); }
    else {
      const btn = document.getElementById(S.BTN_ID);
      if (btn) { btn.querySelector(".bc-study-badge")?.remove(); btn.title = BC.t("学习工具：页面对话 / 闪卡 / 练习"); }
    }
    S._syncVideosTab();
  },
  // 抽屉开着时，🎬 标签该有没有 / 该没有却有 → 重建（锁定时正在看视频标签的话会回到对话）
  _syncVideosTab() {
    const S = BC.study;
    const d = document.getElementById(S.ID);
    if (!d || BC.onCanvas === false) return;
    if (!!d.querySelector('.bc-study-tabs [data-tab="videos"]') !== S._videosOn()) S.open();
  },

  // 打开页面自动识别讲座视频：页面渲染稳定后扫一遍（不含需要播放才有的网络记录），找到就在 📖 上挂角标 + 提示
  _autoTimer: 0,
  _autoDetect() {
    const S = BC.study;
    if (!BC.kaltura || BC.onCanvas === false) return;   // 非 Canvas 网站不识别讲座视频
    clearTimeout(S._autoTimer);
    S._autoTimer = setTimeout(async () => {
      if (BC.assistant && BC.assistant.isBlocked()) return;
      if (!S._videosOn()) return;   // 没解锁 / 关了视频功能：不识别、不提示
      let found = [];
      try {
        const [direct, frames, lti, canvas] = await Promise.all([
          Promise.resolve(BC.kaltura.findOnPage()), BC.kaltura.collectFromFrames(1500), BC.kaltura.scanLtiFrames(), BC.kaltura.scanCanvasMedia()
        ]);
        const map = new Map();
        [...frames, ...lti, ...direct, ...canvas].forEach(v => { const old = map.get(v.entryId); if (!old) map.set(v.entryId, v); else { old.ks = old.ks || v.ks; old.partnerId = old.partnerId || v.partnerId; old.title = old.title || v.title; } });
        found = [...map.values()];
      } catch (e) { return; }
      if (!found.length) return;
      found.forEach(v => BC.kaltura._remember(v));
      S._videos = found;
      const btn = document.getElementById(S.BTN_ID);
      if (btn) {
        let badge = btn.querySelector(".bc-study-badge");
        if (!badge) { badge = document.createElement("span"); badge.className = "bc-study-badge"; btn.appendChild(badge); }
        badge.textContent = found.length;
        btn.title = BC.t("发现 {n} 个讲座视频 → 🎬 视频", { n: found.length });
      }
      if (!S._toasted) { S._toasted = true; BC.toast && BC.toast(BC.t("🎬 本页有 {n} 个讲座视频，点右下角 📖 → 视频 可下载 / 转写", { n: found.length }), { duration: 5000 }); }
    }, 2500);
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
                    ".announcement", ".show-content", "#syllabusContainer", "#wiki_page_show", "#content .ig-list", "#content",
                    // 非 Canvas 网站：正文容器 -> 整页
                    "article", "main", "[role='main']", "body"];
      for (const sel of sels) {
        const nodes = [...document.querySelectorAll(sel)];
        if (!nodes.length) continue;
        text = nodes.map(n => n.innerText || "").join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
        if (text.length > 200) break;
      }
    }
    if (text.length > 40000) text = text.slice(0, 40000) + S._L("\n…（后面已截断）", "\n…(truncated)");
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
         <span class="bc-study-title">${BC.t("📖 学习工具")}</span>
         <span class="bc-study-ctx"></span>
         <button type="button" class="bc-study-close">✕</button>
       </div>
       <div class="bc-study-tabs">
         <button data-tab="chat">${BC.t("💬 页面对话")}</button>
         <button data-tab="kb">${BC.t("🧠 知识库")}</button>
         <button data-tab="cards">${BC.t("🃏 闪卡")}</button>
         <button data-tab="quiz">${BC.t("📝 练习")}</button>
         ${BC.onCanvas === false ? "" : `<button data-tab="files">${BC.t("📁 资料")}</button>`}
         ${BC.onCanvas === false || !S._videosOn() ? "" : `<button data-tab="videos">${BC.t("🎬 视频")}</button>`}
         <button data-tab="bank" title="${BC.t("打开题库")}">${BC.t("📚 题库")}</button>
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
    if (!BC.assistant.configured()) S._status(BC.t("还没配置模型：右下角 ⚙ → 「✨ 助手」填 API key。"), true);
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
    if (S._tab === "videos" && !S._videosOn()) S._tab = "chat";   // 视频标签被锁 / 关掉：回到对话
    d.querySelectorAll(".bc-study-tabs button").forEach(b => b.classList.toggle("bc-study-active", b.dataset.tab === S._tab));
    const body = d.querySelector(".bc-study-body");
    body.innerHTML = "";
    ({ chat: S._tabChat, kb: S._tabKb, cards: S._tabCards, quiz: S._tabQuiz, files: S._tabFiles, videos: S._tabVideos }[S._tab] || S._tabChat)(body);
  },

  /* ---------- 6) 知识库：添加材料 + 只依据材料的问答（切块 / 检索见 knowledge.js） ---------- */
  _kbChat: [],
  // 英文没有「万」：≥1 万字按 k 显示
  _fmtChars(n) { n = n || 0; if (n >= 10000) return BC.i18n.isEn() ? (n / 1000).toFixed(1) + "k chars" : BC.t("{n} 万字", { n: (n / 10000).toFixed(1) }); return BC.t("{n} 字", { n }); },

  async _tabKb(body) {
    const S = BC.study;
    const esc = BC.util.esc;
    if (!BC.kb) { body.innerHTML = `<div class="bc-study-empty">${BC.t("知识库模块没有加载")}</div>`; return; }
    const c = await S.ctx();
    // 不在课程页：课程下拉（Canvas 上才有课程接口）
    let courseSel = "";
    if (!c.cid && BC.grades && BC.onCanvas !== false) {
      const scores = await BC.grades.fetchScores().catch(() => ({}));
      const opts = Object.entries(scores).map(([id, s]) => `<option value="${id}"${String(id) === String(S._courseSel) ? " selected" : ""}>${esc(BC.util.courseTitle(s.name || s.code))}</option>`).join("");
      if (opts) courseSel = `<select class="bc-study-course"><option value="">${BC.t("全部课程")}</option>${opts}</select>`;
    }
    const canvas = BC.onCanvas !== false && !!BC.api && !!BC.docs;
    body.innerHTML =
      `<div class="bc-study-row">${courseSel}<span class="bc-study-fcount bc-study-kbstat"></span></div>
       <div class="bc-ai-answer bc-study-answer bc-study-kbanswer"></div>
       <div class="bc-study-ask"><input type="text" placeholder="${BC.t("根据知识库提问…（Enter 发送）")}"><button type="button">${BC.t("发送")}</button></div>
       <div class="bc-study-sub">${BC.t("添加材料")}</div>
       <div class="bc-study-row">
         ${canvas ? `<button type="button" data-add="files">${BC.t("📁 课程资料")}</button>` : ""}
         <button type="button" data-add="page">${BC.t("📄 本页正文")}</button>
         <button type="button" data-add="upload">${BC.t("⬆ 本地文件")}</button>
         <button type="button" data-add="paste">${BC.t("✍ 粘贴文本")}</button>
         <button type="button" data-add="sums">${BC.t("✨ 已有总结")}</button>
         <input type="file" class="bc-study-kbfile" multiple accept=".pdf,.pptx,.docx,.xlsx,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm" hidden>
       </div>
       <div class="bc-study-kbadd"></div>
       <div class="bc-study-sub">${BC.t("材料")} <span class="bc-study-kbn"></span><button type="button" class="bc-del bc-study-kbclear">${BC.t("清空")}</button></div>
       <div class="bc-study-kblist"></div>
       <div class="bc-study-hint">${BC.t("双击页面文字呼出的助手浮窗里，「🧠 知识库」亮着时讲解就会依据这些材料（有材料时默认开启）。检索在本机完成，每次只把最相关的几段发给模型；材料只存在这台电脑上。")}</div>`;
    const cid = () => { if (c.cid) return c.cid; const sel = body.querySelector(".bc-study-course"); return sel ? sel.value : ""; };
    const courseName = () => c.course || ((body.querySelector(".bc-study-course option:checked") || {}).textContent || "").trim();
    const addBox = body.querySelector(".bc-study-kbadd");
    const ICON = { file: "📁", page: "📄", upload: "⬆", text: "✍", summary: "✨" };

    const draw = async () => {
      const id = cid();
      if (!c.cid) S._courseSel = id;
      const list = await BC.kb.list(id);
      body.querySelector(".bc-study-kbn").textContent = list.length ? BC.t("{n} 份 · {chars}", { n: list.length, chars: S._fmtChars(list.reduce((s, m) => s + (m.chars || 0), 0)) }) : BC.t("0 份");
      body.querySelector(".bc-study-kbstat").textContent = id ? BC.t("范围：{course} + 通用", { course: courseName() || BC.t("所选课程") }) : BC.t("范围：全部材料");
      body.querySelector(".bc-study-kblist").innerHTML = list.length ? list.map(m => `
        <div class="bc-study-file bc-study-kbitem" data-id="${esc(m.id)}">
          <span class="bc-study-ficon">${ICON[m.source] || "📎"}</span>
          <div class="bc-study-fbody"><b class="bc-study-vname" title="${esc(m.name)}">${esc(m.name)}</b>
            <div class="bc-study-fmeta">${esc(m.course || (m.cid ? BC.t("课程 {id}", { id: m.cid }) : BC.t("通用")))} · ${S._fmtChars(m.chars)} · ${BC.t("{n} 段", { n: m.n })} · ${BC.util.fmtDate(m.ts)}</div></div>
          <button type="button" class="bc-del" title="${BC.t("从知识库删除")}">✕</button>
        </div>`).join("") : `<div class="bc-study-empty">${BC.t("还没有材料。用上面的按钮添加：课程里的 PDF / PPT / Word、本页正文、本地文件或粘贴的笔记。")}</div>`;
      body.querySelectorAll(".bc-study-kbitem .bc-del").forEach(b => b.onclick = async () => { await BC.kb.remove(b.closest(".bc-study-kbitem").dataset.id); draw(); });
      S._kbRenderChat();
    };
    const addOne = async opts => {
      const m = await BC.kb.add({ cid: cid(), course: courseName(), ...opts });
      return m;
    };

    // 课程资料：多选 -> 逐个提取正文入库（只在本机解析，不调用模型）
    const openFiles = async () => {
      const id = cid();
      if (!id) { S._status(BC.t("先选一门课"), true); return; }
      addBox.innerHTML = `<div class="bc-study-empty">${BC.t("读取文件列表…")}</div>`;
      let files = [];
      try { files = (await S._loadFiles(id)).filter(f => BC.docs.summarizable(f.name, f.ct)); }
      catch (e) { addBox.innerHTML = `<div class="bc-study-empty">${BC.t("读取失败：{msg}", { msg: esc(e.message) })}</div>`; return; }
      const have = new Set((await BC.kb.list(id)).map(m => m.key));
      if (!files.length) { addBox.innerHTML = `<div class="bc-study-empty">${BC.t("这门课没有可读的文档")}</div>`; return; }
      addBox.innerHTML =
        `<div class="bc-study-kbfiles">${files.map(f => `<label><input type="checkbox" value="${f.id}"${have.has("file:" + f.id) ? "" : " checked"}> ${S._icon(f.kind)} <span class="bc-study-kbfname" title="${esc(f.name)}">${esc(f.name)}</span><span class="bc-when">${S._fmtSize(f.size)}${have.has("file:" + f.id) ? " · " + BC.t("已在库") : ""}</span></label>`).join("")}</div>
         <div class="bc-study-row"><button type="button" class="bc-primary-btn" data-go>${BC.t("➕ 添加选中")}</button><button type="button" data-all>${BC.t("全选")}</button><button type="button" data-none>${BC.t("全不选")}</button><button type="button" data-cancel>${BC.t("收起")}</button></div>`;
      addBox.querySelector("[data-all]").onclick = () => addBox.querySelectorAll("input").forEach(i => { i.checked = true; });
      addBox.querySelector("[data-none]").onclick = () => addBox.querySelectorAll("input").forEach(i => { i.checked = false; });
      addBox.querySelector("[data-cancel]").onclick = () => { addBox.innerHTML = ""; };
      addBox.querySelector("[data-go]").onclick = async () => {
        const picked = [...addBox.querySelectorAll("input:checked")].map(i => files.find(f => f.id === i.value)).filter(Boolean);
        if (!picked.length) { S._status(BC.t("没有选中文件"), true); return; }
        addBox.querySelector("[data-go]").disabled = true;
        let ok = 0;
        for (let i = 0; i < picked.length; i++) {
          const f = picked[i];
          S._status(BC.t("读取 {i} / {n}：{name}", { i: i + 1, n: picked.length, name: f.name }));
          try { await addOne({ name: f.name, source: "file", key: "file:" + f.id, text: await S._extractFile(f) }); ok++; }
          catch (e) { S._status(BC.t("{name}：{msg}", { name: f.name, msg: e.message }), true); await new Promise(r => setTimeout(r, 900)); }
        }
        S._status(BC.t("已加入 {ok} / {n} 份材料", { ok, n: picked.length })); addBox.innerHTML = ""; draw();
      };
    };
    const openPaste = () => {
      addBox.innerHTML =
        `<div class="bc-study-row"><input type="text" class="bc-study-kbtitle" placeholder="${BC.t("材料名称（如：第 3 章笔记）")}"></div>
         <textarea class="bc-study-kbpaste" placeholder="${BC.t("把笔记 / 讲义 / 教材段落粘贴到这里…")}"></textarea>
         <div class="bc-study-row"><button type="button" class="bc-primary-btn" data-go>${BC.t("➕ 加入知识库")}</button><button type="button" data-cancel>${BC.t("收起")}</button></div>`;
      addBox.querySelector("[data-cancel]").onclick = () => { addBox.innerHTML = ""; };
      addBox.querySelector("[data-go]").onclick = async () => {
        const text = addBox.querySelector(".bc-study-kbpaste").value;
        const name = addBox.querySelector(".bc-study-kbtitle").value.trim() || BC.t("粘贴 {date}", { date: new Date().toLocaleString(BC.i18n.locale()) });
        try { await addOne({ name, source: "text", text }); S._status(BC.t("已加入知识库")); addBox.innerHTML = ""; draw(); }
        catch (e) { S._status(e.message, true); }
      };
    };
    const addPage = async () => {
      try {
        S._status(BC.t("读取本页正文…"));
        const text = await S.pageText();
        if (!text) throw new Error(BC.t("这个页面没有可读取的正文"));
        const m = await addOne({ name: (c.title || document.title || BC.t("页面")).slice(0, 100), source: "page", key: "page:" + location.href.split("#")[0], text });
        S._status(BC.t("已加入：{name}（{chars}）", { name: m.name, chars: S._fmtChars(m.chars) })); draw();
      } catch (e) { S._status(e.message, true); }
    };
    const addUploads = async files => {
      let ok = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        S._status(BC.t("解析 {i} / {n}：{name}", { i: i + 1, n: files.length, name: f.name }));
        try {
          let text;
          if (BC.docs) text = await BC.docs.extract(await f.arrayBuffer(), f.name, f.type);
          else if (/^text\/|json|csv|html/i.test(f.type) || /\.(txt|md|markdown|csv|tsv|json|html?)$/i.test(f.name)) text = await f.text();
          else throw new Error(BC.t("这个页面环境只能读文本文件（PDF / Office 请在 Canvas 页面里添加）"));
          await addOne({ name: f.name, source: "upload", key: "upload:" + f.name + ":" + f.size, text }); ok++;
        } catch (e) { S._status(BC.t("{name}：{msg}", { name: f.name, msg: e.message }), true); await new Promise(r => setTimeout(r, 900)); }
      }
      S._status(BC.t("已加入 {ok} / {n} 份材料", { ok, n: files.length })); draw();
    };
    const addSums = async () => {
      const id = cid();
      const sums = (S._settings.summaries || []).filter(x => !id || String(x.cid) === String(id));
      if (!sums.length) { S._status(BC.t("没有可用的总结（在「📁 资料」里对文档点 ✨ 生成）"), true); return; }
      let ok = 0;
      for (const x of sums) { try { await BC.kb.add({ cid: x.cid, course: x.course, name: x.name + BC.t("（总结）"), source: "summary", key: "summary:" + x.fileId, text: x.summary }); ok++; } catch (e) {} }
      S._status(BC.t("已加入 {n} 份总结", { n: ok })); draw();
    };

    body.querySelectorAll("[data-add]").forEach(b => b.onclick = () => {
      const k = b.dataset.add;
      if (k === "files") openFiles();
      else if (k === "paste") openPaste();
      else if (k === "page") addPage();
      else if (k === "upload") body.querySelector(".bc-study-kbfile").click();
      else if (k === "sums") addSums();
    });
    body.querySelector(".bc-study-kbfile").addEventListener("change", ev => { const fs = [...ev.target.files]; ev.target.value = ""; if (fs.length) addUploads(fs); });
    body.querySelector(".bc-study-kbclear").onclick = async () => {
      const id = cid();
      const n = (await BC.kb.list(id)).length;
      if (!n) return;
      if (!confirm(BC.t("删除{scope}的 {n} 份材料？", { scope: id ? BC.t("这门课 + 通用") : BC.t("全部"), n }))) return;
      await BC.kb.removeAll(id); S._kbChat = []; draw();
    };
    const sel = body.querySelector(".bc-study-course");
    if (sel) sel.addEventListener("change", () => { S._files = null; addBox.innerHTML = ""; draw(); });
    const inp = body.querySelector(".bc-study-ask input");
    const go = () => { const t = inp.value.trim(); if (t) { S._kbSend(t, cid(), courseName()); inp.value = ""; } };
    inp.addEventListener("keydown", ev => { if (ev.key === "Enter") go(); });
    body.querySelector(".bc-study-ask button").onclick = go;
    draw();
  },

  _kbRenderChat() {
    const S = BC.study;
    const box = document.querySelector("#" + S.ID + " .bc-study-kbanswer");
    if (!box) return;
    box.innerHTML = S._kbChat.map(m =>
      `<div class="bc-ai-msg bc-ai-${m.role}">${BC.assistant._md(m.content[0].text)}</div>` +
      (m.sources && m.sources.length ? `<div class="bc-ai-srcs">${BC.t("📎 依据：")}${BC.kb.sourcesLine(m.sources)}</div>` : "")).join("")
      || `<div class="bc-study-empty">${BC.t("先添加材料，再在下面提问：回答只依据知识库里的内容，并标注出处。")}</div>`;
    box.scrollTop = box.scrollHeight;
  },

  async _kbSend(text, cid, course) {
    const S = BC.study;
    const st = await BC.kb.stats(cid);
    if (!st.docs) { S._status(BC.t("知识库还没有材料，先添加"), true); return; }
    S._kbChat.push({ role: "user", content: [{ type: "text", text }] });
    S._kbRenderChat();
    S._status(BC.t("检索知识库…"));
    try {
      // 检索词 = 本轮问题 + 上一轮问题（追问常常省略主语）
      const prev = S._kbChat.filter(m => m.role === "user").slice(-2, -1).map(m => m.content[0].text).join(" ");
      const lang = BC.assistant._replyLang();
      const hit = await BC.kb.context(cid, text + (prev ? "\n" + prev : ""), lang);
      S._status(BC.t("思考中…"));
      const sys = S._L(`你是大学课程学习助教，只依据学生知识库里的材料片段回答问题。用中文，简洁、分点，专业术语保留英文。${course ? "课程：" + course + "。" : ""}\n`,
                       `You are a university course teaching assistant. Answer only from the passages in the student's knowledge base. Answer in English, concise, in bullet points, keeping technical terms as they are.${course ? " Course: " + course + "." : ""}\n`) +
        (hit ? BC.kb.prompt(hit, lang) : BC.kb.missPrompt(lang));
      const out = await BC.assistant.call(sys, S._kbChat.map(m => ({ role: m.role, content: m.content })));
      S._kbChat.push({ role: "assistant", content: [{ type: "text", text: out }], sources: hit ? hit.sources : null });
      S._kbRenderChat(); S._status("");
    } catch (e) { S._kbChat.pop(); S._kbRenderChat(); S._status(BC.t("失败：{msg}", { msg: e.message }), true); }
  },

  /* ---------- 5) 讲座视频（Kaltura）：直链下载 + 字幕转写 + 总结 ---------- */
  _videos: null,
  _toasted: false,
  _vidText: {},        // entryId -> 字幕纯文本
  _fmtDur(sec) { sec = Math.round(sec || 0); return sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : ""; },

  async _tabVideos(body) {
    const S = BC.study;
    const esc = BC.util.esc;
    const c = await S.ctx();
    body.innerHTML =
      `<div class="bc-study-row">
         <button type="button" class="bc-study-vscan">${BC.t("🔍 扫描本页视频")}</button>
         <button type="button" class="bc-study-vdlall">${BC.t("⬇ 全部下载")}</button>
         <span class="bc-study-fcount"></span>
       </div>
       <div class="bc-study-row"><input type="text" class="bc-study-vurl" placeholder="${BC.t("或粘贴 MediaSpace / Kaltura 视频链接")}"><button type="button" class="bc-study-vadd">${BC.t("添加")}</button></div>
       <div class="bc-study-vlist"><div class="bc-study-empty">${BC.t("扫描中…")}</div></div>
       <div class="bc-study-hint">${BC.t("建议先在页面里点一下播放再扫描：播放器开始播放后才会拿到真正可用的媒体地址，下载会直接用它。只能拿到你有权观看且没有 DRM 的视频；拿不到时仍可用字幕做转写和总结。")}</div>`;
    const list = body.querySelector(".bc-study-vlist");
    const sums = (S._settings.summaries || []);
    const draw = () => {
      const vids = S._videos || [];
      body.querySelector(".bc-study-fcount").textContent = vids.length ? BC.t("{n} 个视频", { n: vids.length }) : "";
      list.innerHTML = vids.length ? vids.map(v => `
        <div class="bc-study-file bc-study-video" data-id="${esc(v.entryId)}">
          <span class="bc-study-ficon">🎬</span>
          <div class="bc-study-fbody">
            <b class="bc-study-vname" title="${esc(v.title || v.name || v.entryId)}">${esc(v.title || v.name || v.entryId)}</b>
            <div class="bc-study-fmeta">${v.duration ? S._fmtDur(v.duration) + " · " : ""}${v.title && v.name && v.name !== v.title ? esc(v.name) + " · " : ""}${esc(v.entryId)}${sums.some(x => x.fileId === "kaltura:" + v.entryId) ? ' · <span class="bc-study-ok">' + BC.t("已总结") + '</span>' : ""}<span class="bc-study-vstat"></span></div>
          </div>
          <button type="button" class="bc-study-vdl" title="${BC.t("下载 MP4（直链）")}">⬇</button>
          ${v.type === "canvas" ? "" : `<button type="button" class="bc-study-vhls" title="${BC.t("HLS 分段下载（直链被关时用；边下边写入你选的文件）")}">🎞</button>`}
          <button type="button" class="bc-study-vcc" title="${BC.t("拉取字幕 / 转写")}">💬</button>
          <button type="button" class="bc-study-vsum" title="${BC.t("用字幕总结这节课")}">✨</button>
          <button type="button" class="bc-study-vdiag" title="${BC.t("诊断信息（下载失败时发给开发者）")}">🔎</button>
        </div>`).join("") : `<div class="bc-study-empty">${BC.t("这个页面没找到 Kaltura 视频。打开有视频的页面再扫描，或粘贴链接。")}</div>`;
      list.querySelectorAll(".bc-study-video").forEach(el => {
        const v = vids.find(x => x.entryId === el.dataset.id);
        const st = el.querySelector(".bc-study-vstat");
        const say = t => { st.textContent = t ? " · " + t : ""; };
        el.querySelector(".bc-study-vdl").onclick = () => S._downloadVideo(v, c, say);
        const hb = el.querySelector(".bc-study-vhls"); if (hb) hb.onclick = () => S._downloadHls(v, c, say, hb);
        el.querySelector(".bc-study-vdiag").onclick = () => {
          let pre = el.nextElementSibling && el.nextElementSibling.classList.contains("bc-study-dbg") ? el.nextElementSibling : null;
          if (pre) { pre.remove(); return; }
          pre = document.createElement("pre"); pre.className = "bc-study-dbg"; pre.textContent = BC.kaltura.diag(v); el.after(pre);
        };
        el.querySelector(".bc-study-vcc").onclick = async () => {
          try { say(BC.t("拉取字幕…")); const text = await S._transcript(v); S._pageText = S._L(`【讲座字幕：${v.title || v.name || v.entryId}】`, `[Lecture transcript: ${v.title || v.name || v.entryId}]`) + "\n" + text.slice(0, 40000); S._chat = []; say(BC.t("字幕 {n} 字，已带到页面对话", { n: text.length })); S.open("chat"); }
          catch (e) { say(BC.t("失败：{msg}", { msg: e.message })); }
        };
        el.querySelector(".bc-study-vsum").onclick = async () => {
          const btn = el.querySelector(".bc-study-vsum"); btn.disabled = true;
          try {
            say(BC.t("拉取字幕…")); const text = await S._transcript(v);
            const name = (v.title || v.name || v.entryId) + BC.t("（讲座字幕）");
            const summary = await S.summarizeText(text, name, t => say(t));
            const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: new Date().toISOString(), cid: c.cid || "", course: c.course, fileId: "kaltura:" + v.entryId, name, url: location.href, chars: text.length, summary };
            await BC.storage.patch(st => { st.summaries = (st.summaries || []).filter(x => x.fileId !== item.fileId); st.summaries.unshift(item); });
            S._settings.summaries = [item, ...(S._settings.summaries || []).filter(x => x.fileId !== item.fileId)];
            say(BC.t("总结完成，在「📁 资料」的已生成总结里"));
          } catch (e) { say(BC.t("失败：{msg}", { msg: e.message })); }
          btn.disabled = false;
        };
      });
    };
    const scan = async () => {
      S._status(BC.t("扫描中…"));
      // 四路合并：页面直接可见的嵌入 + Kaltura iframe 里脚本回传 + LTI 中转页解析 + Canvas 自带媒体
      const [seen, direct, frames, lti, canvas] = await Promise.all([
        BC.kaltura.scanSeen(), Promise.resolve(BC.kaltura.findOnPage()), BC.kaltura.collectFromFrames(1800), BC.kaltura.scanLtiFrames(), BC.kaltura.scanCanvasMedia()
      ]);
      const map = new Map();
      [...seen, ...frames, ...lti, ...direct, ...canvas].forEach(v => {   // 后台抓到的真实请求（带票据和清单）优先，其次 iframe 回传
        const old = map.get(v.entryId);
        if (!old) map.set(v.entryId, v);
        else {
          old.ks = old.ks || v.ks; old.partnerId = old.partnerId || v.partnerId; old.title = old.title || v.title;
          if (v.manifests && v.manifests.length) old.manifests = [...new Set([...(old.manifests || []), ...v.manifests])];
          if (v.sources && !old.sources) old.sources = v.sources;
        }
      });
      const found = [...map.values()];
      found.forEach(v => BC.kaltura._remember(v));   // 记下票据 / partner_id，供同页没抓到地址的视频借用
      S._videos = found;
      draw();
      S._status(found.length ? (found.some(v => v.manifests && v.manifests.length) ? "" : BC.t("已找到视频但还没抓到播放地址：先播放几秒，再扫描一次")) : BC.t("没找到视频。先播放几秒再扫描；仍没有就点「显示本页 iframe」把地址发给开发者。"));
      if (!found.length) {
        const dbg = document.createElement("div"); dbg.className = "bc-study-row";
        const b = document.createElement("button"); b.type = "button"; b.textContent = BC.t("显示本页 iframe");
        b.onclick = () => { const pre = document.createElement("pre"); pre.className = "bc-study-dbg"; pre.textContent = BC.kaltura.frameList().join("\n") || BC.t("（本页没有 iframe）"); dbg.replaceWith(pre); };
        dbg.appendChild(b); list.appendChild(dbg);
      }
      // 补标题 / 时长（失败不影响列表）
      for (const v of found) { if (v.type === "canvas") continue; try { const e = await BC.kaltura.entry(v); v.name = e.name; v.duration = e.duration; if (!v.partnerId) v.partnerId = e.partnerId; } catch (err) { v.err = err.message; } }
      draw();
    };
    body.querySelector(".bc-study-vscan").onclick = scan;
    body.querySelector(".bc-study-vadd").onclick = () => {
      const p = BC.kaltura.parse(body.querySelector(".bc-study-vurl").value.trim());
      if (!p) { S._status(BC.t("这个链接里没有 entry_id（形如 1_abc12345）"), true); return; }
      S._videos = S._videos || [];
      if (!S._videos.some(x => x.entryId === p.entryId)) S._videos.push({ ...p, title: "" });
      body.querySelector(".bc-study-vurl").value = "";
      draw();
      BC.kaltura.entry(p).then(e => { const v = S._videos.find(x => x.entryId === p.entryId); if (v) { v.name = e.name; v.duration = e.duration; v.partnerId = v.partnerId || e.partnerId; draw(); } }).catch(() => {});
    };
    body.querySelector(".bc-study-vdlall").onclick = () => S._downloadAllVideos(c, draw);
    // 自动识别已经填好列表就直接画，同时再合并一次网络记录（播放后才有的清单地址）
    if (S._videos && S._videos.length) { draw(); scan(); } else scan();
  },

  async _transcript(v) {
    const S = BC.study;
    if (S._vidText[v.entryId]) return S._vidText[v.entryId];
    if (v.type === "canvas") throw new Error(BC.t("Canvas 自带媒体没有字幕接口"));
    const caps = await BC.kaltura.captions(v);
    if (!caps.length) throw new Error(BC.t("这个视频没有字幕 / 转写"));
    // 英文优先，其次第一条
    const cap = caps.find(x => /^en/i.test(x.lang) || /english/i.test(x.label)) || caps[0];
    const text = await BC.kaltura.captionText(v, cap);
    if (text.length < 50) throw new Error(BC.t("字幕内容为空"));
    S._vidText[v.entryId] = text;
    return text;
  },

  async _downloadVideo(v, c, say, quiet) {
    const S = BC.study;
    try {
      say(BC.t("解析直链…"));
      const d = v.type === "canvas" ? { url: v.sources[0].url, size: +v.sources[0].size || 0 } : await BC.kaltura.resolveDownload(v);
      const safe = s => String(s || "").replace(/[\\/:*?"<>|]+/g, "_").trim();
      const filename = ["PotatoCanvas", safe(BC.util.courseTitle(c.course) || ("course " + (c.cid || ""))), BC.t("视频"), safe((v.title || v.name || v.entryId).slice(0, 80)) + ".mp4"].join("/");
      const r = await chrome.runtime.sendMessage({ type: "bc-download", url: d.url, filename });
      if (!r || !r.ok) throw new Error(r && r.error || BC.t("下载 API 无响应"));
      say(d.size ? BC.t("已开始下载（{size}）", { size: S._fmtSize(d.size) }) : BC.t("已开始下载"));
      return true;
    } catch (e) {
      say(BC.t("失败：{msg}", { msg: e.message }) + (e.noDirect ? BC.t("　→ 点 🎞 用 HLS 分段下载") : ""));
      if (!quiet) S._status(e.noDirect ? BC.t("直链被关或需要更高权限，改用旁边的 🎞 HLS 分段下载") : e.message, true);
      return false;
    }
  },

  // 全部下载：点击瞬间先选一次文件夹（用户手势），然后逐个视频「直链 -> 失败就 HLS」，全部写进这个文件夹；
  // 直链走浏览器下载 API 时也尽量落到同一文件夹（拿不到目录句柄的浏览器退回默认下载目录）
  async _downloadAllVideos(c, redraw) {
    const S = BC.study;
    const vids = (S._videos || []).slice();
    if (!vids.length) { S._status(BC.t("先扫描到视频"), true); return; }
    let dir = null;
    if (window.showDirectoryPicker) {
      try { dir = await window.showDirectoryPicker({ mode: "readwrite", id: "bc-videos", startIn: "downloads" }); }
      catch (e) { if (e && e.name === "AbortError") { S._status(BC.t("已取消")); return; } S._status(BC.t("选文件夹失败（{msg}），改为：直链走浏览器下载，HLS 先攒内存", { msg: e.message })); }
    } else if (!confirm(BC.t("这个浏览器不支持选文件夹，HLS 视频会先攒在内存再逐个保存。继续下载 {n} 个视频？", { n: vids.length }))) return;
    const safe = s => String(s || "").replace(/[\\/:*?"<>|]+/g, "_").trim();
    const stat = (v, t) => { const el = document.querySelector(`#${S.ID} .bc-study-video[data-id="${CSS.escape(v.entryId)}"] .bc-study-vstat`); if (el) el.textContent = t ? " · " + t : ""; };
    let ok = 0, fail = 0, usedBrowserDl = false;
    for (let i = 0; i < vids.length; i++) {
      const v = vids[i];
      const base = safe((v.title || v.name || v.entryId).slice(0, 80));
      S._status(BC.t("全部下载 {i} / {n}：{name}", { i: i + 1, n: vids.length, name: base }));
      try {
        // 1) 直链（Canvas 自带媒体或 Kaltura MP4）：有目录句柄就流式写进去，否则交给浏览器下载
        let direct = null;
        try { direct = v.type === "canvas" ? { url: v.sources[0].url } : await BC.kaltura.resolveDownload(v); } catch (e) { direct = null; stat(v, BC.t("无直链，改用 HLS")); }
        if (direct) {
          let written = false;
          if (dir) {
            // 先不带 cookie 流式拉进你选的文件夹（CDN 跨域头是通配符，带 cookie 会被拒）；跨域被拒就退回浏览器下载 API
            let ws = null;
            try {
              const r = await fetch(direct.url, { credentials: "omit" });
              if (!r.ok) throw new Error("HTTP " + r.status);
              const fh = await dir.getFileHandle(base + ".mp4", { create: true });
              ws = await fh.createWritable();
              let got = 0; const reader = r.body.getReader();
              while (true) { const { done, value } = await reader.read(); if (done) break; await ws.write(value); got += value.length; stat(v, BC.t("直链 {size}", { size: S._fmtSize(got) })); }
              await ws.close(); ws = null; written = true;
            } catch (e) { if (ws) { try { await ws.abort(); } catch (x) {} } stat(v, BC.t("直接拉取被拒，改走浏览器下载")); }
          }
          if (!written) {
            const r = await chrome.runtime.sendMessage({ type: "bc-download", url: direct.url, filename: ["PotatoCanvas", safe(BC.util.courseTitle(c.course) || "course"), BC.t("视频"), base + ".mp4"].join("/") });
            if (!r || !r.ok) throw new Error(r && r.error || BC.t("下载 API 无响应"));
            usedBrowserDl = true;
          }
          stat(v, written ? BC.t("完成（直链）") : BC.t("已交给浏览器下载（默认下载目录）")); ok++; continue;
        }
        // 2) HLS：目录句柄里建文件流式写；没有句柄就攒内存
        if (v.type === "canvas") throw new Error(BC.t("Canvas 媒体没有直链"));
        const pl = await BC.kaltura.hlsPlaylist(v);
        let sink, chunks = null;
        if (dir) { const fh = await dir.getFileHandle(`${base}.${pl.ext}`, { create: true }); const ws = await fh.createWritable(); sink = { write: b => ws.write(b), close: () => ws.close() }; }
        else { chunks = []; sink = { write: b => { chunks.push(b); }, close: () => {} }; }
        const r = await BC.kaltura.downloadHls(v, sink, (k, n, bytes) => stat(v, BC.t("HLS {k}/{n} 段 · {size}", { k, n, size: S._fmtSize(bytes) })));
        if (chunks) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(chunks, { type: pl.ext === "mp4" ? "video/mp4" : "video/mp2t" })); a.download = `${base}.${pl.ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
        stat(v, BC.t("完成（HLS {n} 段 · {size}{ts}）", { n: r.segments, size: S._fmtSize(r.bytes), ts: pl.ext === "ts" ? " · .ts" : "" })); ok++;
      } catch (e) { stat(v, BC.t("失败：{msg}", { msg: e.message })); fail++; }
    }
    S._status(BC.t("全部下载完成：成功 {ok}，失败 {fail}", { ok, fail }) + (dir ? (usedBrowserDl ? BC.t("（HLS 已写入你选的文件夹，直链在浏览器默认下载目录 PotatoCanvas/…）") : BC.t("（HLS 已写入你选的文件夹）")) : BC.t("，看浏览器下载栏")), fail > 0);
    if (redraw) redraw();
  },

  // HLS 分段下载：点击瞬间先弹「另存为」（需要用户手势），然后逐段拉取、解密、写入；不支持 showSaveFilePicker 时先攒在内存再一次性下载
  async _downloadHls(v, c, say, btn) {
    const S = BC.study;
    if (btn) btn.disabled = true;
    const name = ((v.title || v.name || v.entryId).slice(0, 80)).replace(/[\\/:*?"<>|]+/g, "_");
    let sink, handle, chunks = null, ext = "ts";
    try {
      // 先弄清是 ts 还是 fMP4，决定后缀（这一步很快，不会耗尽用户手势）
      say(BC.t("读取播放列表…"));
      const pl = await BC.kaltura.hlsPlaylist(v);
      ext = pl.ext;
      if (window.showSaveFilePicker) {
        try {
          handle = await window.showSaveFilePicker({ suggestedName: `${name}.${ext}`, types: [{ description: BC.t("视频"), accept: { [ext === "mp4" ? "video/mp4" : "video/mp2t"]: ["." + ext] } }] });
          const ws = await handle.createWritable();
          sink = { write: b => ws.write(b), close: () => ws.close() };
        } catch (e) { if (e && e.name === "AbortError") { say(BC.t("已取消")); if (btn) btn.disabled = false; return false; } }
      }
      if (!sink) { chunks = []; sink = { write: b => { chunks.push(b); }, close: () => {} }; say(BC.t("浏览器不支持流式保存，先攒在内存里…")); }
      const t0 = Date.now();
      const r = await BC.kaltura.downloadHls(v, sink, (i, n, bytes) => say(BC.t("{i} / {n} 段 · {size}", { i, n, size: S._fmtSize(bytes) }) + (v.hlsRes ? " · " + v.hlsRes : "")));
      if (chunks) {
        const blob = new Blob(chunks, { type: ext === "mp4" ? "video/mp4" : "video/mp2t" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${name}.${ext}`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      }
      say(BC.t("完成：{n} 段 · {size} · {sec} 秒", { n: r.segments, size: S._fmtSize(r.bytes), sec: Math.round((Date.now() - t0) / 1000) }) + (ext === "ts" ? BC.t("（.ts 文件，VLC / PotPlayer 直接播；要 .mp4 用 ffmpeg -i in.ts -c copy out.mp4）") : ""));
      if (btn) btn.disabled = false;
      return true;
    } catch (e) {
      try { if (sink && sink.close && !chunks) await sink.close(); } catch (x) {}
      say(BC.t("HLS 失败：{msg}", { msg: e.message }));
      S._status(BC.t("HLS 失败：{msg}", { msg: e.message }), true);
      if (btn) btn.disabled = false;
      return false;
    }
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
      ct: f["content-type"] || f.content_type || "", folder: f._module ? BC.t("模块 / {m}", { m: f._module }) : (folders[f.folder_id] || ""),
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
         <input type="search" class="bc-study-fq" placeholder="${BC.t("搜文件名")}">
         <select class="bc-study-ftype"><option value="">${BC.t("全部类型")}</option><option value="pdf">PDF</option><option value="pptx">PPT</option><option value="docx">Word</option><option value="other">${BC.t("其他")}</option></select>
       </div>
       <div class="bc-study-row">
         <button type="button" class="bc-study-dlall">${BC.t("⬇ 全部下载")}</button>
         <button type="button" class="bc-study-sumall">${BC.t("✨ 总结全部可读文档")}</button>
         <span class="bc-study-fcount"></span>
       </div>
       <div class="bc-study-flist"><div class="bc-study-empty">${BC.t("读取文件列表…")}</div></div>
       <div class="bc-study-sub">${BC.t("已生成的总结")}</div>
       <div class="bc-study-slist"></div>`;
    const draw = async () => {
      cid = await S._courseId();
      if (!c.cid) S._courseSel = cid;   // 记住下拉框当前选的课
      if (!cid) { body.querySelector(".bc-study-flist").innerHTML = `<div class="bc-study-empty">${BC.t("没有在读课程")}</div>`; return; }
      let list;
      try { list = await S._loadFiles(cid); } catch (e) { body.querySelector(".bc-study-flist").innerHTML = `<div class="bc-study-empty">${BC.t("读取失败：{msg}", { msg: esc(e.message) })}</div>`; return; }
      const q = body.querySelector(".bc-study-fq").value.trim().toLowerCase();
      const t = body.querySelector(".bc-study-ftype").value;
      const shown = list.filter(f => (!q || f.name.toLowerCase().includes(q)) && (!t || (t === "other" ? !["pdf", "pptx", "docx"].includes(f.kind) : f.kind === t)));
      body.querySelector(".bc-study-fcount").textContent = BC.t("{a} / {b} 个文件", { a: shown.length, b: list.length });
      const sums = (S._settings.summaries || []).filter(x => String(x.cid) === String(cid));
      const done = new Set(sums.map(x => x.fileId));
      let folder = null, html = "";
      shown.forEach(f => {
        if (f.folder !== folder) { folder = f.folder; html += `<div class="bc-study-folder">📂 ${esc(folder || BC.t("根目录"))}</div>`; }
        html += `<div class="bc-study-file" data-id="${f.id}">
          <span class="bc-study-ficon">${S._icon(f.kind)}</span>
          <div class="bc-study-fbody"><a href="${esc(f.url)}" target="_blank" rel="noopener" title="${esc(f.name)}">${esc(f.name)}</a>
            <div class="bc-study-fmeta">${S._fmtSize(f.size)}${f.updated ? " · " + BC.util.fmtDate(f.updated) : ""}${done.has(f.id) ? ' · <span class="bc-study-ok">' + BC.t("已总结") + '</span>' : ""}</div></div>
          <button type="button" class="bc-study-fdl" title="${BC.t("下载")}">⬇</button>
          ${BC.docs.summarizable(f.name, f.ct) ? `<button type="button" class="bc-study-fsum" title="${BC.t("生成复习总结")}">✨</button><button type="button" class="bc-study-fchat" title="${BC.t("在「页面对话」里就这个文件提问")}">💬</button>` : ""}
        </div>`;
      });
      body.querySelector(".bc-study-flist").innerHTML = html || `<div class="bc-study-empty">${BC.t("没有文件")}</div>`;
      body.querySelectorAll(".bc-study-file").forEach(el => {
        const f = list.find(x => x.id === el.dataset.id);
        el.querySelector(".bc-study-fdl").onclick = () => S._download(f, c);
        const sb = el.querySelector(".bc-study-fsum"); if (sb) sb.onclick = () => S._summarizeFile(f, c, sb);
        const cb = el.querySelector(".bc-study-fchat"); if (cb) cb.onclick = async () => {
          try { S._status(BC.t("读取文件…")); const text = await S._extractFile(f); S._pageText = S._L(`【文件：${f.name}】`, `[File: ${f.name}]`) + "\n" + text.slice(0, 40000); S._chat = []; S._status(""); S.open("chat"); }
          catch (e) { S._status(BC.t("读取失败：{msg}", { msg: e.message }), true); }
        };
      });
      // 已有总结
      body.querySelector(".bc-study-slist").innerHTML = sums.length ? sums.map(x => `
        <details class="bc-study-sum" data-id="${esc(x.id)}">
          <summary>${esc(x.name)} <span class="bc-when">${BC.util.fmtDate(x.ts)} · ${BC.t("{n} 字", { n: x.chars })}</span></summary>
          <div class="bc-ai-msg bc-ai-assistant">${BC.assistant._md(x.summary)}</div>
          <div class="bc-study-row"><button type="button" data-copy>${BC.t("复制")}</button><button type="button" data-md>${BC.t("导出 MD")}</button><button type="button" data-cards>${BC.t("🃏 生成闪卡")}</button><button type="button" class="bc-del" data-del>${BC.t("删除")}</button></div>
        </details>`).join("") : `<div class="bc-study-empty">${BC.t("还没有总结。点文件旁的 ✨。")}</div>`;
      body.querySelectorAll(".bc-study-sum").forEach(el => {
        const x = sums.find(y => y.id === el.dataset.id);
        el.querySelector("[data-copy]").onclick = () => navigator.clipboard.writeText(x.summary).then(() => S._status(BC.t("已复制")));
        el.querySelector("[data-md]").onclick = () => S._downloadText(`# ${x.name}\n\n${x.summary}`, x.name.replace(/\.[^.]+$/, "") + BC.t(" - 总结.md"));
        el.querySelector("[data-cards]").onclick = () => { S._tab = "cards"; S._renderTab(); S._genCards(x.summary, 12); };
        el.querySelector("[data-del]").onclick = async () => { await BC.storage.patch(st => { st.summaries = (st.summaries || []).filter(y => y.id !== x.id); }); S._settings.summaries = (S._settings.summaries || []).filter(y => y.id !== x.id); draw(); };
      });
    };
    body.querySelectorAll(".bc-study-fq,.bc-study-ftype,.bc-study-course").forEach(el => el.addEventListener("input", () => { if (el.classList.contains("bc-study-course")) { S._courseSel = el.value; S._files = null; } draw(); }));
    body.querySelector(".bc-study-dlall").onclick = async () => {
      const list = S._files ? S._files.list : [];
      if (!list.length) return;
      if (!confirm(BC.t("下载这门课的全部 {n} 个文件到「下载/PotatoCanvas/{dir}/」？", { n: list.length, dir: BC.util.courseTitle(c.course) || cid }))) return;
      let n = 0;
      for (const f of list) { if (await S._download(f, c, true)) n++; S._status(BC.t("下载中… {n} / {total}", { n, total: list.length })); }
      S._status(BC.t("已发起 {n} 个下载，看浏览器下载栏", { n }));
    };
    body.querySelector(".bc-study-sumall").onclick = async () => {
      const list = (S._files ? S._files.list : []).filter(f => BC.docs.summarizable(f.name, f.ct));
      const done = new Set((S._settings.summaries || []).filter(x => String(x.cid) === String(cid)).map(x => x.fileId));
      const todo = list.filter(f => !done.has(f.id));
      if (!todo.length) { S._status(BC.t("没有待总结的文档"), true); return; }
      if (!confirm(BC.t("要总结 {n} 个文档（已总结的跳过）。每个文档会调用一到多次模型，确认继续？", { n: todo.length }))) return;
      for (let i = 0; i < todo.length; i++) { S._status(BC.t("总结中 {i} / {n}：{name}", { i: i + 1, n: todo.length, name: todo[i].name })); await S._summarizeFile(todo[i], c, null, true); }
      S._status(BC.t("全部完成")); draw();
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
    const filename = ["PotatoCanvas", safe(BC.util.courseTitle(c.course) || ("course " + (c.cid || ""))), ...(f.folder ? f.folder.split("/").map(safe).filter(Boolean) : []), safe(f.name)].join("/");
    let r;
    try { r = await chrome.runtime.sendMessage({ type: "bc-download", url: f.url, filename }); } catch (e) { r = { ok: false, error: e.message }; }
    if (!r || !r.ok) { if (!quiet) BC.study._status(BC.t("下载失败：{msg}", { msg: r && r.error || BC.t("无响应") }), true); return false; }
    if (!quiet) BC.study._status(BC.t("已开始下载 {name}", { name: f.name }));
    return true;
  },

  async _extractFile(f) {
    const S = BC.study;
    if (S._fileText[f.id]) return S._fileText[f.id];
    const r = await fetch(f.url, { credentials: "same-origin" });
    if (!r.ok) throw new Error(BC.t("下载失败 HTTP {status}", { status: r.status }));
    const text = (await BC.docs.extract(await r.arrayBuffer(), f.name, r.headers.get("content-type") || f.ct)).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 50) throw new Error(BC.t("没有提取到文字（可能是扫描件 / 图片型 PDF）"));
    S._fileText[f.id] = text;
    return text;
  },

  // 长文档 -> 分块小结（map）-> 合并成一份干净的复习总结（reduce）
  async summarizeText(text, name, onProgress) {
    const S = BC.study;
    const chunks = [];
    for (let i = 0; i < text.length; i += S.CHUNK) chunks.push(text.slice(i, i + S.CHUNK));
    const L = S._L;
    const FINAL = L(`请把内容整理成一份干净、便于复习的总结，用 Markdown，结构固定为：
## 一句话概览
## 核心概念（每条：术语 — 定义，术语保留英文）
## 重点内容（按原文顺序分小节，要点式，保留关键数字 / 公式 / 步骤）
## 公式与定义速查（如有）
## 可能的考点 / 易错点
## 待澄清的问题（原文没讲清楚的地方）
用中文，不要加任何前言后语。`,
`Organize the content into a clean, review-friendly summary in Markdown with exactly this structure:
## One-line overview
## Core concepts (each: term — definition, keep technical terms as they are)
## Key content (sub-sections in the original order, bullet points, keep key numbers / formulas / steps)
## Formula & definition quick reference (if any)
## Likely exam points / common pitfalls
## Open questions (things the material leaves unclear)
Answer in English. No preamble or closing remarks.`);
    const SYS = L("你是把课程材料整理成复习笔记的助教。只依据给定内容，不编造。",
                  "You are a teaching assistant who turns course materials into review notes. Use only the given content; do not make anything up.");
    if (chunks.length === 1) {
      return BC.assistant.call(SYS,
        [{ role: "user", content: [{ type: "text", text: `${FINAL}\n\n${L(`材料《${name}》：`, `Material "${name}":`)}\n${text}` }] }]);
    }
    // map 阶段并行跑（PARALLEL 个一组）：等待时间从「块数 × 单次」降到「ceil(块数 / 并行数) × 单次」
    const notes = new Array(chunks.length);
    let done = 0, next = 0;
    onProgress && onProgress(BC.t("分块小结 {i} / {n}", { i: 0, n: chunks.length }));
    const worker = async () => {
      while (next < chunks.length) {
        const i = next++;
        notes[i] = await BC.assistant.call(SYS,
          [{ role: "user", content: [{ type: "text", text: L(`这是材料《${name}》的第 ${i + 1}/${chunks.length} 部分。请提炼要点：概念定义、关键论述、公式 / 步骤、例子、数字，要点式，保留信息密度，控制在 800 字以内，用中文，术语保留英文。`,
            `This is part ${i + 1}/${chunks.length} of the material "${name}". Extract the key points: concept definitions, key arguments, formulas / steps, examples, numbers — as bullet points, information-dense, within 600 words, in English, keeping technical terms as they are.`) + `\n\n${chunks[i]}` }] }]);
        onProgress && onProgress(BC.t("分块小结 {i} / {n}", { i: ++done, n: chunks.length }));
      }
    };
    await Promise.all(Array.from({ length: Math.min(S.PARALLEL, chunks.length) }, worker));
    onProgress && onProgress(BC.t("合并总结…"));
    return BC.assistant.call(SYS,
      [{ role: "user", content: [{ type: "text", text: L(`下面是材料《${name}》各部分的要点小结，请合并去重后${FINAL}`, `Below are the key-point notes for each part of the material "${name}". Merge and de-duplicate them, then: ${FINAL}`) + `\n\n${notes.map((n, i) => L(`【第 ${i + 1} 部分】`, `[Part ${i + 1}]`) + `\n${n}`).join("\n\n")}` }] }]);
  },

  async _summarizeFile(f, c, btn, quiet) {
    const S = BC.study;
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    try {
      S._status(BC.t("读取文件…"));
      const text = await S._extractFile(f);
      const summary = await S.summarizeText(text, f.name, t => S._status(BC.t("{name}：{msg}", { name: f.name, msg: t })));
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: new Date().toISOString(), cid: c.cid || (S._files && S._files.cid) || "", course: c.course, fileId: f.id, name: f.name, url: f.url, chars: text.length, summary };
      await BC.storage.patch(st => { st.summaries = (st.summaries || []).filter(x => x.fileId !== f.id); st.summaries.unshift(item); if (st.summaries.length > 200) st.summaries.length = 200; });
      S._settings.summaries = [item, ...(S._settings.summaries || []).filter(x => x.fileId !== f.id)];
      if (!quiet) { S._status(BC.t("总结完成")); S._renderTab(); }
    } catch (e) {
      S._status(BC.t("{name}：{msg}", { name: f.name, msg: e.message }), true);
      if (btn) { btn.disabled = false; btn.textContent = "✨"; }
    }
  },

  /* ---------- 1) 页面对话 ---------- */
  _tabChat(body) {
    const S = BC.study;
    body.innerHTML =
      `<div class="bc-study-row">
         <button type="button" data-act="summary">${BC.t("📄 总结要点")}</button>
         <button type="button" data-act="outline">${BC.t("🧭 生成大纲")}</button>
         <button type="button" data-act="terms">${BC.t("🔑 关键术语")}</button>
         <button type="button" data-act="questions">${BC.t("❓ 可能考什么")}</button>
       </div>
       <div class="bc-study-src"></div>
       <div class="bc-ai-answer bc-study-answer"></div>
       <div class="bc-study-ask"><input type="text" placeholder="${BC.t("就这个页面提问…（Enter 发送）")}"><button type="button">${BC.t("发送")}</button></div>`;
    const L = S._L;
    const PROMPTS = {
      summary: L("请用要点总结这个页面的内容：先一句话概括，再列 5–10 条要点，最后写出需要记住的公式 / 定义 / 截止日期（如果有）。",
                 "Summarize this page in bullet points: a one-sentence overview first, then 5–10 key points, and finally any formulas / definitions / deadlines to remember (if any)."),
      outline: L("请把这个页面的内容整理成层级大纲（最多三级），每个条目一句话。",
                 "Organize this page's content into a hierarchical outline (at most three levels), one sentence per item."),
      terms: L("请列出这个页面里的关键术语，每个给出简明定义和一个例子，按重要性排序。",
               "List the key terms on this page, each with a concise definition and one example, ordered by importance."),
      questions: L("根据这个页面的内容，列出 8 个最可能出现在作业或考试里的问题，并给每个问题写一句「答题要点」（不要完整答案）。",
                   "Based on this page, list the 8 questions most likely to appear in homework or an exam, and for each write a one-line \"answer key\" (not a full answer).")
    };
    body.querySelectorAll("[data-act]").forEach(b => b.onclick = () => S._chatSend(PROMPTS[b.dataset.act], true));
    const inp = body.querySelector(".bc-study-ask input");
    const go = () => { const t = inp.value.trim(); if (t) { S._chatSend(t, false); inp.value = ""; } };
    inp.addEventListener("keydown", ev => { if (ev.key === "Enter") go(); });
    body.querySelector(".bc-study-ask button").onclick = go;
    S._renderChat();
    S.pageText().then(t => { const el = body.querySelector(".bc-study-src"); if (el) el.textContent = t ? BC.t("已读取页面正文 {n} 字", { n: t.length }) : BC.t("这个页面没有可读取的正文"); });
  },

  _renderChat() {
    const S = BC.study;
    const box = document.querySelector("#" + S.ID + " .bc-study-answer");
    if (!box) return;
    box.innerHTML = S._chat.map(m => `<div class="bc-ai-msg bc-ai-${m.role}">${BC.assistant._md(m.content[0].text.replace(/^\[(?:页面正文|Page text)\][\s\S]*?\[\/(?:页面正文|Page text)\]\s*/, ""))}</div>`).join("")
      || `<div class="bc-study-empty">${BC.t("点上面的按钮，或直接提问。")}</div>`;
    box.scrollTop = box.scrollHeight;
  },

  async _chatSend(text, fresh) {
    const S = BC.study;
    const page = await S.pageText();
    if (!page) { S._status(BC.t("这个页面没有可读取的正文"), true); return; }
    if (fresh) S._chat = [];
    const first = !S._chat.length;
    S._chat.push({ role: "user", content: [{ type: "text", text: first ? S._L(`[页面正文]\n${page}\n[/页面正文]\n\n${text}`, `[Page text]\n${page}\n[/Page text]\n\n${text}`) : text }] });
    S._renderChat();
    S._status(BC.t("思考中…"));
    try {
      const c = await S.ctx();
      const sys = S._L(`你是大学课程学习助教。用户会给你一个 Canvas 页面的正文，请只依据这段正文回答；正文里没有的内容明确说明。回答用中文，简洁、分点。${c.course ? "课程：" + c.course + "。" : ""}`,
                       `You are a university course teaching assistant. The user will give you the text of a Canvas page; answer only from that text, and say explicitly when something is not covered by it. Answer in English, concise, in bullet points.${c.course ? " Course: " + c.course + "." : ""}`);
      const out = await BC.assistant.call(sys, S._chat);
      S._chat.push({ role: "assistant", content: [{ type: "text", text: out }] });
      S._renderChat(); S._status("");
    } catch (e) { S._chat.pop(); S._renderChat(); S._status(BC.t("失败：{msg}", { msg: e.message }), true); }
  },

  /* ---------- JSON 宽松解析（各家模型偶尔会带 ```json 围栏或前后说明） ---------- */
  _json(text) {
    const s = String(text || "");
    const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = m ? m[1] : s;
    const start = body.indexOf("["), end = body.lastIndexOf("]");
    if (start < 0 || end <= start) throw new Error(BC.t("模型没有返回 JSON 数组"));
    return JSON.parse(body.slice(start, end + 1));
  },

  /* ---------- 资料选择器（闪卡 / 练习共用）：选课程文件 -> 正文（或已有总结） ---------- */
  MATERIAL_MAX: 30000,
  async _materialPicker(container, onPick) {
    const S = BC.study;
    const esc = BC.util.esc;
    container.innerHTML = `<div class="bc-study-row bc-study-mat"><span class="bc-study-mat-label">${BC.t("从资料：")}</span><select class="bc-study-mat-sel"><option value="">${BC.t("读取文件列表…")}</option></select><label><input type="checkbox" class="bc-study-mat-sum" checked> ${BC.t("优先用已有总结")}</label><button type="button" class="bc-study-mat-go">${BC.t("✨ 生成")}</button></div>`;
    const sel = container.querySelector(".bc-study-mat-sel");
    const cid = await S._courseId();
    let list = [];
    try { list = cid ? (await S._loadFiles(cid)).filter(f => BC.docs.summarizable(f.name, f.ct)) : []; } catch (e) {}
    const sums = new Set((S._settings.summaries || []).filter(x => String(x.cid) === String(cid)).map(x => x.fileId));
    sel.innerHTML = list.length
      ? `<option value="">${BC.t("选择文件…")}</option>` + list.map(f => `<option value="${f.id}">${S._icon(f.kind)} ${esc(f.name)}${sums.has(f.id) ? BC.t("（已总结）") : ""}</option>`).join("")
      : `<option value="">${cid ? BC.t("这门课没有可读的文档") : BC.t("不在课程页")}</option>`;
    container.querySelector(".bc-study-mat-go").onclick = async () => {
      const f = list.find(x => x.id === sel.value);
      if (!f) { S._status(BC.t("先选一个文件"), true); return; }
      const useSum = container.querySelector(".bc-study-mat-sum").checked;
      const sum = useSum ? (S._settings.summaries || []).find(x => x.fileId === f.id) : null;
      try {
        let text;
        if (sum) text = sum.summary;
        else { S._status(BC.t("读取文件…")); text = await S._extractFile(f); if (text.length > S.MATERIAL_MAX) { text = text.slice(0, S.MATERIAL_MAX); S._status(BC.t("文件较长，取前 {n} 字（先做总结再生成会更全）", { n: S.MATERIAL_MAX })); } }
        await onPick(S._L(`【资料：${f.name}】`, `[Material: ${f.name}]`) + "\n" + text, f);
      } catch (e) { S._status(BC.t("读取失败：{msg}", { msg: e.message }), true); }
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
         <button type="button" data-act="page">${BC.t("✨ 从本页生成")}</button>
         <button type="button" data-act="sel">${BC.t("✨ 从选中文字生成")}</button>
         <select class="bc-study-n"><option value="8">${BC.t("{n} 张", { n: 8 })}</option><option value="12" selected>${BC.t("{n} 张", { n: 12 })}</option><option value="20">${BC.t("{n} 张", { n: 20 })}</option></select>
       </div>
       <div class="bc-study-matbox"></div>
       <div class="bc-study-gen"></div>
       <div class="bc-study-sub">${BC.t("我的卡组")}</div>
       <div class="bc-study-decks">${decks.length ? decks.map(d => `
         <div class="bc-study-deck" data-id="${esc(d.id)}">
           <div class="bc-study-deck-hd"><b>${esc(d.title)}</b> <span class="bc-pill">${BC.t("{n} 张", { n: d.cards.length })}</span>
             ${S._dueCount(d) ? `<span class="bc-pill bc-pill-bad">${BC.t("{n} 待复习", { n: S._dueCount(d) })}</span>` : ""}
             <span class="bc-when">${esc(d.course || "")}</span></div>
           <div class="bc-study-deck-act"><button type="button" data-review>${BC.t("▶ 复习")}</button><button type="button" data-browse>${BC.t("浏览")}</button><button type="button" class="bc-del" data-del>${BC.t("删除")}</button></div>
         </div>`).join("") : `<div class="bc-study-empty">${BC.t("还没有卡组。从本页或选中文字生成一组试试。")}</div>`}
       </div>`;
    body.querySelector("[data-act=page]").onclick = () => S._genCards(null, +body.querySelector(".bc-study-n").value);
    body.querySelector("[data-act=sel]").onclick = () => {
      const sel = window.getSelection().toString().trim();
      if (sel.length < 20) { S._status(BC.t("先在页面上选中一段文字（至少 20 字）"), true); return; }
      S._genCards(sel, +body.querySelector(".bc-study-n").value);
    };
    S._materialPicker(body.querySelector(".bc-study-matbox"), (text, f) => S._genCards(text, +body.querySelector(".bc-study-n").value, f.name));
    body.querySelectorAll(".bc-study-deck").forEach(el => {
      const deck = decks.find(d => d.id === el.dataset.id);
      el.querySelector("[data-review]").onclick = () => S._review(deck);
      el.querySelector("[data-browse]").onclick = () => S._browse(deck);
      el.querySelector("[data-del]").onclick = async () => { if (!confirm(BC.t("删除卡组「{title}」？", { title: deck.title }))) return; await S._saveDecks(decks.filter(d => d !== deck)); S._renderTab(); };
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
    if (!text) { S._status(BC.t("这个页面没有可读取的正文"), true); return; }
    S._status(BC.t("生成中…"));
    try {
      const c = await S.ctx();
      const L = S._L;
      const out = await BC.assistant.call(
        L("你是出题助教。只输出 JSON 数组，不要任何解释或 Markdown 围栏。", "You are a question-writing assistant. Output only a JSON array — no explanation, no Markdown fences."),
        [{ role: "user", content: [{ type: "text", text:
          L(`根据下面的内容生成 ${n} 张复习闪卡，覆盖最重要的概念、定义、公式和易错点。每张卡是一个对象 {"q": 问题, "a": 答案}，问题具体、答案简洁（1–3 句），用中文，专业术语保留英文。\n\n内容：\n${text}`,
            `From the content below, generate ${n} review flashcards covering the most important concepts, definitions, formulas and common pitfalls. Each card is an object {"q": question, "a": answer}; questions specific, answers concise (1–3 sentences), in English, keeping technical terms as they are.\n\nContent:\n${text}`) }] }]);
      const arr = S._json(out).filter(x => x && x.q && x.a).map(x => ({ id: Math.random().toString(36).slice(2, 8), q: String(x.q), a: String(x.a), box: 1, due: 0 }));
      if (!arr.length) throw new Error(BC.t("没有生成出有效的卡片"));
      S._cards = arr;
      const gen = document.querySelector("#" + S.ID + " .bc-study-gen");
      gen.innerHTML =
        `<div class="bc-study-sub">${BC.t("生成了 {n} 张（可删掉不要的）", { n: arr.length })}</div>
         <ul class="bc-study-cardlist">${arr.map(cd => `<li data-id="${cd.id}"><b>Q:</b> ${esc(cd.q)}<br><b>A:</b> ${esc(cd.a)} <button type="button" class="bc-del">✕</button></li>`).join("")}</ul>
         <div class="bc-study-row"><input type="text" class="bc-study-deckname" value="${esc((deckName || c.title || BC.t("闪卡")).replace(/\.[^.]+$/, "").slice(0, 40))}" placeholder="${BC.t("卡组名")}"><button type="button" class="bc-primary-btn bc-study-savedeck">${BC.t("💾 保存为卡组")}</button></div>`;
      gen.querySelectorAll("li .bc-del").forEach(b => b.onclick = () => { const li = b.closest("li"); S._cards = S._cards.filter(x => x.id !== li.dataset.id); li.remove(); });
      gen.querySelector(".bc-study-savedeck").onclick = async () => {
        if (!S._cards.length) return;
        const decks = S._decks().slice();
        decks.unshift({ id: Date.now().toString(36), ts: new Date().toISOString(), title: gen.querySelector(".bc-study-deckname").value.trim() || BC.t("闪卡"), course: c.course, cid: c.cid, url: c.url, cards: S._cards });
        await S._saveDecks(decks);
        S._cards = [];
        S._renderTab(); S._status(BC.t("已保存卡组"));
      };
      S._status("");
    } catch (e) { S._status(BC.t("失败：{msg}", { msg: e.message }), true); }
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
        body.innerHTML = `<div class="bc-study-done">${BC.t("🎉 这轮复习完成（{n} 张）", { n: queue.length })}</div><div class="bc-study-row"><button type="button" class="bc-study-back">${BC.t("返回卡组")}</button></div>`;
        body.querySelector(".bc-study-back").onclick = () => S._renderTab();
        return;
      }
      const cd = queue[i];
      body.innerHTML =
        `<div class="bc-study-sub">${esc(deck.title)} · ${i + 1} / ${queue.length} · ${BC.t("盒子 {n}", { n: cd.box || 1 })}</div>
         <div class="bc-study-card ${flipped ? "bc-study-flipped" : ""}">
           <div class="bc-study-card-q">${esc(cd.q)}</div>
           ${flipped ? `<div class="bc-study-card-a">${esc(cd.a)}</div>` : `<div class="bc-study-card-hint">${BC.t("点击翻面")}</div>`}
         </div>
         <div class="bc-study-row bc-study-rate" ${flipped ? "" : "hidden"}>
           <button type="button" data-r="again">${BC.t("😵 又忘了")}</button><button type="button" data-r="hard">${BC.t("😐 模糊")}</button>
           <button type="button" data-r="good">${BC.t("🙂 记住了")}</button><button type="button" data-r="easy">${BC.t("😎 太简单")}</button>
         </div>
         <div class="bc-study-row"><button type="button" class="bc-study-back">${BC.t("返回卡组")}</button></div>`;
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
      `<div class="bc-study-sub">${esc(deck.title)} · ${BC.t("{n} 张", { n: deck.cards.length })}</div>
       <ul class="bc-study-cardlist">${deck.cards.map(cd => `<li data-id="${cd.id}"><b>Q:</b> ${esc(cd.q)}<br><b>A:</b> ${esc(cd.a)} <span class="bc-when">${BC.t("盒子 {n}", { n: cd.box || 1 })}</span> <button type="button" class="bc-del">✕</button></li>`).join("")}</ul>
       <div class="bc-study-row"><button type="button" class="bc-study-back">${BC.t("返回卡组")}</button><button type="button" class="bc-study-export">${BC.t("导出 Markdown")}</button></div>`;
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
         <button type="button" data-act="page">${BC.t("✨ 从本页出题")}</button>
         <button type="button" data-act="sel">${BC.t("✨ 从选中文字出题")}</button>
         <select class="bc-study-n"><option value="5">${BC.t("{n} 题", { n: 5 })}</option><option value="8" selected>${BC.t("{n} 题", { n: 8 })}</option><option value="12">${BC.t("{n} 题", { n: 12 })}</option></select>
       </div>
       <div class="bc-study-matbox"></div>
       <div class="bc-study-empty">${BC.t("生成选择题自测，答完看解析；错题可以一键存进题库。")}</div>`;
    S._materialPicker(body.querySelector(".bc-study-matbox"), text => S._genQuiz(text, +body.querySelector(".bc-study-n").value));
    body.querySelector("[data-act=page]").onclick = () => S._genQuiz(null, +body.querySelector(".bc-study-n").value);
    body.querySelector("[data-act=sel]").onclick = () => {
      const sel = window.getSelection().toString().trim();
      if (sel.length < 20) { S._status(BC.t("先在页面上选中一段文字（至少 20 字）"), true); return; }
      S._genQuiz(sel, +body.querySelector(".bc-study-n").value);
    };
  },

  async _genQuiz(source, n) {
    const S = BC.study;
    const text = source || await S.pageText();
    if (!text) { S._status(BC.t("这个页面没有可读取的正文"), true); return; }
    S._status(BC.t("出题中…"));
    try {
      const L = S._L;
      const out = await BC.assistant.call(
        L("你是出题助教。只输出 JSON 数组，不要任何解释或 Markdown 围栏。", "You are a question-writing assistant. Output only a JSON array — no explanation, no Markdown fences."),
        [{ role: "user", content: [{ type: "text", text:
          L(`根据下面的内容出 ${n} 道单选题，考查理解而不是死记硬背，难度有梯度。每题一个对象：{"q": 题干, "options": [4 个选项], "answer": 正确选项下标(0-3), "explain": 解析（为什么对、其他为什么错）}。用中文，专业术语保留英文。\n\n内容：\n${text}`,
            `From the content below, write ${n} single-answer multiple-choice questions that test understanding rather than rote memory, with a range of difficulty. Each question is an object: {"q": question, "options": [4 options], "answer": index of the correct option (0-3), "explain": explanation (why it is right and why the others are wrong)}. In English, keeping technical terms as they are.\n\nContent:\n${text}`) }] }]);
      const items = S._json(out).filter(x => x && x.q && Array.isArray(x.options) && x.options.length >= 2)
        .map(x => ({ q: String(x.q), options: x.options.map(String), answer: Math.max(0, Math.min(x.options.length - 1, +x.answer || 0)), explain: String(x.explain || "") }));
      if (!items.length) throw new Error(BC.t("没有生成出有效的题目"));
      S._quiz = { items, idx: 0, picked: [], done: false };
      S._status("");
      S._renderQuiz(document.querySelector("#" + S.ID + " .bc-study-body"));
    } catch (e) { S._status(BC.t("失败：{msg}", { msg: e.message }), true); }
  },

  _renderQuiz(body) {
    const S = BC.study;
    const esc = BC.util.esc;
    const Q = S._quiz;
    if (Q.done) {
      const right = Q.picked.filter((p, i) => p === Q.items[i].answer).length;
      const wrong = Q.items.map((it, i) => ({ it, i })).filter(({ it, i }) => Q.picked[i] !== it.answer);
      body.innerHTML =
        `<div class="bc-study-done">${BC.t("得分 {a} / {b}", { a: right, b: Q.items.length })}</div>
         ${wrong.length ? `<div class="bc-study-sub">${BC.t("错题")}</div><ul class="bc-study-cardlist">${wrong.map(({ it, i }) => `<li><b>${i + 1}.</b> ${esc(it.q)}<br><span class="bc-study-ok">${BC.t("正确：")}${esc(it.options[it.answer])}</span><br><small>${esc(it.explain)}</small></li>`).join("")}</ul>` : `<div class="bc-study-empty">${BC.t("全对 🎉")}</div>`}
         <div class="bc-study-row">
           ${wrong.length ? `<button type="button" class="bc-primary-btn bc-study-savewrong">${BC.t("💾 错题存题库")}</button>` : ""}
           <button type="button" class="bc-study-again">${BC.t("再来一组")}</button>
         </div>`;
      body.querySelector(".bc-study-again").onclick = () => { S._quiz = null; S._renderTab(); };
      const sw = body.querySelector(".bc-study-savewrong");
      if (sw) sw.onclick = async () => {
        const c = await S.ctx();
        await BC.storage.patch(st => {
          st.qbank = st.qbank || [];
          wrong.forEach(({ it }) => st.qbank.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: new Date().toISOString(), url: c.url, title: c.title, course: c.course, cid: c.cid,
            question: `${it.q}\n${it.options.map((o, k) => `${"ABCD"[k] || k}. ${o}`).join("\n")}`, answer: `${BC.t("正确答案：")}${"ABCD"[it.answer] || it.answer}. ${it.options[it.answer]}\n\n${it.explain}`, note: BC.t("练习错题"), review: true }));
        });
        sw.textContent = BC.t("已存入题库"); sw.disabled = true;
      };
      return;
    }
    const it = Q.items[Q.idx];
    const picked = Q.picked[Q.idx];
    body.innerHTML =
      `<div class="bc-study-sub">${BC.t("第 {i} / {n} 题", { i: Q.idx + 1, n: Q.items.length })}</div>
       <div class="bc-study-q">${esc(it.q)}</div>
       <div class="bc-study-opts">${it.options.map((o, k) => {
         let cls = "";
         if (picked != null) cls = k === it.answer ? "bc-study-opt-right" : (k === picked ? "bc-study-opt-wrong" : "");
         return `<button type="button" data-k="${k}" class="${cls}" ${picked != null ? "disabled" : ""}>${"ABCD"[k] || k}. ${esc(o)}</button>`;
       }).join("")}</div>
       ${picked != null ? `<div class="bc-study-explain">${picked === it.answer ? BC.t("✅ 答对了") : BC.t("❌ 答错了")}<br>${esc(it.explain)}</div>
         <div class="bc-study-row"><button type="button" class="bc-primary-btn bc-study-next">${Q.idx + 1 < Q.items.length ? BC.t("下一题 →") : BC.t("查看结果")}</button></div>` : ""}
       <div class="bc-study-row"><button type="button" class="bc-study-quit">${BC.t("放弃本组")}</button></div>`;
    body.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { Q.picked[Q.idx] = +b.dataset.k; S._renderQuiz(body); });
    const next = body.querySelector(".bc-study-next");
    if (next) next.onclick = () => { if (Q.idx + 1 < Q.items.length) Q.idx++; else Q.done = true; S._renderQuiz(body); };
    body.querySelector(".bc-study-quit").onclick = () => { S._quiz = null; S._renderTab(); };
  }
};

// 界面语言切换：抽屉开着就按新语言重建；📖 按钮的提示也跟着换（角标是数字，不用动）
try {
  BC.i18n.onChange(() => {
    const S = BC.study;
    const btn = document.getElementById(S.BTN_ID);
    if (btn) btn.title = S._videos && S._videos.length && btn.querySelector(".bc-study-badge") ? BC.t("发现 {n} 个讲座视频 → 🎬 视频", { n: S._videos.length }) : BC.t("学习工具：页面对话 / 闪卡 / 练习");
    if (document.getElementById(S.ID)) S.open();
  });
} catch (e) {}
