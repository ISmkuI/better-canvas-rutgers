/* 主题：页面颜色 / 背景 / 课程卡片样式
 * 通过注入一个可随时重建的 <style> 实现，便于实时预览与撤销。 */
BC.theme = {
  STYLE_ID: "bc-theme-style",

  apply(settings) {
    const t = settings.theme || {};
    let css = "";

    if (t.enabled) {
      // 强调色：覆盖 Canvas 品牌变量
      if (t.accent) {
        css += `:root{--ic-brand-primary:${t.accent}!important;--ic-link-color:${t.accent}!important;}\n`;
        css += `a:not(.ic-DashboardCard__link):not(.ic-app-header__menu-list-link){color:${t.accent}!important;}\n`;
      }

      // 左侧导航
      if (t.navBg) css += `#header .ic-app-header,#header.ic-app-header{background-color:${t.navBg}!important;}\n`;
      if (t.navText) {
        css += `#header .ic-app-header__menu-list-link .menu-item__text,` +
               `#header .ic-app-header__menu-list-link{color:${t.navText}!important;}\n`;
        css += `#header .ic-icon-svg{fill:${t.navText}!important;}\n`;
      }

      // 页面背景
      if (t.pageBgImage) {
        css += `body.ic-app{background-image:url("${t.pageBgImage}")!important;` +
               `background-size:cover!important;background-attachment:fixed!important;background-position:center!important;}\n`;
        // 半透明内容层，保证可读性
        css += `#dashboard,#content{background:transparent!important;}\n`;
      } else if (t.pageBg) {
        css += `body.ic-app{background-color:${t.pageBg}!important;}\n`;
      }

      // 课程卡片
      const cardSel = ".ic-DashboardCard";
      const rules = [];
      if (t.cardRadius !== "" && t.cardRadius != null) rules.push(`border-radius:${parseInt(t.cardRadius, 10)}px`);
      if (t.cardShadow) rules.push("box-shadow:0 6px 20px rgba(0,0,0,.18)");
      if (t.cardStyle === "flat") rules.push("box-shadow:none", "border:1px solid rgba(0,0,0,.08)");
      if (t.cardStyle === "glass") {
        rules.push("background:rgba(255,255,255,.65)", "backdrop-filter:blur(8px)",
                   "box-shadow:0 4px 18px rgba(0,0,0,.12)");
      }
      if (rules.length) css += `${cardSel}{${rules.join(";")};overflow:hidden;}\n`;
    }

    let el = document.getElementById(BC.theme.STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = BC.theme.STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }
};
