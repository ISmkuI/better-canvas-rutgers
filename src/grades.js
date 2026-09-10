/* 成绩：拉取每门课的百分比/字母等级，并按需算出 得分/总分，
 * 注入到课程卡片右上角。 */
BC.i18n.add({
  "总评": "Total",
  "当前总评（Canvas 加权值）；下面是已评分作业 得分/总分": "Current total (Canvas weighted); below: earned/possible on graded assignments",
  "按当前百分比换算的绩点（通用分数线，仅供参考）": "Grade points from the current percentage (generic cutoffs, for reference only)",
  "班级均分": "Class avg",
  "用每个作业的班级统计按本课计分规则算出的班级平均总评": "Class average total, computed from per-assignment class statistics using this course's grading rules",
  "课号第四段；index 来自 WebReg 课表": "Fourth segment of the course number; index comes from the WebReg schedule",
  "{n} 学分": "{n} credits",
  "无统计": "No stats",
  "范围 {a}–{b}": "Range {a}–{b}",
  "班级平均总评 {mean}%，最差 {low}% ～ 最好 {high}%（按本课计分规则{w}，用 {n} 个已评分作业的班级统计算出）":
    "Class average total {mean}%, worst {low}% – best {high}% (using this course's grading rules{w}, from class statistics on {n} graded assignments)",
  "、分组权重": " and group weights",
  "你 {m}%，{rel}平均 {d} 分": "You: {m}%, {rel} the average by {d} pts",
  "高于": "above",
  "低于": "below",
  "（本课的计分规则没有完全对上 Canvas 的总评，数值仅供估算）": "(This course's grading rules don't fully match the Canvas total; treat these numbers as estimates)",
  "已评分作业 得分/总分": "Earned/possible on graded assignments",
  "班级": "Class",
  "均 {n}": "avg {n}",
  "班级成绩范围（按本课计分规则{w}，用 {n} 个已评分作业的班级统计算出）": "Class grade range (using this course's grading rules{w}, from class statistics on {n} graded assignments)",
  "最差情况 {low}%  ·  平均 {mean}%  ·  最好情况 {high}%": "Worst case {low}%  ·  Average {mean}%  ·  Best case {high}%"
});

BC.grades = {
  /* in-flight 去重：首页同时有好几个渲染器调 fetchScores / fetchPoints / fetchClassRange，
   * 缓存冷的时候每个调用者都会各发一次请求；这里让并发的调用共用同一个 promise，结束后清掉。
   * chrome.storage 的缓存逻辑不变，仍在各自的 _xxxNow 里。 */
  _inflight: null,               // fetchScores 的 promise
  _inflightPts: new Map(),       // courseId -> fetchPoints promise
  _inflightCls: new Map(),       // courseId -> fetchClassRange promise
  _shared(map, key, fn) {
    if (map.has(key)) return map.get(key);
    const p = Promise.resolve().then(fn).finally(() => { map.delete(key); });
    map.set(key, p);
    return p;
  },

  // courseId -> { score, grade }
  fetchScores() {
    if (BC.grades._inflight) return BC.grades._inflight;
    const p = BC.grades._fetchScoresNow().finally(() => { BC.grades._inflight = null; });
    BC.grades._inflight = p;
    return p;
  },
  async _fetchScoresNow() {
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
          term: (c.term && c.term.name) || "",   // 学期名（Fall 2026），「最新消息」按当前学期过滤用
          weighted: !!c.apply_assignment_group_weights   // 总评是否按作业分组权重算（班级成绩范围要按同一套规则）
        };
      }
      await BC.cache.set("grades", map);
    } catch (e) { console.warn("[BC] fetchScores", e); }
    return map;
  },

  // 单门课 得分/总分（按已评分作业累加，未加权）
  fetchPoints(courseId) {
    return BC.grades._shared(BC.grades._inflightPts, String(courseId), () => BC.grades._fetchPointsNow(courseId));
  },
  async _fetchPointsNow(courseId) {
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

  /* 按 Canvas 的总评算法算一个百分比：pick(a) 给出某个作业的得分（null = 不计）。
   * 分组内 得分和/满分和，套用丢最低 / 丢最高 / never_drop；课程开了分组权重就按权重加权（没有已评分作业的组不参与、权重重新归一），
   * 否则全课程按总分算。omit_from_final_grade 的作业不算。 */
  computeTotal(groups, weighted, pick) {
    let wsum = 0, wtot = 0, earned = 0, possible = 0;
    for (const g of groups) {
      const items = [];
      for (const a of g.assignments || []) {
        if (!a.points_possible || a.omit_from_final_grade) continue;
        const s = pick(a);
        if (s == null || isNaN(s)) continue;
        items.push({ a, s: +s, p: +a.points_possible });
      }
      if (!items.length) continue;
      const rules = g.rules || {};
      const never = new Set((rules.never_drop || []).map(String));
      const droppable = items.filter(it => !never.has(String(it.a.id))).sort((x, y) => x.s / x.p - y.s / y.p);
      const drop = new Set();
      for (let i = 0; i < (rules.drop_lowest || 0) && i < droppable.length; i++) drop.add(droppable[i]);
      for (let i = 0; i < (rules.drop_highest || 0) && droppable.length - 1 - i >= 0; i++) drop.add(droppable[droppable.length - 1 - i]);
      const kept = items.filter(it => !drop.has(it));
      if (!kept.length) continue;
      const e = kept.reduce((t, it) => t + it.s, 0), p = kept.reduce((t, it) => t + it.p, 0);
      if (!p) continue;
      if (weighted) { if (g.group_weight > 0) { wsum += (e / p) * g.group_weight; wtot += g.group_weight; } }
      else { earned += e; possible += p; }
    }
    if (weighted) return wtot ? wsum / wtot * 100 : null;
    return possible ? earned / possible * 100 : null;
  },

  /* 班级成绩范围：把每个作业的班级统计（最低 / 平均 / 最高）当成三个假想同学，按这门课自己的计分规则各算一遍总评，
   * 得到 { low, mean, high, n, approx, mine }。n = 用到的作业数；approx = 用同样算法算出的本人总评和 Canvas 给的差超过 2 分（说明规则没完全对上，只能当估算）。
   * 注意「最低 / 最高」是每个作业的班级最低 / 最高拼起来的，代表的是最差 / 最好情况，不一定真有这么一个人。 */
  fetchClassRange(courseId, info) {
    return BC.grades._shared(BC.grades._inflightCls, String(courseId), () => BC.grades._fetchClassRangeNow(courseId, info));
  },
  async _fetchClassRangeNow(courseId, info) {
    const ck = "cls_" + courseId;
    const cached = await BC.cache.get(ck, 30 * 60 * 1000);
    if (cached !== null) return cached;
    let v = false;
    try {
      let weighted = info && info.weighted;
      if (weighted === undefined) { try { weighted = !!(await BC.api.course(courseId)).apply_assignment_group_weights; } catch (e) { weighted = false; } }
      const groups = await BC.api.assignmentGroupsStats(courseId);
      const stat = a => a.score_statistics && a.score_statistics.mean != null ? a.score_statistics : null;
      let n = 0;
      groups.forEach(g => (g.assignments || []).forEach(a => { if (stat(a) && a.points_possible && !a.omit_from_final_grade) n++; }));
      if (n) {
        const low = BC.grades.computeTotal(groups, weighted, a => stat(a) ? stat(a).min : null);
        const mean = BC.grades.computeTotal(groups, weighted, a => stat(a) ? stat(a).mean : null);
        const high = BC.grades.computeTotal(groups, weighted, a => stat(a) ? stat(a).max : null);
        const mine = BC.grades.computeTotal(groups, weighted, a => a.submission && a.submission.score != null && !a.submission.excused ? a.submission.score : null);
        const canvas = info && info.score != null ? +info.score : null;
        const approx = mine != null && canvas != null && Math.abs(mine - canvas) > 2;
        if (low != null && mean != null && high != null) v = { low, mean, high, n, approx, mine, weighted };
      }
    } catch (e) { /* 无权限 / 没作业 */ }
    await BC.cache.set(ck, v);
    return v;
  },

  /* 卡片右边的小框：总评（百分比 + 字母）、GPA（按百分比换算的绩点）、班级均分（+ 你比平均高 / 低多少）、Section（WebReg 的 index 也带上）。
   * 两段式：_sideBox 立刻建框（总评 / GPA / 班级均分先放骨架条，Section 能从 WebReg 课表里直接得到的先画上），
   * 成绩回来后 _fillSideBox 填值并触发 得分/总分、班级范围 两个接口。info === undefined 表示成绩还没到。 */
  _sideBox(card, cid, info, settings) {
    const esc = BC.util.esc;
    const side = document.createElement("div");
    side.className = "bc-side";
    const skel = `<span class="bc-skel-line w60" aria-hidden="true"></span>`;
    const row = (cls, lbl, val, sub, title) => `<div class="bc-side-row ${cls}"${title ? ` title="${esc(title)}"` : ""}><span class="bc-side-lbl">${lbl}</span><span class="bc-side-val">${val}</span><span class="bc-side-sub">${sub || ""}</span></div>`;
    side.innerHTML =
      row("bc-side-r-score", BC.t("总评"), skel, `<span class="bc-side-pts"></span>`, BC.t("当前总评（Canvas 加权值）；下面是已评分作业 得分/总分")) +
      row("bc-side-r-gpa", "GPA", skel, "", BC.t("按当前百分比换算的绩点（通用分数线，仅供参考）")) +
      row("bc-side-r-cls", BC.t("班级均分"), `<span class="bc-side-cls bc-side-empty">…</span>`, `<span class="bc-side-clssub"></span>`, BC.t("用每个作业的班级统计按本课计分规则算出的班级平均总评")) +
      row("bc-side-r-sec", "Section", skel, "", BC.t("课号第四段；index 来自 WebReg 课表"));
    side.setAttribute("aria-busy", "true");
    card.classList.add("bc-has-side");
    card.appendChild(side);

    // WebReg 课表能直接给 section（不依赖成绩接口），先画；成绩回来后再用课名 / 课程代码补一遍
    BC.grades._fillSection(side, cid, undefined, settings);
    if (settings.cards.showClassRange === false) side.querySelector(".bc-side-r-cls").remove();
    if (info !== undefined) BC.grades._fillSideBox(side, cid, info, settings);
    return side;
  },

  _fillSection(side, cid, info, settings) {
    const esc = BC.util.esc;
    const r = side.querySelector(".bc-side-r-sec");
    if (!r) return;
    const sec = BC.sidebarGpa ? BC.sidebarGpa.sectionFor(cid, info, settings) : { sec: "", index: "" };
    // 成绩还没到、又没从课表里认出 section：保留骨架条，等下一次填
    if (!sec.sec && info === undefined) return;
    r.querySelector(".bc-side-val").innerHTML = sec.sec ? `Sec ${esc(BC.sidebarGpa.fmtSection(sec.sec))}` : `<span class="bc-side-empty">—</span>`;
    r.querySelector(".bc-side-sub").innerHTML = sec.index ? `index ${esc(sec.index)}${sec.credits ? ` · ${BC.t("{n} 学分", { n: esc(sec.credits) })}` : ""}` : "";
  },

  _fillSideBox(side, cid, info, settings) {
    const esc = BC.util.esc;
    const score = info && info.score != null ? +info.score : null;
    const gpa = score != null && BC.blocks ? BC.blocks.pctToGpa(score) : null;
    side.querySelector(".bc-side-r-score .bc-side-val").innerHTML =
      score != null ? `${score}%${info.grade ? `<small>${esc(info.grade)}</small>` : ""}` : `<span class="bc-side-empty">—</span>`;
    side.querySelector(".bc-side-r-gpa .bc-side-val").innerHTML =
      gpa != null ? gpa.toFixed(1) : `<span class="bc-side-empty">—</span>`;
    BC.grades._fillSection(side, cid, info || null, settings);
    side.removeAttribute("aria-busy");

    if (settings.cards.showPoints) {
      BC.grades.fetchPoints(cid).then(pts => {
        const el = side.querySelector(".bc-side-pts");
        if (el && pts && pts.possible) el.textContent = `${pts.earned}/${pts.possible}`;
      });
    }
    const cls = side.querySelector(".bc-side-cls"), clsSub = side.querySelector(".bc-side-clssub");
    if (!cls) return;   // 设置里关掉了班级范围，行已在 _sideBox 里删掉
    const clsRow = cls.closest(".bc-side-row");
    BC.grades.fetchClassRange(cid, info).then(r => {
      if (!r) { cls.textContent = "—"; clsSub.textContent = BC.t("无统计"); return; }
      const f = x => Math.round(x);
      const mine = score != null ? score : (r.mine != null ? r.mine : null);
      const diff = mine != null ? mine - r.mean : null;
      cls.classList.remove("bc-side-empty");
      cls.innerHTML = `${f(r.mean)}` + (diff == null ? "" : `<span class="bc-side-diff ${diff >= 0 ? "bc-up" : "bc-down"}">${diff >= 0 ? "+" : ""}${diff.toFixed(1)}</span>`);
      clsSub.textContent = BC.t("范围 {a}–{b}", { a: f(r.low), b: f(r.high) });
      clsRow.title = BC.t("班级平均总评 {mean}%，最差 {low}% ～ 最好 {high}%（按本课计分规则{w}，用 {n} 个已评分作业的班级统计算出）",
          { mean: r.mean.toFixed(1), low: r.low.toFixed(1), high: r.high.toFixed(1), w: r.weighted ? BC.t("、分组权重") : "", n: r.n }) +
        (diff != null ? "\n" + BC.t("你 {m}%，{rel}平均 {d} 分", { m: mine.toFixed(1), rel: BC.t(diff >= 0 ? "高于" : "低于"), d: Math.abs(diff).toFixed(1) }) : "") +
        (r.approx ? "\n" + BC.t("（本课的计分规则没有完全对上 Canvas 的总评，数值仅供估算）") : "");
    });
  },

  async decorateCards(settings) {
    if (!settings.cards.showGrade) return;
    const cards = document.querySelectorAll(".ic-DashboardCard");
    if (!cards.length) return;
    const sideLayout = (settings.cards.layout || "side") === "side";

    // 侧框布局：不等成绩，先把带骨架的框挂上去，成绩回来再填
    const pending = [];
    if (sideLayout) {
      cards.forEach(card => {
        const cid = BC.util.courseIdFromCard(card);
        if (!cid || card.querySelector(".bc-grade-badge, .bc-side")) return;
        pending.push({ cid, side: BC.grades._sideBox(card, cid, undefined, settings) });
      });
      if (!pending.length) return;
    }

    let scores = {};
    try { scores = await BC.grades.fetchScores(); }
    catch (e) { console.warn("[BC] decorateCards", e); }

    if (sideLayout) {
      pending.forEach(({ cid, side }) => {
        if (!side.isConnected) return;   // 卡片被 React 重画掉了，观察器会重新装饰
        BC.grades._fillSideBox(side, cid, scores[cid], settings);
      });
      return;
    }

    cards.forEach(card => {
      const cid = BC.util.courseIdFromCard(card);
      if (!cid || card.querySelector(".bc-grade-badge, .bc-side")) return;
      const info = scores[cid];

      const badge = document.createElement("div");
      badge.className = "bc-grade-badge";
      const pct = info && info.score != null ? `${info.score}%` : "—";
      const letter = info && info.grade ? ` <span class="bc-grade-letter">${BC.util.esc(info.grade)}</span>` : "";
      badge.innerHTML = `<span class="bc-grade-pct">${pct}</span>${letter}` +
                        `<span class="bc-grade-pts" title="${BC.t("已评分作业 得分/总分")}">…</span>`;
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

      // 班级成绩范围（卡片头部右下角）：最低 – 最高，均值；本人相对平均的差距
      if (settings.cards.showClassRange !== false) {
        BC.grades.fetchClassRange(cid, info).then(r => {
          if (!r || card.querySelector(".bc-class-badge")) return;
          const f = x => Math.round(x);
          const mineScore = info && info.score != null ? +info.score : (r.mine != null ? r.mine : null);
          const diff = mineScore != null ? mineScore - r.mean : null;
          const diffTxt = diff == null ? "" : (diff >= 0 ? "+" : "") + diff.toFixed(1);
          const el = document.createElement("div");
          el.className = "bc-class-badge" + (diff == null ? "" : diff >= 0 ? " bc-class-above" : " bc-class-below");
          el.innerHTML = `<span class="bc-class-lbl">${BC.t("班级")}</span>` +
            `<span class="bc-class-range">${f(r.low)}–${f(r.high)}</span>` +
            `<span class="bc-class-mean">${BC.t("均 {n}", { n: f(r.mean) })}</span>` +
            (diffTxt ? `<span class="bc-class-diff">${diffTxt}</span>` : "");
          el.title = BC.t("班级成绩范围（按本课计分规则{w}，用 {n} 个已评分作业的班级统计算出）", { w: r.weighted ? BC.t("、分组权重") : "", n: r.n }) + "\n" +
            BC.t("最差情况 {low}%  ·  平均 {mean}%  ·  最好情况 {high}%", { low: r.low.toFixed(1), mean: r.mean.toFixed(1), high: r.high.toFixed(1) }) +
            (diff != null ? "\n" + BC.t("你 {m}%，{rel}平均 {d} 分", { m: mineScore.toFixed(1), rel: BC.t(diff >= 0 ? "高于" : "低于"), d: Math.abs(diff).toFixed(1) }) : "") +
            (r.approx ? "\n" + BC.t("（本课的计分规则没有完全对上 Canvas 的总评，数值仅供估算）") : "");
          hero.appendChild(el);
        });
      }
    });
  }
};
