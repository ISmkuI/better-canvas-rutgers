# 用无头 Edge 把 HTML 渲染成指定尺寸的 24 位 PNG（商店要求无 alpha）
# 用法：render.ps1 -Html a.html -Out a.png -W 1280 -H 800
param([string]$Html, [string]$Out, [int]$W, [int]$H)
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$tmp = [System.IO.Path]::ChangeExtension($Out, ".raw.png")
$url = "file:///" + ($Html -replace '\\', '/')
& $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 --window-size=$W,$H --virtual-time-budget=4000 --screenshot="$tmp" $url 2>$null | Out-Null
$tries = 0
while (-not (Test-Path $tmp) -and $tries -lt 30) { Start-Sleep -Milliseconds 300; $tries++ }
if (-not (Test-Path $tmp)) { Write-Host "FAIL $Html"; exit 1 }
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($tmp)
$bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose(); $g.Dispose(); $bmp.Dispose()
Remove-Item $tmp -Force
Write-Host ("OK " + (Split-Path $Out -Leaf) + " " + $W + "x" + $H)
