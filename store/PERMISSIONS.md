# 权限说明（开发者后台「隐私权规范 / Privacy practices」页的填写稿）

后台会对 manifest 里的**每一项**权限和 host permission 要求一段英文说明（"Permission justification"），再问远程代码和数据使用。下面是商店版（`scripts/build-store.js` 生成的 `dist/store/manifest.json`）的最终权限与对应文案，直接粘贴。**只写商店版实际用到的理由**——审核员会在代码里核对，理由对不上号是常见的拒审原因。

商店版最终权限：

```
permissions:       storage, unlimitedStorage, downloads, scripting, webNavigation, activeTab, alarms
host_permissions:  https://*.instructure.com/*, https://*.gradescope.com/*,
                   https://api.anthropic.com/*, https://api.openai.com/*, https://generativelanguage.googleapis.com/*,
                   https://api.deepseek.com/*, https://api.moonshot.cn/*, https://dashscope.aliyuncs.com/*,
                   https://open.bigmodel.cn/*, https://api.x.ai/*, https://api.groq.com/*, https://openrouter.ai/*
optional_host_permissions: （无）
```

（完整版另有 `webRequest`、`https://*.kaltura.com/*`、`optional_host_permissions: https://*/*`，商店版已移除，不要出现在表单里。）

---

## Permission justifications（英文，逐条粘贴）

### `storage`

```
Stores the user's settings (theme, panel layout, keywords, exam dates, timetable), the AI provider API key the user typed in, and short-lived caches of the user's own Canvas grades and messages, all in chrome.storage.local on the device. Nothing is synced or sent to the developer.
```

### `unlimitedStorage`

```
The study tools let the user add their own course materials (PDF / PPTX / DOCX text extracted locally), flashcards and a saved question bank to a local "knowledge base". A single course's slides can exceed the default 10 MB storage quota, so the extension needs unlimited local storage. All of it stays on the device.
```

### `downloads`

```
The "Course files" tab lists the files of the current Canvas course and offers one-click download of a file or the whole folder into Downloads/<extension name>/<course>/. chrome.downloads.download is used to save those Canvas file URLs with a folder name; the user triggers every download explicitly. Study summaries and flashcards can also be exported as Markdown files the same way.
```

### `scripting`

```
Canvas "New Quizzes" run inside a cross-origin iframe (https://*.quiz-lti-*.instructure.com). Manifest content scripts only load in the top frame, so when webNavigation reports that frame has finished loading, the extension uses chrome.scripting.executeScript / insertCSS to inject the same study-assistant and study-tools scripts that already run on the top-level Canvas page. Injection is limited to *.instructure.com frames and the scripts are bundled in the package (no remote code). Inside quiz-taking screens the assistant disables itself.
```

### `webNavigation`

```
Used only to receive the onCompleted event for Canvas "New Quizzes" iframes (host filter: quiz-lti*.instructure.com / quizzes.next) so the study tools can be injected into that frame after it loads. No browsing history is read or stored.
```

### `activeTab`

```
The study assistant has a screenshot button: when the user presses it, the extension captures the visible area of the current tab (chrome.tabs.captureVisibleTab), lets the user draw a rectangle, and attaches only that region to the question the user is asking their AI provider. Nothing is captured without the user's click.
```

（如果审核员追问 "activeTab isn't needed since you have host permission for instructure.com"，可以在下一版直接去掉这项，功能不受影响；截图只在 Canvas 页面上用。）

### `alarms`

```
A single 6-hour alarm ("bc-gs-keepalive") re-fetches https://www.gradescope.com/account with the user's existing cookies so the Gradescope session stays logged in for grade sync. The user can turn this off in Settings (Gradescope → background keep-alive); no other alarms are created.
```

### Host permission: `https://*.instructure.com/*`

```
This is the Canvas site the extension enhances. Content scripts restyle the dashboard and read the user's own courses, grades, class score statistics, planner items, announcements, inbox messages, calendar events and course files through the Canvas REST API of the logged-in session, to render grade badges, dashboard panels, exam countdowns and the message bell. The pattern is *.instructure.com rather than rutgers.instructure.com only because Canvas serves New Quizzes and file previews from other instructure.com subdomains.
```

### Host permission: `https://*.gradescope.com/*`

```
Gradescope grade sync: a content script on gradescope.com course pages reads the user's own assignment scores, and the background service worker fetches www.gradescope.com/account and /courses/<id> with the user's existing cookies. The scores are matched by assignment name and entered into the "what-if" grade fields on the Canvas Grades page. Existing Canvas grades are never modified and no Gradescope data leaves the browser.
```

### Host permissions: AI provider endpoints

`https://api.anthropic.com/*`, `https://api.openai.com/*`, `https://generativelanguage.googleapis.com/*`, `https://api.deepseek.com/*`, `https://api.moonshot.cn/*`, `https://dashscope.aliyuncs.com/*`, `https://open.bigmodel.cn/*`, `https://api.x.ai/*`, `https://api.groq.com/*`, `https://openrouter.ai/*` — 每一条都填同一段（把 "<provider>" 换成对应名字）：

```
The optional study assistant sends the user's question (selected text, page excerpt, optionally a screenshot region) to the AI provider the user selected, authenticated with the user's own API key. Content scripts cannot call cross-origin APIs, so the request is made from the background service worker, which needs host permission for that provider's API endpoint. Only the endpoint of the provider the user picked is ever contacted; the extension has no server of its own. <provider>: <endpoint>.
```

---

## 远程代码（Remote code）

后台问 "Are you using remote code?" → **No, I am not using remote code.**

理由（如需填写）：

```
All JavaScript is bundled in the extension package. The extension does not load scripts from external URLs, does not use eval / new Function on downloaded strings, and does not inject <script src> tags pointing outside the package. The only network requests are Canvas / Gradescope API and page fetches and the user's own AI provider API calls, all of which return data, not code.
```

（`chrome.scripting.executeScript` 用的都是 `files: [...]` 包内文件；`func:` 形式只探测 `window.BC.assistant` 是否存在。）

## 数据使用披露（Data usage）

"What user data do you plan to collect?" 里逐项勾选（勾了就必须在隐私政策里对应写明；PRIVACY.md 已覆盖）：

| 类别 | 勾选 | 说明 |
|---|---|---|
| Personally identifiable information | **Yes** | Canvas 账户里的姓名 / 课程会被读取用于显示（不上传给开发者）。保守起见勾上并在说明里写清楚"processed locally; not transmitted to the developer" |
| Health information | No | |
| Financial and payment information | No | |
| Authentication information | **Yes** | 用户自己填写的 AI API key 存在本机；Gradescope 用的是浏览器已有 cookie（不读取、不保存密码） |
| Personal communications | **Yes** | Canvas 公告 / 收件箱私信用于消息铃铛和面板（本机） |
| Location | No | |
| Web history | No | webNavigation 只监听 Canvas 的 iframe 加载事件，不记录 |
| User activity | No | 无点击 / 行为统计 |
| Website content | **Yes** | Canvas 页面正文、成绩、课程文件；用户主动提问时选中的文字 / 截图发给用户自选的 AI 服务商 |

三条声明（必须全勾才能提交）：

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

> 关于「发给 AI 服务商」是否算 "transfer to third parties"：它属于 approved use case——由用户主动发起、为实现用户请求的功能（"providing or improving a user-facing feature"）、且是用户自己选定并持有 key 的服务。在隐私政策和商品描述里写明即可（已写）。

## 单一用途 / 数据用途说明（Certification）

最后一页的 "Single purpose" 见 `LISTING.md` 第 5 节；"Data usage" 说明可填：

```
Reads the logged-in student's own Canvas and Gradescope data to display it on the Canvas dashboard and, only on explicit user action, sends the student's selected text or screenshot to the AI provider the student configured with their own API key. No data is sent to the developer.
```
