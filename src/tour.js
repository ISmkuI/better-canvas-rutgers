/* 页内导览：第一次进仪表盘时用「聚光灯 + 提示卡」依次介绍面板 / 卡片成绩 / 铃铛 / 学习工具 / 设置。
 * 只在仪表盘跑；看完或点「跳过」都写 chrome.storage.local.bc_tour_done = true，之后不再弹。
 * 设置面板「📖 新手教程 → 页内导览」调 BC.tour.start(true) 重放；引导页 / 设置在非仪表盘页面时把 bc_tour_done 置 false 再跳到 /，
 * 由这里的自动启动接手。加载顺序：settings-ui.js → tour.js → main.js（main.js 的 refreshAll 渲染面板；本文件用 waitFor 等它）。 */
BC.i18n.add({
  "📊 仪表盘面板": "📊 Dashboard panels",
  "本周截止 / GPA / 期中期末倒计时 / 今日课程 / 最新消息。右键面板可以编辑，设置里可以排序和显示隐藏。": "Due this week / GPA / midterm & final countdown / today's classes / latest messages. Right-click a panel to edit it; reorder or hide panels in settings.",
  "🃏 卡片成绩": "🃏 Grades on cards",
  "每张课程卡旁显示总评、GPA、班级均分和 Section，不用一门门点进去看。": "Each course card shows your total, GPA, class average and section, so you don't have to open every course.",
  "🔔 消息铃铛": "🔔 Message bell",
  "汇总这门课的公告和私信；考试、换教室、截止日期这类重要消息会高亮。": "Announcements and inbox messages for the course in one place; important ones (exams, room changes, due dates) are highlighted.",
  "📖 学习工具": "📖 Study tools",
  "页面对话 / 闪卡 / 练习题 / 资料总结。需要先在设置里填一个模型 API key。": "Page chat / flashcards / practice / summaries. Add a model API key in settings first.",
  "⚙ 完整设置": "⚙ Full settings",
  "外观主题、面板排序、消息关键词、期中期末日期、学习助手都在这里。": "Themes, panel order, message keywords, midterm / final dates and the study assistant all live here.",
  "跳过": "Skip",
  "下一步": "Next",
  "完成": "Done",
  "{i} / {n}": "{i} / {n}"
});

BC.tour = {
  STYLE_ID: "bc-tour-style",
  Z: 2147483000,
  PAD: 6,
  // 目标缺失就跳过；最多等 6 秒（面板 / 成绩是异步渲染的）
  STEPS: [
    { sel: "#bc-blocks",       title: "📊 仪表盘面板", text: "本周截止 / GPA / 期中期末倒计时 / 今日课程 / 最新消息。右键面板可以编辑，设置里可以排序和显示隐藏。" },
    { sel: ".bc-side, .bc-grade-badge", title: "🃏 卡片成绩", text: "每张课程卡旁显示总评、GPA、班级均分和 Section，不用一门门点进去看。" },
    { sel: ".bc-bell",         title: "🔔 消息铃铛", text: "汇总这门课的公告和私信；考试、换教室、截止日期这类重要消息会高亮。" },
    { sel: "#bc-study-btn",    title: "📖 学习工具", text: "页面对话 / 闪卡 / 练习题 / 资料总结。需要先在设置里填一个模型 API key。" },
    { sel: "#bc-gear",         title: "⚙ 完整设置", text: "外观主题、面板排序、消息关键词、期中期末日期、学习助手都在这里。" }
  ],
  _active: false,
  _steps: [],
  _i: 0,
  _els: null,
  _raf: 0,

  onDashboard() {
    const p = location.pathname;
    return p === "/" || p === "" || /^\/(dashboard)?\/?$/.test(p);
  },
  _reduced() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  },
  _visible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  },
  // 当前步骤的目标：优先按选择器重新查（React 可能把旧节点换掉了），否则用开始时缓存的那个
  _target() {
    const st = BC.tour._steps[BC.tour._i];
    if (!st) return null;
    const fresh = document.querySelector(st.sel);
    if (BC.tour._visible(fresh)) return fresh;
    return BC.tour._visible(st.el) ? st.el : null;
  },

  /* ---------- 入口 ---------- */
  async start(force) {
    const T = BC.tour;
    if (T._active) return;
    if (!force) {
      const d = await new Promise(res => chrome.storage.local.get("bc_tour_done", res));
      if (d && d.bc_tour_done === true) return;
    }
    T._active = true;
    // 并行等所有目标（各 6 秒），缺的直接跳过
    const found = await Promise.all(T.STEPS.map(st => BC.util.waitFor(st.sel, { timeout: 6000 })));
    T._steps = T.STEPS.map((st, i) => Object.assign({ el: found[i] }, st)).filter(st => T._visible(st.el));
    if (!T._steps.length) { T._active = false; T._done(); return; }
    T._mount();
    T._i = 0;
    T._show();
  },
  stop() {
    const T = BC.tour;
    if (!T._active) return;
    T._active = false;
    T._unbind();
    if (T._els) { T._els.wrap.remove(); T._els = null; }
    document.getElementById(T.STYLE_ID)?.remove();
  },
  _done() {
    try { chrome.storage.local.set({ bc_tour_done: true }); } catch (e) {}
  },
  skip() { BC.tour._done(); BC.tour.stop(); },
  next() {
    const T = BC.tour;
    if (T._i >= T._steps.length - 1) { T._done(); T.stop(); return; }
    T._i++;
    T._show();
  },
  prev() {
    const T = BC.tour;
    if (T._i <= 0) return;
    T._i--;
    T._show();
  },

  /* ---------- DOM ---------- */
  _css() {
    const z = BC.tour.Z;
    return `
#bc-tour-backdrop{position:fixed;inset:0;z-index:${z};background:transparent;}
#bc-tour-hl{position:fixed;z-index:${z + 1};border-radius:10px;pointer-events:none;
  box-shadow:0 0 0 9999px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.9);
  transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease;}
#bc-tour-tip{position:fixed;z-index:${z + 2};width:320px;max-width:calc(100vw - 16px);box-sizing:border-box;
  background:#fff;color:#1c1c1e;border-radius:12px;padding:14px 16px 12px;
  box-shadow:0 12px 40px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,"Segoe UI","Microsoft YaHei","PingFang SC",sans-serif;
  transition:left .25s ease,top .25s ease,opacity .2s ease;}
#bc-tour-tip .bc-tour-title{font-weight:800;font-size:15px;margin:0 0 4px;}
#bc-tour-tip .bc-tour-text{margin:0 0 10px;color:#444;}
#bc-tour-tip .bc-tour-foot{display:flex;align-items:center;gap:8px;}
#bc-tour-tip .bc-tour-count{font-size:12px;color:#888;margin-right:auto;font-variant-numeric:tabular-nums;}
#bc-tour-tip button{font:inherit;font-size:13px;font-weight:600;border-radius:8px;padding:6px 12px;cursor:pointer;
  border:1px solid #ddd;background:#f7f7f7;color:#333;margin:0;line-height:1.3;}
#bc-tour-tip button:hover{background:#eee;}
#bc-tour-tip button.bc-tour-next{background:#cc0033;border-color:#cc0033;color:#fff;}
#bc-tour-tip button.bc-tour-next:hover{background:#a8002a;}
#bc-tour-tip button:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(204,0,51,.3);}
@media (prefers-color-scheme: dark){
  #bc-tour-tip{background:#222226;color:#ececef;}
  #bc-tour-tip .bc-tour-text{color:#c8c8cf;}
  #bc-tour-tip button{background:#2e2e34;border-color:#3d3d44;color:#ececef;}
  #bc-tour-tip button:hover{background:#3a3a41;}
}
@media (prefers-reduced-motion: reduce){
  #bc-tour-hl,#bc-tour-tip{transition:none;}
}`;
  },
  _mount() {
    const T = BC.tour;
    if (!document.getElementById(T.STYLE_ID)) {
      const st = document.createElement("style");
      st.id = T.STYLE_ID;
      st.textContent = T._css();
      document.head.appendChild(st);
    }
    const wrap = document.createElement("div");
    wrap.id = "bc-tour";
    const backdrop = document.createElement("div"); backdrop.id = "bc-tour-backdrop";
    const hl = document.createElement("div"); hl.id = "bc-tour-hl";
    const tip = document.createElement("div"); tip.id = "bc-tour-tip"; tip.setAttribute("role", "dialog"); tip.setAttribute("aria-live", "polite");
    const title = document.createElement("div"); title.className = "bc-tour-title";
    const text = document.createElement("div"); text.className = "bc-tour-text";
    const foot = document.createElement("div"); foot.className = "bc-tour-foot";
    const count = document.createElement("span"); count.className = "bc-tour-count";
    const skip = document.createElement("button"); skip.type = "button"; skip.className = "bc-tour-skip"; skip.textContent = BC.t("跳过");
    const next = document.createElement("button"); next.type = "button"; next.className = "bc-tour-next";
    skip.addEventListener("click", T.skip);
    next.addEventListener("click", T.next);
    foot.append(count, skip, next);
    tip.append(title, text, foot);
    wrap.append(backdrop, hl, tip);
    document.body.appendChild(wrap);
    T._els = { wrap, hl, tip, title, text, count, next };
    T._bind();
  },
  _show() {
    const T = BC.tour;
    const st = T._steps[T._i];
    const el = T._target();
    if (!el) {
      // 目标在等待期间消失了：往后跳；一个都不剩就结束
      T._steps.splice(T._i, 1);
      if (!T._steps.length) { T._done(); T.stop(); return; }
      if (T._i >= T._steps.length) T._i = T._steps.length - 1;
      return T._show();
    }
    const E = T._els;
    E.title.textContent = BC.t(st.title);
    E.text.textContent = BC.t(st.text);
    E.count.textContent = BC.t("{i} / {n}", { i: T._i + 1, n: T._steps.length });
    E.next.textContent = BC.t(T._i >= T._steps.length - 1 ? "完成" : "下一步");
    try { el.scrollIntoView({ block: "center", inline: "nearest", behavior: T._reduced() ? "auto" : "smooth" }); } catch (e) {}
    T._place();
    // 平滑滚动期间位置会变；scroll 监听会持续跟随，这里再补一次以防滚动结束后没有事件
    setTimeout(T._place, 350);
    try { E.next.focus({ preventScroll: true }); } catch (e) {}
  },
  _place() {
    const T = BC.tour;
    if (!T._active || !T._els) return;
    const el = T._target();
    if (!el) return;
    const E = T._els;
    const r = el.getBoundingClientRect();
    const pad = T.PAD;
    E.hl.style.left = (r.left - pad) + "px";
    E.hl.style.top = (r.top - pad) + "px";
    E.hl.style.width = (r.width + pad * 2) + "px";
    E.hl.style.height = (r.height + pad * 2) + "px";

    const tw = E.tip.offsetWidth, th = E.tip.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, gap = 12, m = 8;
    let top, left;
    if (r.bottom + pad + gap + th <= vh - m) {            // 下方
      top = r.bottom + pad + gap;
      left = r.left + r.width / 2 - tw / 2;
    } else if (r.top - pad - gap - th >= m) {             // 上方
      top = r.top - pad - gap - th;
      left = r.left + r.width / 2 - tw / 2;
    } else if (r.right + pad + gap + tw <= vw - m) {      // 右侧
      top = r.top + r.height / 2 - th / 2;
      left = r.right + pad + gap;
    } else if (r.left - pad - gap - tw >= m) {            // 左侧
      top = r.top + r.height / 2 - th / 2;
      left = r.left - pad - gap - tw;
    } else {                                              // 都放不下：贴在视口底部居中
      top = vh - th - m;
      left = vw / 2 - tw / 2;
    }
    left = Math.max(m, Math.min(vw - tw - m, left));
    top = Math.max(m, Math.min(vh - th - m, top));
    E.tip.style.left = left + "px";
    E.tip.style.top = top + "px";
  },

  /* ---------- 事件 ---------- */
  _onMove() {
    const T = BC.tour;
    if (T._raf) return;
    T._raf = requestAnimationFrame(() => { T._raf = 0; T._place(); });
  },
  _onKey(e) {
    const T = BC.tour;
    if (!T._active) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); T.skip(); }
    else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); T.next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); T.prev(); }
  },
  _bind() {
    window.addEventListener("scroll", BC.tour._onMove, { passive: true, capture: true });
    window.addEventListener("resize", BC.tour._onMove, { passive: true });
    document.addEventListener("keydown", BC.tour._onKey, true);
  },
  _unbind() {
    window.removeEventListener("scroll", BC.tour._onMove, { capture: true });
    window.removeEventListener("resize", BC.tour._onMove);
    document.removeEventListener("keydown", BC.tour._onKey, true);
    if (BC.tour._raf) { cancelAnimationFrame(BC.tour._raf); BC.tour._raf = 0; }
  }
};

/* 自动启动：仪表盘 + 还没看过 → 等 main.js 把面板 / 卡片渲染出来，再等 1.5 秒开始 */
(function autoStart() {
  const T = BC.tour;
  if (!T.onDashboard()) return;
  try {
    chrome.storage.local.get("bc_tour_done", d => {
      if (d && d.bc_tour_done === true) return;
      BC.util.waitFor("#bc-blocks, .ic-DashboardCard", { timeout: 20000 }).then(el => {
        if (!el) return;
        setTimeout(() => { if (T.onDashboard() && !T._active) T.start(false); }, 1500);
      });
    });
  } catch (e) {}
})();
