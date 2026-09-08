/* 运行在 *.kaltura.com 的 iframe 里（KAF / MediaSpace / playkit 播放器页）的轻量脚本：
 * 从页面脚本 / 全局变量里找 entry_id、partner_id、ks，回传给顶层 Canvas 页面（study.js 的「🎬 视频」用）。
 * 只做读取和 postMessage，不改页面。 */
(function () {
  if (window === window.top) return;
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
    return { bcKaltura: "info", entryId, partnerId, ks: ks ? decodeURIComponent(ks) : "", title: title.trim().slice(0, 120), url: location.href };
  };
  const reply = (target) => { const i = info(); if (i.entryId) try { (target || window.top).postMessage(i, "*"); } catch (e) {} };
  window.addEventListener("message", ev => { if (ev.data && ev.data.bcKaltura === "ping") reply(ev.source); });
  // 播放器异步初始化：多试几次
  [500, 1500, 4000].forEach(t => setTimeout(() => reply(), t));
})();
