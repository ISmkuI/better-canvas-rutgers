/* 首页课程卡片按 Rutgers 科目代码分组。
 * 课号格式 学院:科目:课程:段（01:198:205:05）或 科目:课程（198:112）；中间/前面的 3 位是科目。 */
BC.groups = {
  // 常见 Rutgers 科目代码 -> 名称（可继续补充；未知时只显示代码）
  SUBJECTS: {
    "198": "Computer Science", "640": "Mathematics", "750": "Physics",
    "160": "Chemistry", "119": "Biology (Life Sci)", "355": "English",
    "220": "Economics", "830": "Psychology", "014": "Astrophysics",
    "447": "Genetics", "750x": "", "351": "Electrical & Computer Eng",
    "332": "Electrical & Computer Eng", "440": "Industrial Eng", "650": "Mechanical Eng",
    "121": "Biology", "115": "Statistics", "960": "Statistics", "010": "Accounting",
    "799": "Information Technology", "189": "Journalism & Media", "790": "Political Science",
    "510": "History", "920": "Sociology", "070": "Anthropology", "300": "Comparative Lit"
  },

  // 从任意文本里识别科目代码；识别不到返回 "其他"
  subjectOfText(text) {
    const t = (text || "").replace(/\s+/g, " ");
    let m = t.match(/\b\d{2,3}:(\d{3}):\d{3}\b/);   // 学院:科目:课程
    if (m) return m[1];
    m = t.match(/\b(\d{3}):\d{3}\b/);               // 科目:课程
    if (m) return m[1];
    return "其他";
  },

  subjectOf(card) {
    return BC.groups.subjectOfText(card.textContent);
  },

  // 没有 Rutgers 课号的“其他课程”（打印实验室、迎新、辅导站之类）不计入 GPA
  countsForGpa(s) {
    return BC.groups.subjectOfText([s.name, s.code].filter(Boolean).join(" ")) !== "其他";
  },

  label(sub) {
    if (sub === "其他") return "其他课程";
    const name = BC.groups.SUBJECTS[sub];
    return name ? `${sub} · ${name}` : `${sub} 类`;
  },

  apply(settings) {
    const container = document.querySelector(".ic-DashboardCard__box");
    if (!container) return;

    if (!settings.cards || !settings.cards.groupBySubject) {
      container.querySelectorAll(".bc-card-group-header").forEach(h => h.remove());
      delete container.dataset.bcGroupSig;
      return;
    }

    const cards = [...container.querySelectorAll(".ic-DashboardCard")];
    if (!cards.length) return;

    // 顺序无关的签名：避免我们自己重排卡片后又触发重排（死循环）
    const sig = cards.map(c => BC.util.courseIdFromCard(c) || "").sort().join(",");
    if (container.dataset.bcGroupSig === sig && container.querySelector(".bc-card-group-header")) return;

    const groups = {};
    cards.forEach(c => {
      const s = BC.groups.subjectOf(c);
      (groups[s] = groups[s] || []).push(c);
    });

    const subs = Object.keys(groups).sort((a, b) => {
      if (a === "其他") return 1;
      if (b === "其他") return -1;
      return (parseInt(a, 10) || 9999) - (parseInt(b, 10) || 9999);
    });

    container.querySelectorAll(".bc-card-group-header").forEach(h => h.remove());
    subs.forEach(sub => {
      const header = document.createElement("div");
      header.className = "bc-card-group-header";
      header.innerHTML = `${BC.util.esc(BC.groups.label(sub))} <span class="bc-pill">${groups[sub].length}</span>`;
      container.appendChild(header);
      groups[sub].forEach(c => container.appendChild(c)); // appendChild 会移动已有节点（重排）
    });
    // 把末尾的 <br> 等清理元素放最后
    container.querySelectorAll("br").forEach(br => container.appendChild(br));

    container.dataset.bcGroupSig = sig;
  }
};
