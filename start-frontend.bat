@echo off
cd /d "%~dp0"
echo ================================
echo     启动前端应用
echo ================================
echo.

echo 检查依赖包...
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
)

echo.
echo 选择启动方式:
echo [1] 正常启动 (自动打开浏览器)
echo [2] 静默启动 (不打开浏览器)
echo.
set /p choice="请选择 (1 或 2): "

if "%choice%"=="2" (
    echo 启动前端开发服务器 (静默模式)...
    echo 前端应用将运行在: http://localhost:3000
    echo 请手动打开浏览器访问上述地址
    echo 按 Ctrl+C 停止服务器
    echo.
    npm start
) else (
    echo 启动前端开发服务器...
    echo 前端应用将运行在: http://localhost:3000
    echo 浏览器将自动打开
    echo 按 Ctrl+C 停止服务器
    echo.
    npm run start:browser
)

pause