/* 弹窗：几个主开关 + 清缓存。直接读写 chrome.storage.local.bc_settings。 */
const DEFAULTS = {
  theme: { enabled: true },
  cards: { showGrade: true },
  blocks: { enabled: true },
  messages: { enabled: true }
};

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}
function set(obj, path, val) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = (o[keys[i]] = o[keys[i]] || {});
  o[keys[keys.length - 1]] = val;
}

chrome.storage.local.get("bc_settings", d => {
  const s = d.bc_settings || {};
  document.querySelectorAll("input[data-path]").forEach(input => {
    const path = input.dataset.path;
    const cur = get(s, path);
    input.checked = cur === undefined ? get(DEFAULTS, path) : cur;
    input.addEventListener("change", () => {
      chrome.storage.local.get("bc_settings", dd => {
        const ns = dd.bc_settings || {};
        set(ns, path, input.checked);
        chrome.storage.local.set({ bc_settings: ns });
      });
    });
  });
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.get(null, all => {
    const keys = Object.keys(all).filter(k => k.startsWith("bc_cache_"));
    chrome.storage.local.remove(keys, () => {
      const btn = document.getElementById("clear");
      btn.textContent = "已清除，刷新 Canvas 页面生效";
    });
  });
});
