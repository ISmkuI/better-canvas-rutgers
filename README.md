# PotatoCanvas

给 Rutgers Canvas 用的 Chromium 浏览器扩展（Chrome / Edge / Opera GX 通用，Manifest V3）。

## 功能

> **界面语言**：默认跟随浏览器 / 系统语言（中文系统显示中文，其它显示英文），设置面板「外观」顶部的「界面语言 / Language」可手动固定。助手的回答语言默认也跟随界面语言，可在「助手」里单独改。


1. **外观自定义** —— 自由改强调色、左侧导航颜色、页面背景色 / 背景图、课程卡片圆角 / 阴影 / 风格（默认 / 扁平 / 毛玻璃）。
   - **预设主题风格**（设置面板「外观」顶部画廊，点一下即换）：简约、清新、暗夜、黑白、**像素风**（8-bit 夜景：1/5 分辨率画布放大且关闭平滑，星星 / 方块云 / 天际线亮窗 / 像素月亮全是整像素块，12fps 抽帧；所有框 4px 描边 + 内侧亮暗斜面 + 8px 硬阴影（老游戏对话框），Press Start 2P 标题配闪烁光标，VT323 正文，Sweetie 16 调色板）、**马拉松**（Rutgers 红 × 荧光黄的新粗野主义：红色左导航、白卡片 2px 黑边 + 实心偏移投影、POTATO 水印背景，纯 CSS 绘制不吃 CPU），以及动态动画主题——**春夏秋冬**（按月份切换、飘落花瓣/落叶/雪）、**日出日落**（海岸天空随真实时间，太阳从海平线升起划过落下、夜里出月亮和星星）、**赛博朋克**（霓虹 + 扫描线 + 卡片随机故障 glitch）、**黑客**（黑底绿色字幕雨）。预设可被下方“自定义微调”覆盖。
   - 所有预设都会接管 Canvas 那条**白色仪表盘标题横条**（它是 InstUI 组件、类名为编译期哈希，靠文本匹配定位后打上 `.bc-hdr-*` 类，各主题自行配色）。深色主题不处理它就会白底白字。「暗夜」是按令牌写的真正深色配色（页面 #121417 / 面板 #1b1f24 / 文字 #e6e8eb / 强调 #ff4d6d），不用反色滤镜，图片、课程颜色、嵌入内容都保持原样，表单控件与滚动条走 `color-scheme: dark`。
   - **日历页**也跟随预设主题：月 / 周表格、议程视图、顶部导航与视图按钮、右侧迷你日历、课程列表、事件弹窗和编辑对话框统一按主题令牌（配色 / 圆角 / 边框 / 阴影 / 字体）生成样式；事件条本身的课程颜色保留不改。
   - **其他页面的内容框**（Files / Assignments / Modules / Grades / People 等）也用同一套主题令牌生成样式：表格外框与表头、搜索框和表单输入、带文字的按钮（主色 / 提交按钮用强调色，纯图标按钮不加框）、旧式面板与列表行、页面标题。日历页表格由日历专属规则接管，不重复处理。
   - **扩展自身的 UI 也跟主题**：右下角 ⚙ / 📖 按钮、学习工具抽屉、助手浮窗 / 小按钮 / 右键菜单 / 题库都按当前预设取色（配色、圆角、边框、阴影、字体）。助手界面在 closed Shadow DOM 里，页面 CSS 进不去，靠 `themes.js` 把主题令牌输出成 `--bc-ai-*` 自定义属性挂在 `:root` 上（自定义属性能继承进影子树），影子样式用 `var(--bc-ai-*, 默认值)` 取值。
   - 选了预设主题后鼠标会带一条和主题配套的拖尾（简约灰蓝点、清新气泡、像素方块、赛博霓虹、黑客字符雨、四季花瓣/雪花、日出日落光斑/星点、马拉松红黄黑方块），可在「外观」里关掉；系统开启「减少动态效果」时自动不显示。
2. **卡片成绩** —— 每张课程卡片右边挂一个小框，四行：**总评** `百分比 字母`（下面小字是已评分作业 得分/总分）、**GPA**（按百分比换算的绩点）、**班级均分**（+ 你比平均高 / 低多少，下面是最差–最好范围）、**Section**（WebReg 导入过的还带 index 和学分）。小框配色跟随主题；窄屏时退到卡片下方。设置「卡片」里可改回老的头部角标样式（左上角总评角标、右下角班级角标）。**班级成绩范围**的算法：把 gradebook 里每个作业的班级最低 / 平均 / 最高分当成三个假想同学，按这门课自己的计分规则（作业分组权重、丢最低 / 丢最高、不计入总评的作业）各算一遍总评，显示 `最差–最好 · 均值` 和你与平均的差（绿高红低），悬停看详情。数据来自 Canvas 的 `score_statistics`：老师关掉「显示成绩分布」或有效提交不到 5 份的作业没有统计，整门课没有就不显示；用同样算法算出的本人总评和 Canvas 对不上时会标注「仅供估算」。设置「卡片」里可关。
3. **自定义仪表盘面板**（持久、顺序固定，可开关 / 排序）：
   - 📅 本周截止作业（来自 Planner，未提交的）
   - 🎯 当前 GPA 估算（按在读课程当前百分比换算，仅供参考；没有 Rutgers 课号的「其他课程」不计入）
   - ⏳ 期中 / 期末倒计时 —— 整行宽度，按「本周内 / 两周内 / 一个月内 / 更远」四个时间段横向摆放；每门课固定一种颜色（顶部有图例），条目左边色条 + 课程代码标签同色。右键任一条目可就地编辑名字 / 时间 / 类型，或删除。这些考试也会画进 **Canvas 日历页**：月视图和周视图全天区的对应日期里出现同色条目（右键同样可编辑），右侧迷你日历有考试的日期打红点。
   - 🧑‍🏫 教授请假 —— 列出全部在读课程；消息回看窗口内公告或私信里出现「professor absence / no class / 停课 / 请假」等关键词的课打 ✕（附最近一条通知的链接），否则 ✔。关键词可在「面板」设置里改。
   - 📨 最新消息 —— 当前学期课程的公告 + 私信合并按时间倒序取最近 10 条（学期自动取在读课程里最新的那个，标题右侧显示；往届课和 Advising 这类没有学期的课不算，设置里可关），占两列宽、左右两栏；未读加红点，命中重要关键词的按类别颜色标左边条并注明类别。标题右侧有两个下拉：**排序方式**（最新在前 / 最早在前 / 未读优先 / 重要优先 / 按课程）和**只看某一门课**，选择会记住。
   - 📆 今日课程 —— 当天课表，按时间排序；正在上的标「进行中」，下一节标「下一节」，已结束的变淡。来源三合一：**WebReg 课表 PDF 导入**（在 WebReg「View / Print Schedule」页浏览器打印另存为 PDF，面板里一键导入；自带零依赖的 PDF 解析：ToUnicode 还原 CID 字形、按 Monday…Friday 表头 x 坐标分列、课号自动匹配 Canvas 课程）+ Canvas 日历里的课程事件 + 设置里手填的每周课表。没导入过时面板里直接给出 WebReg 链接和三步引导。
4. **右侧栏课程卡**（在 View Grades 按钮上方）—— 默认是 **课程 Section**：每门课一个「Sec N」徽标，section 取 Rutgers 课号的第四段（`01:198:206:02:11528` → 02，`01:355:101:EJ` → EJ），来源优先用 WebReg 导入的课表（还会显示 index 号和学分），否则从 Canvas 课名里识别。设置里可切换成 **GPA 与各科差距**：GPA 估算 + 每门课一条进度条：条长=当前百分比，竖线=下一档分数线，下面直接写「还差 X% 到 B+」。按分数升序，最需要补的排最前。三档状态色（达标/注意/偏低）固定不随主题变，且每行都有文字标签，颜色不单独承载信息。可在设置面板「📊 面板」里关掉。
5. **右侧栏「常用网站」导航** —— 右侧栏顶部，Rutgers 学生常用站点按「选课 / 学业」「账户 / 缴费」「校园生活」分组折叠（WebReg、Schedule of Classes、Degree Navigator、Rate My Professors、myRutgers、NetID、ScarletMail、Term Bill、校车 Tripshot（链接自动带当天日期）、Dining、Recreation、Housing、Handshake…），点击一律新标签页打开。折叠状态会记住；设置面板「面板」里可开关、选择是否在其他页面也显示、增删链接或恢复默认。Canvas 自带的右侧栏 **To Do** 和 **Recent Feedback** 默认隐藏（「本周截止」面板已覆盖 To Do 的功能），同一处设置可恢复。**📚 历史课程**默认也放在右侧栏最底部（按学年 / 学期折叠），设置里可切回仪表盘整行。
6. **消息铃铛** —— 卡片右上角三点菜单左侧加铃铛，未读数角标；点击弹出最新 **课程公告 + 收件箱私信**；
   - 已读 / 未读用透明度区分；
   - 换教室 / 请假停课 / 测验考试 / 截止日期等重要消息用不同颜色高亮（关键词可在设置里改）。
7. **期中期末日期识别** —— 三种方式：自动扫描、上传文本文件解析、手动填写。扫描一门课会同时看四处：Syllabus 正文、正文里链接的同源 PDF、**Course Summary（作业 + 日历事件，标题带 midterm/final/quiz 等词的直接采用其日期）**，以及**当前已渲染的 Syllabus 页面**。面板（含「扫描 Syllabus」按钮、已识别列表、手动添加、上传解析）在**课程主页和 Syllabus 页**都会出现。
   - **待补日期**：很多老师写的是 `Exam 1 - Wednesday October ?th` 或 `Midterm: TBA` 这种占位符，没有可解析的日期。这类行不会被丢掉，而是单独列出来并预填月份，补一个日期就能入库。
   - 关键词里单独的 `final` 也算期末（`Final - Thursday, December 18th` 这种写法很常见），但 `final grade / final project / final draft / final paper` 会被排除，不会误判成考试。
8. **Gradescope → Canvas 成绩同步** —— 在 gradescope.com 登录一次（勾选 Remember me）之后就不用再去那边了：打开 Canvas 某门课 Grades 页时，后台带着浏览器 cookie 直接抓 Gradescope 账户页和课程页（优先匹配当前课程，最多 12 门，结果缓存 10 分钟），按作业名匹配，把分数填进**没有分数**的作业的 what-if(预估分数)，已有分数的不动。后台每 6 小时访问一次 gradescope.com 维持会话。浏览 gradescope.com 课程页时也会顺手抓取。会话过期时自动同步最多一天提示一次（提示里带登录链接），手动按钮「🔄 从 Gradescope 同步」总会提示。设置面板「面板」里可分别关掉同步 / 自动同步 / 后台保活。匹配不到当前课程时不再把所有课程的同名作业混填。

9. **学习助手（✨）** —— 双击页面上的题目 / 段落、选中文字后点「✨ 问一下」、**右键**点选中的文字（接管浏览器默认右键菜单：上半是四种模式，下半保留常用动作——复制、Google 搜索选中内容、打开 / 复制链接，以及「浏览器菜单」——点它后再右键一次就是原生菜单；设置里可关）、或按快捷键 **Alt+Shift+A**（在 chrome://extensions/shortcuts 可改；后台收到后转发给当前标签页），弹出浮窗：**💡 思路**（只讲知识点和步骤提示，不给答案）、**✅ 解答**、**📖 概念**、**🌐 翻译**，可继续追问；**📷 截图**框选屏幕区域连图一起问（公式、图表这类选不中的内容）；**💾 存题库** 把题目和讲解按课程归档，题库支持搜索、备注、待复习标记、导出 Markdown / JSON。
   - 支持的模型服务：Claude、OpenAI、Google Gemini、DeepSeek、Kimi、通义千问、智谱 GLM、xAI Grok、Groq、OpenRouter，以及任意 OpenAI 兼容接口（自定义 Base URL，需在设置里授权域名）。API key 只存在本机，请求由扩展后台直接发给模型接口。
   - **不是代答工具**：经典 Quiz 作答页（take / questions）、New Quizzes 的作答界面（URL 带 /take 或页面上有可点的 Submit 按钮）、任何正在作答的表单里都不会激活，这条规则写死在 `assistant.js` 里；测验列表页、介绍页和交卷后的结果回看页可以用（复习错题）。系统提示词也要求模型对疑似考试内容只讲方法不给答案。
   - **New Quizzes 里也能用**：New Quizzes 跑在跨域 iframe（`*.quiz-lti-*.instructure.com`）里，manifest 的内容脚本进不去；后台监听 `webNavigation.onCompleted`，在那个 frame 加载完成后用 `scripting.executeScript` 注入 `storage.js + assistant.js + study.js + quiz-frame.js`（资料 / 视频标签不出现）。frame 内是单页应用，`quiz-frame.js` 轮询屏蔽状态：点 Begin 进入作答就关浮窗、撤 📖，交卷回到结果页再恢复。题库归档用的课程 id 由后台按标签页顶层地址提供（`bc-top-url`）。快捷键会同时发给顶层页面和 frame，只有持有焦点的那个响应。
   - **知识库（🧠）** —— 让助手「根据特定材料」回答。📖 学习工具 → 🧠 知识库 里添加材料：课程资料（多选 PDF / PPTX / DOCX / XLSX，本机提取正文）、本页正文、本地文件、粘贴的笔记、已生成的总结；按课程归档（不在课程页时可选课或看全部），可逐条删除 / 清空。提问时先在本机做 BM25 词法检索（英文按词 + 极简去后缀、中文按二元组），取最相关的几段（默认 8 段、≤ 9000 字）连同问题交给模型，回答里标注 [n] 出处，答案下方列出引用的材料和段号；材料里没有的内容要求模型明确说明。标签内有独立的知识库问答；双击 / 选中呼出的助手浮窗里有「🧠 知识库」开关（当前课程有材料时默认开启，每轮按原题 + 追问重新检索，片段附在系统提示里）。存储在 `chrome.storage.local`（`unlimitedStorage`），每份材料一个键，顶层 Canvas 页 / New Quizzes iframe / 其它网站共用；不用 embedding 接口，对所有模型服务一样可用。
   - **在所有网站启用**：工具栏弹窗里打开「在所有网站启用助手」并授权后，任何网页都能双击 / 选中 / 右键 / 快捷键呼出助手，右下角也有 📖（页面对话 / 闪卡 / 练习）；后台用 `scripting.registerContentScripts` 动态注册一套精简脚本（`anywhere.js`），Canvas 域排除，资料 / 视频这类依赖 Canvas 接口的功能不出现。权限被撤销时自动注销。
   - **学习工具抽屉（右下角 📖）**：**页面对话** —— 读取当前 Canvas 页面正文（Page / 作业说明 / 讨论 / 公告 / 大纲，文件预览页会抓 PDF 本体），一键「总结要点 / 生成大纲 / 关键术语 / 可能考什么」，并可就内容提问；**闪卡** —— 从本页或选中文字生成问答卡，按课程存成卡组，Leitner 间隔重复复习（又忘了 / 模糊 / 记住了 / 太简单 → 1、3、7、14、30 天），可浏览、删卡、导出 Markdown；**练习** —— 生成单选题自测，即时判分 + 解析，错题一键存题库。讲座视频转写不在范围内（Canvas 里的 Kaltura 视频拿不到字幕）。**资料** —— 一键列出当前课程全部文件（Files 区按文件夹分组；Files 被隐藏时退回模块里挂的文件），按类型筛选 / 搜索，单个或「⬇ 全部下载」到 `下载/PotatoCanvas/<课程>/<文件夹>/`；PDF / PPTX / DOCX / XLSX / 文本 / HTML 可「✨ 总结」成固定结构的复习笔记（概览、核心概念、重点、公式速查、考点、待澄清），长文档自动分块小结再合并；总结可复制、导出 Markdown、一键生成闪卡，或「💬」带进页面对话提问。闪卡和练习标签里也有「从资料」下拉：直接选课程文件出卡 / 出题，已有总结的默认用总结（更快更省），否则读取正文（超长取前 3 万字）。PPTX / DOCX / XLSX 靠自带的零依赖 zip 读取器（`docs.js`）抽 XML 文本，老版二进制 .ppt/.doc 不支持。**视频** —— 扫描页面里的 Kaltura（MediaSpace）讲座视频（播放器 iframe、LTI 中转、mediaspace 链接，或手动粘贴链接），解析 partner_id / entry_id / 会话票据后走 playManifest 拿 MP4 直链一键下载（后台带 cookie 请求，只放行 kaltura.com）；同时能拉字幕做转写，直接「✨ 总结这节课」或带进页面对话。直链被关时用 **🎞 HLS 分段下载**：读播放器用的 m3u8，选最高码率，逐段拉取（AES-128 加密段用 WebCrypto 解密），通过「另存为」边下边写入本地文件（不支持时先攒内存），产物是 .ts（fMP4 流则是 .mp4）；Widevine / SAMPLE-AES 这类真 DRM 不支持。只能拿到你有权观看的视频，都拿不到时字幕仍可用。
10. **高级功能（工具栏弹窗「🔒 高级功能」分页，默认锁定）** —— 阅读器导出和讲座视频下载 / 转写与 Canvas 本身无关、又依赖网站权限，所以收进弹窗的独立分页，并加了一道**解锁门**：密码 = HMAC-SHA256(密钥, 当前小时序号) 映射成 8 位字符，每小时换一个（验证时也接受上一小时的）；输对一次这台浏览器就绑定，以后不再问，「解除绑定」可撤销。扩展里没有生成密码的入口，密码由仓库里的**独立生成器** `tools/gate-password/` 提供（网页版双击即开、Windows 双击 `.cmd`、或 `node gate-password.js`），发布 zip 时不要把 `tools/` 打进去。注意：密钥也在扩展源码 `src/gate.js` 里，这道门只挡「顺手用一下」，不是安全机制。锁定时 📖 学习工具里也没有「🎬 视频」标签。

    **阅读器导出（📕）** —— 把 Pearson eText / Revel / 各类 EPUB 网页阅读器里的教材正文导出成 **PDF**（打开扩展自带的打印页，浏览器打印对话框里选「另存为 PDF」）或 **Markdown**（静默下载到 `下载/PotatoCanvas/`，公式转成 `$…$` / `$$…$$` LaTeX）。在打开阅读器的标签页上点扩展图标 → 「打印为 PDF」/「下载 Markdown」。
   - **定位正文**：后台用 `webNavigation.getAllFrames` 枚举标签页里所有 frame，逐个注入探测脚本按「文字量 / 段落数 / 有无公式 / EPUB 标记 / 是否像阅读器外壳」打分，取最高的那个 frame；直接注入不成时降级为外层探测——穿透 `mosaic-book` 的 shadow DOM 找 `iframe.favre`，或挑正文最长的同源 iframe。第一次会申请阅读器所在域名的访问权限（`optional_host_permissions`），Canvas 里 LTI 嵌入的阅读器也能抓。
   - **配置**（弹窗里，持久保存）：**清理界面**（只删明确是控件的东西：固定 / 粘性定位的浮层、role=toolbar / menu / dialog、按钮表单、iframe；EPUB 正文里的 `<nav>` 目录、`class="sidebar"` 补充栏、旁注一律当内容保留，删完发现文字少了一半以上则这一页自动放弃清理）；**破解打印限制**（剔除 `@media print` 块和 `media="print"` 样式表——阅读器常在打印时把 body 设成 `display:none` / 白屏；`@media screen` 规则解开，打印时按屏幕样式来）；**强制懒加载**（按步长自动滚到底，等 MathJax 懒渲染占位符 `mjx-lazy` 和图片加载完再滚回顶部，间隔毫秒可调）；**连续导出**（自动找「下一页」按钮——按一组选择器 / aria-label / 按钮文字在阅读器外壳、正文 frame、其它 frame 里依次找，点击后靠内容指纹判断新一节已加载，循环到按钮消失或 disabled、内容重复、或达到上限为止）。
   - **提取**：滚动完成后克隆正文，URL 绝对化、图片抓成 data URL 内联（PDF 路径；带 cookie 请求，单张 6MB / 每节总量 20MB 上限，整节超过 40MB 时从最大的图开始换回原链接——注入脚本返回值和扩展消息单条上限都是 64MiB）、`<canvas>` 转成图片；样式从 CSSOM（`document.styleSheets` + `adoptedStyleSheets`）序列化重建，MathJax 动态插入的规则也在内，`html` / `body` 选择器改写成 `.bc-html` / `.bc-body` 以便装进打印页。
   - **书内链接改成文内跳转**（`reader-links.js`，PDF 和 Markdown 都做）：提取时记下每一节的元素 id 和各级标题，合并时把指向本书其它位置的链接改写成导出文件内部的锚点——`章节文件#锚点` 按 id 找到所在节，没有锚点的按文件名对应节，目录条目按链接文字匹配章节标题；PDF 里点目录直接跳到对应章节，Markdown 里指向标题锚点（GitHub 风格）。外部网址保持原样。
   - **公式 → LaTeX**（Markdown 路径）：按可靠度依次取 MathJax 3 `startup.document.math` 里的原始 TeX、MathJax 2 的 `<script type="math/tex">`、`<annotation encoding="application/x-tex">`（KaTeX / MathML 语义标注）、`<math alttext>`，都没有时由自带的 MathML → LaTeX 转换器从结构反推（分式、根式、上下标、求和积分上下限、矩阵 / cases、希腊字母与常用运算符、`\mathrm` 等字体变体）。
   - 打印页数据走扩展自身的 **IndexedDB**（`reader-db.js`，后台逐节写入、打印页逐节读出；不走 `storage.session` 和 runtime 消息——前者只有 10MB 配额，后者单条 64MiB，整本书带图轻易就超），打印结束后自动删除，一天前没打印的旧数据下次导出时清掉。**断点续跑**：任务进度（已抓节数、见过的内容指纹、选项）每抓完一节就写进 `storage.session`，后台 service worker 被浏览器回收（MV3 后台跑几分钟就可能被杀，之前整本书导到三十多节就会断）后重启时自动接着上次的进度继续；中途出错（页面关了、frame 没了）也不再丢掉已抓的部分，有多少导出多少，错误写在提示里。只能导出你有权阅读的内容；EPUB.js 那种横向分栏翻页的阅读器和 DRM 保护的内容不在支持范围内。

## 下载

- **Releases 页**下载最新的 `potatocanvas-vX.Y.Z.zip`，解压到任意固定位置；或者 `git clone` 本仓库 / 点绿色 **Code → Download ZIP**。
- GitHub 上的是**完整版**（含阅读器导出 / 视频下载等高级功能），用下面的「开发者模式加载」安装；更新时把文件夹替换掉再在扩展页点刷新即可，设置和题库存在浏览器本地不会丢。Chrome 应用商店版是去掉高级功能的**核心版**，见下方「打包 / 上架」。

## 安装（开发者模式加载）

1. 打开 `chrome://extensions`（Edge 是 `edge://extensions`，Opera GX 是 `opera://extensions`）。
2. 打开右上角 **开发者模式**。
3. 点 **加载已解压的扩展程序**，选择本文件夹（含 `manifest.json` 的目录）。
4. 打开 `https://rutgers.instructure.com/`，刷新即可看到右下角 ⚙ 设置按钮。

## 使用说明

- 完整设置：Canvas 页面右下角 **⚙** 按钮。
- 快速开关：浏览器工具栏的扩展图标弹窗。
- 卡片成绩 / 铃铛需要使用 **经典 Dashboard（卡片视图）**。若你的首页是新版 widget 仪表盘，点页面右上 “Switch to old dashboard view” 切回卡片视图。
- 数据（成绩 / 消息）有 5 分钟缓存；想立即刷新可在弹窗里点“清除数据缓存”。仪表盘各面板并行拉取、先出骨架屏再填内容，同一份数据（成绩 / 消息）多处同时要时只发一次请求。

## 打包 / 上架

仓库本身就是完整版（开发者模式直接加载，无构建步骤）。要上 Chrome Web Store 的是**商店版（core edition）**——审核政策容不下阅读器导出（绕过打印限制）、讲座视频下载 / HLS、小时密码解锁门（隐藏功能）和「在所有网站启用」（全站权限），所以商店版把它们**物理排除**，而不是只关开关。

```
npm run build:store            # 等价于 node scripts/build-store.js
node scripts/build-store.js --name "PotatoCanvas"   # 顺手改名（只改暂存副本）
node scripts/build-store.js --no-zip                              # 只暂存到 dist/store/，可直接「加载已解压的扩展程序」试商店版
```

脚本（Node 18+，无依赖）把仓库复制到 `dist/store/`，再打成 `dist/<name>-store-v<version>.zip`：

- **排除**：`.git`、`dist`、`tools/`（密码生成器）、`store/`、`scripts/`、`print/`、`*.md`、`SourceCode.html`，以及 `src/gate.js`、`src/kaltura.js`、`src/kaltura-frame.js`、`src/reader-db.js`、`src/reader-links.js`、`src/reader-export.js`、`src/anywhere.js`。
- **manifest**：内容脚本去掉 `gate.js` / `kaltura.js`，删掉 `*.kaltura.com` 那组内容脚本和 host permission，去掉 `webRequest` 权限，删掉 `optional_host_permissions`（全站权限），`web_accessible_resources` 收窄到 instructure.com；每组内容脚本最前面插入 `src/edition.js`。
- **`src/edition.js`**：只在商店版存在，内容是 `BC.EDITION = "store"`。`background.js`（`STORE_EDITION` / `HAS_READER`）、`popup/popup.js`（去掉「🔒 高级功能」分页和「在所有网站启用助手」）、`study.js`（`BC.kaltura` 不存在时没有视频标签）据此在运行时隐藏对应功能；开发仓库里没有这个文件，所以同一份源码既是完整版也是商店版，不用维护两个分支。
- **商店版的副作用**：助手「自定义 Base URL」只能用已在 host_permissions 里的 10 家官方接口域名（「授权域名」依赖被删掉的 `optional_host_permissions`）。
- 脚本会校验 manifest / popup.html 引用的文件都在、暂存副本的 json / html / css 里不再出现被删文件，并列出 JS 里对 `BC.gate` / `BC.kaltura` / `ReaderExport` 的引用位置（都带守卫）。

上架材料在 `store/`：`LISTING.md`（名称——**必须改名，"PotatoCanvas" 已被别的扩展占用**——简短 / 详细描述中英文、分类、单一用途说明、截图清单）、`PRIVACY.md`（可直接托管的隐私政策）、`PERMISSIONS.md`（每项权限的英文说明、远程代码与数据使用披露）、`CHECKLIST.md`（逐步提交清单 + 政策风险评估）。

## 已知限制 / 待办

- 得分/总分按“已评分作业”简单累加，**未按作业组权重**，与 Canvas 加权总评可能略有出入（百分比用的是 Canvas 官方加权值）。
- 期中期末「上传文本文件解析」只收文本文件（`.txt/.csv/.html/.md`）；PDF / PPTX / DOCX / XLSX 的正文提取走「资料」和「知识库」（自带解析，见 `docs.js`），老版二进制 .doc/.ppt 不支持。
- 英文界面靠各模块登记的词典，没登记的句子会原样显示中文。
- GPA 分数线用的是通用估算，不同教授评分线不同。
- 私信只在带课程归属（context）时才会挂到对应卡片。

## 文件结构

```
manifest.json
src/i18n.js              界面语言：跟随系统 / 手选，BC.t() 词典（各模块在文件顶部登记英文；后台 worker 用 importScripts 引入）
src/gate.js              高级功能解锁门：每小时 HMAC 密码校验、本机绑定（密码由 tools/gate-password 生成）
styles/inject.css        注入样式
src/storage.js           命名空间 / 工具 / 设置存储 / 缓存（默认设置里含 ui.lang、gradescope、advanced）
src/gradescope-parse.js  Gradescope 页面解析（作业表 / 课程名 / 登录页判定），gradescope.com 内容脚本与 Canvas 侧共用
src/gradescope-scrape.js 跑在 gradescope.com：顺手抓取课程页成绩
src/gradescope-sync.js   跑在 Canvas Grades 页：请后台抓 Gradescope（带 cookie），匹配后填 what-if
src/api.js               Canvas REST API 封装
src/theme.js             外观主题
src/grades.js            卡片成绩
src/messages.js          公告+私信铃铛
src/syllabus.js          日期识别(正文/PDF/Course Summary/当前页 扫描 + 解析)
src/webreg.js            WebReg 课表 PDF 解析（带坐标的文字提取 + 分列 + 课号匹配）
src/blocks.js            自定义仪表盘面板
src/calendar.js          日历页：把期中/期末考试注入 FullCalendar
src/sidebar-gpa.js       右侧栏 GPA + 各科差距图
src/links.js             右侧栏「常用网站」导航（Rutgers 常用站点，新标签页打开）
src/pagestate.js         页面状态：visibilitychange / blur / focus -> html.bc-idle 暂停主题动画，离开太久回到仪表盘时刷新面板
src/knowledge.js         知识库：材料切块 / 存储（chrome.storage.local）/ BM25 检索 / 组装给模型的片段与引用（assistant.js 浮窗开关、study.js 知识库标签共用）
src/assistant.js         学习助手（双击 / 选中 / 右键 / 快捷键触发、浮窗、截图框选、题库；作答页屏蔽）。全部 UI 在 closed Shadow DOM（#bc-ai-host）里，样式随影子树注入
src/quiz-frame.js        New Quizzes iframe（*.quiz-lti-*.instructure.com）里的入口：后台注入，只跑助手 + 学习工具，轮询作答状态
src/docs.js              文档文字提取：PDF / PPTX / DOCX / XLSX / 文本（自带最小 zip 读取器）
src/kaltura.js           Kaltura 讲座视频：嵌入识别（页面 / iframe 回传 / LTI 中转 / Canvas 媒体）、MP4 直链、字幕
src/kaltura-frame.js     跑在 *.kaltura.com iframe 里：读播放器配置（entry_id / partner_id / ks）回传主页面
src/study.js             学习工具抽屉（页面对话 / 知识库 / 闪卡 + 间隔重复 / 练习题自测 / 资料库 + 长文档总结 / 视频）
src/background.js        后台 service worker：调各家模型接口 + 截图 + 域名授权 + New Quizzes iframe 注入 + 阅读器导出任务入口
src/reader-db.js         阅读器导出用的 IndexedDB 小封装（后台与打印页共用）
src/reader-links.js      阅读器导出：书内链接 → 导出文件内部锚点（后台生成 Markdown 与打印页共用）
src/reader-export.js     阅读器导出：注入 frame 的自包含脚本（探测 / 自动滚动 / 提取 / 找下一页 / MathML→LaTeX / HTML→Markdown）+ 后台任务流程（frame 定位、翻页循环、合并、打印页 / 下载）
print/                   阅读器导出用的打印页（装入正文 + 样式，等图片字体就绪后唤起 window.print）
src/settings-ui.js       设置面板 + 课程页小面板
src/main.js              入口 / 刷新总线 / 观察器
tools/gate-password/     高级功能密码生成器（网页 / PowerShell / Node 三种形态，算法与 gate.js 一致；不随扩展发布）
popup/                   工具栏弹窗：「常用」（主开关）+「🔒 高级功能」（解锁门、视频标签开关、阅读器导出配置与按钮；商店版没有这一页）
scripts/build-store.js   商店版打包：复制到 dist/store/、裁掉高级功能文件、改 manifest、写入 src/edition.js、打 zip（见「打包 / 上架」）
store/                   上架材料：商品描述、隐私政策、权限说明、提交清单与政策风险评估（不随扩展发布）
package.json             只有 `npm run build:store` 一个脚本，无依赖
```
