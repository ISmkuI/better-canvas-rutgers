/* 页面状态监控：visibilitychange / blur / focus。
 * - 标签页切走或窗口失焦 -> html.bc-idle：inject.css 里暂停全部 CSS 动画；themes.js 的 canvas 动画循环看到 idle 也只空转不画；
 *   同时收起助手的小按钮和右键菜单（回来时它们的位置多半已经不对）。
 * - 回到页面 -> 去掉 bc-idle；离开超过 STALE_MS 且当前在仪表盘时，重新拉一遍面板数据（本周截止 / 最新消息之类可能已经过期）。 */
BC.pagestate = {
  IDLE_CLASS: "bc-idle",
  STALE_MS: 15 * 60 * 1000,
  idle: false,
  _awayAt: 0,
  _bound: false,

  init() {
    const P = BC.pagestate;
    if (P._bound) return;
    P._bound = true;
    document.addEventListener("visibilitychange", P._update);
    window.addEventListener("blur", P._update);
    window.addEventListener("focus", P._update);
    P._update();
  },

  _update() {
    const P = BC.pagestate;
    // hasFocus 在焦点落在页内 iframe 时也为 true；只有整个窗口失焦或标签页不可见才算离开
    const idle = document.hidden || !document.hasFocus();
    if (idle === P.idle) return;
    P.idle = idle;
    document.documentElement.classList.toggle(P.IDLE_CLASS, idle);
    if (idle) {
      P._awayAt = Date.now();
      if (BC.assistant) { BC.assistant._hideFab(); BC.assistant._hideMenu(); }
      return;
    }
    const away = P._awayAt ? Date.now() - P._awayAt : 0;
    P._awayAt = 0;
    if (away > P.STALE_MS && BC.dash && BC.dash.onDashboard() && BC.bus) BC.bus.refreshBlocks();
  }
};
