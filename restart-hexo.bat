@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Hexo 重启工具
cd /d e:\MY\gitee\skylineoflee.github.io

echo ============================================
echo            Hexo 本地服务器重启工具
echo ============================================
echo.

REM ---- 第 1 步：查找并关闭占用 4000 端口的旧进程 ----
echo [1/3] 正在检查端口 4000 ...
set "PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000" ^| findstr "LISTENING"') do (
    set "PID=%%a"
)

if defined PID (
    echo       发现旧进程 PID: %PID%，正在关闭 ...
    taskkill /PID %PID% /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo       旧进程已关闭。
    ) else (
        echo       [警告] 关闭进程失败，请手动关闭。
    )
) else (
    echo       端口 4000 空闲，无需关闭旧进程。
)
echo.

REM ---- 第 2 步：清理 Hexo 缓存 ----
echo [2/3] 正在清理 Hexo 缓存 ...
call npx hexo clean
echo.

REM ---- 第 3 步：启动本地预览服务器 ----
echo [3/3] 正在启动 Hexo 本地服务器 ...
echo       访问地址: http://localhost:4000/
echo       按 Ctrl+C 可停止服务器
echo ============================================
echo.
call npx hexo server -p 4000

pause
