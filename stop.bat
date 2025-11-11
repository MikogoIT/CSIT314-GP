@echo off
chcp 65001 >nul

:: CSR志愿者系统 - 停止服务脚本

title CSR志愿者系统 - 停止服务

echo ========================================
echo    CSR志愿者系统 - 停止所有服务
echo ========================================
echo.

echo 查找运行中的Node.js进程...
tasklist | findstr "node.exe" >nul
if errorlevel 1 (
    echo 没有找到运行中的Node.js进程
    echo.
    pause
    exit /b 0
)

echo.
echo 运行中的Node.js进程:
tasklist | findstr "node.exe"
echo.

set /p confirm="是否停止所有Node.js进程? [Y/n]: "
if /i "%confirm%"=="n" (
    echo 已取消
    pause
    exit /b 0
)

echo.
echo 停止Node.js进程...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    echo [错误] 无法停止进程
) else (
    echo [成功] 所有Node.js服务已停止
)

echo.
pause
