#!/usr/bin/env node
/* 商店版（core edition）打包：node scripts/build-store.js  →  dist/<name>-store-v<version>.zip
 *
 * 做什么：
 *   1. 把仓库复制到 dist/store/，跳过开发 / 高级功能相关文件（.git、dist、tools、store、scripts、print/、*.md、SourceCode.html，
 *      以及 src/gate.js、src/kaltura.js、src/kaltura-frame.js、src/reader-db.js、src/reader-links.js、src/reader-export.js、src/anywhere.js）。
 *   2. 改 dist/store/manifest.json：内容脚本去掉 gate.js / kaltura.js，删掉 kaltura.com 的 content_scripts 与 host_permissions，
 *      去掉 webRequest 权限（先确认暂存副本里除 background.js 的 Kaltura 监听外没人用它），删掉 optional_host_permissions（全站权限），
 *      web_accessible_resources 收窄到 instructure.com；每组内容脚本最前面插入 src/edition.js。
 *   3. 写入 dist/store/src/edition.js（BC.EDITION = "store"）：background.js / popup.js / study.js 靠它（以及被删掉的文件不存在）
 *      在运行时隐藏「高级功能」分页、「在所有网站启用」和视频标签。开发仓库里没有这个文件 → 完整版。
 *   4. 改 dist/store/popup/popup.html：去掉 gate.js 的 <script>，在 i18n.js 前插入 edition.js。
 *   5. 校验：manifest / popup.html 引用的文件都在；暂存副本里不得再引用被删文件；列出 JS 里对 BC.gate / BC.kaltura / ReaderExport 的
 *      引用位置（应全是带守卫的）。
 *   6. 打 zip。默认用内置的纯 Node zip 写入器（zlib deflate，路径统一正斜杠，任何平台结果一致；
 *      Windows PowerShell 5.1 的 Compress-Archive 会把路径写成反斜杠，部分解压器 / 审核工具会把它当成文件名）。
 *      加 --shell-zip 则改用平台工具（Windows: Compress-Archive；POSIX: zip -r）。
 *
 * 参数：--name "PotatoCanvas"   覆盖暂存 manifest 里的 name（上架前必须改名，见 store/LISTING.md）
 *       --no-zip                              只暂存不打包（方便在 chrome://extensions 里「加载已解压的扩展程序」试商店版）
 *       --shell-zip                           用 Compress-Archive / zip 打包
 * 无第三方依赖，Node 18+。 */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const STAGE = path.join(DIST, "store");

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

/* ---------- 排除规则 ---------- */
const EXCLUDE_DIRS = new Set([".git", ".github", ".claude", ".vscode", "dist", "node_modules", "tools", "store", "scripts", "print"]);
const EXCLUDE_FILES = new Set(["SourceCode.html", ".gitignore", ".gitattributes", "package.json", "package-lock.json"]);
const EXCLUDE_EXT = new Set([".md", ".zip", ".crx", ".pem"]);
const EXCLUDE_SRC = new Set([
  "src/gate.js",            // 小时密码解锁门
  "src/kaltura.js",         // 讲座视频：解析 / MP4 直链 / HLS 分段下载
  "src/kaltura-frame.js",   // 跑在 *.kaltura.com iframe 里
  "src/reader-db.js",       // 阅读器导出：IndexedDB
  "src/reader-links.js",    // 阅读器导出：书内链接
  "src/reader-export.js",   // 阅读器导出：注入脚本 + 后台任务
  "src/anywhere.js"         // 「在所有网站启用」的入口脚本：商店版没有全站权限，registerAnywhere 一律拒绝，这个文件永远不会被注册
]);
const REMOVED_PERMISSIONS = ["webRequest"];
const REMOVED_HOST_RE = /kaltura\.com/i;
const EDITION_JS = `/* 由 scripts/build-store.js 生成：商店版标记。开发仓库里没有这个文件（BC.EDITION 为 undefined = 完整版）。
 * background.js / popup.js 据此隐藏「高级功能」分页、「在所有网站启用」等商店版不含的功能。 */
var BC = globalThis.BC = globalThis.BC || {};
BC.EDITION = "store";
`;

/* ---------- 工具 ---------- */
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");
const relStage = p => path.relative(STAGE, p).split(path.sep).join("/");
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
function fail(msg) { console.error("\n✕ " + msg); process.exit(1); }

/* ---------- 1. 复制 ---------- */
fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
const excluded = [];
let copied = 0;
(function copyDir(src) {
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const p = path.join(src, ent.name);
    const r = rel(p);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.has(ent.name) && path.dirname(p) === ROOT) { excluded.push(r + "/"); continue; }
      copyDir(p);
      continue;
    }
    if (!ent.isFile()) continue;
    if ((path.dirname(p) === ROOT && EXCLUDE_FILES.has(ent.name)) || EXCLUDE_EXT.has(path.extname(ent.name).toLowerCase()) || EXCLUDE_SRC.has(r)) {
      excluded.push(r);
      continue;
    }
    const dst = path.join(STAGE, path.relative(ROOT, p));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(p, dst);
    copied++;
  }
})(ROOT);

/* ---------- 2. manifest ---------- */
const manifestPath = path.join(STAGE, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const srcManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const removedScriptFiles = [], removedEntries = [];

manifest.content_scripts = (manifest.content_scripts || []).filter(cs => {
  const onlyRemovedHosts = (cs.matches || []).length && cs.matches.every(m => REMOVED_HOST_RE.test(m));
  const onlyRemovedFiles = (cs.js || []).length && cs.js.every(f => EXCLUDE_SRC.has(f)) && !(cs.css || []).length;
  if (onlyRemovedHosts || onlyRemovedFiles) { removedEntries.push(cs); return false; }
  return true;
}).map(cs => {
  const js = (cs.js || []).filter(f => { if (EXCLUDE_SRC.has(f)) { removedScriptFiles.push(f); return false; } return true; });
  return Object.assign({}, cs, { js: ["src/edition.js", ...js.filter(f => f !== "src/edition.js")] });
});

const removedHosts = (manifest.host_permissions || []).filter(h => REMOVED_HOST_RE.test(h));
manifest.host_permissions = (manifest.host_permissions || []).filter(h => !REMOVED_HOST_RE.test(h));

// webRequest：只有 background.js 里的 Kaltura 监听在用（且已按 STORE_EDITION 跳过）。暂存副本里若别处还在用就保留并警告
const webRequestUsers = walk(STAGE).filter(f => /\.(js|html)$/.test(f) && relStage(f) !== "src/background.js" && /chrome\.webRequest/.test(fs.readFileSync(f, "utf8"))).map(relStage);
const removedPerms = [];
manifest.permissions = (manifest.permissions || []).filter(p => {
  if (!REMOVED_PERMISSIONS.includes(p)) return true;
  if (p === "webRequest" && webRequestUsers.length) { console.warn("! webRequest 仍被以下文件使用，保留权限：" + webRequestUsers.join(", ")); return true; }
  removedPerms.push(p); return false;
});

const hadOptional = !!manifest.optional_host_permissions;
delete manifest.optional_host_permissions;

// web_accessible_resources 收窄到 Canvas 域（原来对所有站点开放是给「在所有网站启用」和阅读器打印页用的）
(manifest.web_accessible_resources || []).forEach(w => { w.matches = ["https://*.instructure.com/*"]; });

const nameOverride = opt("--name");
if (nameOverride) manifest.name = nameOverride;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

/* ---------- 3. edition.js ---------- */
fs.writeFileSync(path.join(STAGE, "src", "edition.js"), EDITION_JS);

/* ---------- 4. popup.html ---------- */
const popupPath = path.join(STAGE, "popup", "popup.html");
let popup = fs.readFileSync(popupPath, "utf8");
const gateTag = /[ \t]*<script src="\.\.\/src\/gate\.js"><\/script>\r?\n/;
if (!gateTag.test(popup)) fail("popup/popup.html 里没找到 gate.js 的 <script> 标签，脚本需要更新");
popup = popup.replace(gateTag, "");
if (!/<script src="\.\.\/src\/i18n\.js">/.test(popup)) fail("popup/popup.html 里没找到 i18n.js 的 <script> 标签");
popup = popup.replace(/([ \t]*)<script src="\.\.\/src\/i18n\.js"><\/script>/, '$1<script src="../src/edition.js"></script>\n$1<script src="../src/i18n.js"></script>');
fs.writeFileSync(popupPath, popup);

/* ---------- 5. 校验 ---------- */
const stagedFiles = walk(STAGE);
const stagedSet = new Set(stagedFiles.map(relStage));
const mustExist = [];
manifest.content_scripts.forEach(cs => { (cs.js || []).forEach(f => mustExist.push(f)); (cs.css || []).forEach(f => mustExist.push(f)); });
if (manifest.background && manifest.background.service_worker) mustExist.push(manifest.background.service_worker);
if (manifest.action && manifest.action.default_popup) mustExist.push(manifest.action.default_popup);
Object.values(manifest.icons || {}).forEach(f => mustExist.push(f));
Object.values((manifest.action && manifest.action.default_icon) || {}).forEach(f => mustExist.push(f));
(manifest.web_accessible_resources || []).forEach(w => (w.resources || []).forEach(f => { if (!f.includes("*")) mustExist.push(f); }));
if (manifest.default_locale) mustExist.push(`_locales/${manifest.default_locale}/messages.json`);
const missing = [...new Set(mustExist)].filter(f => !stagedSet.has(f));
if (missing.length) fail("manifest 引用的文件不在暂存目录里：" + missing.join(", "));
(popup.match(/<script src="([^"]+)"/g) || []).map(s => s.match(/"([^"]+)"/)[1]).forEach(s => {
  const f = path.posix.normalize(path.posix.join("popup", s));
  if (!stagedSet.has(f)) fail(`popup.html 引用的脚本不存在：${s}`);
});
// 后台 importScripts 的文件（edition.js / reader-*.js 被 try/catch 包着，缺了没关系；其余必须在）
const bg = fs.readFileSync(path.join(STAGE, manifest.background.service_worker), "utf8");
const bgDir = path.posix.dirname(manifest.background.service_worker);
for (const m of bg.matchAll(/importScripts\(([^)]*)\)/g)) {
  const guarded = /try\s*\{\s*$/.test(bg.slice(Math.max(0, m.index - 40), m.index));
  m[1].split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean).forEach(f => {
    const p = path.posix.join(bgDir, f);
    if (!stagedSet.has(p) && !guarded) fail(`background.js importScripts 的文件不存在且未加 try/catch：${f}`);
  });
}
// 硬引用：json / html / css 里绝不能再出现被删文件；JS 里的引用列出来（应全是带守卫的）
const removedNames = [...EXCLUDE_SRC].map(f => path.posix.basename(f)).concat(["print/print.html", "print/"]);
const hardRefs = [], softRefs = [];
const SOFT_RE = /BC\.gate\b|BC\.kaltura\b|\bReaderExport\b|gate\.js|kaltura|reader-export|reader-db|reader-links|print\/print\.html|optional_host_permissions|chrome\.webRequest/;
for (const f of stagedFiles) {
  const r = relStage(f);
  if (!/\.(js|json|html|css)$/.test(r)) continue;
  const text = fs.readFileSync(f, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/\.(json|html|css)$/.test(r)) {
      removedNames.forEach(n => { if (line.includes(n)) hardRefs.push(`${r}:${i + 1}: ${line.trim().slice(0, 120)}`); });
    } else if (SOFT_RE.test(line) && !/^\s*(\/\/|\/\*|\*)/.test(line)) {
      softRefs.push(`${r}:${i + 1}: ${line.trim().slice(0, 140)}`);
    }
  });
}
if (hardRefs.length) fail("暂存副本的 json/html/css 里仍引用被删文件：\n  " + hardRefs.join("\n  "));

/* ---------- 6. zip ---------- */
const version = manifest.version;
const baseName = String(manifest.name || "").startsWith("__MSG_")
  ? "extension"
  : String(manifest.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const zipPath = path.join(DIST, `${baseName}-store-v${version}.zip`);

function crc32(buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf) >>> 0;
  if (!crc32.table) { crc32.table = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc32.table[n] = c; } }
  let c = -1; for (let i = 0; i < buf.length; i++) c = crc32.table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}
function writeZip(out, root, files) {
  const now = dosDateTime(new Date());
  const locals = [], centrals = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(path.relative(root, f).split(path.sep).join("/"), "utf8");
    const data = fs.readFileSync(f);
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(now.time, 10); lh.writeUInt16LE(now.date, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(now.time, 12); ch.writeUInt16LE(now.date, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28);
    ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
    locals.push(lh, name, comp);
    centrals.push(ch, name);
    offset += lh.length + name.length + comp.length;
  }
  const cdSize = centrals.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10); eocd.writeUInt32LE(cdSize, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
  fs.writeFileSync(out, Buffer.concat([...locals, ...centrals, eocd]));
}
function shellZip(out, root) {
  fs.rmSync(out, { force: true });
  if (process.platform === "win32") {
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `Compress-Archive -Path '${path.join(root, "*").replace(/'/g, "''")}' -DestinationPath '${out.replace(/'/g, "''")}' -CompressionLevel Optimal -Force`], { stdio: "inherit" });
  } else {
    execFileSync("zip", ["-r", "-X", "-q", out, "."], { cwd: root, stdio: "inherit" });
  }
}
if (!flag("--no-zip")) {
  if (flag("--shell-zip")) shellZip(zipPath, STAGE);
  else writeZip(zipPath, STAGE, stagedFiles.sort((a, b) => relStage(a).localeCompare(relStage(b))));
}

/* ---------- 汇总 ---------- */
const pad = s => "  " + s;
console.log(`\n== 商店版打包 ${manifest.name} v${version} ==`);
console.log(`\n暂存目录：${STAGE}（${copied} 个文件 + src/edition.js）`);
console.log("\n排除的目录 / 文件：");
excluded.sort().forEach(x => console.log(pad(x)));
console.log("\nmanifest 改动：");
console.log(pad(`content_scripts：删掉 ${removedEntries.length} 组（${removedEntries.map(e => (e.matches || []).join(" ")).join("; ") || "无"}），从其余各组里去掉 ${removedScriptFiles.join(", ") || "无"}，每组最前面插入 src/edition.js`));
console.log(pad(`host_permissions：去掉 ${removedHosts.join(", ") || "无"}`));
console.log(pad(`permissions：去掉 ${removedPerms.join(", ") || "无"}`));
console.log(pad(`optional_host_permissions：${hadOptional ? "已删除（原 " + JSON.stringify(srcManifest.optional_host_permissions) + "）" : "原本就没有"}`));
console.log(pad("web_accessible_resources.matches：收窄为 https://*.instructure.com/*"));
if (nameOverride) console.log(pad(`name：改为 "${nameOverride}"`));
else console.log(pad(`name：保持 "${manifest.name}"（上架前必须改名，见 store/LISTING.md；可用 --name "…" 覆盖）`));
console.log("\n最终 permissions：      " + JSON.stringify(manifest.permissions));
console.log("最终 host_permissions： " + JSON.stringify(manifest.host_permissions, null, 0).replace(/","/g, '",\n                        "'));
console.log("内容脚本：");
manifest.content_scripts.forEach(cs => console.log(pad(`${(cs.matches || []).join(", ")}  →  ${(cs.js || []).length} js${(cs.css || []).length ? " + " + cs.css.length + " css" : ""}`)));
console.log(`\nJS 里对高级功能对象的引用（应全部带守卫，缺文件时静默跳过）：${softRefs.length} 处`);
softRefs.forEach(x => console.log(pad(x)));
if (flag("--no-zip")) console.log(`\n未打 zip（--no-zip）。在 chrome://extensions 里「加载已解压的扩展程序」选 ${STAGE} 可试商店版。`);
else console.log(`\n✓ ${zipPath}（${(fs.statSync(zipPath).size / 1024).toFixed(0)} KB）`);
