/* 成绩：拉取每门课的百分比/字母等级，并按需算出 得分/总分，
 * 注入到课程卡片右上角。 */
BC.grades = {
  // courseId -> { score, grade }
  async fetchScores() {
    const cached = await BC.cache.get("grades", 5 * 60 * 1000);
    if (cached) return cached;
    const map = {};
    try {
      const courses = await BC.api.activeCourses();
      for (const c of courses) {
        const en = (c.enrollments || []).find(e => e.type === "student") || (c.enrollments || [])[0];
        if (!en) continue;
        map[c.id] = {
          score: en.computed_current_score ?? en.current_period_computed_current_score ?? null,
          grade: en.computed_current_grade ?? en.current_period_computed_current_grade ?? null,
          // 侧栏差距图要显示课程名；code 更短，窄栏里优先用它
          name: c.name || c.course_code || null,
          code: c.course_code || null,
          term: (c.term && c.term.name) || ""   // 学期名（Fall 2026），「最新消息」按当前学期过滤用
        };
      }
      await BC.cache.set("grades", map);
    } catch (e) { console.warn("[BC] fetchScores", e); }
    return map;
  },

  // 单门课 得分/总分（按已评分作业累加，未加权）
  async fetchPoints(courseId) {
    const ck = "pts_" + courseId;
    const cached = await BC.cache.get(ck, 5 * 60 * 1000);
    if (cached !== null) return cached;
    let earned = 0, possible = 0, any = false;
    try {
      const groups = await BC.api.assignmentGroups(courseId);
      for (const g of groups) {
        for (const a of g.assignments || []) {
          const s = a.submission;
          if (s && s.score != null && !s.excused && a.points_possible) {
            earned += s.score;
            possible += a.points_possible;
            any = true;
          }
        }
      }
    } catch (e) { /* 无权限/无作业 */ }
    const v = any
      ? { earned: Math.round(earned * 100) / 100, possible: Math.round(possible * 100) / 100 }
      : false; // false 表示已查询但无数据，避免重复请求
    await BC.cache.set(ck, v);
    return v;
  },

  async decorateCards(settings) {
    if (!settings.cards.showGrade) return;
    const cards = document.querySelectorAll(".ic-DashboardCard");
    if (!cards.length) return;
    const scores = await BC.grades.fetchScores();

    cards.forEach(card => {
      const cid = BC.util.courseIdFromCard(card);
      if (!cid || card.querySelector(".bc-grade-badge")) return;
      const info = scores[cid];

      const badge = document.createElement("div");
      badge.className = "bc-grade-badge";
      const pct = info && info.score != null ? `${info.score}%` : "—";
      const letter = info && info.grade ? ` <span class="bc-grade-letter">${BC.util.esc(info.grade)}</span>` : "";
      badge.innerHTML = `<span class="bc-grade-pct">${pct}</span>${letter}` +
                        `<span class="bc-grade-pts" title="已评分作业 得分/总分">…</span>`;
      // 放在卡片彩色头部，绝对定位左上，避开右上的三点菜单
      const hero = card.querySelector(".ic-DashboardCard__header_hero") || card;
      hero.style.position = hero.style.position || "relative";
      hero.appendChild(badge);

      if (settings.cards.showPoints) {
        BC.grades.fetchPoints(cid).then(pts => {
          const span = badge.querySelector(".bc-grade-pts");
          if (!span) return;
          if (pts && pts.possible) span.textContent = `${pts.earned}/${pts.possible}`;
          else span.remove();
        });
      } else {
        const span = badge.querySelector(".bc-grade-pts");
        if (span) span.remove();
      }
    });
  }
};
