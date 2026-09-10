/* New Quizzes iframe（*.quiz-lti-*.instructure.com）里的入口：由 background.js 在 frame 加载完成后用 scripting.executeScript 注入
 * （manifest 的内容脚本只进顶层页面，进不来这里）。只加载学习助手和学习工具抽屉；资料 / 视频这类靠 Canvas 接口的功能不在这里出现
 * （frame 的源不是 Canvas，接口打不到，所以 BC.onCanvas = false）。
 * 作答中不激活：assistant.isBlocked 按 URL（…/take）和 DOM（可点的 Submit 按钮）判定。New Quizzes 是单页应用，从介绍页点 Begin
 * 进入作答、交卷回到结果页都不重新加载 frame，所以这里轮询屏蔽状态：一变成作答就关掉浮窗、撤掉 📖；回到结果页再恢复。 */
(function () {
  if (window === window.top) return;
  BC.onCanvas = false;
  BC.quizFrame = true;
  let settings = null, blocked = null;
  const apply = () => {
    if (!settings || !BC.assistant) return;
    const now = BC.assistant.isBlocked();
    if (now === blocked) return;
    blocked = now;
    if (now) { BC.assistant.closePanel(); BC.assistant._hideFab(); BC.assistant._hideMenu(); }
    BC.assistant.init(settings);
    if (BC.study) BC.study.init(settings);
  };
  const start = async () => {
    settings = await BC.storage.get();
    // 顶层 Canvas 页面的地址：题库按课程归档靠它（frame 自己的 URL 没有课程 id；跨域 referrer 通常只剩源）
    try { const r = await chrome.runtime.sendMessage({ type: "bc-top-url" }); if (r && r.ok) BC.topUrl = r.url || ""; } catch (e) {}
    apply();
    setInterval(apply, 800);
    BC.storage.onChange(async () => { settings = await BC.storage.get(); blocked = null; apply(); });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
