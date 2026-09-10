/* 学习助手：双击 / 选中 / 右键选中文字 / 快捷键 -> 浮窗给出思路、解答、概念讲解，可追问；截图框选提问；个人题库。
 * 模型调用走后台 service worker（background.js），支持 Claude / OpenAI / Gemini / DeepSeek / Kimi / 通义 / 智谱 / Grok / Groq / OpenRouter / 自定义 OpenAI 兼容接口。
 *
 * UI 隔离：所有界面（小按钮、浮窗、右键菜单、截图框选层、题库）都挂在一个 closed 模式的 Shadow DOM 里（宿主 #bc-ai-host）。
 *   - 样式写在 A.CSS 里随影子树注入，和 Canvas 页面的 CSS 互不影响；页面脚本也拿不到影子树内部的节点。
 *   - 文档级监听（双击 / 选中 / 右键 / 按键）都在捕获阶段注册。事件从影子树冒到文档时 target 会被重定向成宿主元素，
 *     所以 _inOwnUi 只需判断「是否在 #bc-ai-host 里」。影子树内部自己的事件（点小按钮、复制讲解）在 shadow root 上单独监听。
 * 触发链路：
 *   - 双击 / 选中后小按钮 / 右键选中文字：内容脚本直接处理（右键会 preventDefault 接管浏览器默认菜单）。
 *   - 快捷键：manifest commands -> background.js chrome.commands.onCommand -> chrome.tabs.sendMessage -> 这里的 onHotkey。
 *   - 复制：影子树里整段选中一条讲解再 Ctrl+C 时，preventDefault 并把原始 Markdown 写进剪贴板（渲染后的文本会丢代码块和列表符号）。
 *
 * 硬性规则（不可配置）：正在作答的测验 / 考试页面（经典 Quiz 的 take 页、New Quizzes 的作答界面、任何正在作答的表单）不激活。
 * 这是学习工具，不是代答工具。测验列表、介绍页、交卷后的结果回看页都可以用（复习错题）。
 * New Quizzes 跑在跨域 iframe（*.quiz-lti-*.instructure.com）里，manifest 的内容脚本只进顶层页面：background.js 在那个 frame
 * 加载完成后用 scripting.executeScript 把本文件 + study.js + quiz-frame.js 注进去，屏蔽判断（isBlocked）在 frame 内部按 URL / DOM 做。 */
BC.i18n.add({
  "复制": "Copy", "已复制": "Copied", "搜索": "Search", "打开链接": "Open link", "复制链接": "Copy link", "浏览器菜单": "Browser menu",
  "再右键一次显示浏览器原生菜单": "Right-click again for the native browser menu",
  // 服务名（设置面板 / 浮窗右上角）
  "通义千问 (DashScope)": "Qwen (DashScope)", "智谱 GLM": "Zhipu GLM", "OpenRouter（聚合）": "OpenRouter (aggregator)", "自定义 OpenAI 兼容接口": "Custom OpenAI-compatible API",
  // 模式
  "💡 思路": "💡 Hint", "✅ 解答": "✅ Solve", "📖 概念": "📖 Concept", "🌐 翻译": "🌐 Translate",
  // 小按钮 / 右键菜单
  "✨ 问一下": "✨ Ask", "✨ 打开助手": "✨ Open assistant",
  // 浮窗
  "✨ 学习助手": "✨ Study Assistant", "打开题库": "Open question bank", "关闭": "Close", "题目 / 要问的内容": "Question / what to ask",
  "框选屏幕区域，连图一起提问": "Select a screen region and ask with the image", "📷 截图": "📷 Screenshot",
  "让讲解依据我的知识库": "Ground explanations in my knowledge base", "🧠 知识库": "🧠 Knowledge base", "🧠 知识库 · {n}": "🧠 Knowledge base · {n}",
  "追问…（Enter 发送）": "Follow-up… (Enter to send)", "把这题和讲解存进题库": "Save this question and explanation to the bank", "💾 存题库": "💾 Save to bank",
  "未配置模型": "No model configured", "还没配置模型：右下角 ⚙ → 「✨ 助手」填 API key。": "No model configured yet: bottom-right ⚙ → \"✨ Assistant\" and enter an API key.",
  "已开启：讲解依据知识库里的 {n} 份材料（点击切换）": "On: explanations use the {n} document(s) in the knowledge base (click to toggle)",
  "已关闭：讲解依据知识库里的 {n} 份材料（点击切换）": "Off: explanations use the {n} document(s) in the knowledge base (click to toggle)",
  "知识库还没有材料：点击去添加（📖 学习工具 → 🧠 知识库）": "The knowledge base is empty: click to add materials (📖 Study tools → 🧠 Knowledge base)",
  "在 Canvas 页面右下角 📖 学习工具 → 🧠 知识库 里添加材料": "Add materials on a Canvas page: bottom-right 📖 Study tools → 🧠 Knowledge base",
  "已开启知识库：接下来的讲解会依据材料": "Knowledge base on: explanations will now be grounded in your materials", "已关闭知识库": "Knowledge base off",
  "🖼️ 已附截图": "🖼️ Screenshot attached", "复制原文（Markdown）": "Copy raw text (Markdown)", "📎 依据：": "📎 Sources: ",
  "复制失败：浏览器没有授予剪贴板权限": "Copy failed: the browser did not grant clipboard permission",
  "检索知识库…": "Searching knowledge base…", "思考中…": "Thinking…", "失败：{err}": "Failed: {err}", "无响应": "No response",
  "无响应（扩展可能刚更新，刷新页面再试）": "No response (the extension may have just updated; reload the page and try again)",
  "后台在等待模型回复时被浏览器回收，已重试仍失败；请刷新页面再试": "The background worker was recycled by the browser while waiting for the model and the retry failed too; please reload the page and try again",
  "后台在等待模型回复时被浏览器回收，已重试仍失败；请刷新页面再试一次": "The background worker was recycled by the browser while waiting for the model and the retry failed too; please reload the page and try again",
  "先填题目或内容": "Enter a question or some content first", "（截图内容）": "(screenshot)",
  "拖动框选要提问的区域，Esc 取消": "Drag to select the region to ask about; Esc to cancel", "截图失败：{err}": "Screenshot failed: {err}",
  // 题库
  "还没有讲解可以保存": "No explanation to save yet", "已存入题库 📚": "Saved to question bank 📚", "📚 我的题库": "📚 My Question Bank",
  "导出 Markdown": "Export Markdown", "导出 JSON": "Export JSON", "导出 MD": "Export MD", "搜索题目 / 讲解 / 备注": "Search questions / explanations / notes",
  "全部课程": "All courses", "只看待复习": "To review only", "未归类": "Uncategorized", "待复习": "To review", "我的备注 / 错因…": "My note / why I got it wrong…",
  "标记待复习": "Mark to review", "来源页面 ↗": "Source page ↗", "删除": "Delete", "还没有题目。在讲解浮窗里点「💾 存题库」。": "No questions yet. Click \"💾 Save to bank\" in the explanation panel.",
  "题目": "Question", "讲解": "Explanation", "备注": "Note", "来源：{url}": "Source: {url}"
});
BC.assistant = {
  HOST_ID: "bc-ai-host",
  PANEL_ID: "bc-ai-panel",
  FAB_ID: "bc-ai-fab",
  MENU_ID: "bc-ai-menu",
  _root: null,        // closed shadow root（只有这里持有引用）
  _passNative: false, // 右键菜单里点了「浏览器菜单」：下一次右键放行，不接管
  _settings: null,
  _bound: false,
  _conv: [],          // 当前浮窗对话：[{role, content:[{type:"text",text}|{type:"image",mime,data}]}]
  _question: "",
  _lastAnswer: "",

  // 每家服务的常用模型（第一个是默认）；列表外的模型在设置里选「自定义…」手填
  PRESETS: {
    anthropic:  { name: "Claude (Anthropic)",    model: "claude-opus-5",
                  models: ["claude-opus-5", "claude-sonnet-5", "claude-fable-5-1", "claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"] },
    openai:     { name: "OpenAI",                model: "gpt-5",
                  models: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "o3", "o4-mini"] },
    gemini:     { name: "Google Gemini",         model: "gemini-3.1-pro-preview",
                  // 2.5 系列已对新用户下线；列表以接口「拉取列表」为准
                  models: ["gemini-3.1-pro-preview", "gemini-3.6-flash", "gemini-3.5-flash-lite"] },
    deepseek:   { name: "DeepSeek",              model: "deepseek-chat",
                  models: ["deepseek-chat", "deepseek-reasoner"] },
    kimi:       { name: "Kimi (Moonshot)",       model: "kimi-k2-turbo-preview",
                  models: ["kimi-k2-turbo-preview", "kimi-k2-0711-preview", "moonshot-v1-128k", "moonshot-v1-32k"] },
    qwen:       { name: "通义千问 (DashScope)",   model: "qwen-plus",
                  models: ["qwen-plus", "qwen-max", "qwen-turbo", "qwen3-235b-a22b", "qwen-vl-max"] },
    zhipu:      { name: "智谱 GLM",              model: "glm-4.5",
                  models: ["glm-4.5", "glm-4.5-air", "glm-4.5v", "glm-4-plus", "glm-4-flash"] },
    grok:       { name: "xAI Grok",              model: "grok-4",
                  models: ["grok-4", "grok-3", "grok-3-mini"] },
    groq:       { name: "Groq",                  model: "llama-3.3-70b-versatile",
                  models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b"] },
    openrouter: { name: "OpenRouter（聚合）",     model: "anthropic/claude-opus-5",
                  models: ["anthropic/claude-opus-5", "anthropic/claude-sonnet-5", "openai/gpt-5", "google/gemini-2.5-pro", "deepseek/deepseek-chat", "x-ai/grok-4"] },
    custom:     { name: "自定义 OpenAI 兼容接口", model: "", models: [] }
  },

  // 前端只有轻量 Markdown 渲染、没有公式引擎：要求模型用 Unicode 写数学；残留的 LaTeX 由 _tex 尽量转成纯文本
  MATH_RULE: "数学公式一律用普通文字和 Unicode 符号书写（例如 ≤ ≥ ≠ → ⇒ × · ² x₁ Σ √），不要用 LaTeX（不要 $…$、\\text{}、\\frac{} 之类）。",
  MATH_RULE_EN: "Write all math in plain text with Unicode symbols (e.g. ≤ ≥ ≠ → ⇒ × · ² x₁ Σ √); do not use LaTeX (no $…$, \\text{}, \\frac{} and the like).",

  // 模式：label 是界面文案（渲染时用 BC.t 取界面语言）；prompt / promptEn 是发给模型的指令（按回答语言 _replyLang 选）。
  // 翻译模式译成回答语言：中文时译成中文、英文时译成英文。
  MODES: {
    hint:    { label: "💡 思路",  prompt: "请不要直接给最终答案。先讲这道题考的知识点，再给出解题思路和步骤提示，让我自己做完。",
                                  promptEn: "Do not give the final answer directly. First explain what concepts this problem tests, then give the approach and step-by-step hints so I can finish it myself." },
    solve:   { label: "✅ 解答",  prompt: "请给出完整解答：先说思路，再一步步推导，最后给出结论，并指出容易出错的地方。",
                                  promptEn: "Give a complete solution: state the approach first, then derive it step by step, then give the conclusion and point out common pitfalls." },
    concept: { label: "📖 概念",  prompt: "请解释这段内容涉及的核心概念、定义和它们之间的关系，配一个简单例子。",
                                  promptEn: "Explain the core concepts and definitions involved in this content and how they relate to each other, with a simple example." },
    translate:{ label: "🌐 翻译", prompt: "请把这段内容翻译成中文，保留专业术语的英文原词（括号标注）。",
                                  promptEn: "Translate this content into English, keeping technical terms as they are (put the original term in parentheses where helpful)." }
  },

  /* ---------- 回答语言 ----------
   * settings.assistant.lang："zh" | "en" | "auto"（空 / 缺省也算 auto = 跟随界面语言 BC.i18n.lang）。
   * 所有发给模型的指令（模式提示、系统提示、数学规则、截图 / 知识库说明）都按这个语言选版本；界面文案另按 BC.t 走界面语言。 */
  _replyLang(a) {
    const s = a || ((BC.assistant._settings || {}).assistant || {});
    return s.lang === "zh" || s.lang === "en" ? s.lang : BC.i18n.lang;
  },
  _L(zh, en, a) { return BC.assistant._replyLang(a) === "en" ? en : zh; },   // 提示词中英二选一
  _mathRule(a) { return BC.assistant._L(BC.assistant.MATH_RULE, BC.assistant.MATH_RULE_EN, a); },
  _modePrompt(m) { return BC.assistant._replyLang() === "en" && m.promptEn ? m.promptEn : m.prompt; },
  // 消息开头的 [模式] 标签也按回答语言（界面上会把它剥掉，只有模型看到）
  _modeTag(m) { return BC.assistant._replyLang() === "en" ? (BC.i18n._dict[m.label] || m.label) : m.label; },

  /* ---------- 作答页面屏蔽 ---------- */
  /* 只屏蔽「正在作答」：经典 Quiz 的 take / questions 页、New Quizzes 的作答界面、监考 / 锁定浏览器。
   * 测验列表页、介绍页、交卷后的结果回看页都放开——复习错题是正常学习。
   * 外层 Canvas 页面不因为页面里有 quiz-lti iframe 就整页屏蔽：题目在跨域 iframe 里，外层的双击本来也碰不到。
   * New Quizzes（frame 域名带 quiz-lti）是单页应用，介绍页 → 作答 → 结果页之间不重新加载，所以每次触发都重新判定：
   *   - URL 里有 /take（作答会话）；
   *   - 或页面上有可点的「Submit」提交按钮（介绍页只有 Begin / Resume，结果页没有提交按钮）。 */
  BLOCKED_URL: [
    /\/quizzes\/\d+\/take\b/i,          // 经典 Quiz 作答
    /\/quizzes\/\d+\/questions\b/i,
    /\/proctor/i, /lockdown/i, /respondus/i
  ],
  BLOCKED_DOM: "#quiz_taking, body.quizzes-take, #submit_quiz_form, #submit_quiz_button, form.quiz_taking, [data-testid*='quiz-taking']",
  NEW_QUIZ_HOST: /quiz-lti|quizzes\.next/i,
  NEW_QUIZ_TAKING_URL: /\/take(\/|[?#]|$)/i,
  inNewQuizFrame() { return BC.assistant.NEW_QUIZ_HOST.test(location.hostname); },
  isBlocked() {
    const A = BC.assistant;
    const url = location.href;
    if (A.BLOCKED_URL.some(re => re.test(url))) return true;
    if (A.inNewQuizFrame()) {
      if (A.NEW_QUIZ_TAKING_URL.test(location.pathname)) return true;
      return A._newQuizTaking();
    }
    if (window !== window.top) {
      // 其它 iframe（不是 New Quizzes 的）：按上层页面地址粗判
      try { if (/quiz|assess|exam|proctor/i.test(document.referrer)) return true; } catch (e) {}
    }
    return !!document.querySelector(A.BLOCKED_DOM);
  },
  // New Quizzes 作答界面的特征：一个可点的「Submit」提交按钮（自己的 UI 在 shadow DOM / #bc-study 里，不会算进去）
  _newQuizTaking() {
    for (const b of document.querySelectorAll("button, input[type='submit']")) {
      if (b.disabled || (BC.study && b.closest("#" + BC.study.ID))) continue;
      const t = (b.textContent || b.value || "").replace(/\s+/g, " ").trim();
      if (/^(submit( quiz| assessment)?|turn in|提交(测验|答卷)?)$/i.test(t)) return true;
    }
    return false;
  },

  /* ---------- Shadow DOM ---------- */
  // 影子树内的全部样式。宿主是 0×0 的 fixed 元素，里面的 fixed 子元素仍按视口定位；z-index 只在影子树内部比较。
  CSS: `
    :host { all: initial; position: fixed; left: 0; top: 0; width: 0; height: 0; z-index: 2147483000; }
    * { box-sizing: border-box; }
    button, input, select, textarea { font-family: inherit; }
    /* 主题：--bc-ai-* 由 themes.js 按当前预设写在 :root 上（自定义属性能继承进影子树），没选预设时用括号里的默认值 */
    .bc-root { font: 13px/1.4 "Lato Extended", "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif; font-family: var(--bc-ai-font, "Lato Extended", "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif); color: var(--bc-ai-text, #222); }
    #bc-ai-fab {
      position: fixed; z-index: 1; font-size: 12px; font-weight: 700; padding: 4px 10px;
      background: var(--bc-ai-accent, #1c54b2); color: var(--bc-ai-accent-text, #fff); border: var(--bc-ai-btn-border, 0);
      border-radius: var(--bc-ai-radius, 999px); box-shadow: var(--bc-ai-btn-shadow, 0 4px 14px rgba(0, 0, 0, .25)); cursor: pointer;
    }
    #bc-ai-menu {
      position: fixed; z-index: 5; display: flex; flex-direction: column; min-width: 150px; max-width: 240px; padding: 4px;
      background: var(--bc-ai-bg, #fff); color: var(--bc-ai-text, #222); border: var(--bc-ai-border, 1px solid #ddd);
      border-radius: var(--bc-ai-radius, 10px); box-shadow: var(--bc-ai-shadow, 0 8px 28px rgba(0, 0, 0, .22));
    }
    #bc-ai-menu[hidden] { display: none; }
    #bc-ai-menu button { text-align: left; font-size: 13px; padding: 6px 10px; border: 0; background: transparent; border-radius: 6px; cursor: pointer; color: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #bc-ai-menu button:hover { background: var(--bc-ai-cell-alt, #eef3ff); color: var(--bc-ai-link, #1c54b2); }
    #bc-ai-menu .bc-ai-sep { height: 1px; margin: 3px 4px; background: var(--bc-ai-line, #eee); }
    #bc-ai-menu .bc-ai-std { font-size: 12px; padding: 5px 10px; color: var(--bc-ai-muted, #666); }
    #bc-ai-menu .bc-ai-std:hover { color: var(--bc-ai-link, #1c54b2); }
    #bc-ai-panel {
      position: fixed; z-index: 2; width: 420px; max-width: calc(100vw - 16px); max-height: 80vh; display: flex; flex-direction: column;
      background: var(--bc-ai-bg, #fff); color: var(--bc-ai-text, #222); border: var(--bc-ai-border, 1px solid #ddd);
      border-radius: var(--bc-ai-radius, 12px); box-shadow: var(--bc-ai-shadow, 0 12px 40px rgba(0, 0, 0, .28)); font-size: 13px; overflow: hidden;
    }
    .bc-ai-head { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bc-ai-head, #f4f6fa); color: var(--bc-ai-head-text, inherit); border-bottom: 1px solid var(--bc-ai-line, #e5e7eb); cursor: move; user-select: none; }
    .bc-ai-title { font-weight: 800; }
    .bc-ai-model { font-size: 11px; color: var(--bc-ai-muted, #888); margin-left: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
    .bc-ai-head button { border: 0; background: transparent; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 6px; color: inherit; }
    .bc-ai-head button:hover { background: rgba(0, 0, 0, .06); }
    #bc-ai-panel .bc-ai-q { margin: 10px 12px 6px; resize: vertical; border: var(--bc-ai-btn-border, 1px solid #ccc); border-radius: var(--bc-ai-radius, 8px); padding: 6px 8px; font-size: 13px; min-height: 48px; background: var(--bc-ai-cell, #fff); color: inherit; }
    .bc-ai-modes { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 8px; }
    .bc-ai-modes button { font-size: 12px; font-weight: 700; padding: 4px 10px; border: var(--bc-ai-btn-border, 1px solid #d0d7e2); background: var(--bc-ai-btn-bg, #fff); border-radius: var(--bc-ai-radius, 999px); box-shadow: var(--bc-ai-btn-shadow, none); cursor: pointer; color: var(--bc-ai-btn-text, #222); }
    .bc-ai-modes button:hover { background: var(--bc-ai-accent, #eef3ff); color: var(--bc-ai-accent-text, #222); border-color: var(--bc-ai-accent, #1c54b2); }
    .bc-ai-modes button:active { transform: translate(1px, 1px); box-shadow: none; }
    .bc-ai-modes .bc-ai-kb.bc-on { background: var(--bc-ai-accent, #1c54b2); color: var(--bc-ai-accent-text, #fff); border-color: var(--bc-ai-accent, #1c54b2); }
    .bc-ai-modes .bc-ai-kb.bc-none { opacity: .6; }
    .bc-ai-srcs { font-size: 11px; color: var(--bc-ai-muted, #777); margin: 0 0 8px; line-height: 1.7; }
    .bc-ai-src { display: inline-block; background: var(--bc-ai-cell-alt, #eef3ff); border-radius: 4px; padding: 0 5px; margin: 1px 2px 1px 0; }
    .bc-ai-answer { flex: 1 1 auto; overflow: auto; padding: 4px 12px 8px; border-top: 1px dashed var(--bc-ai-line, #e5e7eb); }
    .bc-ai-answer[hidden], .bc-ai-follow[hidden], .bc-ai-cap-rect[hidden], #bc-ai-fab[hidden] { display: none; }
    .bc-ai-msg { position: relative; margin: 8px 0; padding: 8px 10px; border-radius: 10px; line-height: 1.55; word-break: break-word; white-space: normal; }
    .bc-ai-user { background: var(--bc-ai-cell-alt, #eef3ff); color: inherit; border-left: 3px solid var(--bc-ai-accent, #1c54b2); }
    .bc-ai-assistant { background: var(--bc-ai-cell, #f7f7f7); border: 1px solid var(--bc-ai-line, transparent); padding-right: 30px; }
    .bc-ai-copy { position: absolute; right: 4px; top: 4px; border: 0; background: transparent; cursor: pointer; font-size: 13px; padding: 2px 4px; border-radius: 6px; opacity: .55; }
    .bc-ai-copy:hover { opacity: 1; background: rgba(0, 0, 0, .06); }
    .bc-ai-msg pre { background: #1f2430; color: #e6e6e6; padding: 8px 10px; border-radius: 6px; overflow: auto; font-size: 12px; white-space: pre-wrap; }
    .bc-ai-msg code { background: rgba(0, 0, 0, .06); padding: 0 4px; border-radius: 4px; font-size: 12px; }
    .bc-math { font-family: "Cambria Math", "STIX Two Math", "Times New Roman", serif; font-size: 1.05em; }
    .bc-math-block { display: block; margin: 4px 0; padding: 4px 8px; background: rgba(0, 0, 0, .04); border-radius: 6px; text-align: center; font-family: "Cambria Math", "STIX Two Math", "Times New Roman", serif; }
    .bc-ai-imgtag { font-size: 11px; color: #888; margin-bottom: 4px; }
    .bc-ai-follow { display: flex; gap: 6px; padding: 6px 12px; border-top: 1px solid var(--bc-ai-line, #e5e7eb); }
    .bc-ai-follow-in { flex: 1; border: var(--bc-ai-btn-border, 1px solid #ccc); border-radius: var(--bc-ai-radius, 8px); padding: 5px 8px; font-size: 13px; min-width: 0; background: var(--bc-ai-cell, #fff); color: inherit; }
    .bc-ai-save { font-size: 12px; border: var(--bc-ai-btn-border, 1px solid #d0d7e2); background: var(--bc-ai-btn-bg, #fff); color: var(--bc-ai-btn-text, #222); border-radius: var(--bc-ai-radius, 8px); box-shadow: var(--bc-ai-btn-shadow, none); padding: 4px 8px; cursor: pointer; white-space: nowrap; }
    .bc-ai-status { font-size: 11px; color: var(--bc-ai-link, #1c7ed6); padding: 0 12px 8px; min-height: 14px; }
    .bc-ai-status.bc-ai-err { color: #e03131; }
    #bc-ai-capture { position: fixed; inset: 0; z-index: 4; cursor: crosshair; background: rgba(0, 0, 0, .18); }
    .bc-ai-cap-hint { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); background: #111; color: #fff; font-size: 12px; padding: 6px 12px; border-radius: 999px; pointer-events: none; }
    .bc-ai-cap-rect { position: absolute; border: 2px dashed #1c54b2; background: rgba(28, 84, 178, .12); pointer-events: none; }
    #bc-ai-bank { position: fixed; inset: 0; z-index: 3; background: rgba(0, 0, 0, .35); display: flex; align-items: center; justify-content: center; }
    .bc-ai-bank-panel { width: 720px; max-width: calc(100vw - 24px); max-height: 85vh; display: flex; flex-direction: column; background: var(--bc-ai-bg, #fff); color: var(--bc-ai-text, #222); border: var(--bc-ai-border, 0); border-radius: var(--bc-ai-radius, 12px); box-shadow: var(--bc-ai-shadow, 0 12px 40px rgba(0, 0, 0, .3)); overflow: hidden; font-size: 13px; }
    .bc-ai-bank-panel .bc-ai-head { cursor: default; }
    .bc-ai-bank-panel .bc-ai-head .bc-ai-title { margin-right: auto; }
    .bc-ai-export { font-size: 12px !important; }
    .bc-ai-bank-tools { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid #eee; }
    .bc-ai-bank-tools input[type="search"] { flex: 1; border: 1px solid #ccc; border-radius: 8px; padding: 5px 8px; }
    .bc-ai-bank-tools select { border: 1px solid #ccc; border-radius: 8px; padding: 4px 6px; }
    .bc-ai-bank-list { overflow: auto; padding: 6px 12px 12px; }
    .bc-ai-bank-item { border-bottom: 1px dashed #eee; padding: 4px 0; }
    .bc-ai-bank-item > summary { cursor: pointer; padding: 6px 2px; }
    .bc-ai-bank-course-tag { font-size: 11px; background: #eef1f5; color: #555; border-radius: 3px; padding: 0 5px; font-weight: 700; margin-right: 4px; }
    .bc-ai-bank-rv { font-size: 11px; background: #ffe3e3; color: #c92a2a; border-radius: 3px; padding: 0 5px; font-weight: 700; }
    .bc-ai-bank-body { padding: 4px 6px 8px; }
    .bc-ai-bank-qfull { white-space: pre-wrap; font-weight: 600; margin-bottom: 4px; }
    .bc-ai-bank-note { width: 100%; min-height: 40px; border: 1px solid #ccc; border-radius: 6px; padding: 6px; font-size: 12px; resize: vertical; margin: 6px 0; }
    .bc-ai-bank-actions { display: flex; gap: 12px; align-items: center; font-size: 12px; }
    .bc-ai-bank-actions a { color: #1c54b2; }
    .bc-ai-bank-actions .bc-del { margin-left: auto; }
    .bc-ai-bank-empty { color: #888; padding: 20px 0; text-align: center; }
    /* 下面几条是 inject.css 里通用小件的副本：影子树里拿不到外面的样式 */
    .bc-pill { background: var(--bc-ai-accent, #e7f0ff); color: var(--bc-ai-accent-text, #1c54b2); font-size: 12px; border-radius: var(--bc-ai-radius, 10px); padding: 1px 8px; font-weight: 700; }
    .bc-when { font-size: 12px; color: var(--bc-ai-muted, #888); white-space: nowrap; }
    .bc-del { margin-left: auto; font-size: 11px; border: var(--bc-ai-btn-border, 1px solid #ddd); background: var(--bc-ai-btn-bg, #f7f7f7); color: var(--bc-ai-btn-text, inherit); border-radius: var(--bc-ai-radius, 6px); padding: 2px 8px; cursor: pointer; }
  `,

  // 创建（或复用）宿主元素和 closed shadow root；返回 shadow root
  _mount() {
    const A = BC.assistant;
    if (A._root && A._root.host.isConnected) return A._root;
    document.getElementById(A.HOST_ID)?.remove();
    const host = document.createElement("div");
    host.id = A.HOST_ID;
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = A.CSS;
    const wrap = document.createElement("div");
    wrap.className = "bc-root";
    root.append(style, wrap);
    (document.body || document.documentElement).appendChild(host);
    // 影子树内部的事件：这里的 target 是真实节点（不会被重定向）
    root.addEventListener("mousedown", ev => {
      if (!ev.target.closest("#" + A.FAB_ID)) A._hideFab();
      if (!ev.target.closest("#" + A.MENU_ID)) A._hideMenu();
    });
    root.addEventListener("copy", A._onCopy);
    A._root = root;
    return root;
  },
  _box() { return BC.assistant._mount().querySelector(".bc-root"); },   // 影子树里放 UI 的容器
  $(sel) { return BC.assistant._root ? BC.assistant._root.querySelector(sel) : null; },
  _el(id) { return BC.assistant._root ? BC.assistant._root.getElementById(id) : null; },

  /* ---------- 初始化 / 事件 ---------- */
  init(settings) {
    const A = BC.assistant;
    A._settings = settings;
    if (!A._enabled()) { A.closePanel(); A._hideFab(); A._hideMenu(); return; }
    A._mount();
    if (A._bound) return;
    A._bound = true;
    // 文档级监听全部走捕获阶段：比页面自己的处理器先拿到事件，页面 stopPropagation 也拦不住
    document.addEventListener("dblclick", A._onDblClick, true);
    document.addEventListener("mouseup", A._onMouseUp, true);
    document.addEventListener("contextmenu", A._onContextMenu, true);
    document.addEventListener("mousedown", ev => { if (!A._inOwnUi(ev.target)) { A._hideFab(); A._hideMenu(); } }, true);
    document.addEventListener("keydown", ev => { if (ev.key === "Escape") { A._hideFab(); A._hideMenu(); A._cancelCapture(); } }, true);
    // 快捷键：background.js 收到 chrome.commands 后用 chrome.tabs.sendMessage 转发到当前标签页
    try { chrome.runtime.onMessage.addListener(msg => { if (msg && msg.type === "bc-hotkey") A.onHotkey(); }); } catch (e) {}
  },

  _enabled() { const s = BC.assistant._settings; return !!(s && s.assistant && s.assistant.enabled !== false); },
  // 影子树里的事件冒到文档时 target 已被重定向成宿主 #bc-ai-host；设置面板（#bc-panel*）在影子树外，按 id 判断
  _inOwnUi(el) { return !!(el && el.closest && el.closest("#bc-ai-host, #bc-panel-overlay, #bc-panel")); },
  _editable(el) { return !!(el && el.closest && el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")); },

  _onDblClick(ev) {
    const A = BC.assistant;
    if (!A._enabled()) return;
    const trig = (A._settings.assistant || {}).trigger || "both";
    if (trig !== "dblclick" && trig !== "both") return;
    if (A._inOwnUi(ev.target) || A._editable(ev.target)) return;
    if (A.isBlocked()) return;
    const text = A._questionFrom(ev.target);
    if (!text) return;
    A.openPanel(text, ev.clientX, ev.clientY);
  },

  _onMouseUp(ev) {
    const A = BC.assistant;
    if (!A._enabled()) return;
    const trig = (A._settings.assistant || {}).trigger || "both";
    if (trig !== "select" && trig !== "both") return;
    if (A._inOwnUi(ev.target) || A._editable(ev.target)) return;
    if (ev.detail >= 2) return; // 双击由 dblclick 处理
    if (ev.button !== 0) return; // 右键交给 contextmenu
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (text.length < 8 || A.isBlocked()) { A._hideFab(); return; }
      let x = ev.clientX, y = ev.clientY;
      try { const r = sel.getRangeAt(0).getBoundingClientRect(); if (r.width || r.height) { x = r.right; y = r.bottom; } } catch (e) {}
      A._showFab(x, y, text);
    }, 0);
  },

  // 右键点在选中的文字上：接管浏览器默认菜单，改成助手的模式菜单。点在选区外面不管（保留默认菜单）
  _onContextMenu(ev) {
    const A = BC.assistant;
    if (A._passNative) { A._passNative = false; return; }   // 上次菜单里点了「浏览器菜单」：这一次放行给浏览器
    if (!A._enabled() || (A._settings.assistant || {}).contextMenu === false) return;
    if (A._inOwnUi(ev.target) || A._editable(ev.target)) return;
    if (ev.target.closest("#" + (BC.blocks ? BC.blocks.CONTAINER_ID : "bc-blocks") + ", .bc-cal-chip")) return; // 这些有自己的右键菜单
    const sel = window.getSelection();
    const text = sel && !sel.isCollapsed ? sel.toString().trim() : "";
    if (text.length < 8 || A.isBlocked()) return;
    let hit = false;
    try {
      for (const r of sel.getRangeAt(0).getClientRects()) {
        if (ev.clientX >= r.left - 2 && ev.clientX <= r.right + 2 && ev.clientY >= r.top - 2 && ev.clientY <= r.bottom + 2) { hit = true; break; }
      }
    } catch (e) {}
    if (!hit) return;
    ev.preventDefault();
    A._hideFab();
    const link = ev.target.closest && ev.target.closest("a[href]");
    A._showMenu(ev.clientX, ev.clientY, text, { href: link ? link.href : "" });
  },

  // 快捷键（默认 Alt+Shift+A，可在 chrome://extensions/shortcuts 改）：有选中文字就带上，没有就开空浮窗等输入
  onHotkey() {
    const A = BC.assistant;
    if (!A._enabled() || A.isBlocked()) return;
    // 后台是发给整个标签页的，顶层页面和 New Quizzes iframe 都会收到：只让有焦点的那个响应。
    // 顶层页面里焦点落在 LTI iframe 上时让给 frame（frame 里没跑助手的话就没人响应，属于可接受的情况）
    if (window !== window.top && !document.hasFocus()) return;
    const ae = document.activeElement;
    if (window === window.top && ae && ae.tagName === "IFRAME" && (ae.id === "tool_content" || /external_tools|lti|quiz/i.test(ae.src || ""))) return;
    const sel = window.getSelection();
    const text = sel && !sel.isCollapsed ? sel.toString().trim() : "";
    let x = Math.max(8, window.innerWidth / 2 - 220), y = 100;
    try { const r = sel.getRangeAt(0).getBoundingClientRect(); if (text && (r.width || r.height)) { x = r.right; y = r.bottom; } } catch (e) {}
    A._hideFab(); A._hideMenu();
    A.openPanel(text, x, y).then(() => { const q = A.$("#" + A.PANEL_ID + " .bc-ai-q"); if (q && !text) q.focus(); });
  },

  // 双击处：优先整段（题目通常是一个 p / li / 题干容器），太长就取选中的句子
  _questionFrom(target) {
    const sel = window.getSelection();
    const selected = sel ? sel.toString().trim() : "";
    const block = target.closest(".question_text, .user_content p, .user_content li, .user_content td, .question, .discussion_entry, .message, p, li, td, th, blockquote, h1, h2, h3, h4, dd, dt, div");
    let text = block ? (block.innerText || block.textContent || "").replace(/\s+\n/g, "\n").trim() : "";
    if (!text || text.length > 2500) text = selected;
    if (text.length > 2500) text = text.slice(0, 2500) + "…";
    if (text.length < 2) return "";
    return text;
  },

  /* ---------- 选中后的小按钮 ---------- */
  _showFab(x, y, text) {
    const A = BC.assistant;
    let fab = A._el(A.FAB_ID);
    if (!fab) {
      fab = document.createElement("button");
      fab.id = A.FAB_ID; fab.type = "button";
      A._box().appendChild(fab);
    }
    fab.textContent = BC.t("✨ 问一下");
    fab.onclick = () => { A._hideFab(); A.openPanel(text, x, y); };
    fab.style.left = Math.min(x + 6, window.innerWidth - 110) + "px";
    fab.style.top = Math.min(y + 8, window.innerHeight - 40) + "px";
    fab.hidden = false;
  },
  _hideFab() { const f = BC.assistant._el(BC.assistant.FAB_ID); if (f) f.hidden = true; },

  /* ---------- 右键菜单 ---------- */
  // 接管了浏览器菜单，所以把常用的默认操作（复制 / 搜索 / 链接）也放进来；内容随选区和点中的元素变，每次重建
  _showMenu(x, y, text, opts) {
    const A = BC.assistant, esc = BC.util.esc;
    const href = (opts && opts.href) || "";
    let menu = A._el(A.MENU_ID);
    if (!menu) {
      menu = document.createElement("div");
      menu.id = A.MENU_ID;
      A._box().appendChild(menu);
    }
    const short = text.length > 20 ? text.slice(0, 20) + "…" : text;
    menu.innerHTML = Object.entries(A.MODES).map(([k, m]) => `<button type="button" data-mode="${k}">${esc(BC.t(m.label))}</button>`).join("") +
      `<button type="button" data-mode="">${esc(BC.t("✨ 打开助手"))}</button>
       <div class="bc-ai-sep"></div>
       <button type="button" class="bc-ai-std" data-act="copy">📋 ${esc(BC.t("复制"))}</button>
       <button type="button" class="bc-ai-std" data-act="search" title="${esc(text.slice(0, 200))}">🔍 ${esc(BC.t("搜索"))}「${esc(short)}」</button>` +
      (href ? `<button type="button" class="bc-ai-std" data-act="open-link" title="${esc(href)}">🔗 ${esc(BC.t("打开链接"))}</button>
               <button type="button" class="bc-ai-std" data-act="copy-link" title="${esc(href)}">📋 ${esc(BC.t("复制链接"))}</button>` : "") +
      `<button type="button" class="bc-ai-std" data-act="native" title="${esc(BC.t("再右键一次显示浏览器原生菜单"))}">🖱 ${esc(BC.t("浏览器菜单"))}</button>`;
    menu.querySelectorAll("button[data-mode]").forEach(b => b.onclick = async () => {
      A._hideMenu();
      await A.openPanel(text, x, y);
      if (b.dataset.mode) A.ask(b.dataset.mode);
    });
    // 复制成功后按钮上短暂显示「已复制」再收起
    const copyThen = async (b, value) => {
      await A._writeClipboard(value);
      const html = b.innerHTML;
      b.textContent = "✅ " + BC.t("已复制");
      setTimeout(() => { b.innerHTML = html; A._hideMenu(); }, 900);
    };
    menu.querySelectorAll("button[data-act]").forEach(b => b.onclick = () => {
      switch (b.dataset.act) {
        case "copy": copyThen(b, text); break;
        case "copy-link": copyThen(b, href); break;
        case "search": A._hideMenu(); window.open("https://www.google.com/search?q=" + encodeURIComponent(text), "_blank", "noopener"); break;
        case "open-link": A._hideMenu(); window.open(href, "_blank", "noopener"); break;
        case "native": A._passNative = true; A._hideMenu(); break;   // 下一次右键不接管（脚本没法主动弹出原生菜单）
      }
    });
    menu.hidden = false;
    menu.style.left = Math.max(4, Math.min(x, window.innerWidth - menu.offsetWidth - 8)) + "px";
    menu.style.top = Math.max(4, Math.min(y, window.innerHeight - menu.offsetHeight - 8)) + "px";
  },
  _hideMenu() { const m = BC.assistant._el(BC.assistant.MENU_ID); if (m) m.hidden = true; },
  // 写剪贴板：clipboard API 不可用（没权限 / 非安全上下文）时退回 execCommand
  async _writeClipboard(value) {
    try { await navigator.clipboard.writeText(value); return true; } catch (e) {}
    try {
      const sel = window.getSelection();
      const ranges = sel ? Array.from({ length: sel.rangeCount }, (_, i) => sel.getRangeAt(i)) : [];   // 临时 textarea 会抢走页面选区，复制完还原
      const ta = document.createElement("textarea");
      ta.value = value; ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (sel && ranges.length) { sel.removeAllRanges(); ranges.forEach(r => sel.addRange(r)); }
      return ok;
    } catch (e) { return false; }
  },

  /* ---------- 浮窗 ---------- */
  async _context() {
    // 课程 id 从页面地址取；New Quizzes iframe 自己的地址没有课程 id，用 quiz-frame.js 从后台拿到的顶层 Canvas 页面地址（BC.topUrl）。
    // 非 Canvas 网站（BC.onCanvas === false 且没有 topUrl）不归课程，也没有课程接口（BC.grades），只带页面标题。
    const src = BC.topUrl || (BC.onCanvas === false ? "" : location.href);
    const cid = (src.match(/\/courses\/(\d+)/) || [])[1] || "";
    let course = "";
    if (cid && BC.grades) { try { const s = (await BC.grades.fetchScores())[cid]; if (s) course = BC.util.courseTitle(s.name || s.code); } catch (e) {} }
    return { cid, course, title: document.title.replace(/\s*[-–|]\s*Canvas.*$/i, "").trim(), url: location.href };
  },

  _system(ctx) {
    const A = BC.assistant;
    const en = A._replyLang() === "en";
    const lang = en ? "English" : "中文";
    return (en ? [
      "You are a patient teaching assistant for university courses, helping students understand course content, assignment questions and concepts.",
      `Reply language: ${lang}. Do not output HTML.`,
      A.MATH_RULE_EN,
      "Principles: explain the reasoning and evidence first, then the conclusion; say clearly when you are unsure; never fabricate facts or citations.",
      "If the content looks like a question from an exam or quiz in progress, only explain the relevant concepts and methods; do not give the answer directly.",
      ctx.course ? `Current course: ${ctx.course}.` : "",
      ctx.title ? `Current page: ${ctx.title}.` : ""
    ] : [
      "你是一名耐心的大学课程学习助教，帮助学生理解课程内容、作业题目和概念。",
      `回答语言：${lang}。不要输出 HTML。`,
      A.MATH_RULE,
      "原则：先讲清楚思路和依据，再给结论；不确定的地方明确说不确定，不要编造事实或引用。",
      "如果内容像是正在进行的考试或测验题，请只讲解相关知识点和方法，不要直接给答案。",
      ctx.course ? `当前课程：${ctx.course}。` : "",
      ctx.title ? `当前页面：${ctx.title}。` : ""
    ]).filter(Boolean).join("\n");
  },

  async openPanel(question, x, y) {
    const A = BC.assistant;
    A._question = question || "";
    A._conv = [];
    A._lastAnswer = "";
    A._el(A.PANEL_ID)?.remove();
    const esc = BC.util.esc;
    const panel = document.createElement("div");
    panel.id = A.PANEL_ID;
    // 文案都在这里（每次打开重建），切换界面语言后重新打开就是新语言
    panel.innerHTML =
      `<div class="bc-ai-head">
         <span class="bc-ai-title">${esc(BC.t("✨ 学习助手"))}</span>
         <span class="bc-ai-model"></span>
         <button type="button" class="bc-ai-bank-btn" title="${esc(BC.t("打开题库"))}">📚</button>
         <button type="button" class="bc-ai-close" title="${esc(BC.t("关闭"))}">✕</button>
       </div>
       <textarea class="bc-ai-q" rows="3" placeholder="${esc(BC.t("题目 / 要问的内容"))}">${esc(A._question)}</textarea>
       <div class="bc-ai-modes">
         ${Object.entries(A.MODES).map(([k, m]) => `<button type="button" data-mode="${k}">${esc(BC.t(m.label))}</button>`).join("")}
         <button type="button" class="bc-ai-shot" title="${esc(BC.t("框选屏幕区域，连图一起提问"))}">${esc(BC.t("📷 截图"))}</button>
         <button type="button" class="bc-ai-kb" title="${esc(BC.t("让讲解依据我的知识库"))}">${esc(BC.t("🧠 知识库"))}</button>
       </div>
       <div class="bc-ai-answer" hidden></div>
       <div class="bc-ai-follow" hidden>
         <input type="text" class="bc-ai-follow-in" placeholder="${esc(BC.t("追问…（Enter 发送）"))}">
         <button type="button" class="bc-ai-save" title="${esc(BC.t("把这题和讲解存进题库"))}">${esc(BC.t("💾 存题库"))}</button>
       </div>
       <div class="bc-ai-status"></div>`;
    A._box().appendChild(panel);

    // 位置：贴着触发点，不出视口
    const W = 420, H = panel.offsetHeight || 260;
    const left = Math.max(8, Math.min((x || 200) + 12, window.innerWidth - W - 8));
    const top = Math.max(8, Math.min((y || 120) + 12, window.innerHeight - H - 8));
    panel.style.left = left + "px"; panel.style.top = top + "px";

    const a = A._settings.assistant || {};
    const preset = A.PRESETS[a.provider] || A.PRESETS.custom;
    panel.querySelector(".bc-ai-model").textContent = a.apiKey ? (a.model || preset.model || BC.t(preset.name)) : BC.t("未配置模型");
    panel.querySelector(".bc-ai-close").onclick = () => A.closePanel();
    panel.querySelector(".bc-ai-bank-btn").onclick = () => A.openBank();
    panel.querySelector(".bc-ai-shot").onclick = () => A.startCapture();
    panel.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => A.ask(b.dataset.mode));
    panel.querySelector(".bc-ai-save").onclick = () => A.saveToBank();
    const fin = panel.querySelector(".bc-ai-follow-in");
    fin.addEventListener("keydown", ev => { if (ev.key === "Enter" && fin.value.trim()) { A.followUp(fin.value.trim()); fin.value = ""; } });
    A._drag(panel, panel.querySelector(".bc-ai-head"));
    A._kbSources = null;
    A._kbBind(panel);

    if (!a.apiKey) A._status(BC.t("还没配置模型：右下角 ⚙ → 「✨ 助手」填 API key。"), true);
  },

  /* ---------- 知识库开关（knowledge.js）：当前课程有材料时默认开启；没材料时点它去学习工具里添加 ---------- */
  _kbOn: false,
  _kbUser: false,     // 用户手动切换过，就不再按「有没有材料」自动决定
  _kbSources: null,   // 最近一次回答引用的片段 [{n, id, name, i}]
  async _kbBind(panel) {
    const A = BC.assistant;
    const btn = panel.querySelector(".bc-ai-kb");
    if (!btn) return;
    if (!BC.kb) { btn.hidden = true; return; }
    const ctx = await A._context();
    let st = { docs: 0 };
    try { st = await BC.kb.stats(ctx.cid); } catch (e) {}
    if (!A._kbUser) A._kbOn = st.docs > 0;
    const paint = () => {
      btn.classList.toggle("bc-on", A._kbOn && st.docs > 0);
      btn.classList.toggle("bc-none", !st.docs);
      btn.textContent = st.docs ? BC.t("🧠 知识库 · {n}", { n: st.docs }) : BC.t("🧠 知识库");
      btn.title = st.docs
        ? BC.t(A._kbOn ? "已开启：讲解依据知识库里的 {n} 份材料（点击切换）" : "已关闭：讲解依据知识库里的 {n} 份材料（点击切换）", { n: st.docs })
        : BC.t("知识库还没有材料：点击去添加（📖 学习工具 → 🧠 知识库）");
    };
    paint();
    btn.onclick = () => {
      if (!st.docs) {
        if (BC.study) { A.closePanel(); BC.study.open("kb"); } else A._status(BC.t("在 Canvas 页面右下角 📖 学习工具 → 🧠 知识库 里添加材料"), true);
        return;
      }
      A._kbUser = true; A._kbOn = !A._kbOn; paint();
      A._status(BC.t(A._kbOn ? "已开启知识库：接下来的讲解会依据材料" : "已关闭知识库"));
    };
  },

  closePanel() { BC.assistant._el(BC.assistant.PANEL_ID)?.remove(); },

  _drag(panel, handle) {
    let sx, sy, ox, oy, on = false;
    handle.addEventListener("mousedown", ev => {
      if (ev.target.closest("button")) return;
      on = true; sx = ev.clientX; sy = ev.clientY; ox = panel.offsetLeft; oy = panel.offsetTop; ev.preventDefault();
    });
    document.addEventListener("mousemove", ev => { if (!on) return; panel.style.left = (ox + ev.clientX - sx) + "px"; panel.style.top = (oy + ev.clientY - sy) + "px"; });
    document.addEventListener("mouseup", () => { on = false; });
  },

  _status(text, isErr) {
    const el = BC.assistant.$("#" + BC.assistant.PANEL_ID + " .bc-ai-status");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("bc-ai-err", !!isErr);
  },

  // 极简 Markdown -> HTML：代码块、行内代码、粗体、标题、列表、换行；数学 $…$ / $$…$$ / \(…\) / \[…\] 经 _tex 转成 Unicode 纯文本
  _md(text) {
    const A = BC.assistant, esc = BC.util.esc;
    const parts = String(text || "").split(/```/);
    return parts.map((p, i) => {
      if (i % 2 === 1) return `<pre>${esc(p.replace(/^\w*\n/, ""))}</pre>`;
      // 行内 $…$：开头不能跟空格、结尾不能是空格、后面不能紧跟数字，避免把 "$5 and $10" 当成公式
      const re = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)|\\\(([^\n]+?)\\\)/g;
      let html = "", last = 0, m;
      while ((m = re.exec(p))) {
        html += A._inline(esc(p.slice(last, m.index)));
        const block = m[1] != null || m[2] != null;
        const tex = A._tex(block ? (m[1] != null ? m[1] : m[2]) : (m[3] != null ? m[3] : m[4]));
        html += block ? `<div class="bc-math-block">${esc(tex)}</div>` : `<span class="bc-math">${esc(tex)}</span>`;
        last = m.index + m[0].length;
      }
      return html + A._inline(esc(p.slice(last)));
    }).join("");
  },
  _inline(e) {
    return e
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/^(#{1,4})\s+(.+)$/gm, "<b>$2</b>")
      .replace(/^\s*[-*•]\s+(.+)$/gm, "• $1")
      .replace(/\n/g, "<br>");
  },
  // LaTeX -> Unicode 纯文本。没有公式引擎，够复习笔记用就行：关系 / 逻辑 / 箭头 / 希腊字母 / 上下标 / 分数 / 根号 / \text{}
  SUP: { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "(": "⁽", ")": "⁾", "n": "ⁿ", "i": "ⁱ" },
  SUB: { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "(": "₍", ")": "₎", "a": "ₐ", "e": "ₑ", "i": "ᵢ", "j": "ⱼ", "k": "ₖ", "m": "ₘ", "n": "ₙ", "o": "ₒ", "x": "ₓ" },
  TEX: [
    [/\\(?:text|mathrm|mathbf|mathit|operatorname|mbox)\s*\{([^{}]*)\}/g, "$1"],
    [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)"],
    [/\\sqrt\s*\{([^{}]*)\}/g, "√($1)"],
    [/\\(?:le|leq)(?![A-Za-z])/g, "≤"], [/\\(?:ge|geq)(?![A-Za-z])/g, "≥"], [/\\neq?(?![A-Za-z])/g, "≠"], [/\\approx(?![A-Za-z])/g, "≈"], [/\\equiv(?![A-Za-z])/g, "≡"],
    [/\\(?:land|wedge)(?![A-Za-z])/g, "∧"], [/\\(?:lor|vee)(?![A-Za-z])/g, "∨"], [/\\(?:neg|lnot)(?![A-Za-z])/g, "¬"], [/\\oplus(?![A-Za-z])/g, "⊕"],
    [/\\(?:Rightarrow|implies)(?![A-Za-z])/g, "⇒"], [/\\(?:Leftrightarrow|iff)(?![A-Za-z])/g, "⇔"], [/\\(?:rightarrow|to)(?![A-Za-z])/g, "→"], [/\\leftarrow(?![A-Za-z])/g, "←"], [/\\mapsto(?![A-Za-z])/g, "↦"],
    [/\\times(?![A-Za-z])/g, "×"], [/\\cdot(?![A-Za-z])/g, "·"], [/\\div(?![A-Za-z])/g, "÷"], [/\\pm(?![A-Za-z])/g, "±"], [/\\infty(?![A-Za-z])/g, "∞"],
    [/\\sum(?![A-Za-z])/g, "Σ"], [/\\prod(?![A-Za-z])/g, "Π"], [/\\int(?![A-Za-z])/g, "∫"], [/\\partial(?![A-Za-z])/g, "∂"], [/\\nabla(?![A-Za-z])/g, "∇"],
    [/\\in(?![A-Za-z])/g, "∈"], [/\\notin(?![A-Za-z])/g, "∉"], [/\\subseteq(?![A-Za-z])/g, "⊆"], [/\\subset(?![A-Za-z])/g, "⊂"], [/\\cup(?![A-Za-z])/g, "∪"], [/\\cap(?![A-Za-z])/g, "∩"], [/\\emptyset(?![A-Za-z])/g, "∅"],
    [/\\forall(?![A-Za-z])/g, "∀"], [/\\exists(?![A-Za-z])/g, "∃"], [/\\(?:ldots|cdots|dots)(?![A-Za-z])/g, "…"],
    [/\\alpha(?![A-Za-z])/g, "α"], [/\\beta(?![A-Za-z])/g, "β"], [/\\gamma(?![A-Za-z])/g, "γ"], [/\\delta(?![A-Za-z])/g, "δ"], [/\\epsilon(?![A-Za-z])/g, "ε"], [/\\theta(?![A-Za-z])/g, "θ"], [/\\lambda(?![A-Za-z])/g, "λ"], [/\\mu(?![A-Za-z])/g, "μ"], [/\\pi(?![A-Za-z])/g, "π"], [/\\rho(?![A-Za-z])/g, "ρ"], [/\\sigma(?![A-Za-z])/g, "σ"], [/\\tau(?![A-Za-z])/g, "τ"], [/\\phi(?![A-Za-z])/g, "φ"], [/\\omega(?![A-Za-z])/g, "ω"],
    [/\\Delta(?![A-Za-z])/g, "Δ"], [/\\Sigma(?![A-Za-z])/g, "Σ"], [/\\Omega(?![A-Za-z])/g, "Ω"], [/\\Theta(?![A-Za-z])/g, "Θ"], [/\\Pi(?![A-Za-z])/g, "Π"],
    [/\\(?:left|right|displaystyle|,|;|:|!)/g, ""], [/\\q?quad(?![A-Za-z])/g, "  "], [/\\\\/g, "\n"],
    [/\\([{}%&#_$])/g, "$1"]
  ],
  _tex(s) {
    const A = BC.assistant;
    let t = String(s || "");
    // 先做上下标（去掉一层花括号，\sqrt{x_{ij}} 这类嵌套才能被下面的规则匹配）：全部字符都有对应的 Unicode 上/下标才转，否则退回 ^(…) / _(…)
    const script = (map, body, mark) => { const out = [...body].map(ch => map[ch]); return out.every(Boolean) ? out.join("") : mark + (body.length > 1 ? "(" + body + ")" : body); };
    t = t.replace(/\^\{([^{}]*)\}|\^(\S)/g, (m, a, b) => script(A.SUP, a != null ? a : b, "^"));
    t = t.replace(/_\{([^{}]*)\}|_(\S)/g, (m, a, b) => script(A.SUB, a != null ? a : b, "_"));
    for (const [re, rep] of A.TEX) t = t.replace(re, rep);
    return t.replace(/\\([A-Za-z]+)/g, "$1").replace(/[{}]/g, "").replace(/[ \t]{2,}/g, " ").trim();
  },

  _render() {
    const A = BC.assistant, esc = BC.util.esc;
    const panel = A._el(A.PANEL_ID);
    if (!panel) return;
    const box = panel.querySelector(".bc-ai-answer");
    box.hidden = false;
    const raws = [];
    box.innerHTML = A._conv.map(m => {
      const txt = m.content.filter(p => p.type === "text").map(p => p.text).join("\n");
      const img = m.content.some(p => p.type === "image") ? `<div class="bc-ai-imgtag">${esc(BC.t("🖼️ 已附截图"))}</div>` : "";
      const shown = m.role === "user" ? txt.replace(/^\[[^\]]*\]\s*/s, "") : txt;
      raws.push(shown);
      const copy = m.role === "assistant" ? `<button type="button" class="bc-ai-copy" title="${esc(BC.t("复制原文（Markdown）"))}">📋</button>` : "";
      return `<div class="bc-ai-msg bc-ai-${m.role}">${copy}${img}${A._md(shown)}</div>`;
    }).join("") + (A._kbSources && A._kbSources.length && A._conv.some(m => m.role === "assistant")
      ? `<div class="bc-ai-srcs">${esc(BC.t("📎 依据："))}${BC.kb.sourcesLine(A._kbSources)}</div>` : "");
    A._attachRaw(box, raws);
    box.scrollTop = box.scrollHeight;
    panel.querySelector(".bc-ai-follow").hidden = !A._conv.some(m => m.role === "assistant");
  },

  // 把每条消息的原始文本挂在节点上（供 copy 事件和 📋 按钮用）
  _attachRaw(container, raws) {
    const A = BC.assistant;
    container.querySelectorAll(".bc-ai-msg").forEach((el, i) => {
      el._bcRaw = raws[i] || "";
      const btn = el.querySelector(".bc-ai-copy");
      if (btn) btn.onclick = () => A._copyText(el._bcRaw, btn);
    });
  },
  _copyText(text, btn) {
    navigator.clipboard.writeText(text || "").then(() => {
      if (!btn) return;
      btn.textContent = "✅";
      setTimeout(() => { btn.textContent = "📋"; }, 1200);
    }).catch(() => BC.assistant._status(BC.t("复制失败：浏览器没有授予剪贴板权限"), true));
  },
  // 影子树里的 copy 事件：整段选中一条讲解时，放原始 Markdown 而不是渲染后的文本；只选了一部分则不干预
  _onCopy(ev) {
    const A = BC.assistant;
    const sel = A._root && A._root.getSelection ? A._root.getSelection() : window.getSelection();
    if (!sel || sel.isCollapsed) return;
    let n = sel.anchorNode;
    if (n && n.nodeType === 3) n = n.parentElement;
    const msg = n && n.closest ? n.closest(".bc-ai-msg") : null;
    if (!msg || !msg._bcRaw) return;
    const picked = sel.toString().trim();
    const shown = (msg.innerText || "").replace(/📋/g, "").trim();
    if (!picked || picked.length < shown.length * 0.9) return;
    ev.preventDefault();
    ev.clipboardData.setData("text/plain", msg._bcRaw);
  },

  /* ---------- 调模型 ---------- */
  async _send(userParts) {
    const A = BC.assistant;
    const a = A._settings.assistant || {};
    const ctx = await A._context();
    // 知识库开着：按「原题 + 本轮追问」在本机检索，最相关的片段附在系统提示里（对话消息本身保持干净，每轮重新检索）
    let kbText = "";
    A._kbSources = null;
    if (A._kbOn && BC.kb) {
      A._status(BC.t("检索知识库…"));
      try {
        const follow = A._conv.length ? userParts.filter(p => p.type === "text").map(p => p.text).join("\n") : "";
        const hit = await BC.kb.context(ctx.cid, [A._question, follow].filter(Boolean).join("\n").slice(0, 2000), A._replyLang());
        if (hit) { kbText = "\n\n" + BC.kb.prompt(hit, A._replyLang()); A._kbSources = hit.sources; }
      } catch (e) { console.warn("[BC] kb", e); }
    }
    A._conv.push({ role: "user", content: userParts });
    A._render();
    A._status(BC.t("思考中…"));
    const preset = A.PRESETS[a.provider] || A.PRESETS.custom;
    const req = {
      type: "bc-llm", provider: a.provider || "anthropic", model: a.model || preset.model, apiKey: a.apiKey || "",
      baseUrl: a.baseUrl || "", system: A._system(ctx) + kbText, messages: A._conv
    };
    let res;
    try { res = await chrome.runtime.sendMessage(req); }
    catch (e) {
      if (A._channelClosed(e)) { try { res = await chrome.runtime.sendMessage(req); } catch (e2) { res = { ok: false, error: BC.t("后台在等待模型回复时被浏览器回收，已重试仍失败；请刷新页面再试") }; } }
      else res = { ok: false, error: e.message };
    }
    if (!res || !res.ok) {
      A._conv.pop();
      A._render();
      A._status(BC.t("失败：{err}", { err: res && res.error || BC.t("无响应（扩展可能刚更新，刷新页面再试）") }), true);
      return;
    }
    A._conv.push({ role: "assistant", content: [{ type: "text", text: res.text }] });
    A._lastAnswer = res.text;
    A._render();
    A._status("");
  },

  async ask(mode) {
    const A = BC.assistant;
    const panel = A._el(A.PANEL_ID);
    if (!panel) return;
    const q = panel.querySelector(".bc-ai-q").value.trim();
    if (!q) { A._status(BC.t("先填题目或内容"), true); return; }
    A._question = q;
    const m = A.MODES[mode] || A.MODES.hint;
    A._conv = [];
    await A._send([{ type: "text", text: `[${A._modeTag(m)}] ${A._modePrompt(m)}\n\n${A._L("内容：", "Content:")}\n${q}` }]);
  },

  async followUp(text) {
    const A = BC.assistant;
    if (!A._conv.length) { A._question = text; await A._send([{ type: "text", text }]); return; }
    await A._send([{ type: "text", text }]);
  },

  /* ---------- 截图框选 ---------- */
  _cap: null,
  startCapture() {
    const A = BC.assistant;
    if (A.isBlocked()) return;
    A._cancelCapture();
    const ov = document.createElement("div");
    ov.id = "bc-ai-capture";
    ov.innerHTML = `<div class="bc-ai-cap-hint">${BC.util.esc(BC.t("拖动框选要提问的区域，Esc 取消"))}</div><div class="bc-ai-cap-rect" hidden></div>`;
    A._box().appendChild(ov);
    const rect = ov.querySelector(".bc-ai-cap-rect");
    let sx = 0, sy = 0, on = false;
    ov.addEventListener("mousedown", ev => { on = true; sx = ev.clientX; sy = ev.clientY; rect.hidden = false; rect.style.cssText = `left:${sx}px;top:${sy}px;width:0;height:0`; ev.preventDefault(); });
    ov.addEventListener("mousemove", ev => {
      if (!on) return;
      const x = Math.min(sx, ev.clientX), y = Math.min(sy, ev.clientY), w = Math.abs(ev.clientX - sx), h = Math.abs(ev.clientY - sy);
      rect.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    });
    ov.addEventListener("mouseup", async ev => {
      if (!on) return; on = false;
      const box = { x: Math.min(sx, ev.clientX), y: Math.min(sy, ev.clientY), w: Math.abs(ev.clientX - sx), h: Math.abs(ev.clientY - sy) };
      A._cancelCapture();
      if (box.w < 10 || box.h < 10) return;
      await A._captureAndAsk(box);
    });
    A._cap = ov;
  },
  _cancelCapture() { if (BC.assistant._cap) { BC.assistant._cap.remove(); BC.assistant._cap = null; } },

  async _captureAndAsk(box) {
    const A = BC.assistant;
    const panel = A._el(A.PANEL_ID);
    // 截图时把自己的浮窗藏起来
    if (panel) panel.style.visibility = "hidden";
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 60)));
    let res;
    try { res = await chrome.runtime.sendMessage({ type: "bc-capture" }); } catch (e) { res = { ok: false, error: e.message }; }
    if (panel) panel.style.visibility = "";
    if (!res || !res.ok) { if (!panel) await A.openPanel("", box.x, box.y); A._status(BC.t("截图失败：{err}", { err: res && res.error || BC.t("无响应") }), true); return; }
    const dpr = window.devicePixelRatio || 1;
    const img = new Image();
    await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = res.dataUrl; });
    const c = document.createElement("canvas");
    c.width = Math.round(box.w * dpr); c.height = Math.round(box.h * dpr);
    c.getContext("2d").drawImage(img, Math.round(box.x * dpr), Math.round(box.y * dpr), c.width, c.height, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/png").split(",")[1];
    if (!panel) await A.openPanel("", box.x + box.w, box.y);
    const q = (A.$("#" + A.PANEL_ID + " .bc-ai-q") || {}).value || "";
    A._question = q.trim() || BC.t("（截图内容）");
    A._conv = [];
    await A._send([
      { type: "image", mime: "image/png", data },
      { type: "text", text: A._L("[截图] 请先把图中的题目 / 内容完整转述出来，然后讲解思路和涉及的知识点。",
                                 "[Screenshot] First transcribe the question / content in the image in full, then explain the approach and the concepts involved.") +
                             (q.trim() ? "\n" + A._L("补充说明：", "Additional notes: ") + q.trim() : "") }
    ]);
  },

  /* ---------- 题库 ---------- */
  async saveToBank() {
    const A = BC.assistant;
    if (!A._lastAnswer) { A._status(BC.t("还没有讲解可以保存"), true); return; }
    const ctx = await A._context();
    const item = { id: Date.now().toString(36), ts: new Date().toISOString(), url: ctx.url, title: ctx.title, course: ctx.course, cid: ctx.cid,
                   question: A._question, answer: A._lastAnswer, note: "", review: false };
    await BC.storage.patch(st => { st.qbank = (st.qbank || []); st.qbank.unshift(item); if (st.qbank.length > 500) st.qbank.length = 500; });
    A._status(BC.t("已存入题库 📚"));
  },

  async openBank() {
    const A = BC.assistant;
    const esc = BC.util.esc;
    A._el("bc-ai-bank")?.remove();
    const s = await BC.storage.get();
    const all = s.qbank || [];
    const ov = document.createElement("div");
    ov.id = "bc-ai-bank";
    const courses = [...new Set(all.map(i => i.course).filter(Boolean))];
    ov.innerHTML =
      `<div class="bc-ai-bank-panel">
         <div class="bc-ai-head"><span class="bc-ai-title">${esc(BC.t("📚 我的题库"))} <span class="bc-pill">${all.length}</span></span>
           <button type="button" class="bc-ai-export" data-fmt="md" title="${esc(BC.t("导出 Markdown"))}">${esc(BC.t("导出 MD"))}</button>
           <button type="button" class="bc-ai-export" data-fmt="json" title="${esc(BC.t("导出 JSON"))}">${esc(BC.t("导出 JSON"))}</button>
           <button type="button" class="bc-ai-close" title="${esc(BC.t("关闭"))}">✕</button></div>
         <div class="bc-ai-bank-tools">
           <input type="search" class="bc-ai-bank-q" placeholder="${esc(BC.t("搜索题目 / 讲解 / 备注"))}">
           <select class="bc-ai-bank-course"><option value="">${esc(BC.t("全部课程"))}</option>${courses.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
           <label><input type="checkbox" class="bc-ai-bank-review"> ${esc(BC.t("只看待复习"))}</label>
         </div>
         <div class="bc-ai-bank-list"></div>
       </div>`;
    A._box().appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
    ov.querySelector(".bc-ai-close").onclick = () => ov.remove();

    const list = ov.querySelector(".bc-ai-bank-list");
    const draw = () => {
      const q = ov.querySelector(".bc-ai-bank-q").value.trim().toLowerCase();
      const c = ov.querySelector(".bc-ai-bank-course").value;
      const rv = ov.querySelector(".bc-ai-bank-review").checked;
      const items = all.filter(i => (!c || i.course === c) && (!rv || i.review) &&
        (!q || `${i.question} ${i.answer} ${i.note}`.toLowerCase().includes(q)));
      list.innerHTML = items.length ? items.map(i => `
        <details class="bc-ai-bank-item" data-id="${esc(i.id)}">
          <summary><span class="bc-ai-bank-course-tag">${esc(i.course || BC.t("未归类"))}</span> ${esc(i.question.slice(0, 120))}${i.question.length > 120 ? "…" : ""}
            <span class="bc-when">${BC.util.fmtDate(i.ts.slice(0, 10))}</span>${i.review ? ` <span class="bc-ai-bank-rv">${esc(BC.t("待复习"))}</span>` : ""}</summary>
          <div class="bc-ai-bank-body">
            <div class="bc-ai-bank-qfull">${esc(i.question)}</div>
            <div class="bc-ai-msg bc-ai-assistant"><button type="button" class="bc-ai-copy" title="${esc(BC.t("复制原文（Markdown）"))}">📋</button>${A._md(i.answer)}</div>
            <textarea class="bc-ai-bank-note" placeholder="${esc(BC.t("我的备注 / 错因…"))}">${esc(i.note || "")}</textarea>
            <div class="bc-ai-bank-actions">
              <label><input type="checkbox" class="bc-ai-bank-rvcb" ${i.review ? "checked" : ""}> ${esc(BC.t("标记待复习"))}</label>
              <a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(BC.t("来源页面 ↗"))}</a>
              <button type="button" class="bc-del">${esc(BC.t("删除"))}</button>
            </div>
          </div>
        </details>`).join("") : `<div class="bc-ai-bank-empty">${esc(BC.t("还没有题目。在讲解浮窗里点「💾 存题库」。"))}</div>`;
      A._attachRaw(list, items.map(i => i.answer));
      list.querySelectorAll(".bc-ai-bank-item").forEach(el => {
        const it = all.find(x => x.id === el.dataset.id);
        el.querySelector(".bc-ai-bank-note").addEventListener("change", async ev => { it.note = ev.target.value; await BC.storage.patch(st => { st.qbank = all; }); });
        el.querySelector(".bc-ai-bank-rvcb").addEventListener("change", async ev => { it.review = ev.target.checked; await BC.storage.patch(st => { st.qbank = all; }); });
        el.querySelector(".bc-del").onclick = async () => { all.splice(all.indexOf(it), 1); await BC.storage.patch(st => { st.qbank = all; }); draw(); };
      });
    };
    draw();
    ov.querySelectorAll(".bc-ai-bank-q,.bc-ai-bank-course,.bc-ai-bank-review").forEach(el => el.addEventListener("input", draw));
    ov.querySelectorAll(".bc-ai-export").forEach(b => b.onclick = () => A.exportBank(all, b.dataset.fmt));
  },

  exportBank(items, fmt) {
    let text, name;
    if (fmt === "json") { text = JSON.stringify(items, null, 2); name = "bc-qbank.json"; }
    else {
      // 导出的标题跟界面语言走
      text = items.map(i => `## ${i.course || BC.t("未归类")} · ${i.ts.slice(0, 10)}\n\n**${BC.t("题目")}**\n\n${i.question}\n\n**${BC.t("讲解")}**\n\n${i.answer}\n\n${i.note ? "**" + BC.t("备注") + "**\n\n" + i.note + "\n\n" : ""}${BC.t("来源：{url}", { url: i.url })}\n`).join("\n---\n\n");
      name = "bc-qbank.md";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  },

  // 通用调用：给其他模块（study.js）用。messages: [{role, content:[{type:"text",text}]}] -> 文本
  async call(system, messages) {
    const A = BC.assistant;
    const a = (A._settings && A._settings.assistant) || (await BC.storage.get()).assistant || {};
    const preset = A.PRESETS[a.provider] || A.PRESETS.custom;
    const req = {
      type: "bc-llm", provider: a.provider || "anthropic", model: a.model || preset.model, apiKey: a.apiKey || "",
      baseUrl: a.baseUrl || "", system: [system, A._mathRule(a)].filter(Boolean).join("\n"), messages
    };
    let res;
    for (let attempt = 0; ; attempt++) {
      try { res = await chrome.runtime.sendMessage(req); break; }
      catch (e) {
        // 后台 worker 在请求进行中被浏览器回收（background.js 已加保活，这里再兜底重试一次）
        if (A._channelClosed(e) && attempt === 0) continue;
        throw new Error(A._channelClosed(e) ? BC.t("后台在等待模型回复时被浏览器回收，已重试仍失败；请刷新页面再试一次") : (e.message || BC.t("无响应（扩展可能刚更新，刷新页面再试）")));
      }
    }
    if (!res || !res.ok) throw new Error(res && res.error || BC.t("无响应"));
    return res.text;
  },
  _channelClosed(e) { return /message channel closed|receiving end does not exist/i.test(e && e.message || ""); },
  configured() { const a = (BC.assistant._settings || {}).assistant || {}; return !!a.apiKey; },

  // 设置面板里的「测试连接」
  async test(a) {
    const preset = BC.assistant.PRESETS[a.provider] || BC.assistant.PRESETS.custom;
    const res = await chrome.runtime.sendMessage({
      type: "bc-llm", provider: a.provider, model: a.model || preset.model, apiKey: a.apiKey, baseUrl: a.baseUrl,
      system: BC.assistant._L("只回复“OK”。", "Reply with \"OK\" only.", a), messages: [{ role: "user", content: [{ type: "text", text: BC.assistant._L("连接测试", "Connection test", a) }] }]
    });
    if (!res || !res.ok) throw new Error(res && res.error || BC.t("无响应"));
    return res.text;
  }
};
// 切换界面语言：浮窗 / 菜单 / 小按钮 / 题库都是打开时重建的，直接收起，下次打开就是新语言
try { BC.i18n.onChange(() => { const A = BC.assistant; A.closePanel(); A._hideFab(); A._hideMenu(); A._el("bc-ai-bank")?.remove(); }); } catch (e) {}
