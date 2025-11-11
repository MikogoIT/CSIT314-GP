Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "社区关怀系统 - 测试数据生成器" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在生成测试数据..." -ForegroundColor Yellow
Write-Host "这个过程可能需要几分钟，请耐心等待..." -ForegroundColor Yellow
Write-Host ""

# 切换到backend目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
Set-Location $backendPath

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖包..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# 运行数据生成脚本
Write-Host "开始生成测试数据..." -ForegroundColor Green
node generate-test-data.js

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")