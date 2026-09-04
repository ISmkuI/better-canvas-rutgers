/* 消息：合并 课程公告 + 收件箱私信，按课程聚合，
 * 在卡片右上角(三点菜单左侧)放铃铛，未读数角标，点击弹出消息列表。
 * 区分已读/未读(透明度)，重要消息(测验/换教室/请假/截止)按类别上色。 */
BC.messages = {
  _byCourse: null,   // { [courseId]: [msg...] }
  _settings: null,

  // 文本分类 -> 命中的 importantRule（或 null）
  classify(text, rules) {
    const low = (text || "").toLowerCase();
    for (const r of rules) {
      if (r.words.some(w => low.includes(w.toLowerCase()))) return r;
    }
    return null;
  },

  // 拉取原始数据（带 3 分钟缓存，避免观察器重复触发时狂刷 API）
  async _fetchRaw(settings) {
    const cached = await BC.cache.get("msgs_raw", 3 * 60 * 1000);
    if (cached) return cached;
    const lookback = settings.messages.lookbackDays || 21;
    const startISO = new Date(Date.now() - lookback * 86400000).toISOString();
    let anns = [], convos = [];
    if (settings.messages.sources.announcements) {
      try {
        const scores = await BC.grades.fetchScores();
        const ids = Object.keys(scores);
        const courseIds = ids.length ? ids : BC.messages._idsFromCards();
        anns = await BC.api.announcements(courseIds, startISO);
      } catch (e) { console.warn("[BC] announcements", e); }
    }
    if (settings.messages.sources.inbox) {
      try { convos = await BC.api.conversations(); }
      catch (e) { console.warn("[BC] conversations", e); }
    }
    const raw = { anns, convos };
    await BC.cache.set("msgs_raw", raw);
    return raw;
  },

  async fetchAll(settings) {
    const seen = new Set(settings.seenMessages || []);
    const byCourse = {};
    const push = (cid, m) => { (byCourse[cid] = byCourse[cid] || []).push(m); };
    const { anns, convos } = await BC.messages._fetchRaw(settings);

    if (settings.messages.sources.announcements) {
      for (const a of anns) {
        const cid = BC.util.idFromContextCode(a.context_code);
        if (!cid) continue;
        const id = "ann_" + a.id;
        push(cid, {
          id,
          kind: "announcement",
          title: a.title || "(无标题公告)",
          body: BC.messages._strip(a.message),
          date: a.posted_at || a.created_at,
          url: a.html_url,
          unread: (a.read_state ? a.read_state === "unread" : true) && !seen.has(id),
          rule: BC.messages.classify(`${a.title} ${a.message}`, settings.importantRules)
        });
      }
    }

    if (settings.messages.sources.inbox) {
      for (const c of convos) {
        const cid = BC.util.idFromContextCode(c.context_code);
        if (!cid) continue; // 无课程归属的私信不挂到卡片
        const id = "conv_" + c.id;
        const text = `${c.subject || ""} ${c.last_message || ""}`;
        push(cid, {
          id,
          kind: "inbox",
          title: c.subject || "(无主题私信)",
          body: c.last_message || "",
          date: c.last_message_at,
          url: `/conversations/${c.id}`,
          unread: c.workflow_state === "unread" && !seen.has(id),
          rule: BC.messages.classify(text, settings.importantRules)
        });
      }
    }

    for (const cid in byCourse) {
      byCourse[cid].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
    BC.messages._byCourse = byCourse;
    return byCourse;
  },

  _idsFromCards() {
    return [...document.querySelectorAll(".ic-DashboardCard")]
      .map(c => BC.util.courseIdFromCard(c)).filter(Boolean);
  },

  _strip(html) {
    const d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").trim().slice(0, 400);
  },

  async decorateCards(settings) {
    if (!settings.messages.enabled) return;
    const byCourse = await BC.messages.fetchAll(settings);

    document.querySelectorAll(".ic-DashboardCard").forEach(card => {
      const cid = BC.util.courseIdFromCard(card);
      if (!cid || card.querySelector(".bc-bell")) return;
      const msgs = byCourse[cid] || [];
      const unread = msgs.filter(m => m.unread).length;

      const bell = document.createElement("button");
      bell.className = "bc-bell";
      bell.title = "课程消息";
      bell.innerHTML = `🔔${unread ? `<span class="bc-bell-badge">${unread > 99 ? "99+" : unread}</span>` : ""}`;
      bell.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();
        BC.messages._openPopup(bell, cid, msgs, settings);
      });

      // 尝试放进卡片操作区/头部，定位在三点菜单左侧
      const host = card.querySelector(".ic-DashboardCard__header") || card;
      host.appendChild(bell);
    });
  },

  /* ---- 原生公告/讨论 列表页：强化 已读/未读 视觉 + 重要消息上色 ---- */
  enhanceLists(settings) {
    if (!settings.messages.enabled) return;
    const rows = document.querySelectorAll(
      '.ic-announcement-row, [data-testid="discussion-row"], li[class*="announcement-row"]'
    );
    rows.forEach(row => {
      if (row.dataset.bcRow) return;
      row.dataset.bcRow = "1";
      const unread = BC.messages._isUnreadRow(row);
      row.classList.add(unread ? "bc-row-unread" : "bc-row-read");
      const rule = BC.messages.classify(row.textContent || "", settings.importantRules);
      if (rule) {
        row.classList.add("bc-row-important");
        row.style.setProperty("--bc-rule", rule.color);
        // 在标题旁加一个彩色标签
        const titleLink = row.querySelector('a[href*="/discussion_topics/"], a[href*="/announcements/"], a');
        if (titleLink && !row.querySelector(".bc-row-tag")) {
          const tag = document.createElement("span");
          tag.className = "bc-row-tag";
          tag.textContent = rule.label;
          tag.style.background = rule.color;
          titleLink.insertAdjacentElement("afterend", tag);
        }
      }
    });
  },

  // 判断一行是否未读：Canvas 在行首“指示器列”用一个彩色圆点表示未读，已读时该列为空。
  _isUnreadRow(row) {
    // 1) 显式信号（屏幕阅读器文本 / 属性里带 unread）
    const sr = (row.querySelector(".screenreader-only, [class*='screenReader' i]") || {}).textContent || "";
    if (/\bunread\b/i.test(sr)) return true;
    if (row.querySelector('[class*="unread" i], [data-testid*="unread" i], [aria-label*="unread" i], [title*="unread" i]'))
      return true;
    // 2) 行首指示器列里有彩色元素 = 未读
    const col = row.firstElementChild;
    if (col) {
      for (const el of col.querySelectorAll("*")) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && !/,\s*0\)\s*$/.test(bg))
          return true;
      }
    }
    return false;
  },

  _closePopup() {
    document.querySelectorAll(".bc-msg-popup").forEach(p => p.remove());
    document.removeEventListener("click", BC.messages._outside, true);
  },

  _outside(e) {
    if (!e.target.closest(".bc-msg-popup") && !e.target.closest(".bc-bell")) {
      BC.messages._closePopup();
    }
  },

  async _openPopup(anchor, cid, msgs, settings) {
    const open = document.querySelector(".bc-msg-popup");
    BC.messages._closePopup();
    if (open) return; // 再次点击=关闭

    const pop = document.createElement("div");
    pop.className = "bc-msg-popup";
    const rows = msgs.length
      ? msgs.map(m => BC.messages._row(m)).join("")
      : `<div class="bc-msg-empty">最近没有消息</div>`;
    pop.innerHTML =
      `<div class="bc-msg-head">课程消息 <span class="bc-msg-count">${msgs.length}</span>
        <button class="bc-msg-allread" title="全部标为已读">全标已读</button></div>
       <div class="bc-msg-list">${rows}</div>`;
    document.body.appendChild(pop);

    // 定位到铃铛下方
    const r = anchor.getBoundingClientRect();
    pop.style.top = `${window.scrollY + r.bottom + 6}px`;
    pop.style.left = `${Math.max(8, window.scrollX + r.right - pop.offsetWidth)}px`;

    // 点击某条 -> 标记本地已读 + 打开
    pop.querySelectorAll("[data-mid]").forEach(el => {
      el.addEventListener("click", async () => {
        const mid = el.getAttribute("data-mid");
        const url = el.getAttribute("data-url");
        await BC.messages._markSeen([mid]);
        if (url) window.open(url, "_blank");
      });
    });
    pop.querySelector(".bc-msg-allread").addEventListener("click", async () => {
      await BC.messages._markSeen(msgs.map(m => m.id));
      BC.messages._closePopup();
      BC.bus.refreshMessages();
    });

    setTimeout(() => document.addEventListener("click", BC.messages._outside, true), 0);
  },

  _row(m) {
    const stripe = m.rule ? `border-left:4px solid ${m.rule.color};` : "border-left:4px solid transparent;";
    const tag = m.rule ? `<span class="bc-msg-tag" style="background:${m.rule.color}">${m.rule.label}</span>` : "";
    const kindTag = m.kind === "inbox" ? `<span class="bc-msg-kind">私信</span>` : `<span class="bc-msg-kind">公告</span>`;
    return `<div class="bc-msg-item ${m.unread ? "bc-unread" : "bc-read"}" data-mid="${m.id}" data-url="${BC.util.esc(m.url || "")}" style="${stripe}">
      <div class="bc-msg-title">${m.unread ? '<span class="bc-dot"></span>' : ""}${BC.util.esc(m.title)}</div>
      <div class="bc-msg-meta">${kindTag}${tag}<span class="bc-msg-date">${m.date ? BC.util.fmtDate(m.date) : ""}</span></div>
      <div class="bc-msg-body">${BC.util.esc(m.body).slice(0, 160)}</div>
    </div>`;
  },

  async _markSeen(ids) {
    await BC.storage.patch(s => {
      const set = new Set(s.seenMessages || []);
      ids.forEach(i => set.add(i));
      s.seenMessages = [...set].slice(-1000);
    });
  }
};
