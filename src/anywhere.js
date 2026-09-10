/* 非 Canvas 网站上的入口（由 background.js 用 scripting.registerContentScripts 动态注册，只在用户打开「在所有网站启用」并授权后生效）。
 * 只加载学习助手（双击 / 选中 / 右键 / 快捷键浮窗、题库）和学习工具抽屉（页面对话 / 闪卡 / 练习）；
 * 资料 / 视频这类依赖 Canvas 接口的功能在这里不出现。 */
(function () {
  if (/\.instructure\.com$/i.test(location.hostname)) return;   // Canvas 由 main.js 负责
  BC.onCanvas = false;
  const start = async () => {
    const s = await BC.storage.get();
    if (!s.assistant || s.assistant.enabled === false || s.assistant.everywhere === false) return;
    if (BC.assistant) BC.assistant.init(s);
    if (BC.study) BC.study.init(s);
    BC.storage.onChange(async () => {
      const n = await BC.storage.get();
      if (BC.assistant) BC.assistant.init(n);
      if (BC.study) BC.study.init(n);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
