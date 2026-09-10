# 用无头 Edge 把五张截图和两张宣传图渲染成商店要求的 24 位 PNG，输出到 store/assets/
# 用法：powershell -ExecutionPolicy Bypass -File render-shots.ps1
$d = $PSScriptRoot
$out = Join-Path $d "..\assets"
New-Item -ItemType Directory -Force $out | Out-Null
node (Join-Path $d "make-promo.js")
& "$d\render.ps1" -Html "$d\promo-small.html" -Out "$out\promo-small-440x280.png" -W 440 -H 280
& "$d\render.ps1" -Html "$d\promo-marquee.html" -Out "$out\promo-marquee-1400x560.png" -W 1400 -H 560
$names = @("dashboard", "card-grades", "dark-theme-settings", "study-assistant", "flashcards")
for ($i = 1; $i -le 5; $i++) {
  & "$d\render.ps1" -Html "$d\shot$i.html" -Out ("$out\screenshot-$i-" + $names[$i - 1] + "-1280x800.png") -W 1280 -H 800
}
