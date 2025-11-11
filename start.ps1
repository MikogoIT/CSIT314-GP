# CSR志愿者系统 - 一键启动脚本 (PowerShell版本)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "      CSR志愿者系统启动脚本" -ForegroundColor Cyan  
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "[1/3] 启动后端服务器..." -ForegroundColor Yellow
Set-Location "backend"

# 检查.env文件
if (-not (Test-Path ".env")) {
    Write-Host "错误: .env 文件不存在，请先配置环境变量" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

# 启动后端（新窗口）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Write-Host "后端服务器启动中... (端口: 5000)" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "[2/3] 启动前端应用..." -ForegroundColor Yellow
Set-Location ".."

# 启动前端（新窗口，禁用自动打开浏览器）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Write-Host "前端应用启动中... (端口: 3000)" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] 打开浏览器..." -ForegroundColor Yellow
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "    启动完成！" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "后端API: http://localhost:5000" -ForegroundColor White
Write-Host "前端应用: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "按任意键关闭此窗口..." -ForegroundColor Gray
Read-Host