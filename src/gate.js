/* 高级功能（阅读器导出 / 讲座视频下载）的解锁门。
 *
 * 规则：
 *  - 密码 = HMAC-SHA256(SECRET, 当前整点的小时序号) 映射成 8 位字符（去掉易混的 0/O/1/I），每小时自动换一个；
 *    验证时接受「当前小时」和「上一小时」两个（跨整点、时钟略有偏差时不至于失效）。
 *  - 密码从哪来：扩展里没有生成入口，用仓库里的独立生成器 tools/gate-password/（网页 / PowerShell / Node），密钥必须和这里一致。
 *  - 绑定：密码输对一次后写 chrome.storage.local.bc_gate = { unlocked: true, boundAt }，这台浏览器以后不再询问；
 *    「解除绑定」会清掉。
 *
 * 说明：密钥就写在这个文件里，装了扩展的人打开源码就能算出密码。
 * 这道门挡的是「顺手用一下」，不是安全机制——别把它当成许可证系统。 */
window.BC = window.BC || {};
BC.gate = {
  KEY: "bc_gate",
  SECRET: "uhNKemzqdAGy360foPFDZ9Cv4nvmDQy-",
  ALPHABET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  CODE_LEN: 8,

  _enc: s => new TextEncoder().encode(s),

  async _hmac(msg) {
    const key = await crypto.subtle.importKey("raw", BC.gate._enc(BC.gate.SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", key, BC.gate._enc(msg)));
  },
  hourIndex(offset = 0) { return Math.floor(Date.now() / 3600000) + offset; },
  // 某个小时的密码；offset = -1 是上一小时
  async code(offset = 0) {
    const mac = await BC.gate._hmac("bc-gate:" + BC.gate.hourIndex(offset));
    let out = "";
    for (let i = 0; i < BC.gate.CODE_LEN; i++) out += BC.gate.ALPHABET[mac[i] % BC.gate.ALPHABET.length];
    return out.slice(0, 4) + "-" + out.slice(4);
  },
  // 密码剩余有效秒数（到整点）
  secondsLeft() { return 3600 - Math.floor((Date.now() % 3600000) / 1000); },
  norm(s) { return String(s || "").toUpperCase().replace(/[^A-Z2-9]/g, ""); },
  async verify(input) {
    const v = BC.gate.norm(input);
    if (v.length !== BC.gate.CODE_LEN) return false;
    for (const off of [0, -1]) if (BC.gate.norm(await BC.gate.code(off)) === v) return true;
    return false;
  },

  _get() { return new Promise(r => chrome.storage.local.get(BC.gate.KEY, d => r(d[BC.gate.KEY] || null))); },
  _set(v) { return new Promise(r => chrome.storage.local.set({ [BC.gate.KEY]: v }, r)); },
  async isUnlocked() { const g = await BC.gate._get(); return !!(g && g.unlocked); },
  async bind(how) { await BC.gate._set({ unlocked: true, boundAt: Date.now(), how: how || "code" }); return true; },
  async unbind() { return new Promise(r => chrome.storage.local.remove(BC.gate.KEY, r)); },
  // 输入密码解锁并绑定本机
  async unlock(input) {
    if (!(await BC.gate.verify(input))) return false;
    await BC.gate.bind("code");
    return true;
  },

  onChange(cb) {
    try { chrome.storage.onChanged.addListener((c, area) => { if (area === "local" && c[BC.gate.KEY]) cb(!!(c[BC.gate.KEY].newValue && c[BC.gate.KEY].newValue.unlocked)); }); } catch (e) {}
  }
};
