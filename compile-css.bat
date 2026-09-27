@echo off
REM ============================================================
REM  compile-css.bat - 编译自定义首页样式
REM  源:   source/_styl/custom-home.styl
REM  产物: source/css/custom-home.css  (站点实际引用)
REM  用法: 双击运行，或命令行执行 compile-css.bat
REM  注意: 修改 styl 后必须跑一次本脚本，再 hexo g
REM ============================================================
cd /d %~dp0

echo [1/2] 编译 styl -^> css ...
REM hexo render 把 CSS 输出到 stdout（不写文件），--silent 抑制 stdout 里的日志行（否则 ANSI 色码会污染 CSS 导致浏览器解析 0 条规则）
npx hexo render source/_styl/custom-home.styl --silent > "source\css\custom-home.css"
if errorlevel 1 (
  echo [!] 编译失败，请检查 styl 语法
  pause
  exit /b 1
)

echo [2/2] 校验产物 ...
set "CSS_SIZE="
for %%F in ("source\css\custom-home.css") do set "CSS_SIZE=%%~zF"
if not defined CSS_SIZE (
  echo [!] 未找到编译产物 source\css\custom-home.css
  pause
  exit /b 1
)
if %CSS_SIZE% LSS 1000 (
  echo [!] 编译产物异常（%CSS_SIZE% 字节），请检查
  pause
  exit /b 1
)

echo 完成！样式已更新，运行 npm run build 生成站点。
pause
