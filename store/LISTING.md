# Chrome Web Store 商品信息（商店版 / core edition）

本文件是开发者后台「商品信息（Store listing）」各栏的现成文案。商店版由 `node scripts/build-store.js` 打出，**不含**阅读器导出、讲座视频下载、解锁门和「在所有网站启用」——下面的描述只写商店版里有的功能，别把 README 里的高级功能抄进去（描述与实际功能不符本身就是拒审理由）。

---

## 1. 名称（Name）

**PotatoCanvas**（已写进 `manifest.json`、`_locales`、弹窗标题、下载目录名，打包脚本无需再传 `--name`）。

> 注意：旧名 "Better Canvas" 是 Chrome Web Store 上另一位作者的知名扩展，不要在名称、简介或截图里再出现，否则会被判定为冒用。名称也不要含 "Rutgers University" 官方全称或校徽；描述里 "for Rutgers" 这类描述性用法可以。

## 2. 简短描述（Summary，≤ 132 字符）

已写进 `_locales/*/messages.json` 的 `extDescription`，商店按浏览器语言显示。

**en**（125 字符）：

```
PotatoCanvas: a heartier Canvas LMS. Grades on cards, exam countdowns, due dates, message alerts, themes, and a study helper.
```

**zh_CN**（58 字符）：

```
PotatoCanvas：更顶饱的 Canvas。卡片成绩、期中期末倒计时、截止提醒、消息高亮、主题美化、学习助手。
```

## 3. 详细描述（Description）

> 商店后台提示「请着重说明该内容的用途以及用户为何应该安装它」：先讲用途，再讲安装理由，最后列功能；带一点 PotatoCanvas 的土豆味。直接整段粘贴。

### English

```
WHAT IT IS
PotatoCanvas is a browser extension that turns the Canvas LMS dashboard into your semester's command center. It works on any school's Canvas site (*.instructure.com). Plain Canvas hands you a grid of course cards and makes you dig into each one to find your grade, your next deadline or your midterm date. PotatoCanvas digs those up for you and lays them out on the dashboard, so one glance answers "how am I doing, what is due, and when are my exams?" Small, filling, and it goes with everything.

WHY INSTALL IT
• Save clicks every day. Grades, due dates, exam dates, unread announcements and today's classes are visible the moment Canvas opens. No more opening five courses to check five things.
• Never miss an exam. Midterm and final dates are found automatically in each syllabus and calendar and shown as a countdown, sorted by "this week / two weeks / a month / later".
• Know where you stand. Every course card shows your current total, an estimated GPA and the class average with your distance from it, using the statistics Canvas already publishes.
• Catch the messages that matter. A bell on each course shows unread announcements and inbox messages; room changes, cancelled classes, quizzes and deadline changes are highlighted automatically.
• Study smarter with your own AI key. Ask for a hint, a worked solution or an explanation on any page, build flashcards and practice quizzes from your course files, and keep a personal question bank. You pick the provider; the key never leaves your browser.
• Dress Canvas your way. Ten preset themes, from a calm dark mode to a pixel-art night sky (yes, there is a Marathon theme with a potato watermark), plus fully custom colors and backgrounds.
• Private by design. No account, no server, no tracking. Everything runs in your own Canvas session; nothing is sent to the developer. Potatoes do not phone home.

WHAT YOU GET
Dashboard panels (toggle and reorder): due this week, GPA estimate, midterm/final countdown, professor absence notices, latest announcements and inbox messages, today's classes (from the Canvas calendar or a manual timetable), and a sidebar of quick links you can edit.

For Rutgers students there are a few extras: import your WebReg schedule PDF for today's classes, section badges parsed from Rutgers course codes, and a preset list of Rutgers links (WebReg, Degree Navigator, myRutgers, term bill, buses, dining, Handshake). Everything else works the same on any Canvas.

Course cards: total grade (percent and letter), GPA estimate, class average with min–max range, section number, and a message bell with unread count.

Gradescope sync: log in to gradescope.com once; PotatoCanvas fills your Gradescope scores into ungraded assignments' what-if grades on the Canvas Grades page. Existing grades are never changed.

Study assistant (bring your own API key): double-click a paragraph, select text, right-click or press Alt+Shift+A for hints, solutions, concept explanations or translations; screenshot a region for formulas and figures. The study drawer adds page chat, a local knowledge base built from your own course files, flashcards with spaced repetition, practice quizzes, and one-click course file download with AI summaries. Works with Claude, OpenAI, Gemini, DeepSeek, Kimi, Qwen, GLM, Grok, Groq and OpenRouter. The assistant stays switched off on quiz-taking pages and inside any form you are answering.

Themes: Minimal, Fresh, Dark, Mono, Pixel, Marathon, Seasons, Sunrise/Sunset, Cyberpunk, Hacker, plus custom accent color, sidebar color, background image and card style. Themes also cover the calendar, Files, Assignments, Modules and Grades pages.

Bilingual interface (English / 中文) that follows your browser language. A short onboarding page and an in-page tour get you set up in two minutes.

GOOD TO KNOW
• Requires the classic card dashboard ("Switch to old dashboard view").
• GPA and class-range figures are estimates; grading scales differ by professor.
• Privacy policy: https://github.com/ISmkuI/better-canvas-rutgers/blob/main/store/PRIVACY.md
• Open source: https://github.com/ISmkuI/better-canvas-rutgers
• Not affiliated with Instructure or any university. Affiliated with potatoes only in spirit.
```

### 中文

```
这是什么
PotatoCanvas 是一个浏览器扩展，把 Canvas 的仪表盘变成你这学期的「总控台」，任何学校的 Canvas（*.instructure.com）都能用。原版 Canvas 只给你一排课程卡片，想看成绩、下一个截止日期或期中考试日期，得一门一门点进去刨。PotatoCanvas 替你把这些都刨出来摆到仪表盘上，打开 Canvas 一眼就能回答三个问题：我现在成绩怎么样？有什么要交？考试什么时候？土豆嘛，不起眼，但顶饱。

为什么值得安装
• 每天少点很多次。成绩、截止日期、考试日期、未读公告、今天的课，打开 Canvas 的那一刻全在眼前，不用再为了查五件事点开五门课。
• 不再错过考试。期中 / 期末日期自动从每门课的 Syllabus 和日历里识别，按「本周 / 两周内 / 一个月内 / 更远」排成倒计时。
• 随时知道自己处在什么位置。每张课程卡片显示当前总评、GPA 估算、班级均分以及你比平均高多少或低多少，数据来自 Canvas 本来就公开的统计。
• 重要消息不漏。每门课一个铃铛显示未读公告和私信；换教室、停课、测验、截止日期变动会自动高亮。
• 用自己的 AI key 学得更聪明。任何页面上都能要思路、解答或概念讲解，用课程资料生成闪卡和练习题，把错题存进自己的题库。服务商由你选，key 只留在你的浏览器里。
• 把 Canvas 穿成你喜欢的样子。十套预设主题，从护眼深色到像素风夜景（对，马拉松主题里真的有土豆水印），也支持完全自定义颜色和背景。
• 从设计上就保护隐私。没有账号、没有服务器、没有统计。所有功能在你自己的 Canvas 会话里运行，不向开发者发送任何数据。土豆不打小报告。

具体包含
仪表盘面板（可开关、可排序）：本周截止作业、GPA 估算、期中 / 期末倒计时、教授请假提醒、最新公告与私信、今日课程（Canvas 日历或手填课表）、右侧栏可自行编辑的常用网站导航。

Rutgers 的同学另有几项加料：导入 WebReg 课表 PDF 生成今日课程、按 Rutgers 课号解析的 Section 徽标、预置的 Rutgers 常用链接（WebReg、Degree Navigator、myRutgers、学费账单、校车、食堂、Handshake）。其余功能在任何学校的 Canvas 上都一样。

课程卡片：总评（百分比 + 字母）、GPA 估算、班级均分与最差–最好范围、Section 号，以及带未读计数的消息铃铛。

Gradescope 成绩同步：在 gradescope.com 登录一次，打开 Canvas Grades 页时 PotatoCanvas 自动把 Gradescope 分数填进未评分作业的 what-if 预估分。已有成绩不会被改动。

学习助手（自带 API key）：双击段落、选中文字、右键或按 Alt+Shift+A 获取思路、解答、概念讲解或翻译；公式和图表可框选截图一起问。学习工具抽屉提供页面对话、用你自己的课程资料建的本地知识库、闪卡 + 间隔重复、练习题自测、课程资料一键下载和 AI 总结。支持 Claude、OpenAI、Gemini、DeepSeek、Kimi、通义千问、智谱 GLM、Grok、Groq、OpenRouter。测验作答页和任何正在作答的表单里助手一律不激活。

主题：简约、清新、暗夜、黑白、像素风、马拉松、春夏秋冬、日出日落、赛博朋克、黑客，另有自定义强调色、侧栏颜色、背景图和卡片风格。日历页、Files、Assignments、Modules、Grades 页面同样跟随主题。

界面中英双语，跟随浏览器语言。安装引导页和页内导览两分钟就能设置好。

需要知道
• 需要使用经典卡片仪表盘（"Switch to old dashboard view"）。
• GPA 和班级范围均为估算，不同教授的评分线不同。
• 隐私政策：https://github.com/ISmkuI/better-canvas-rutgers/blob/main/store/PRIVACY.md
• 开源：https://github.com/ISmkuI/better-canvas-rutgers
• 与 Instructure 及任何学校均无关联。和土豆的关系仅限精神层面。
```

## 4. 分类 / 语言

- **Category**：Education
- **Language**：English（主）；中文界面通过 `_locales/zh_CN` 提供，商品信息可再加一份 zh-CN 本地化（后台「添加语言」后粘上面的中文）。
- **可见性**：Public。**地区**：全部（或只选 United States——用户几乎都在美国，缩小范围不影响审核）。

## 5. 单一用途说明（Single purpose description）

后台会问 "What is the single purpose of this extension?"，填：

```
Enhances the Canvas learning-management site (*.instructure.com) for the logged-in student: visual themes, grade and class-statistics summaries on course cards, dashboard panels (due dates, exam countdown, messages, today's classes), Gradescope grade import, and an optional study assistant that uses the student's own AI API key. All features act on the student's own Canvas data.
```

（一句话版本：*"Adds themes, grade summaries, dashboard panels and a study assistant to Canvas LMS."*）

## 6. 截图清单（1280×800 或 640×400，PNG/JPEG，1–5 张）

拍之前：用一个**没有真实姓名 / 学号 / 邮箱**的账号，或者拍完把姓名、课程里同学的名字、私信内容打码。界面语言先切成英文（审核员看得懂）。

| # | 画面 | 怎么拍 |
|---|---|---|
| 1 | **仪表盘全景**：暗夜或简约主题 + 卡片成绩小框 + 「本周截止 / GPA / 期中期末倒计时 / 最新消息」面板 | 经典卡片视图仪表盘，浏览器窗口 1280×800，`Ctrl+Shift+P` → "Capture screenshot" 或系统截图 |
| 2 | **卡片成绩特写**：一张课程卡片 + 右边的总评 / GPA / 班级均分 / Section 小框，悬停显示班级范围 tooltip | 放大 125% 再截，裁成 1280×800 |
| 3 | **期中期末倒计时**：整行面板，四个时间段各有条目，图例可见；右键编辑菜单打开着更好 | 先在设置里手动加 3–4 条考试 |
| 4 | **主题画廊**：设置面板「外观」顶部的预设主题画廊，背后是像素风或日出日落主题 | 点 ⚙ 打开设置面板 |
| 5 | **学习助手浮窗**：选中一段作业说明后弹出的「💡 思路 / ✅ 解答 / 📖 概念 / 🌐 翻译」浮窗，带一段回答 | 用一个非测验页（Page / Assignment 说明）；回答内容别涉及真实考题 |

可选第 6 张：📖 学习工具抽屉的闪卡或知识库标签。

- **小型宣传图（Promo tile）440×280**：必填。扩展图标 + 名字即可（底色随意，别用学校校徽），不要放截图缩略图（会糊）。
- **Marquee 1400×560**：可选，不做。

## 7. 其它栏

- **官方网址**：GitHub 仓库地址。
- **支持网址**：GitHub Issues 地址。
- **隐私政策网址**：把 `store/PRIVACY.md` 托管后的地址（GitHub Pages / 仓库里的 raw 文件都可以，必须是可公开访问的 URL）。
- **Mature content**：No。
- **联系邮箱**：开发者后台要求验证一个联系邮箱，用能长期收信的地址。
