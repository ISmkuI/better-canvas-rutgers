# 开发者后台逐字段填写表（按页面顺序）

> 打开 https://chrome.google.com/webstore/devconsole → 你的商品。左侧四个页签依次填。每一栏对应下面一个代码块，整段复制粘贴即可。
> 名称和简短说明来自上传的 zip（manifest + _locales），后台里不可编辑，只要 zip 对就自动带出。

---

## 页签 1：软件包（Package）

- 上传 `dist/potatocanvas-store-v0.2.0.zip`（先跑 `node scripts/build-store.js`）。
- 上传后确认页面显示：名称 **PotatoCanvas**、版本 **0.2.0**、简短说明以 "PotatoCanvas: a heartier Canvas LMS." 开头。

---

## 页签 2：商品详情（Store listing）

### 商品说明 → 详细说明（Description）

英文（默认语言）：

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

如果后台「添加语言 → 中文（简体）」，中文版详细说明：

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

把两段里的 `https://github.com/ISmkuI/better-canvas-rutgers/blob/main/store/PRIVACY.md` 和 `https://github.com/ISmkuI/better-canvas-rutgers` 换成真实链接。

### 类别（Category）

- 类别：**教育 / Education**
- 语言：**English**（中文界面由 `_locales/zh_CN` 提供，不用另选）

### 图形资源（Graphic assets）

| 栏位 | 文件（都在 `store/assets/`） |
|---|---|
| 商品图标 128×128 | 自动取自 zip 里的 `icons/icon128.png`，不用传 |
| 全球通用的屏幕截图 ×5（1280×800） | `screenshot-1-dashboard-1280x800.png` … `screenshot-5-flashcards-1280x800.png`，按 1→5 顺序拖入 |
| 小型宣传图块 440×280 | `promo-small-440x280.png` |
| 顶部宣传图块 1400×560 | `promo-marquee-1400x560.png` |

### 其他字段（Additional fields）

- 官方网址 / 主页：GitHub 仓库地址
- 支持网址：GitHub 仓库的 Issues 页
- 成人内容（Mature content）：**否**

---

## 页签 3：隐私权规范（Privacy practices）

### 单一用途（Single purpose）

```
Enhances the Canvas learning-management site (*.instructure.com) for the logged-in student: visual themes, grade and class-statistics summaries on course cards, dashboard panels (due dates, exam countdown, messages, today's classes), Gradescope grade import, and an optional study assistant that uses the student's own AI API key. All features act on the student's own Canvas data.
```

### 权限理由（Permission justification）—— 每项一栏

#### storage

```
Stores the user's settings (theme, panel layout, keywords, exam dates, timetable), the AI provider API key the user typed in, and short-lived caches of the user's own Canvas grades and messages, all in chrome.storage.local on the device. Nothing is synced or sent to the developer.
```

#### unlimitedStorage

```
The study tools let the user add their own course materials (PDF / PPTX / DOCX text extracted locally), flashcards and a saved question bank to a local "knowledge base". A single course's slides can exceed the default 10 MB storage quota, so the extension needs unlimited local storage. All of it stays on the device.
```

#### downloads

```
The "Course files" tab lists the files of the current Canvas course and offers one-click download of a file or the whole folder into Downloads/<extension name>/<course>/. chrome.downloads.download is used to save those Canvas file URLs with a folder name; the user triggers every download explicitly. Study summaries and flashcards can also be exported as Markdown files the same way.
```

#### scripting

```
Canvas "New Quizzes" run inside a cross-origin iframe (https://*.quiz-lti-*.instructure.com). Manifest content scripts only load in the top frame, so when webNavigation reports that frame has finished loading, the extension uses chrome.scripting.executeScript / insertCSS to inject the same study-assistant and study-tools scripts that already run on the top-level Canvas page. Injection is limited to *.instructure.com frames and the scripts are bundled in the package (no remote code). Inside quiz-taking screens the assistant disables itself.
```

#### webNavigation

```
Used only to receive the onCompleted event for Canvas "New Quizzes" iframes (host filter: quiz-lti*.instructure.com / quizzes.next) so the study tools can be injected into that frame after it loads. No browsing history is read or stored.
```

#### activeTab

```
The study assistant has a screenshot button: when the user presses it, the extension captures the visible area of the current tab (chrome.tabs.captureVisibleTab), lets the user draw a rectangle, and attaches only that region to the question the user is asking their AI provider. Nothing is captured without the user's click.
```

#### alarms

```
A single 6-hour alarm ("bc-gs-keepalive") re-fetches https://www.gradescope.com/account with the user's existing cookies so the Gradescope session stays logged in for grade sync. The user can turn this off in Settings (Gradescope → background keep-alive); no other alarms are created.
```

#### 需请求主机权限的理由（后台只有一栏，上限 1000 字符，把所有域名合在一段）

```
*.instructure.com: the Canvas site this extension enhances. Content scripts restyle the dashboard and read the logged-in student's own courses, grades, class statistics, planner items, announcements, inbox and course files via the Canvas REST API to show grade badges, dashboard panels, exam countdowns and a message bell. Wildcard needed because New Quizzes and file previews load from other instructure.com subdomains.

*.gradescope.com: optional grade sync. Reads the user's own Gradescope scores (existing session) and fills them into what-if grades on the Canvas Grades page. Existing grades are never changed; nothing leaves the browser.

AI endpoints (anthropic, openai, googleapis, deepseek, moonshot, dashscope, bigmodel, x.ai, groq, openrouter): the optional study assistant sends text the user explicitly asks about to the one provider the user chose, with the user's own API key. Cross-origin calls must come from the background worker, hence host permission. No developer server.
```

### 是否使用远程代码（Remote code）

选 **否，我不使用远程代码**。如有说明栏：

```
All JavaScript is bundled in the extension package. The extension does not load scripts from external URLs, does not use eval / new Function on downloaded strings, and does not inject <script src> tags pointing outside the package. The only network requests are Canvas / Gradescope API and page fetches and the user's own AI provider API calls, all of which return data, not code.
```

### 数据使用（Data usage）—— 勾选项

| 类别 | 勾 |
|---|---|
| 个人身份信息 Personally identifiable information | ✅ |
| 健康信息 | ☐ |
| 财务和付款信息 | ☐ |
| 身份验证信息 Authentication information | ✅ |
| 个人通信 Personal communications | ✅ |
| 位置 | ☐ |
| 网络历史记录 | ☐ |
| 用户活动 | ☐ |
| 网站内容 Website content | ✅ |

三条声明全部勾选：不出售 / 不用于无关用途 / 不用于信用评估。

数据用途说明（如有栏位）：

```
Reads the logged-in student's own Canvas and Gradescope data to display it on the Canvas dashboard and, only on explicit user action, sends the student's selected text or screenshot to the AI provider the student configured with their own API key. No data is sent to the developer.
```

### 隐私权政策网址（Privacy policy URL）

把 `store/PRIVACY.md` 填好 `ISmkuI`、`<CONTACT EMAIL>`、`https://github.com/ISmkuI/better-canvas-rutgers` 后放到 GitHub，粘贴该文件的公开链接（形如 `https://github.com/<user>/<repo>/blob/main/store/PRIVACY.md`）。

---

## 页签 4：分发（Distribution）

- 付款：**免费**
- 可见性：**公开**
- 分发地区：**所有地区**（或只选 United States）

---

## 提交前

- 右上角「保存草稿」，再点「提交审核」。首次提交因为有 `scripting` + 多个 host permission，通常进入人工审核，1–7 天。
- 提交后右上角会问是否「审核通过后自动发布」，选是。
- 被打回时，审核邮件会指出具体权限 / 描述条目，把原文贴给我再改。
