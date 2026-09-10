# Privacy Policy — PotatoCanvas

_Last updated: 2026-09-09_

This page is the privacy policy for the browser extension **PotatoCanvas** (the "Extension"), published in the Chrome Web Store. Host this file at a public URL and paste that URL into the "Privacy policy" field of the developer dashboard. 中文版见下方。

## Summary

- The Extension has **no server, no account system and no analytics**. The developer never receives any of your data.
- All data the Extension reads stays **in your browser** (`chrome.storage.local`) unless you explicitly ask the study assistant a question, in which case the text you selected (and, if you chose to, a screenshot region) is sent **directly to the AI provider you configured with your own API key**.
- You can delete everything at any time by removing the Extension or using the "Clear data cache" button.

## What the Extension accesses and why

| Data | Where it comes from | What it is used for | Where it goes |
|---|---|---|---|
| Your Canvas courses, assignments, grades, class score statistics, planner items, announcements, inbox messages, calendar events, course files and page content | The Canvas REST API and pages of `*.instructure.com`, using the session you are already logged in to | Themes, grades on course cards, dashboard panels, exam countdown, message bell, study tools | Stays in your browser. Cached for a few minutes in `chrome.storage.local` |
| Your Gradescope course and assignment scores | Pages of `gradescope.com`, fetched with the cookies of your existing Gradescope login | Filling your Gradescope scores into Canvas "what-if" grades | Stays in your browser |
| Text you select or double-click, page text of the current Canvas page, files you add to the knowledge base, and (only if you press the screenshot button) an image of the screen region you drew | The page you are on / files you chose | Answering the question you asked the study assistant | Sent **only when you explicitly ask a question**, directly from the Extension to the AI provider you chose (see list below). Never sent to the developer |
| Your AI provider API key, model name and optional custom Base URL | Typed by you in Settings | Authenticating your requests to that provider | Stored only in `chrome.storage.local` on your device. Sent only to that provider as part of your requests |
| Settings, question bank, flashcards, knowledge-base materials, exam dates, timetable | Created by you | The features above | `chrome.storage.local` on your device only |

### AI providers

The study assistant is optional and does nothing until you enter an API key. Requests go directly to the provider you select — one of Anthropic (`api.anthropic.com`), OpenAI (`api.openai.com`), Google (`generativelanguage.googleapis.com`), DeepSeek (`api.deepseek.com`), Moonshot/Kimi (`api.moonshot.cn`), Alibaba Qwen (`dashscope.aliyuncs.com`), Zhipu (`open.bigmodel.cn`), xAI (`api.x.ai`), Groq (`api.groq.com`) or OpenRouter (`openrouter.ai`). Your use of that provider is governed by **that provider's** privacy policy and terms; the Extension does not add any proxy in between.

### Screenshots

The screenshot feature captures only the visible area of the current tab, only when you press the screenshot button, and only the region you then draw. The image is attached to that one question and is not stored.

## What the Extension does NOT do

- It does not collect, transmit or sell personal information to the developer or any third party.
- It does not use analytics, crash reporting, advertising or tracking of any kind.
- It does not read data from websites other than `*.instructure.com`, `*.gradescope.com` and the AI provider endpoints listed above.
- It does not modify grades or submit anything on your behalf. Gradescope sync only edits the client-side "what-if" fields Canvas already offers.
- It does not run on quiz-taking pages; the assistant is disabled while you are answering a quiz or any form.
- It does not load remote code. All code is contained in the extension package.

## Data retention and deletion

- Cached Canvas / Gradescope data expires automatically (grades and messages after 5 minutes; Gradescope pages after 10 minutes).
- Everything else (settings, API key, question bank, flashcards, knowledge base) is kept in `chrome.storage.local` until you delete it: use "Clear data cache" in the toolbar popup, delete items inside the Extension's own UI, or uninstall the Extension, which removes all its storage.
- The developer holds no copy of any of it and therefore cannot access, restore or delete it for you.

## Permissions

A per-permission explanation is in the store listing and in the project repository (`store/PERMISSIONS.md`). In short: `storage` / `unlimitedStorage` keep your settings and study materials locally; `downloads` saves course files you click; `scripting` and `webNavigation` let the study tools work inside Canvas's New Quizzes frame; `alarms` refreshes the Gradescope login session; `activeTab` is used for the screenshot feature; host permissions are limited to Canvas, Gradescope and the AI provider endpoints.

## Children

The Extension is intended for university students and is not directed at children under 13.

## Changes

If this policy changes, the updated version will be published at the same URL with a new "Last updated" date.

## Contact

Developer: `ISmkuI` — `<CONTACT EMAIL>` — `https://github.com/ISmkuI/better-canvas-rutgers` (open an issue for questions).

---

# 隐私政策（中文）

**PotatoCanvas**（下称「本扩展」）没有服务器、没有账号系统、没有统计埋点，开发者不会收到你的任何数据。

**本扩展读取什么、用来做什么、发到哪里**

- **Canvas 数据**（课程、作业、成绩、班级统计、Planner、公告、私信、日历、课程文件、页面正文）：通过你已登录的 `*.instructure.com` 会话和 Canvas REST API 读取，用于主题、卡片成绩、仪表盘面板、考试倒计时、消息铃铛、学习工具。只留在你的浏览器里，缓存几分钟后过期。
- **Gradescope 成绩**：用你已有的 gradescope.com 登录 cookie 抓取，用于填进 Canvas 的 what-if 预估分。只留在你的浏览器里。
- **你选中的文字、当前页面正文、你加进知识库的文件，以及（只在你按截图按钮时）你框选的屏幕区域**：只在你**主动提问**时，由扩展直接发给**你自己配置的 AI 服务商**（Anthropic / OpenAI / Google / DeepSeek / Kimi / 通义千问 / 智谱 / xAI / Groq / OpenRouter 之一），中间没有任何代理，也不会发给开发者。该服务商如何处理数据以其隐私政策为准。
- **API key、模型名、自定义 Base URL**：你在设置里填写，只存在本机 `chrome.storage.local`，只随你的请求发给该服务商。
- **设置、题库、闪卡、知识库、考试日期、课表**：只存在本机。

**本扩展不做什么**：不收集 / 上传 / 出售个人信息；无统计、无广告、无追踪；不读取 Canvas、Gradescope、上述 AI 接口以外的网站；不代替你提交任何内容、不改动真实成绩；测验作答页和任何正在作答的表单里助手不激活；不加载远程代码。

**保留与删除**：Canvas / Gradescope 缓存 5–10 分钟自动过期；其余数据保存在本机直到你删除——弹窗里「清除数据缓存」、在扩展界面里逐条删除，或卸载扩展（会清空全部存储）。开发者没有任何副本，无法替你查看、恢复或删除。

**联系方式**：`ISmkuI` — `<CONTACT EMAIL>` — `https://github.com/ISmkuI/better-canvas-rutgers`。
