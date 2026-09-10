#!/usr/bin/env node
/* PotatoCanvas 高级功能密码生成器（Node 18+）
 * 用法：
 *   node gate-password.js            本小时 / 上一小时 / 下一小时的密码
 *   node gate-password.js --watch    持续刷新并显示倒计时
 *   环境变量 BC_GATE_SECRET 可覆盖密钥。
 * 密钥默认从同仓库的 src/gate.js 读取（找不到时用内置常量），算法与 gate.js 一致。 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const FALLBACK_SECRET = "uhNKemzqdAGy360foPFDZ9Cv4nvmDQy-";

function loadSecret() {
  if (process.env.BC_GATE_SECRET) return process.env.BC_GATE_SECRET;
  try {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "src", "gate.js"), "utf8");
    const m = src.match(/SECRET:\s*"([^"]+)"/);
    if (m) return m[1];
  } catch (e) {}
  return FALLBACK_SECRET;
}
const SECRET = loadSecret();

const hourIndex = (offset = 0) => Math.floor(Date.now() / 3600000) + offset;
function code(offset = 0) {
  const mac = crypto.createHmac("sha256", SECRET).update("bc-gate:" + hourIndex(offset)).digest();
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[mac[i] % ALPHABET.length];
  return out.slice(0, 4) + "-" + out.slice(4);
}
const secondsLeft = () => 3600 - Math.floor((Date.now() % 3600000) / 1000);
const mmss = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

const args = process.argv.slice(2);
if (args.includes("--watch")) {
  const draw = () => {
    process.stdout.write("\x1b[2J\x1b[H");
    console.log("PotatoCanvas 高级功能密码（Ctrl+C 退出）\n");
    console.log("   " + code(0) + "\n");
    console.log(`上一小时 ${code(-1)}   下一小时 ${code(1)}`);
    console.log(`还剩 ${mmss(secondsLeft())} 换下一个`);
  };
  draw(); setInterval(draw, 1000);
} else {
  console.log("本小时密码：  " + code(0));
  console.log("上一小时：    " + code(-1) + "   （仍可用）");
  console.log("下一小时：    " + code(1));
  console.log(`还剩 ${mmss(secondsLeft())} 换下一个。加 --watch 可持续显示。`);
}
