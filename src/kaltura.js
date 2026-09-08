/* Kaltura（Rutgers MediaSpace）讲座视频：找页面里的嵌入 -> 解析 partner_id / entry_id / ks -> 拿 MP4 直链和字幕。
 *   - 嵌入形式：cdnapisec.kaltura.com 的 embedIframeJs 播放器 iframe、*.mediaspace.kaltura.com / kaf.kaltura.com 的 KAF 页面、
 *     Canvas LTI 中转（/external_tools/retrieve?url=<kaltura url>），以及指向 mediaspace 的普通链接。
 *   - 直链：playManifest .../format/download/protocol/https/flavorParamIds/0（带 ks），后台带 cookie 请求并跟随跳转，拿到最终 CDN 地址后交给下载 API。
 *   - 字幕：caption_captionasset list + serve，解析 SRT / VTT 成纯文本，可直接喂给总结。
 *   - 跨域请求都走 background.js 的 bc-fetch（只放行 kaltura.com / instructure.com）。
 * 只能拿到你自己有权限观看、且没有 DRM 的视频；有 DRM 或老师关闭下载的会失败，那就只能用字幕。 */
BC.kaltura = {
  DEFAULT_HOST: "https://cdnapisec.kaltura.com",

  // 从任意 Kaltura 相关 URL 里解析标识；解析不到 entry 返回 null
  parse(url) {
    if (!url) return null;
    let u = String(url);
    // Canvas LTI 中转：url= 参数里才是 Kaltura 地址
    const lti = /[?&]url=([^&]+)/.exec(u);
    if (/external_tools|retrieve/.test(u) && lti) { try { u = decodeURIComponent(lti[1]); } catch (e) {} }
    if (!/kaltura/i.test(u)) return null;
    const pick = re => { const m = re.exec(u); return m ? decodeURIComponent(m[1]) : ""; };
    const entryId = pick(/[?&/]entry_id[=/]([01]_[a-z0-9]{8})/i) || pick(/[?&/]entryId[=/]([01]_[a-z0-9]{8})/i) || pick(/\/entry\/([01]_[a-z0-9]{8})/i) || pick(/\/media\/(?:[^/]+\/)?([01]_[a-z0-9]{8})/i);
    if (!entryId) return null;
    const partnerId = pick(/\/p\/(\d+)\//) || pick(/[?&/]partner_id[=/](\d+)/i) || pick(/[?&]partnerId=(\d+)/i) || pick(/\/partnerid\/(\d+)/i);
    const uiconf = pick(/uiconf_id[=/](\d+)/i);
    const ks = pick(/[?&/]ks[=/]([A-Za-z0-9_\-=%]+)/) || pick(/\[ks\]=([A-Za-z0-9_\-=%]+)/);
    // API 一律走 cdnapisec（MediaSpace / KAF 域名不提供 api_v3）；原始 url 留着抓 ks 用
    return { url: u, entryId, partnerId, uiconf, ks, host: BC.kaltura.DEFAULT_HOST };
  },

  // 扫描当前页面：iframe / a / video 里所有 Kaltura 条目（按 entryId 去重）
  findOnPage() {
    const out = new Map();
    const add = (url, title) => { const p = BC.kaltura.parse(url); if (p && !out.has(p.entryId)) out.set(p.entryId, { ...p, title: title || "" }); };
    document.querySelectorAll("iframe[src]").forEach(f => add(f.getAttribute("src"), f.getAttribute("title") || (f.closest("details,section,.user_content") || {}).querySelector?.("summary,h1,h2,h3")?.textContent));
    document.querySelectorAll("a[href*='kaltura'],a[href*='external_tools/retrieve']").forEach(a => add(a.getAttribute("href"), a.textContent.trim()));
    document.querySelectorAll("[data-entryid],[data-entry-id]").forEach(el => { const id = el.dataset.entryid || el.dataset.entryId; if (id) add(`https://cdnapisec.kaltura.com/?entry_id=${id}`, el.getAttribute("title")); });
    // 内嵌在 iframe srcdoc / 页面脚本里的播放器配置
    const html = document.documentElement.innerHTML;
    const re = /(?:entry_id|entryId)["'=:\s/]+([01]_[a-z0-9]{8})/g; let m;
    while ((m = re.exec(html))) if (!out.has(m[1])) { const pid = (html.match(/partner_id["'=:\s/]+(\d+)/) || [])[1] || ""; out.set(m[1], { url: "", entryId: m[1], partnerId: pid, uiconf: "", ks: "", host: BC.kaltura.DEFAULT_HOST, title: "" }); }
    return [...out.values()];
  },

  /* ---------- 三路补充识别 ---------- */
  // 1) 问 Kaltura 域的 iframe 要配置（kaltura-frame.js 会回 postMessage），等 waitMs
  collectFromFrames(waitMs) {
    return new Promise(resolve => {
      const got = new Map();
      const onMsg = ev => {
        const d = ev.data;
        if (!d || d.bcKaltura !== "info" || !d.entryId) return;
        if (!got.has(d.entryId)) got.set(d.entryId, { url: d.url || "", entryId: d.entryId, partnerId: d.partnerId || "", uiconf: "", ks: d.ks || "", host: BC.kaltura.DEFAULT_HOST, title: d.title || "", src: "frame" });
      };
      window.addEventListener("message", onMsg);
      document.querySelectorAll("iframe").forEach(f => { try { f.contentWindow.postMessage({ bcKaltura: "ping" }, "*"); } catch (e) {} });
      setTimeout(() => { window.removeEventListener("message", onMsg); resolve([...got.values()]); }, waitMs || 1500);
    });
  },

  // 2) LTI 中转 iframe（src 是 instructure 的 external_tools 页面，里面是一个自动提交到 kaltura 的表单）：后台抓 HTML 找 kaltura 地址 / entry id
  async scanLtiFrames() {
    const out = [];
    const frames = [...document.querySelectorAll("iframe[src]")].map(f => f.getAttribute("src")).filter(s => /external_tools|lti|retrieve/i.test(s || ""));
    for (const src of frames.slice(0, 12)) {
      try {
        const abs = new URL(src, location.href).href;
        const r = await BC.kaltura._fetch(abs, { as: "text" });
        const html = r.body || "";
        const urls = html.match(/https?:\/\/[^"'\s<>]*kaltura[^"'\s<>]*/gi) || [];
        let found = null;
        for (const u of urls) { const p = BC.kaltura.parse(u.replace(/&amp;/g, "&")); if (p) { found = p; break; } }
        if (!found) {
          const eid = (html.match(/([01]_[a-z0-9]{8})/) || [])[1];
          if (eid) found = { url: abs, entryId: eid, partnerId: (html.match(/(\d{4,9})\.kaf\.kaltura\.com/) || html.match(/partner_?id["'=:\s/]+(\d+)/i) || [])[1] || "", uiconf: "", ks: "", host: BC.kaltura.DEFAULT_HOST };
        }
        if (found) { found.title = found.title || (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || ""; found.src = "lti"; out.push(found); }
      } catch (e) {}
    }
    return out;
  },

  // 3) Canvas 自带媒体嵌入（media_objects_iframe / media_attachments_iframe）：Canvas 接口直接给 MP4 源
  async scanCanvasMedia() {
    const out = [];
    const frames = [...document.querySelectorAll("iframe[src*='media_objects_iframe'],iframe[src*='media_attachments_iframe'],iframe[src*='/media_objects/']")];
    for (const f of frames) {
      const src = f.getAttribute("src") || "";
      const mo = /media_objects(?:_iframe)?\/(m-[A-Za-z0-9]+)/.exec(src);
      const ma = /media_attachments_iframe\/(\d+)/.exec(src);
      try {
        let j = null, id = "";
        if (mo) { id = mo[1]; j = await BC.api.get(`/api/v1/media_objects/${id}`); }
        else if (ma) { id = "att-" + ma[1]; j = await BC.api.get(`/media_attachments/${ma[1]}/info`); }
        if (!j) continue;
        const sources = (j.media_sources || []).filter(s => /mp4/i.test(s.content_type || s.url || "")).sort((a, b) => (+b.bitrate || 0) - (+a.bitrate || 0));
        if (!sources.length) continue;
        out.push({ type: "canvas", entryId: id, name: j.title || j.user_entered_title || f.getAttribute("title") || id, title: f.getAttribute("title") || "", duration: 0, sources, src: "canvas" });
      } catch (e) {}
    }
    return out;
  },

  // 调试：本页所有 iframe 的地址（识别不到时给用户看）
  frameList() { return [...document.querySelectorAll("iframe")].map(f => (f.getAttribute("src") || (f.srcdoc ? "[srcdoc]" : "[无 src]")).slice(0, 200)); },

  /* ---------- 后台代理请求 ---------- */
  async _fetch(url, opts) {
    let r;
    try { r = await chrome.runtime.sendMessage({ type: "bc-fetch", url, ...(opts || {}) }); } catch (e) { throw new Error(e.message || "后台无响应"); }
    if (!r || !r.ok) throw new Error(r && r.error || "请求失败");
    return r;
  },

  async api(host, service, action, params, ks) {
    const q = new URLSearchParams({ format: "1", service, action, ...(ks ? { ks } : {}) });
    Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") q.set(k, v); });
    const r = await BC.kaltura._fetch(`${host}/api_v3/?${q.toString()}`, { as: "json" });
    const j = r.body;
    if (j && j.objectType === "KalturaAPIException") throw new Error(j.message || j.code || "Kaltura API 错误");
    return j;
  },

  // 匿名 widget session（公开条目够用；有访问控制的条目需要嵌入里带的 ks）
  async widgetKs(host, partnerId) {
    if (!partnerId) return "";
    try { const j = await BC.kaltura.api(host, "session", "startWidgetSession", { widgetId: "_" + partnerId }); return (j && j.ks) || ""; } catch (e) { return ""; }
  },

  async _ksFor(v) {
    if (v.ks) return v.ks;
    // 嵌入页面里通常写着 ks：带 cookie 抓一次嵌入 URL 的 HTML
    if (v.url) {
      try {
        const r = await BC.kaltura._fetch(v.url, { as: "text" });
        const m = /["']?ks["']?\s*[:=]\s*["']([A-Za-z0-9_\-=]{20,})["']/.exec(r.body) || /[?&]ks=([A-Za-z0-9_\-=%]{20,})/.exec(r.body);
        if (m) { v.ks = decodeURIComponent(m[1]); return v.ks; }
        if (!v.partnerId) { const p = /partner_?[iI]d["'=:\s/]+(\d+)/.exec(r.body); if (p) v.partnerId = p[1]; }
      } catch (e) {}
    }
    v.ks = await BC.kaltura.widgetKs(v.host, v.partnerId);
    return v.ks;
  },

  async entry(v) {
    const ks = await BC.kaltura._ksFor(v);
    const j = await BC.kaltura.api(v.host, "baseentry", "get", { entryId: v.entryId, ...(v.partnerId ? { partnerId: v.partnerId } : {}) }, ks);
    return { name: j.name || v.entryId, duration: j.duration || j.msDuration / 1000 || 0, thumb: j.thumbnailUrl || "", partnerId: String(j.partnerId || v.partnerId || ""), downloadUrl: j.downloadUrl || "" };
  },

  // 拿可下载的 MP4 直链：几种 URL 依次试，后台跟随跳转并检查 content-type
  async resolveDownload(v) {
    const ks = await BC.kaltura._ksFor(v);
    const pid = v.partnerId || "";
    const base = `${BC.kaltura.DEFAULT_HOST}/p/${pid}/sp/${pid}00/playManifest/entryId/${v.entryId}`;
    const cands = [
      `${base}/format/download/protocol/https/flavorParamIds/0${ks ? "/ks/" + encodeURIComponent(ks) : ""}`,
      `${base}/format/url/protocol/https/flavorParamId/0/video.mp4${ks ? "?ks=" + encodeURIComponent(ks) : ""}`,
      `${base}/format/url/protocol/https/video.mp4${ks ? "?ks=" + encodeURIComponent(ks) : ""}`
    ];
    let lastErr = "";
    for (const url of cands) {
      try {
        const r = await BC.kaltura._fetch(url, { as: "probe" });
        if (r.status >= 200 && r.status < 300 && /video|octet-stream|mp4/i.test(r.contentType || "")) return { url: r.finalUrl || url, type: r.contentType, size: +r.contentLength || 0 };
        lastErr = `HTTP ${r.status} ${r.contentType || ""}`;
      } catch (e) { lastErr = e.message; }
    }
    throw new Error("拿不到直链（" + lastErr + "）。可能是 DRM 或老师关闭了下载。");
  },

  /* ---------- 字幕 ---------- */
  async captions(v) {
    const ks = await BC.kaltura._ksFor(v);
    const j = await BC.kaltura.api(v.host, "caption_captionasset", "list", { "filter:objectType": "KalturaAssetFilter", "filter:entryIdEqual": v.entryId }, ks);
    return ((j && j.objects) || []).map(c => ({ id: c.id, lang: c.language || c.languageCode || "", label: c.label || "", format: c.format }));
  },
  async captionText(v, cap) {
    const ks = await BC.kaltura._ksFor(v);
    const r = await BC.kaltura._fetch(`${v.host}/api_v3/?service=caption_captionasset&action=serve&captionAssetId=${encodeURIComponent(cap.id)}${ks ? "&ks=" + encodeURIComponent(ks) : ""}`, { as: "text" });
    return BC.kaltura.plainText(r.body);
  },
  // SRT / VTT -> 纯文本（去序号、时间轴、标签；相邻重复行合并）
  plainText(raw) {
    const lines = String(raw || "").replace(/\r/g, "").split("\n");
    const out = [];
    for (let l of lines) {
      l = l.trim();
      if (!l || /^\d+$/.test(l) || /-->/.test(l) || /^WEBVTT/.test(l) || /^(NOTE|STYLE|Kind:|Language:)/.test(l)) continue;
      l = l.replace(/<[^>]+>/g, "").replace(/\{\\[^}]*\}/g, "");
      if (l && out[out.length - 1] !== l) out.push(l);
    }
    return out.join(" ").replace(/\s+/g, " ").trim();
  }
};
