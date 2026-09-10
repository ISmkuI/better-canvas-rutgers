# Chrome Web Store 上架清单

> 结论先行：**上架的是「商店版」（core edition）**，由 `node scripts/build-store.js` 生成，物理上不包含阅读器导出、讲座视频下载 / HLS、小时密码解锁门、「在所有网站启用」。这些留在 GitHub 的「完整版」（开发者模式加载）里。原因见文末「政策风险评估」。

## 0. 前置决定

- [x] **改名**。已改为 PotatoCanvas（manifest、_locales、弹窗、下载目录、打包名都已同步）。商店文案和截图里不要再出现旧名 "Better Canvas"。
- [ ] 确认 `manifest.json` 的 `version`（商店要求每次上传版本号递增；现在是 0.2.0）。
- [ ] `README.md` 「下载」一节里的「不上架商店」改掉或补一句「商店版为精简版」（README 不进 zip，但用户会看）。

## 1. 开发者账号

- [ ] 用一个长期能收信的 Google 账号打开 https://chrome.google.com/webstore/devconsole ，付 **$5 一次性注册费**。
- [ ] 完成账号验证：联系邮箱验证（后台「Account」页）；启用两步验证（2024 年起发布必需）。
- [ ] 若以个人名义发布，"Trader / Non-trader" 声明选 Non-trader（不收费、无商业目的）；EU 用户可见性会受影响，但本扩展面向 Rutgers，无所谓。

## 2. 托管隐私政策

- [ ] 把 `store/PRIVACY.md` 填好占位符（`ISmkuI`、`<CONTACT EMAIL>`、`https://github.com/ISmkuI/better-canvas-rutgers`），改名后把标题里的扩展名也对上。
- [ ] 放到一个**公开可访问的 URL**：GitHub 仓库里的文件页（`https://github.com/<user>/<repo>/blob/main/store/PRIVACY.md`）就够；或 GitHub Pages。
- [ ] 把同一 URL 写进 `LISTING.md` 描述里的 `https://github.com/ISmkuI/better-canvas-rutgers/blob/main/store/PRIVACY.md` 和后台「Privacy policy」栏。

## 3. 素材

- [ ] 图标：`icons/icon128.png` 已有（商店要求 128×128，四周留 16px 透明边距更好看）。
- [ ] 截图 1–5 张，1280×800（或 640×400）PNG，按 `LISTING.md` 第 6 节的清单拍；**打码真实姓名 / 学号 / 同学名字 / 私信**；界面切英文。
- [ ] 小型宣传图 440×280（必填）。
- [ ] （可选）Marquee 1400×560。

## 4. 打包

- [ ] `node scripts/build-store.js --name "<新名字>"`（或改好 manifest 后直接 `npm run build:store`）。
- [ ] 看终端汇总：`permissions` 里没有 `webRequest`；`host_permissions` 里没有 `kaltura.com`；`optional_host_permissions` 已删除；排除列表里有 `src/gate.js`、`src/kaltura*.js`、`src/reader-*.js`、`src/anywhere.js`、`print/`、`tools/`。
- [ ] 本地试装商店版：`node scripts/build-store.js --no-zip`，在 `chrome://extensions` 里「加载已解压的扩展程序」选 `dist/store/`。检查：
  - [ ] 弹窗只有一页，没有「🔒 高级功能」标签，也没有「在所有网站启用助手」。
  - [ ] Canvas 页面右下角 📖 学习工具里没有「🎬 视频」标签。
  - [ ] 设置面板正常、助手能回答、Gradescope 同步正常、资料下载正常。
  - [ ] Service worker 控制台（chrome://extensions → 「Service worker」）没有红色报错（允许一条 `reader export not bundled` info）。
- [ ] zip 在 `dist/<name>-store-v<version>.zip`，解压后根目录直接是 `manifest.json`（不是套一层文件夹）。

## 5. 提交

- [ ] 后台 → New item → 上传 zip。
- [ ] **Store listing**：名称（来自 manifest）、简短描述（来自 manifest `__MSG_extDescription__`）、详细描述（`LISTING.md` 第 3 节）、分类 Education、语言 English、图标、截图、宣传图、官网 / 支持 URL。
- [ ] **Privacy practices**：单一用途说明（`LISTING.md` 第 5 节）；每项权限的说明（`PERMISSIONS.md` 逐条粘贴）；远程代码 = No；数据使用勾选按 `PERMISSIONS.md` 表格；三条声明全勾；隐私政策 URL。
- [ ] **Distribution**：Public；地区全部或仅美国；免费。
- [ ] Submit for review。

## 6. 审核预期

- 有 `scripting` + `webNavigation` + 12 个 host permission + `downloads`，**几乎一定进人工深度审核**，通常 3–10 个工作日（偶尔更久）。别在等待期间重复提交新版本，会重排队。
- 常见退回与对策：
  - *"Requesting a permission not needed"*：按 `PERMISSIONS.md` 回复，指出具体代码位置；`activeTab` 若被点名可直接去掉再提交。
  - *"Use of broad host permissions"*：解释 `*.instructure.com` 是因为 New Quizzes / 文件预览子域；AI 接口每个域只对应一个用户可选的服务商。
  - *"Description does not match functionality"*：确保描述里没有阅读器导出 / 视频下载 / 全站助手。
  - *"Impersonation"*：名字里不要有 PotatoCanvas；描述末尾保留 "Not affiliated with Rutgers University or Instructure"。
  - *"Missing privacy policy"*：URL 必须能匿名打开。
- 通过后新版本更新同样要过审，但通常快得多。

## 7. 发布后

- [ ] 在 GitHub Release 里同时发两个 zip：商店版（同商店）和完整版（原来的开发者模式 zip），README 写清区别。
- [ ] 观察后台「Reviews」和「Reports」；违规通知会发到注册邮箱，限期不回复会被下架。

---

## 政策风险评估（为什么商店版要砍功能）

对照 Chrome Web Store Program Policies（Deceptive Installation Tactics、Impersonation & Intellectual Property、Use of Permissions、Single Purpose、Code Readability、Privacy）和实际审核经验，逐项看仓库里现有的功能。**已按当前代码核实**（2026-09-09，`src/reader-export.js`、`src/kaltura.js`、`src/gate.js`、`src/background.js`、`popup/popup.js`）。

| 功能 | 代码位置 | 风险 | 判断 |
|---|---|---|---|
| **阅读器导出**（Pearson eText / Revel / EPUB 正文 → PDF / Markdown；选项里明写「破解打印限制（剔除 @media print）」、自动翻页到书末、图片内联） | `src/reader-export.js`、`src/reader-db.js`、`src/reader-links.js`、`print/`、弹窗「高级功能」 | **极高**。绕过出版商的打印 / 复制限制 = 规避内容保护、协助未授权复制（Intellectual Property 条款；也触及 DMCA 反规避）。出版商会投诉。同时它需要 `optional_host_permissions: https://*/*` 在任意网站注入脚本，与「Canvas 增强」的单一用途无关 | **不上架**。物理移除 |
| **讲座视频下载**（Kaltura playManifest MP4 直链、HLS 分段下载 + AES-128 解密、`webRequest` 监听 kaltura.com 请求） | `src/kaltura.js`、`src/kaltura-frame.js`（在 `*.kaltura.com` 以 MAIN world 注入）、`background.js` 的 webRequest 监听与 `bc-fetch` 代理 | **高**。下载受访问控制的流媒体 + 解密 HLS 是典型的「规避技术保护措施」；`webRequest` + 第三方域 host permission + MAIN world 注入都会被审核员单独盘问；Kaltura / 学校也可能投诉 | **不上架**。物理移除，同时去掉 `webRequest` 权限和 `kaltura.com` host permission |
| **小时密码解锁门**（HMAC 密码，输对后本机绑定，功能藏在「🔒 高级功能」后） | `src/gate.js`、`tools/gate-password/`、`popup/popup.js` | **高**。审核员无法触达被密码挡住的功能 = "hidden / obfuscated functionality"，直接违反 "all functionality must be discoverable and reviewable"；即便功能本身没问题也会被退回要求提供测试密码，而提供了之后又暴露上面两条 | **不上架**。移除 gate.js 与整个分页 |
| **「在所有网站启用助手」**（`optional_host_permissions: https://*/*`，动态注册全站内容脚本） | `manifest.json`、`popup/popup.js`、`background.js registerAnywhere`、`src/anywhere.js` | **中高**。可选权限比必需权限好，但 `<all_urls>` 级别的 host permission 是审核的头号触发点，需要证明与单一用途强相关；「在任意网站用 AI 助手」和「Rutgers Canvas 增强」明显是两个用途 | **商店版移除**（删 `optional_host_permissions`，弹窗里不显示开关，后台拒绝注册）。副作用见下 |
| 助手 **自定义 Base URL**（任意 OpenAI 兼容接口，设置里「授权域名」按钮走 `chrome.permissions.request`） | `src/settings-ui.js`、`background.js bc-permission` | 依赖同一个 `optional_host_permissions: https://*/*` | 商店版里删掉该权限后，**自定义 Base URL 只能用已在 host_permissions 里的域名**（10 家官方接口都在）；「授权域名」按钮会返回未授权。如果一定要保留自定义接口，可在商店版保留 `optional_host_permissions`（改成只在用户填 URL 时申请单个域），审核风险比全站注册脚本低得多，但仍会被问；本次先不保留 |
| `scripting` + `webNavigation`（New Quizzes iframe 注入） | `background.js` QUIZ_FRAME_FILES | **中**。合理用途，但两者组合会触发深度审核；范围限定 `*.instructure.com` 且不加载远程代码，可解释 | 保留，写清理由 |
| 12 个 host permission（Canvas、Gradescope、10 个 AI 接口） | `manifest.json` | **中**。每个域单独解释；AI 接口都是用户自带 key 的直连 | 保留，`PERMISSIONS.md` 已逐条写 |
| `downloads`、`alarms`、`unlimitedStorage`、`activeTab` | 资料下载、Gradescope 保活、知识库、截图 | 低 | 保留；`activeTab` 可有可无，被点名就删 |
| 学习助手（AI 答题） | `src/assistant.js`、`src/study.js` | 低–中。审核不管学术诚信，但要避免被描述成 "quiz answer bot"；代码里已经在作答页屏蔽 | 保留；描述里强调「作答页禁用」 |
| 名称 | `manifest.json` | 已改为 PotatoCanvas，与现有扩展不重名 | 已处理；文案里勿再提旧名 |
| Gradescope 抓取（带 cookie 请求第三方站点） | `background.js gsFetch*`、`src/gradescope-scrape.js` | 低–中。读用户自己的数据、不改动、不外传；要在隐私政策和权限说明里写明 | 保留 |

**总结**：完整版里的四项（阅读器导出、视频下载、解锁门、全站启用）任何一项都足以被拒，且前两项还有版权投诉与下架风险，一旦被判定为规避内容保护，整个开发者账号可能被封（连带商店版）。所以商店版必须在 **zip 里根本不含这些代码**，而不是仅仅关掉开关——审核是读代码的，源码里留着「破解打印限制」这种字符串一样会被抓。完整版继续放 GitHub Release 供开发者模式加载。

`scripts/build-store.js` 就是这套裁剪的自动化；`src/background.js`、`popup/popup.js`、`src/study.js` 里的 `STORE_EDITION` / `HAS_READER` / `BC.kaltura &&` 守卫保证同一份源码在文件缺失时不报错，不需要维护两个分支。
