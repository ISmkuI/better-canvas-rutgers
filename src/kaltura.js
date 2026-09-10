/* Kaltura（Rutgers MediaSpace）讲座视频：找页面里的嵌入 -> 解析 partner_id / entry_id / ks -> 拿 MP4 直链和字幕。
 *   - 嵌入形式：cdnapisec.kaltura.com 的 embedIframeJs 播放器 iframe、*.mediaspace.kaltura.com / kaf.kaltura.com 的 KAF 页面、
 *     Canvas LTI 中转（/external_tools/retrieve?url=<kaltura url>），以及指向 mediaspace 的普通链接。
 *   - 直链：playManifest .../format/download/protocol/https/flavorParamIds/0（带 ks），后台带 cookie 请求并跟随跳转，拿到最终 CDN 地址后交给下载 API。
 *   - 字幕：caption_captionasset list + serve，解析 SRT / VTT 成纯文本，可直接喂给总结。
 *   - 跨域请求都走 background.js 的 bc-fetch（只放行 kaltura.com / instructure.com）。
 * 只能拿到你自己有权限观看、且没有 DRM 的视频；有 DRM 或老师关闭下载的会失败，那就只能用字幕。 */
BC.i18n.add({
  "[无 src]": "[no src]",
  "后台无响应": "No response from the background worker",
  "请求失败": "Request failed",
  "Kaltura API 错误": "Kaltura API error",
  "没拿到 partner_id": "Could not get partner_id",
  "拿不到 MP4 直链（{tried}{flavor}）": "Could not get a direct MP4 link ({tried}{flavor})",
  "；flavor 列表：{err}": "; flavor list: {err}",
  "没有可用的播放列表地址（播放器还没开始播放？先点一下播放再试）": "No playlist URL available (has the player started? Press play once, then try again)",
  "HLS 播放列表拿不到（{tried}）。先在页面里点一下播放，再扫描一次。": "Could not fetch the HLS playlist ({tried}). Press play on the page first, then scan again.",
  "主列表里没有可用的清晰度": "No usable quality level in the master playlist",
  "视频用了 {method} 加密（DRM），无法下载": "The video uses {method} encryption (DRM) and cannot be downloaded",
  "播放列表里没有分段": "The playlist has no segments",
  "分段 {msg}": "Segment {msg}"
});
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

  // 页面上这个元素（通常是播放器 iframe）对应的小标题：所在折叠区的 summary > 前面最近的标题 > iframe 的 title 属性
  headingFor(el) {
    if (!el) return "";
    const clean = s => String(s || "").replace(/\s+/g, " ").replace(/^[▶▸►▼▾\s]+/, "").trim().slice(0, 120);
    const det = el.closest("details");
    if (det) { const s = det.querySelector(":scope > summary"); if (s && clean(s.textContent)) return clean(s.textContent); }
    // 文档序里往前找最近的标题（跳过自己内部的）
    const SEL = "h1,h2,h3,h4,h5,h6,summary,.ig-title,[role='heading']";
    const all = [...document.querySelectorAll(SEL + ",iframe")];
    const idx = all.indexOf(el);
    for (let i = idx - 1; i >= 0; i--) {
      const h = all[i];
      if (h.tagName === "IFRAME") continue;
      if (h.classList.contains("screenreader-only")) continue;
      const t = clean(h.textContent);
      if (t) return t;
    }
    return clean(el.getAttribute && el.getAttribute("title"));
  },

  // 扫描当前页面：iframe / a / video 里所有 Kaltura 条目（按 entryId 去重）
  findOnPage() {
    const out = new Map();
    const add = (url, title) => { const p = BC.kaltura.parse(url); if (p && !out.has(p.entryId)) out.set(p.entryId, { ...p, title: title || "" }); };
    document.querySelectorAll("iframe[src]").forEach(f => add(f.getAttribute("src"), BC.kaltura.headingFor(f)));
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
  _hellos: [],
  collectFromFrames(waitMs) {
    return new Promise(resolve => {
      const got = new Map();
      BC.kaltura._hellos = [];
      const onMsg = ev => {
        const d = ev.data;
        if (d && d.bcKaltura === "hello") { BC.kaltura._hellos.push(`${d.host}${d.path}${d.hasPlayer ? " [player]" : ""}`); return; }
        if (!d || d.bcKaltura !== "info" || !d.entryId) return;
        // 回消息的是哪个 iframe：contentWindow 对得上就能拿到它在页面里的小标题
        let heading = "";
        try { const fr = [...document.querySelectorAll("iframe")].find(f => f.contentWindow === ev.source); if (fr) heading = BC.kaltura.headingFor(fr); } catch (e) {}
        const cur = got.get(d.entryId);
        if (!cur) got.set(d.entryId, { url: d.url || "", entryId: d.entryId, partnerId: d.partnerId || "", uiconf: "", ks: d.ks || "", host: BC.kaltura.DEFAULT_HOST, title: heading || "", kalturaName: d.title || "", src: "frame", sources: d.sources || null, manifests: d.manifests || [] });
        else { cur.ks = cur.ks || d.ks; cur.partnerId = cur.partnerId || d.partnerId; cur.title = cur.title || heading; if (d.sources && (d.sources.hls.length || d.sources.progressive.length)) cur.sources = d.sources; if (d.manifests && d.manifests.length) cur.manifests = d.manifests; }
      };
      window.addEventListener("message", onMsg);
      document.querySelectorAll("iframe").forEach(f => { try { f.contentWindow.postMessage({ bcKaltura: "ping" }, "*"); } catch (e) {} });
      setTimeout(() => { window.removeEventListener("message", onMsg); resolve([...got.values()]); }, waitMs || 1500);
    });
  },

  // 2) LTI 中转 iframe（src 是 instructure 的 external_tools 页面，里面是一个自动提交到 kaltura 的表单）：后台抓 HTML 找 kaltura 地址 / entry id
  async scanLtiFrames() {
    const out = [];
    const frames = [...document.querySelectorAll("iframe[src]")].filter(f => /external_tools|lti|retrieve/i.test(f.getAttribute("src") || ""));
    for (const fr of frames.slice(0, 12)) {
      const src = fr.getAttribute("src");
      try {
        const abs = new URL(src, location.href).href;
        const r = await BC.kaltura._fetch(abs, { as: "text" });
        const html = r.body || "";
        const urls = html.match(/https?:\/\/[^"'\s<>]*kaltura[^"'\s<>]*/gi) || [];
        let found = null;
        for (const u of urls) { const p = BC.kaltura.parse(u.replace(/&amp;/g, "&")); if (p) { found = p; break; } }
        if (!found) {
          const eid = (html.match(/([01]_[a-z0-9]{8})/) || [])[1];
          if (eid) found = { url: abs, entryId: eid, partnerId: "", uiconf: "", ks: "", host: BC.kaltura.DEFAULT_HOST };
        }
        if (found) {
          // LTI 表单实际提交到哪个域（播放器真正所在的域，可能不是 kaltura.com）——诊断用
          const action = (html.match(/<form[^>]+action=["']([^"']+)["']/i) || [])[1] || "";
          const hosts = [...new Set((html.match(/https?:\/\/[a-z0-9.-]+/gi) || []).map(u => u.replace(/^https?:\/\//, "")))].filter(h => !/instructure\.com|google|gstatic|cloudfront|amazonaws|w3\.org/i.test(h)).slice(0, 8);
          found.ltiAction = action; found.ltiHosts = hosts;
          // partner_id：KAF 的 LTI consumer key 通常就是 partner id；域名前缀也可能是
          found.partnerId = found.partnerId || (html.match(/name=["']oauth_consumer_key["']\s+value=["'](\d{4,9})["']/i) || html.match(/value=["'](\d{4,9})["']\s+name=["']oauth_consumer_key["']/i) || html.match(/(\d{4,9})\.kaf\.kaltura\.com/) || html.match(/partner_?id["'=:\s/]+(\d{4,9})/i) || [])[1] || "";
          // LTI 页里的 ks 是受限票据（只能用于跳转），拿来调 API 会报 EXCEEDED_RESTRICTED_URI，不要用
          found.ks = "";
        }
        if (found) { found.title = BC.kaltura.headingFor(fr) || found.title || (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || ""; found.src = "lti"; out.push(found); }
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
        out.push({ type: "canvas", entryId: id, name: j.title || j.user_entered_title || f.getAttribute("title") || id, title: BC.kaltura.headingFor(f) || f.getAttribute("title") || "", duration: 0, sources, src: "canvas" });
      } catch (e) {}
    }
    return out;
  },

  // 4) 后台 webRequest 记录的、本标签页里播放器真正请求过的 Kaltura 地址：按 entry 归组，附带清单地址和票据
  async scanSeen() {
    let r;
    try { r = await chrome.runtime.sendMessage({ type: "bc-kaltura-seen" }); } catch (e) { return []; }
    const urls = (r && r.urls) || [];
    const map = new Map();
    urls.forEach(u => {
      const p = BC.kaltura.parse(u);
      if (!p) return;
      const cur = map.get(p.entryId) || { url: u, entryId: p.entryId, partnerId: "", uiconf: "", ks: "", host: BC.kaltura.DEFAULT_HOST, title: "", src: "net", manifests: [], sources: null };
      cur.partnerId = cur.partnerId || p.partnerId;
      cur.ks = cur.ks || p.ks;
      if (/playManifest|\.m3u8|\.mpd|\/flavorId\//i.test(u)) cur.manifests.push(u);
      map.set(p.entryId, cur);
    });
    BC.kaltura._seenCount = urls.length;
    return [...map.values()];
  },

  // 诊断摘要（不含票据本身）
  diag(v) {
    return JSON.stringify({
      entryId: v.entryId, partnerId: v.partnerId || "", src: v.src || "", ksLen: (v.ks || "").length, name: v.name || "", err: v.err || "",
      frameReplies: BC.kaltura._hellos,   // 空 = kaltura.com 的 iframe 里脚本没跑起来（扩展没重载？播放器不在 kaltura.com 域？）
      ltiAction: (v.ltiAction || "").replace(/([?&]ks=)[^&]+/g, "$1…").slice(0, 200),   // LTI 表单提交到的地址 = 播放器真正的域
      ltiHosts: v.ltiHosts || [],
      iframes: BC.kaltura.frameList().map(u => u.replace(/([?&]ks=)[^&]+/g, "$1…").slice(0, 160)),
      netSeen: BC.kaltura._seenCount || 0, // 后台记录到的本页 Kaltura 请求数；0 = 还没播放过 / webRequest 权限没生效
      sources: v.sources ? { hls: v.sources.hls.length, dash: v.sources.dash.length, progressive: v.sources.progressive.length } : null,
      manifests: (v.manifests || []).map(u => u.replace(/([?&/]ks[=/])[^&/]+/g, "$1…").slice(0, 160)),
      flavors: v.flavors || null, flavorErr: v.flavorErr || "", hlsTried: v.hlsTried || null, hlsRes: v.hlsRes || ""
    }, null, 1);
  },

  // 调试：本页所有 iframe 的地址（识别不到时给用户看）
  frameList() { return [...document.querySelectorAll("iframe")].map(f => (f.getAttribute("src") || (f.srcdoc ? "[srcdoc]" : BC.t("[无 src]"))).slice(0, 200)); },

  /* ---------- 后台代理请求 ---------- */
  async _fetch(url, opts) {
    let r;
    try { r = await chrome.runtime.sendMessage({ type: "bc-fetch", url, ...(opts || {}) }); } catch (e) { throw new Error(e.message || BC.t("后台无响应")); }
    if (!r || !r.ok) throw new Error(r && r.error || BC.t("请求失败"));
    return r;
  },

  async api(host, service, action, params, ks) {
    const q = new URLSearchParams({ format: "1", service, action, ...(ks ? { ks } : {}) });
    Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") q.set(k, v); });
    const r = await BC.kaltura._fetch(`${host}/api_v3/?${q.toString()}`, { as: "json" });
    const j = r.body;
    if (j && j.objectType === "KalturaAPIException") { const e = new Error(j.message || j.code || BC.t("Kaltura API 错误")); e.code = j.code || ""; throw e; }
    return j;
  },

  // 带票据调用；票据被拒（受限 / 过期 / 无效）时换匿名 widget 票据重试一次
  async apiWithFallback(v, service, action, params) {
    const ks = await BC.kaltura._ksFor(v);
    try { return await BC.kaltura.api(v.host, service, action, params, ks); }
    catch (e) {
      if (!/INVALID_KS|EXCEEDED_RESTRICTED_URI|INVALID_STR|KS_EXPIRED|MISSING_KS/i.test((e.code || "") + " " + e.message)) throw e;
      const wks = await BC.kaltura.widgetKs(v.host, v.partnerId);
      if (!wks || wks === ks) throw e;
      v.ks = wks;
      return BC.kaltura.api(v.host, service, action, params, wks);
    }
  },

  // 匿名 widget session（公开条目够用；有访问控制的条目需要嵌入里带的 ks）
  async widgetKs(host, partnerId) {
    if (!partnerId) return "";
    try { const j = await BC.kaltura.api(host, "session", "startWidgetSession", { widgetId: "_" + partnerId }); return (j && j.ks) || ""; } catch (e) { return ""; }
  },

  // 同一页里任一视频抓到的票据 / partner_id：KAF 的票据是用户级会话，同门课其他视频也能用
  _shared: { ks: "", partnerId: "" },
  _remember(v) {
    if (v.ks && !/^\s*$/.test(v.ks) && v.src !== "lti") BC.kaltura._shared.ks = BC.kaltura._shared.ks || v.ks;
    if (v.partnerId) BC.kaltura._shared.partnerId = BC.kaltura._shared.partnerId || v.partnerId;
  },

  async _ksFor(v) {
    if (v.ks) return v.ks;
    if (BC.kaltura._shared.ks) { v.ks = BC.kaltura._shared.ks; return v.ks; }
    // 嵌入页面里通常写着 ks：带 cookie 抓一次嵌入 URL 的 HTML（LTI 中转页除外——那里的 ks 是受限票据，调 API 必被拒）
    if (v.url && v.src !== "lti" && !/external_tools|retrieve/i.test(v.url)) {
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
    const j = await BC.kaltura.apiWithFallback(v, "baseentry", "get", { entryId: v.entryId, ...(v.partnerId ? { partnerId: v.partnerId } : {}) });
    return { name: j.name || v.entryId, duration: j.duration || j.msDuration / 1000 || 0, thumb: j.thumbnailUrl || "", partnerId: String(j.partnerId || v.partnerId || ""), downloadUrl: j.downloadUrl || "" };
  },

  async _ensurePartner(v) {
    if (v.partnerId) return v.partnerId;
    if (BC.kaltura._shared.partnerId) { v.partnerId = BC.kaltura._shared.partnerId; return v.partnerId; }
    try { const e = await BC.kaltura.entry(v); if (e.partnerId) v.partnerId = e.partnerId; } catch (e) {}
    return v.partnerId || "";
  },

  // 拿可下载的 MP4 直链：entry.downloadUrl -> flavorAsset 列表(最高码率 mp4) -> playManifest 几种写法；后台跟随跳转并检查 content-type
  async resolveDownload(v) {
    const ks = await BC.kaltura._ksFor(v);
    const pid = await BC.kaltura._ensurePartner(v);
    const cands = [];
    // 0) 播放器自己拿到的 progressive（MP4）源，最高清晰度优先
    ((v.sources && v.sources.progressive) || []).slice().sort((a, b) => (b.bw || b.h || 0) - (a.bw || a.h || 0)).forEach(s => cands.push(s.url));
    // 0b) 播放器实际请求过的 flavor 直链（只要 format/url|download 的整段 MP4；HLS 的分片清单 / .ts 分段路径里也有 flavorId，必须排除，
    //     否则一个 10 秒的 .ts 分段会被当成“直链”存成假 .mp4）
    (v.manifests || []).filter(u => /format\/(url|download)/i.test(u) && !/\.m3u8|\.ts(\?|$)|\/hls\/|serveFlavor|applehttp|mpegdash/i.test(u)).forEach(u => cands.push(u));
    if (!pid && !cands.length) throw new Error(BC.t("没拿到 partner_id"));
    try { const e = await BC.kaltura.entry(v); if (e.downloadUrl) cands.push(e.downloadUrl + (ks && !/ks=/.test(e.downloadUrl) ? (e.downloadUrl.includes("?") ? "&" : "?") + "ks=" + encodeURIComponent(ks) : "")); } catch (e) {}
    try {
      const j = await BC.kaltura.apiWithFallback(v, "flavorasset", "getByEntryId", { entryId: v.entryId });
      const flavors = (Array.isArray(j) ? j : (j && j.objects) || []).filter(f => f && f.status === 2 && /mp4/i.test(f.fileExt || "")).sort((a, b) => (+b.bitrate || 0) - (+a.bitrate || 0));
      v.flavors = flavors.map(f => ({ id: f.id, bitrate: f.bitrate, w: f.width, h: f.height }));
      for (const f of flavors.slice(0, 2)) {
        try { const u = await BC.kaltura.api(v.host, "flavorasset", "getUrl", { id: f.id }, ks); if (typeof u === "string" && /^https?:/.test(u)) cands.push(u); } catch (e) {}
        cands.push(`${BC.kaltura.DEFAULT_HOST}/p/${pid}/sp/${pid}00/playManifest/entryId/${v.entryId}/flavorId/${f.id}/format/url/protocol/https/a.mp4${ks ? "?ks=" + encodeURIComponent(ks) : ""}`);
      }
    } catch (e) { v.flavorErr = e.message; }
    const base = `${BC.kaltura.DEFAULT_HOST}/p/${pid}/sp/${pid}00/playManifest/entryId/${v.entryId}`;
    cands.push(
      `${base}/format/download/protocol/https/flavorParamIds/0${ks ? "/ks/" + encodeURIComponent(ks) : ""}`,
      `${base}/format/url/protocol/https/flavorParamId/0/video.mp4${ks ? "?ks=" + encodeURIComponent(ks) : ""}`,
      `${base}/format/url/protocol/https/video.mp4${ks ? "?ks=" + encodeURIComponent(ks) : ""}`
    );
    const tried = [];
    for (const url of [...new Set(cands)]) {
      try {
        const r = await BC.kaltura._fetch(url, { as: "probe" });
        const ct = r.contentType || "", fin = r.finalUrl || url;
        // 必须是整段 MP4：类型是 mp4 / 二进制，且落地地址不是 HLS 分段
        if (r.status >= 200 && r.status < 300 && /mp4|octet-stream|video\/(?!mp2t)/i.test(ct) && !/\.ts(\?|$)|\.m3u8/i.test(fin)) return { url: fin, type: ct, size: +r.contentLength || 0 };
        tried.push(`HTTP ${r.status} ${ct.split(";")[0]}`);
      } catch (e) { tried.push(e.message); }
    }
    const err = new Error(BC.t("拿不到 MP4 直链（{tried}{flavor}）", { tried: [...new Set(tried)].join(" / "), flavor: v.flavorErr ? BC.t("；flavor 列表：{err}", { err: v.flavorErr }) : "" }));
    err.noDirect = true;
    throw err;
  },

  /* ---------- HLS 分段下载（直链被关时的备选；播放器能播就能拿到分段） ---------- */
  _resolveUrl(u, base) { try { return new URL(u, base).href; } catch (e) { return u; } },

  async hlsPlaylist(v) {
    const ks = await BC.kaltura._ksFor(v);
    const pid = await BC.kaltura._ensurePartner(v);
    // 候选主列表：播放器配置里的 hls 源 > 播放器实际请求过的 m3u8 / applehttp 清单 > 自己拼的
    const cands = [];
    ((v.sources && v.sources.hls) || []).forEach(s => cands.push(s.url));
    (v.manifests || []).filter(u => /applehttp|\.m3u8/i.test(u)).forEach(u => cands.push(u.split("#")[0]));
    if (pid) cands.push(`${BC.kaltura.DEFAULT_HOST}/p/${pid}/sp/${pid}00/playManifest/entryId/${v.entryId}/format/applehttp/protocol/https/a.m3u8${ks ? "?ks=" + encodeURIComponent(ks) : ""}`);
    if (!cands.length) throw new Error(BC.t("没有可用的播放列表地址（播放器还没开始播放？先点一下播放再试）"));
    let text = "", url = "", tried = [];
    for (const m of [...new Set(cands)]) {
      try {
        const r = await BC.kaltura._fetch(m, { as: "text" });
        if (/#EXTM3U/.test(r.body || "")) { text = r.body; url = r.finalUrl || m; break; }
        tried.push(`HTTP ${r.status}`);
      } catch (e) { tried.push(e.message); }
    }
    v.hlsTried = tried;
    if (!text) throw new Error(BC.t("HLS 播放列表拿不到（{tried}）。先在页面里点一下播放，再扫描一次。", { tried: [...new Set(tried)].join(" / ") }));
    // 主列表 -> 选最高带宽的子列表
    if (/#EXT-X-STREAM-INF/.test(text)) {
      const lines = text.split(/\r?\n/);
      let best = null;
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("#EXT-X-STREAM-INF")) continue;
        const bw = +((/BANDWIDTH=(\d+)/.exec(lines[i]) || [])[1] || 0);
        const res = (/RESOLUTION=(\d+x\d+)/.exec(lines[i]) || [])[1] || "";
        const uri = (lines[i + 1] || "").trim();
        if (uri && (!best || bw > best.bw)) best = { bw, res, uri: BC.kaltura._resolveUrl(uri, url) };
      }
      if (!best) throw new Error(BC.t("主列表里没有可用的清晰度"));
      const r2 = await BC.kaltura._fetch(best.uri, { as: "text" });
      text = r2.body || ""; url = r2.finalUrl || best.uri;
      v.hlsRes = best.res;
    }
    // 子列表 -> 分段 + 加密信息 + fMP4 init
    const segs = [], lines = text.split(/\r?\n/);
    let key = null, map = null, seq = +((/#EXT-X-MEDIA-SEQUENCE:(\d+)/.exec(text) || [])[1] || 0);
    for (const raw of lines) {
      const l = raw.trim();
      if (!l) continue;
      if (l.startsWith("#EXT-X-KEY")) {
        const method = (/METHOD=([A-Z0-9-]+)/.exec(l) || [])[1] || "NONE";
        if (method === "NONE") key = null;
        else if (method === "AES-128") key = { uri: BC.kaltura._resolveUrl((/URI="([^"]+)"/.exec(l) || [])[1] || "", url), iv: (/IV=0x([0-9a-fA-F]+)/.exec(l) || [])[1] || "" };
        else throw new Error(BC.t("视频用了 {method} 加密（DRM），无法下载", { method }));
        continue;
      }
      if (l.startsWith("#EXT-X-MAP")) { map = BC.kaltura._resolveUrl((/URI="([^"]+)"/.exec(l) || [])[1] || "", url); continue; }
      if (l.startsWith("#")) continue;
      segs.push({ uri: BC.kaltura._resolveUrl(l, url), key, seq: seq++ });
    }
    if (!segs.length) throw new Error(BC.t("播放列表里没有分段"));
    return { segs, map, ext: map ? "mp4" : "ts" };
  },

  async _aesKey(uri, cache) {
    if (cache[uri]) return cache[uri];
    let raw;
    try { const r = await fetch(uri, { credentials: "omit" }); if (!r.ok) throw new Error("HTTP " + r.status); raw = await r.arrayBuffer(); }
    catch (e) { const r2 = await BC.kaltura._fetch(uri, { as: "bytes" }); const bin = atob(r2.body || ""); raw = Uint8Array.from(bin, c => c.charCodeAt(0)).buffer; }
    cache[uri] = await crypto.subtle.importKey("raw", raw, { name: "AES-CBC" }, false, ["decrypt"]);
    return cache[uri];
  },

  // 逐段下载 -> 写入 sink（{write(bytes), close()}）；onProgress(i, total, bytes)
  async downloadHls(v, sink, onProgress) {
    const { segs, map } = await BC.kaltura.hlsPlaylist(v);
    const keys = {};
    let bytes = 0;
    // 分段：先不带 cookie 直接 fetch（CDN 的跨域头是通配符，带 cookie 反而会被浏览器拒）；被拒就走后台代理拿 base64
    const get = async (uri) => {
      try {
        const r = await fetch(uri, { credentials: "omit" });
        if (r.ok) return new Uint8Array(await r.arrayBuffer());
        if (r.status !== 0) throw new Error("HTTP " + r.status);
      } catch (e) { if (!/HTTP \d+/.test(e.message)) { /* CORS / 网络：转后台 */ } else throw new Error(BC.t("分段 {msg}", { msg: e.message })); }
      const r2 = await BC.kaltura._fetch(uri, { as: "bytes" });
      const bin = atob(r2.body || "");
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    };
    if (map) { const b = await get(map); await sink.write(b); bytes += b.length; }
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      let data = await get(s.uri);
      if (s.key) {
        const k = await BC.kaltura._aesKey(s.key.uri, keys);
        let iv;
        if (s.key.iv) { iv = new Uint8Array(s.key.iv.padStart(32, "0").match(/../g).map(h => parseInt(h, 16))); }
        else { iv = new Uint8Array(16); new DataView(iv.buffer).setUint32(12, s.seq); }
        data = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CBC", iv }, k, data));
      }
      await sink.write(data);
      bytes += data.length;
      onProgress && onProgress(i + 1, segs.length, bytes);
    }
    await sink.close();
    return { segments: segs.length, bytes };
  },

  /* ---------- 字幕 ---------- */
  async captions(v) {
    const j = await BC.kaltura.apiWithFallback(v, "caption_captionasset", "list", { "filter:objectType": "KalturaAssetFilter", "filter:entryIdEqual": v.entryId });
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
