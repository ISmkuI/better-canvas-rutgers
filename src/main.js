/* 入口：初始化主题、注入齿轮、装饰卡片、渲染面板，
 * 监听卡片异步出现 + SPA 路由变化。 */
BC.bus = {
  _settings: null,
  async refreshAll() {
    BC.bus._settings = await BC.storage.get();
    const s = BC.bus._settings;
    if (BC.pagestate) BC.pagestate.init(); // visibilitychange / blur / focus：离开时暂停动画，回来时按需刷新
    BC.themes.apply(s.theme.preset, s);  // 预设主题/动画（先）
    BC.theme.apply(s);                    // 手动调色覆盖在预设之上（后）
    BC.ui.injectGearButton();
    BC.bus.applySidebarFlags(s);
    if (BC.dash.onDashboard()) {
      await BC.grades.decorateCards(s);
      await BC.messages.decorateCards(s);
      if (BC.groups) BC.groups.apply(s);
      await BC.blocks.render(s);
      if (BC.sidebarGpa) await BC.sidebarGpa.render(s);
      BC.blocks.renderSidebarHistory(s);
    }
    BC.messages.enhanceLists(s);       // 公告/讨论列表页：已读未读强化
    BC.ui.injectCoursePagePanel();
    if (BC.calendar) BC.calendar.init(s);  // 日历页：把期中/期末考试画到日历上
    if (BC.links) BC.links.render(s);      // 右侧栏：常用网站导航（模块自己判断在哪些页显示）
    if (BC.assistant) BC.assistant.init(s); // 学习助手：双击 / 选中触发（作答页面内部屏蔽）
    if (BC.study) BC.study.init(s);         // 学习工具抽屉：页面对话 / 闪卡 / 练习
    if (BC.gradescope) BC.gradescope.maybeSync();  // Grades 页：从 Gradescope 同步预估分数
  },
  async refreshTheme() {
    const s = await BC.storage.get();
    BC.themes.apply(s.theme.preset, s);
    BC.theme.apply(s);
  },
  async refreshCards() { BC.grades.decorateCards(await BC.storage.get()); },
  async refreshMessages() {
    document.querySelectorAll(".bc-bell").forEach(e => e.remove());
    BC.messages.decorateCards(await BC.storage.get());
  },
  async refreshBlocks() {
    const s = await BC.storage.get();
    BC.blocks.render(s);
    if (BC.sidebarGpa) BC.sidebarGpa.render(s);
    if (BC.links) BC.links.render(s);
    BC.blocks.renderSidebarHistory(s);
    if (BC.calendar) BC.calendar.refresh();
    BC.bus.applySidebarFlags(s);
  },
  // 右侧栏 To Do / Recent Feedback 的隐藏靠 html 上的类切换（inject.css 里 display:none），React 重渲染也不会带回来
  applySidebarFlags(s) {
    document.documentElement.classList.toggle("bc-hide-todo", s.sidebar.hideTodo !== false);
    document.documentElement.classList.toggle("bc-hide-feedback", s.sidebar.hideFeedback !== false);
  }
};

BC.dash = {
  onDashboard() {
    const p = location.pathname;
    return p === "/" || p === "" || /^\/(dashboard)?$/.test(p);
  }
};

(function init() {
  const start = () => {
    BC.bus.refreshAll();

    // 卡片是 React 异步渲染：观察容器，出现新卡片就补装饰
    const observer = new MutationObserver(() => {
      const s = BC.bus._settings;
      if (!s) return;
      BC.messages.enhanceLists(s); // 列表行可能异步加载
      if (!BC.dash.onDashboard()) return;
      const undecorated = document.querySelector(".ic-DashboardCard:not([data-bc-done])");
      if (undecorated) {
        document.querySelectorAll(".ic-DashboardCard").forEach(c => c.setAttribute("data-bc-done", "1"));
        BC.grades.decorateCards(s);
        BC.messages.decorateCards(s);
        if (BC.groups) BC.groups.apply(s);
        if (!document.getElementById(BC.blocks.CONTAINER_ID)) BC.blocks.render(s);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // SPA 路由变化：Canvas 部分页面用 pushState
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        document.querySelector(".bc-msg-popup")?.remove();
        setTimeout(() => BC.bus.refreshAll(), 400);
      }
    }, 800);

    // 别的页面（如 popup 修改设置）改了存储 -> 同步刷新
    BC.storage.onChange(() => BC.bus.refreshTheme());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
