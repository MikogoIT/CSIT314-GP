# CSR志愿者系统 - 后端启动脚本

Write-Host "================================" -ForegroundColor Cyan
Write-Host "     启动后端服务器" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录并切换到backend
$ScriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location "$ScriptDir\backend"

Write-Host "检查环境配置..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "错误: .env 文件不存在" -ForegroundColor Red
    Write-Host "请确保 backend/.env 文件已配置" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host "检查依赖包..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖包..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "启动开发服务器..." -ForegroundColor Green
Write-Host "后端API将运行在: http://localhost:5000" -ForegroundColor White
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host ""

npm start

Read-Host "按Enter键退出"