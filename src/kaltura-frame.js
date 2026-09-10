/* 运行在 *.kaltura.com 的 iframe 里（KAF / MediaSpace / playkit 播放器页）的轻量脚本：
 * 从页面脚本 / 全局变量里找 entry_id、partner_id、ks 和播放器解析好的媒体源，回传给顶层 Canvas 页面（study.js 的「🎬 视频」用）。
 * manifest 里声明 world: "MAIN"——默认的隔离世界读不到页面的 KalturaPlayer 全局对象。这里没有 chrome.* API，只用 postMessage。
 * 只做读取，不改页面。 */
(function () {
  if (window === window.top) return;
  // 无论找没找到 entry，都先回一条“我在”，让主页面的诊断能看到 iframe 脚本确实跑了
  const hello = (target) => { try { (target || window.top).postMessage({ bcKaltura: "hello", host: location.host, path: location.pathname.slice(0, 80), hasPlayer: !!(window.KalturaPlayer || window.kWidget || window.kalturaIframePackageData) }, "*"); } catch (e) {} };
  const info = () => {
    const html = document.documentElement.innerHTML;
    const g = (re, s) => { const m = re.exec(s || html); return m ? m[1] : ""; };
    // playkit V7 的配置：KalturaPlayer.setup({ provider: { partnerId, ks }, ... , sources: { id: entryId } }) / kalturaIframePackageData（V2）
    let entryId = "", partnerId = "", ks = "";
    try {
      const pk = window.kalturaIframePackageData;
      if (pk && pk.entryResult && pk.entryResult.meta) { entryId = pk.entryResult.meta.id || ""; partnerId = String(pk.entryResult.meta.partnerId || ""); }
      if (pk && pk.playerConfig && pk.playerConfig.ks) ks = pk.playerConfig.ks;
    } catch (e) {}
    try {
      const players = window.KalturaPlayer && window.KalturaPlayer.getPlayers ? window.KalturaPlayer.getPlayers() : null;
      const p = players && Object.values(players)[0];
      if (p) { entryId = entryId || (p.sources && p.sources.id) || (p.config && p.config.sources && p.config.sources.id) || ""; const prov = p.config && p.config.provider; if (prov) { partnerId = partnerId || String(prov.partnerId || ""); ks = ks || prov.ks || ""; } }
    } catch (e) {}
    entryId = entryId || g(/["']?entry_?[iI]d["']?\s*[:=]\s*["']([01]_[a-z0-9]{8})["']/) || g(/[?&/]entry_?id[=/]([01]_[a-z0-9]{8})/i, location.href) || g(/\/entryid\/([01]_[a-z0-9]{8})/i, location.href) || g(/([01]_[a-z0-9]{8})/);
    partnerId = partnerId || g(/["']?partner_?[iI]d["']?\s*[:=]\s*["']?(\d{4,9})/) || g(/\/p\/(\d+)\//, location.href) || g(/(\d{4,9})\.kaf\.kaltura\.com/, location.host);
    ks = ks || g(/["']ks["']\s*[:=]\s*["']([A-Za-z0-9_\-=]{20,})["']/) || g(/[?&]ks=([A-Za-z0-9_\-=%]{20,})/, location.href);
    const title = (document.querySelector("h1,.entryTitle,[class*='title']") || {}).textContent || document.title || "";
    // 播放器已经解析好的媒体源（最可靠）：playkit 的 player.sources.{hls,dash,progressive}
    const sources = { hls: [], dash: [], progressive: [] };
    try {
      const players = window.KalturaPlayer && window.KalturaPlayer.getPlayers ? window.KalturaPlayer.getPlayers() : null;
      Object.values(players || {}).forEach(p => {
        const s = (p && p.sources) || (p && p.config && p.config.sources) || {};
        ["hls", "dash", "progressive"].forEach(k => (s[k] || []).forEach(x => { if (x && x.url) sources[k].push({ url: x.url, w: x.width || 0, h: x.height || 0, bw: x.bandwidth || 0, mime: x.mimetype || "" }); }));
      });
    } catch (e) {}
    // 播放器实际请求过的清单 / 分段地址（Resource Timing 能看到跨域 URL）
    let manifests = [];
    try {
      manifests = performance.getEntriesByType("resource").map(e => e.name)
        .filter(n => /playManifest|\.m3u8|\.mpd|\/flavorId\//i.test(n)).slice(-20);
    } catch (e) {}
    return { bcKaltura: "info", entryId, partnerId, ks: ks ? decodeURIComponent(ks) : "", title: title.trim().slice(0, 120), url: location.href, sources, manifests };
  };
  const reply = (target) => { hello(target); const i = info(); if (i.entryId) try { (target || window.top).postMessage(i, "*"); } catch (e) {} };
  window.addEventListener("message", ev => { if (ev.data && ev.data.bcKaltura === "ping") reply(ev.source); });
  // 播放器异步初始化、清单要等播放开始才请求：多试几次
  [500, 1500, 4000, 10000].forEach(t => setTimeout(() => reply(), t));
})();
