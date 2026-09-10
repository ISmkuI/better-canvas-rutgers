// 生成两张宣传图的 HTML：小型 440×280、顶部 1400×560
const fs = require("fs"), path = require("path");
const dir = __dirname;
const icon = "data:image/png;base64," + fs.readFileSync(path.join(dir, "icon.b64"), "utf8");
const base = `
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; background: #cc0033; color: #fff; overflow: hidden; }
  .bg { position: absolute; inset: 0; background:
    radial-gradient(circle at 85% 20%, rgba(255,255,255,.14), transparent 40%),
    radial-gradient(circle at 10% 90%, rgba(0,0,0,.18), transparent 45%),
    linear-gradient(135deg, #d4143f 0%, #b8002d 100%); }
  .dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.10) 1.2px, transparent 1.2px); background-size: 22px 22px; }
  .wrap { position: relative; height: 100vh; display: flex; align-items: center; }
  .icon { border-radius: 22%; box-shadow: 0 14px 40px rgba(0,0,0,.35); }
  h1 { margin: 0; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
  .tag { margin: 0; opacity: .92; font-weight: 500; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
  .chip { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35); border-radius: 999px; padding: 5px 12px; font-size: 15px; font-weight: 600; backdrop-filter: blur(4px); }
  .potato { position: absolute; right: -40px; bottom: -60px; width: 260px; height: 200px; border-radius: 48% 52% 45% 55% / 55% 45% 55% 45%; background: rgba(255, 205, 117, .16); transform: rotate(-18deg); }
</style>`;

// 440×280
fs.writeFileSync(path.join(dir, "promo-small.html"), `${base}
<style>
  .wrap { padding: 0 22px; gap: 18px; }
  .icon { width: 96px; height: 96px; }
  h1 { font-size: 36px; }
  .tag { font-size: 15px; margin-top: 6px; }
  .chip { font-size: 11px; padding: 3px 8px; }
  .chips { margin-top: 10px; gap: 5px; max-width: 290px; }
</style>
<div class="bg"></div><div class="dots"></div><div class="potato"></div>
<div class="wrap">
  <img class="icon" src="${icon}">
  <div>
    <h1>PotatoCanvas</h1>
    <p class="tag">A heartier Canvas dashboard.</p>
    <div class="chips"><span class="chip">Grades on cards</span><span class="chip">Exam countdown</span><span class="chip">Themes</span></div>
  </div>
</div>`);

// 1400×560
fs.writeFileSync(path.join(dir, "promo-marquee.html"), `${base}
<style>
  .wrap { padding: 0 90px; gap: 56px; }
  .icon { width: 240px; height: 240px; }
  h1 { font-size: 92px; }
  .tag { font-size: 30px; margin-top: 14px; }
  .chip { font-size: 19px; padding: 7px 16px; }
  .chips { margin-top: 26px; gap: 10px; max-width: 820px; }
  .potato { width: 520px; height: 400px; right: -120px; bottom: -140px; }
  .foot { position: absolute; left: 90px; bottom: 34px; font-size: 18px; opacity: .8; }
</style>
<div class="bg"></div><div class="dots"></div><div class="potato"></div>
<div class="wrap">
  <img class="icon" src="${icon}">
  <div>
    <h1>PotatoCanvas</h1>
    <p class="tag">Grades, deadlines and exam dates on your Canvas dashboard. One glance, no digging.</p>
    <div class="chips">
      <span class="chip">Grades on course cards</span><span class="chip">Midterm / final countdown</span><span class="chip">Due this week</span>
      <span class="chip">Message alerts</span><span class="chip">10 themes</span><span class="chip">Study helper (your own AI key)</span>
    </div>
  </div>
</div>
<div class="foot">Works on any Canvas LMS site · No account, no server, no tracking</div>`);
console.log("promo html written");
