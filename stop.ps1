# CSR志愿者系统 - 停止服务脚本

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Red
Write-Host "   CSR志愿者系统 - 停止所有服务" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# 查找并停止Node.js进程
Write-Host "查找运行中的Node.js进程..." -ForegroundColor Yellow

$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" }

if ($nodeProcesses) {
    Write-Host "找到 $($nodeProcesses.Count) 个Node.js进程" -ForegroundColor Cyan
    
    foreach ($proc in $nodeProcesses) {
        try {
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
            Write-Host "  PID $($proc.Id): $commandLine" -ForegroundColor Gray
        } catch {
            Write-Host "  PID $($proc.Id): (无法获取详情)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    $response = Read-Host "是否停止所有Node.js进程? [Y/n]"
    
    if ($response -eq "" -or $response -eq "y" -or $response -eq "Y") {
        foreach ($proc in $nodeProcesses) {
            try {
                Stop-Process -Id $proc.Id -Force
                Write-Host "✓ 已停止进程 PID $($proc.Id)" -ForegroundColor Green
            } catch {
                Write-Host "✗ 无法停止进程 PID $($proc.Id)" -ForegroundColor Red
            }
        }
        Write-Host ""
        Write-Host "所有Node.js服务已停止" -ForegroundColor Green
    } else {
        Write-Host "已取消" -ForegroundColor Yellow
    }
} else {
    Write-Host "没有找到运行中的Node.js进程" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
Read-Host
