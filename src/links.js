/* 右侧栏「常用网站」导航：Rutgers 学生常用的站点，按类别折叠，点击在新标签页打开。
 * 链接列表存在 settings.links（可在设置面板增删 / 恢复默认），默认只在仪表盘显示，
 * settings.sidebar.linksEverywhere 打开后所有带右侧栏的页面都显示。 */
BC.links = {
  ID: "bc-sb-links",

  // 默认列表：{ group, emoji, name, url }
  DEFAULTS: [
    // 选课 / 学业
    { group: "选课 / 学业", emoji: "🗓️", name: "WebReg 选课",            url: "https://sims.rutgers.edu/webreg/" },
    { group: "选课 / 学业", emoji: "📖", name: "Schedule of Classes",    url: "https://sis.rutgers.edu/soc/" },
    { group: "选课 / 学业", emoji: "🧭", name: "Course Schedule Planner", url: "https://sims.rutgers.edu/csp/" },
    { group: "选课 / 学业", emoji: "🎓", name: "Degree Navigator",       url: "https://dn.rutgers.edu/" },
    { group: "选课 / 学业", emoji: "⭐", name: "Rate My Professors",     url: "https://www.ratemyprofessors.com/school/825" },
    { group: "选课 / 学业", emoji: "📅", name: "Academic Calendar",      url: "https://scheduling.rutgers.edu/scheduling/academic-calendar" },
    { group: "选课 / 学业", emoji: "📝", name: "Gradescope",             url: "https://www.gradescope.com/" },
    { group: "选课 / 学业", emoji: "📚", name: "Rutgers Libraries",      url: "https://www.libraries.rutgers.edu/" },
    { group: "选课 / 学业", emoji: "🧑‍🏫", name: "Learning Centers 辅导",  url: "https://rlc.rutgers.edu/" },
    // 账户 / 缴费
    { group: "账户 / 缴费", emoji: "🏠", name: "myRutgers",              url: "https://my.rutgers.edu/" },
    { group: "账户 / 缴费", emoji: "🔑", name: "NetID 管理",             url: "https://netid.rutgers.edu/" },
    { group: "账户 / 缴费", emoji: "✉️", name: "ScarletMail",            url: "https://scarletmail.rutgers.edu/" },
    { group: "账户 / 缴费", emoji: "💳", name: "Term Bill 学费账单",     url: "https://finance.rutgers.edu/student-abc/paying-your-term-bill" },
    { group: "账户 / 缴费", emoji: "💰", name: "Financial Aid",          url: "https://scarlethub.rutgers.edu/financial-services/" },
    { group: "账户 / 缴费", emoji: "🛠️", name: "IT Help",                url: "https://it.rutgers.edu/help-support/" },
    // 校园生活
    // 链接里的 {{Y}} {{M}} {{D}} 在渲染时替换成当天日期（Tripshot 的路线页要带日期）
    { group: "校园生活",    emoji: "🚌", name: "Rutgers 校车",
      url: 'https://rutgers.tripshot.com/g/tms/Public.html#RoutesPlace:%7B"regionId":"CA558DDC-D7F2-4B48-9CAC-DEEA1134F820",%20"date":%7B"year":{{Y}},%20"month":{{M}},%20"day":{{D}}%7D,%20"noNav":false%7D' },
    { group: "校园生活",    emoji: "🍽️", name: "Dining 食堂",             url: "https://food.rutgers.edu/" },
    { group: "校园生活",    emoji: "🏋️", name: "Recreation 健身",         url: "https://recreation.rutgers.edu/" },
    { group: "校园生活",    emoji: "🏢", name: "Housing 宿舍",            url: "https://ruoncampus.rutgers.edu/" },
    { group: "校园生活",    emoji: "🩺", name: "Student Health",          url: "https://health.rutgers.edu/" },
    { group: "校园生活",    emoji: "🎉", name: "getINVOLVED 社团活动",    url: "https://rutgers.campuslabs.com/engage/" },
    { group: "校园生活",    emoji: "💼", name: "Handshake 实习求职",      url: "https://rutgers.joinhandshake.com/" }
  ],

  // null = 没改过，用默认；数组（哪怕是空的）= 用户自己的列表
  list(settings) {
    return Array.isArray(settings.links) ? settings.links : BC.links.DEFAULTS;
  },

  // 把 url 里的日期占位符换成当天
  resolveUrl(url) {
    const d = new Date();
    return String(url || "")
      .replace(/\{\{Y\}\}/g, d.getFullYear())
      .replace(/\{\{M\}\}/g, d.getMonth() + 1)
      .replace(/\{\{D\}\}/g, d.getDate());
  },

  async render(settings) {
    const L = BC.links;
    const old = document.getElementById(L.ID);
    const show = settings.sidebar.links !== false && (BC.dash.onDashboard() || settings.sidebar.linksEverywhere);
    if (!show) { old?.remove(); return; }
    const side = await BC.util.waitFor("#right-side", { timeout: 8000 });
    if (!side) return;

    const esc = BC.util.esc;
    const groups = {};
    L.list(settings).forEach(it => {
      if (!it || !it.url) return;
      const g = it.group || "其他";
      (groups[g] = groups[g] || []).push(it);
    });
    const openGroups = new Set(settings.sidebar.linksOpen || Object.keys(groups));  // 默认全部展开

    const html = Object.entries(groups).map(([g, items]) => `
      <details class="bc-links-group" data-group="${esc(g)}" ${openGroups.has(g) ? "open" : ""}>
        <summary>${esc(g)} <span class="bc-pill">${items.length}</span></summary>
        <ul class="bc-links-list">
          ${items.map(it => `<li>
            <a href="${esc(L.resolveUrl(it.url))}" target="_blank" rel="noopener noreferrer" title="${esc(L.resolveUrl(it.url))}">
              <span class="bc-links-emoji">${esc(it.emoji || "🔗")}</span>
              <span class="bc-links-name">${esc(it.name || it.url)}</span>
              <span class="bc-links-ext" aria-hidden="true">↗</span>
            </a>
          </li>`).join("")}
        </ul>
      </details>`).join("");

    const card = document.createElement("div");
    card.className = "bc-block bc-links";
    card.id = L.ID;
    card.innerHTML =
      `<div class="bc-block-title">🧭 常用网站 <span class="bc-links-hint">新标签页打开</span></div>
       <div class="bc-block-body">${html || "<small>还没有链接，去设置面板添加。</small>"}</div>`;

    // 记住折叠状态
    card.querySelectorAll("details.bc-links-group").forEach(d => {
      d.addEventListener("toggle", async () => {
        const open = [...card.querySelectorAll("details.bc-links-group[open]")].map(x => x.dataset.group);
        await BC.storage.patch(st => { st.sidebar.linksOpen = open; });
      });
    });

    if (old) old.remove();
    side.insertBefore(card, side.firstChild);   // 放右侧栏最上面
  }
};
