/* 右侧栏「GPA 与各科差距」——插在 View Grades 按钮上方。
 *
 * 形式选型：每门课一条 meter（当前百分比 / 下一档分数线），按分数升序，最弱的排最前，
 * 直接回答「哪科不够、还差多少」。不用 0–100 之外的截断坐标轴（截断柱状轴会夸大差距）。
 *
 * 配色用固定的状态色（不随主题变）。四档状态里 warning(#fab219) 与 serious(#ec835a)
 * 在白底上普通视觉 ΔE 只有 13.6，低于 15 的下限——而按分数排序恰好会让这两档相邻，
 * 所以这里只用三档。三档实测：最差相邻对 #fab219↔#0ca30c，CVD ΔE 11.3 / 普通视觉 27.6，通过。
 * #fab219 对白底对比度 1.83（<3:1），因此每一行都必须带可见文字标签（分数 + 差距 + 状态词），
 * 状态永远不靠颜色单独承载。 */
BC.sidebarGpa = {
  ID: "bc-sb-gpa",

  // Rutgers 分数线（与 BC.blocks.pctToGpa 的档位一致）
  BOUNDS: [[60, "D"], [70, "C"], [75, "C+"], [80, "B"], [85, "B+"], [90, "A"]],

  STATUS: {
    good:     { label: "达标", fill: "#0ca30c", track: "#d6f0d6" },
    warning:  { label: "注意", fill: "#fab219", track: "#fdeccb" },
    critical: { label: "偏低", fill: "#d03b3b", track: "#f6d8d8" }
  },

  band(p) { return p >= 85 ? "good" : p >= 70 ? "warning" : "critical"; },

  // 刚好高于当前分数的那一档；已在最高档返回 null
  nextBound(p) {
    for (const [v, l] of BC.sidebarGpa.BOUNDS) if (p < v) return { v, l };
    return null;
  },

  /* ---------- 课程 Section（默认卡） ----------
   * Rutgers 课号 学院:科目:课程:section[:index]，第四段就是 section：
   *   01:198:206:02:11528 -> 02   04:189:102:02:14277 -> 02   01:355:101:EJ -> EJ   01:198:211:05-08 -> 05-08（跨 section 合班）
   * 来源优先级：WebReg 导入的课表条目（还带 index 号）> Canvas 课名 / 课程代码。 */
  sectionOf(text) {
    // 第四段后面可以直接跟 ":index"（WebReg 写法），所以只排除紧接的字母数字，不排除冒号
    const m = /\b\d{2}:\d{3}:\d{3}:([A-Z0-9]{1,3}(?:-[A-Z0-9]{1,3})?)(?![\dA-Z])/i.exec(text || "");
    return m ? m[1].toUpperCase() : "";
  },
  courseNo(text) {
    const m = /\b(\d{2}:\d{3}:\d{3})\b/.exec(text || "");
    return m ? m[1] : "";
  },
  fmtSection(sec) { return /^\d+$/.test(sec) ? String(+sec) : sec; },   // "02" -> "2"

  async _renderSection(settings, side, old) {
    const S = BC.sidebarGpa;
    const esc = BC.util.esc;
    const scores = await BC.grades.fetchScores();
    // WebReg 导入的条目：按 Canvas 课程 id 和课号两种方式索引
    const byCid = {}, byNo = {};
    (settings.schedule || []).forEach(it => {
      if (!it || it.source !== "webreg" || !it.code) return;
      const rec = { code: it.code, section: it.section || "", index: it.index || "", credits: it.credits || "" };
      if (it.cid) byCid[it.cid] = byCid[it.cid] || rec;
      const no = S.courseNo(it.code);
      if (no) byNo[no] = byNo[no] || rec;
    });

    const rows = Object.entries(scores).map(([cid, s]) => {
      const text = `${s.name || ""} ${s.code || ""}`;
      const no = S.courseNo(text);
      const wr = byCid[cid] || (no && byNo[no]) || null;
      // WebReg 解析时已填好的 section 优先，其次从 WebReg 课号 / Canvas 课名里识别
      const sec = (wr && wr.section) || S.sectionOf(wr ? wr.code : "") || S.sectionOf(text);
      return {
        cid, no, sec, index: wr ? wr.index : "", credits: wr ? wr.credits : "",
        name: BC.util.courseTitle(s.name || s.code || ("课程 " + cid))
      };
    }).filter(r => r.no || r.sec).sort((a, b) => a.name.localeCompare(b.name));

    const card = document.createElement("div");
    card.className = "bc-block bc-sbg bc-sec";
    card.id = S.ID;
    const items = rows.map(r => `<li class="bc-sec-row" title="${esc(r.no ? r.no + (r.sec ? ":" + r.sec : "") : "")}${r.index ? " · index " + esc(r.index) : ""}">
        <span class="bc-sec-badge${r.sec ? "" : " bc-sec-none"}">${r.sec ? "Sec " + esc(S.fmtSection(r.sec)) : "—"}</span>
        <div class="bc-sec-body">
          <a class="bc-sec-name" href="/courses/${esc(r.cid)}">${esc(r.name)}</a>
          <div class="bc-sec-sub">${esc(r.no)}${r.sec ? ":" + esc(r.sec) : ""}${r.index ? ` · index ${esc(r.index)}` : ""}${r.credits ? ` · ${esc(r.credits)} 学分` : ""}</div>
        </div>
      </li>`).join("");
    card.innerHTML =
      `<div class="bc-block-title">🔢 课程 Section</div>
       ${rows.length ? `<ul class="bc-sec-list">${items}</ul>` : `<div class="bc-sbg-empty">课名里没有 Rutgers 课号</div>`}
       <div class="bc-sbg-foot">section = 课号第四段${Object.keys(byCid).length || Object.keys(byNo).length ? "；index 来自 WebReg 课表" : "；导入 WebReg 课表后还会显示 index 号"}</div>`;

    const anchor = side.querySelector('a[href="/grades"]') || side.querySelector('a[href$="/grades"]');
    if (old) old.remove();
    if (anchor) anchor.parentNode.insertBefore(card, anchor);
    else side.appendChild(card);
  },

  async render(settings) {
    const S = BC.sidebarGpa;
    const old = document.getElementById(S.ID);
    if (!settings.sidebar.gpaChart || !BC.dash.onDashboard()) { old?.remove(); return; }

    const side = await BC.util.waitFor("#right-side");
    if (!side) return;

    // 默认显示「课程 Section」；设置里可切回「GPA 与各科差距」
    if ((settings.sidebar.rightCard || "section") === "section") return S._renderSection(settings, side, old);

    const scores = await BC.grades.fetchScores();
    const rows = Object.entries(scores)
      .filter(([, s]) => s.score != null && BC.groups.countsForGpa(s)) // “其他课程”不计入
      .map(([cid, s]) => ({ cid, ...s }))
      .sort((a, b) => a.score - b.score);

    const gpas = rows.map(r => BC.blocks.pctToGpa(r.score)).filter(v => v != null);
    const avg = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;

    const card = document.createElement("div");
    card.className = "bc-block bc-sbg";
    card.id = S.ID;

    let body;
    if (!rows.length) {
      body = `<div class="bc-sbg-empty">还没有已评分的课程</div>`;
    } else {
      const items = rows.slice(0, 8).map(r => {
        const st = S.STATUS[S.band(r.score)];
        const nb = S.nextBound(r.score);
        const name = BC.util.courseTitle(r.name || r.code || ("课程 " + r.cid));
        const gap = nb
          ? `还差 <b>${(nb.v - r.score).toFixed(1)}%</b> 到 ${nb.l}`
          : "已在最高档";
        const tip = `${r.name || name}：当前 ${r.score}%` +
                    (r.grade ? `（${r.grade}）` : "") +
                    (nb ? ` · 距 ${nb.l} 线 ${(nb.v - r.score).toFixed(1)}%` : " · 已在最高档");
        // tick 位置直接用分数线的百分比——坐标轴就是 0–100，没有缩放
        const tick = nb
          ? `<span class="bc-sbg-tick" style="left:${nb.v}%"></span>`
          : "";
        return `<li class="bc-sbg-row" title="${BC.util.esc(tip)}">
          <div class="bc-sbg-head">
            <span class="bc-sbg-name">${BC.util.esc(name)}</span>
            <span class="bc-sbg-val">${r.score}%</span>
          </div>
          <div class="bc-sbg-track" style="background:${st.track}">
            <span class="bc-sbg-fill" style="width:${Math.max(0, Math.min(100, r.score))}%;background:${st.fill}"></span>
            ${tick}
          </div>
          <div class="bc-sbg-gap"><span class="bc-sbg-tag">${st.label}</span> · ${gap}</div>
        </li>`;
      }).join("");
      const more = rows.length > 8 ? `<div class="bc-sbg-foot">另有 ${rows.length - 8} 门未列出</div>` : "";
      body =
        `<ul class="bc-sbg-list">${items}</ul>${more}
         <div class="bc-sbg-foot">竖线 = 下一档分数线</div>`;
    }

    card.innerHTML =
      `<div class="bc-block-title">🎯 GPA 与各科差距</div>
       <div class="bc-sbg-num">${avg != null ? avg.toFixed(2) : "—"}</div>
       <div class="bc-sbg-sub">${gpas.length} 门在读 · 分数线因课而异，仅供参考</div>
       ${body}`;

    // 插到 View Grades 按钮上方；先精确匹配，避免命中 To Do 里指向某门课成绩页的链接
    const anchor = side.querySelector('a[href="/grades"]') || side.querySelector('a[href$="/grades"]');
    if (old) old.remove();
    if (anchor) anchor.parentNode.insertBefore(card, anchor);
    else side.appendChild(card);
  }
};
