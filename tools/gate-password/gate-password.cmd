@echo off
rem 双击运行：持续显示本小时密码和倒计时（Ctrl+C 或关窗口退出）
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gate-password.ps1" -Watch
