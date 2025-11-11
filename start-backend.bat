@echo off
cd /d "%~dp0backend"
echo ================================
echo     启动后端服务器
echo ================================
echo.

echo 检查环境配置...
if not exist ".env" (
    echo 错误: .env 文件不存在
    echo 请确保 backend/.env 文件已配置
    pause
    exit /b 1
)

echo 检查依赖包...
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
)

echo.
echo 启动开发服务器...
echo 后端API将运行在: http://localhost:5000
echo 按 Ctrl+C 停止服务器
echo.

npm start

pause