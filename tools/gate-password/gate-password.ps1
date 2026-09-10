# PotatoCanvas 高级功能密码生成器（Windows PowerShell 5.1+，无需安装任何东西）
# 用法：
#   右键「使用 PowerShell 运行」，或在终端里：  powershell -ExecutionPolicy Bypass -File gate-password.ps1
#   参数：-Watch 持续刷新并显示倒计时；-Secret 覆盖密钥
# 算法与 src/gate.js 一致：HMAC-SHA256(SECRET, "bc-gate:" + 小时序号)，前 8 字节各取模 32 映射到字母表。
param(
  [switch]$Watch,
  [string]$Secret = "uhNKemzqdAGy360foPFDZ9Cv4nvmDQy-"
)
$ErrorActionPreference = "Stop"
$Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function Get-HourIndex([int]$Offset = 0) {
  $ms = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  return [math]::Floor($ms / 3600000) + $Offset
}
function Get-GateCode([int]$Offset = 0) {
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
  $mac = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("bc-gate:" + (Get-HourIndex $Offset)))
  $out = ""
  for ($i = 0; $i -lt 8; $i++) { $out += $Alphabet[$mac[$i] % $Alphabet.Length] }
  return $out.Substring(0, 4) + "-" + $out.Substring(4)
}
if (-not $Watch) {
  Write-Host ("本小时密码：  " + (Get-GateCode 0)) -ForegroundColor Green
  Write-Host ("上一小时：    " + (Get-GateCode -1) + "   （仍可用）") -ForegroundColor DarkGray
  Write-Host ("下一小时：    " + (Get-GateCode 1)) -ForegroundColor DarkGray
  $left = 3600 - [math]::Floor(([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() % 3600000) / 1000)
  Write-Host ("还剩 {0:00}:{1:00} 换下一个。加 -Watch 可持续显示。" -f [math]::Floor($left / 60), ($left % 60)) -ForegroundColor DarkGray
  exit 0
}

while ($true) {
  Clear-Host
  Write-Host "PotatoCanvas 高级功能密码（Ctrl+C 退出）" -ForegroundColor Cyan
  Write-Host ""
  Write-Host ("   " + (Get-GateCode 0)) -ForegroundColor Green
  Write-Host ""
  Write-Host ("上一小时 " + (Get-GateCode -1) + "   下一小时 " + (Get-GateCode 1)) -ForegroundColor DarkGray
  $left = 3600 - [math]::Floor(([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() % 3600000) / 1000)
  Write-Host ("还剩 {0:00}:{1:00} 换下一个" -f [math]::Floor($left / 60), ($left % 60)) -ForegroundColor DarkGray
  Start-Sleep -Seconds 1
}
