@echo off
cd /d "%~dp0"
echo ================================
echo       CSR志愿者系统
echo       开发工具菜单
echo ================================
echo.
echo 请选择要执行的操作:
echo.
echo [1] 启动完整系统 (前端+后端)
echo [2] 仅启动后端服务器
echo [3] 仅启动前端应用
echo [4] 生成管理员密码
echo [5] 创建管理员账户
echo [6] 安装/更新依赖
echo [0] 退出
echo.
set /p choice="请输入选项 (0-6): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto gen_password
if "%choice%"=="5" goto create_admin
if "%choice%"=="6" goto install_deps
if "%choice%"=="0" goto exit
goto invalid

:start_all
echo 启动完整系统...
call start.bat
goto menu

:start_backend
echo 启动后端服务器...
call start-backend.bat
goto menu

:start_frontend
echo 启动前端应用...
call start-frontend.bat
goto menu

:gen_password
echo 生成管理员密码...
cd backend
node encode-password.js
pause
goto menu

:create_admin
echo 创建管理员账户...
call create-admin.bat
goto menu

:install_deps
echo 安装依赖包...
echo.
echo [1/2] 安装前端依赖...
npm install
echo.
echo [2/2] 安装后端依赖...
cd backend
npm install
cd ..
echo.
echo 依赖安装完成！
pause
goto menu

:invalid
echo 无效选项，请重新选择
pause
goto menu

:exit
echo 再见！
exit /b 0

:menu
cls
goto :eof