/* Canvas REST API 封装。content script 内同源 fetch 会自动带 cookie。 */
BC.api = {
  base: location.origin,

  async raw(path, opts = {}) {
    const url = path.startsWith("http") ? path : BC.api.base + path;
    const r = await fetch(url, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json+canvas-string-ids, application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      ...opts
    });
    if (!r.ok) throw new Error(`Canvas API ${r.status} @ ${path}`);
    return r;
  },

  async get(path) {
    return (await BC.api.raw(path)).json();
  },

  // 跟随 Link header 翻页，返回拼接后的数组
  async getAll(path, { max = 500 } = {}) {
    let url = path.startsWith("http") ? path : BC.api.base + path;
    const out = [];
    while (url && out.length < max) {
      const r = await BC.api.raw(url);
      const data = await r.json();
      if (Array.isArray(data)) out.push(...data);
      else { out.push(data); break; }
      url = BC.api.nextLink(r.headers.get("Link"));
    }
    return out;
  },

  nextLink(link) {
    if (!link) return null;
    const part = link.split(",").find(s => s.includes('rel="next"'));
    if (!part) return null;
    const m = part.match(/<([^>]+)>/);
    return m ? m[1] : null;
  },

  /* ----- 具体业务接口 ----- */

  // 在读课程（含成绩）
  async activeCourses() {
    return BC.api.getAll(
      "/api/v1/users/self/courses?enrollment_state=active&state[]=available" +
      "&include[]=total_scores&include[]=current_grading_period_scores&include[]=term&per_page=100"
    );
  },

  // 全部课程（在读 + 已结课），含学期(term)与成绩，按 id 去重
  async allCourses() {
    const q = "include[]=term&include[]=total_scores&per_page=100";
    const [a, b] = await Promise.all([
      BC.api.getAll("/api/v1/users/self/courses?enrollment_state=active&" + q).catch(() => []),
      BC.api.getAll("/api/v1/users/self/courses?enrollment_state=completed&" + q).catch(() => [])
    ]);
    const map = {};
    [...a, ...b].forEach(c => { if (c && c.id) map[c.id] = c; });
    return Object.values(map);
  },

  // 单门课的作业分组（含每个作业的得分）
  async assignmentGroups(courseId) {
    return BC.api.getAll(
      `/api/v1/courses/${courseId}/assignment_groups` +
      `?include[]=assignments&include[]=submission&per_page=100`
    );
  },

  // 公告（一次请求覆盖多门课）
  async announcements(courseIds, startDateISO) {
    if (!courseIds.length) return [];
    const ctx = courseIds.map(id => `context_codes[]=course_${id}`).join("&");
    return BC.api.getAll(
      `/api/v1/announcements?${ctx}&start_date=${encodeURIComponent(startDateISO)}` +
      `&active_only=true&per_page=50`
    );
  },

  // 收件箱会话
  async conversations() {
    return BC.api.getAll("/api/v1/conversations?per_page=50");
  },

  // 单个会话详情（含全部消息）
  async conversation(id) {
    return BC.api.get(`/api/v1/conversations/${id}`);
  },

  // Planner 待办（用于“本周截止”）
  async plannerItems(startISO, endISO) {
    return BC.api.getAll(
      `/api/v1/planner/items?start_date=${encodeURIComponent(startISO)}` +
      `&end_date=${encodeURIComponent(endISO)}&per_page=50`
    );
  },

  // 日历事件（上课时间 / 课程事件），用于“今日课程表”；context_codes 一次最多带 10 门，分批
  async calendarEvents(courseIds, startISO, endISO) {
    const out = [];
    for (let i = 0; i < courseIds.length; i += 10) {
      const ctx = courseIds.slice(i, i + 10).map(id => `&context_codes[]=course_${id}`).join("");
      const list = await BC.api.getAll(
        `/api/v1/calendar_events?type=event&start_date=${encodeURIComponent(startISO)}` +
        `&end_date=${encodeURIComponent(endISO)}&per_page=50${ctx}`
      ).catch(() => []);
      out.push(...list);
    }
    return out;
  },

  // 课程全部文件（Files 区）；Files 标签被老师隐藏时会 401/403，调用方再退回模块里的文件
  async courseFiles(courseId) {
    return BC.api.getAll(`/api/v1/courses/${courseId}/files?per_page=100&sort=updated_at&order=desc`, { max: 2000 });
  },
  async courseFolders(courseId) {
    return BC.api.getAll(`/api/v1/courses/${courseId}/folders?per_page=100`, { max: 500 }).catch(() => []);
  },
  // 模块里挂的文件（type=File 的 item），补 Files 区拿不到的情况
  async moduleFiles(courseId) {
    const mods = await BC.api.getAll(`/api/v1/courses/${courseId}/modules?include[]=items&per_page=50`, { max: 200 }).catch(() => []);
    const out = [];
    for (const m of mods) {
      for (const it of (m.items || [])) {
        if (it.type !== "File" || !it.content_id) continue;
        try { const f = await BC.api.get(`/api/v1/courses/${courseId}/files/${it.content_id}`); f._module = m.name; out.push(f); } catch (e) {}
      }
    }
    return out;
  },

  // 课程 syllabus 正文
  async syllabus(courseId) {
    const c = await BC.api.get(`/api/v1/courses/${courseId}?include[]=syllabus_body`);
    return c.syllabus_body || "";
  }
};
