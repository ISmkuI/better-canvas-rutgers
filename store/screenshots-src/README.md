# 商店素材源文件

`../assets/` 里的 PNG 由这里的 HTML 用无头 Edge 渲染而来（24 位、无 alpha，符合商店要求）。改了界面或文案后重新生成：

```
powershell -ExecutionPolicy Bypass -File store/screenshots-src/render-shots.ps1
```

| 文件 | 产物 | 说明 |
|---|---|---|
| `promo-small.html` / `promo-marquee.html`（由 `make-promo.js` 生成） | 440×280 小型宣传图、1400×560 顶部宣传图 | 图标来自 `icon.b64`（icons/icon128.png 的 base64） |
| `shot1.html` | 截图 1：仪表盘总览（面板 + 倒计时 + 卡片成绩 + 右侧栏） | 浅色 |
| `shot2.html` | 截图 2：卡片成绩特写（总评 / GPA / 班级均分 / Section + 铃铛） | 浅色 |
| `shot3.html` | 截图 3：暗夜主题 + 设置面板主题画廊 | 深色 |
| `shot4.html` | 截图 4：学习助手浮窗（思路模式，不给答案） | 浅色 |
| `shot5.html` | 截图 5：学习工具抽屉的闪卡复习 | 浅色 |
| `canvas-frame.css` | 五张截图共用的 Canvas 外壳样式（左导航、标题、课程卡片） | |

截图页直接引用 `styles/inject.css`（绝对 file:// 路径，见各 HTML 顶部），面板、成绩框、倒计时等用的是扩展真实样式；课程、姓名、成绩均为虚构。

注意：这些是按真实界面搭的示意图，不是实机截图。上架前最好用真实 Canvas 页面截几张替换（`store/LISTING.md` 第 6 节有拍摄清单），至少把第一张换成实机图。
