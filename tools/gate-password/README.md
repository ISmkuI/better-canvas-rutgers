# 高级功能密码生成器

给扩展弹窗「🔒 高级功能」用的小时密码，三种形态任选，算法和密钥与 `src/gate.js` 完全一致：
`HMAC-SHA256(SECRET, "bc-gate:" + 当前小时序号)` → 前 8 字节映射到 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` → `XXXX-XXXX`。
扩展验证时接受「当前小时」和「上一小时」两个密码。

| 文件 | 怎么用 | 依赖 |
|---|---|---|
| `gate-password.html` | 双击在浏览器里打开，离线可用。大字显示本小时密码 + 倒计时，一键复制；折叠区里可改密钥（存在浏览器本地） | 任何现代浏览器 |
| `gate-password.cmd` | 双击，弹出命令行窗口持续显示密码和倒计时 | Windows 自带 PowerShell |
| `gate-password.ps1` | `powershell -ExecutionPolicy Bypass -File gate-password.ps1`；`-Watch` 持续刷新；`-Secret xxx` 覆盖密钥 | Windows 自带 PowerShell |
| `gate-password.js` | `node gate-password.js`；`--watch`；环境变量 `BC_GATE_SECRET` 覆盖密钥。放在仓库里时会自动读 `src/gate.js` 的密钥 | Node 18+ |

## 换密钥

1. 生成一个新密钥：`node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
2. 改 `src/gate.js` 的 `SECRET`，重载扩展。
3. 改 `gate-password.ps1` 的默认 `$Secret` 和 `gate-password.html` 的 `DEFAULT_SECRET`（`gate-password.js` 会自动从 `src/gate.js` 读）。

换了密钥后，已经绑定过的浏览器不受影响（绑定只是本机的一个标记），只影响新输入的密码。

## 注意

- **发布扩展时不要把 `tools/` 打进 zip**：这里面就是密码生成器本身。
- 密钥同样写在扩展源码 `src/gate.js` 里，装了扩展的人打开源码就能算出密码。这道门只挡「顺手用一下」，不是安全机制。
