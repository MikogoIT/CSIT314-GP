@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: CSR志愿者系统 - 完整启动脚本 (批处理版本)

title CSR志愿者系统启动

echo ========================================
echo    CSR志愿者系统 - 完整启动脚本
echo ========================================
echo.

:: 获取脚本所在目录
cd /d "%~dp0"

:: 步骤1: 检查Node.js
echo [1/7] 检查Node.js环境...
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] Node.js 未安装或未添加到PATH
    echo 请访问 https://nodejs.org/ 下载并安装Node.js
    pause
    exit /b 1
)

node --version
npm --version
echo [成功] Node.js 环境正常
echo.

:: 步骤2: 检查MongoDB
echo [2/7] 检查MongoDB连接...
netstat -an | findstr "27017.*LISTENING" >nul
if errorlevel 1 (
    echo [警告] MongoDB 似乎未运行在端口 27017
    echo 请确保MongoDB已启动
) else (
    echo [成功] MongoDB 正在运行
)
echo.

:: 步骤3: 检查.env文件
echo [3/7] 检查环境配置...
if not exist "backend\.env" (
    echo [警告] backend\.env 文件不存在，创建模板...
    (
        echo # MongoDB配置
        echo MONGODB_URI=mongodb://localhost:27017/csr-volunteer
        echo.
        echo # JWT密钥
        echo JWT_SECRET=your-secret-key-change-this-in-production
        echo.
        echo # 服务器配置
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # 前端URL
        echo FRONTEND_URL=http://localhost:3000
    ) > "backend\.env"
    echo [成功] 已创建 backend\.env 模板文件
    echo [提示] 请编辑配置文件后重新运行此脚本
    pause
    exit /b 0
) else (
    echo [成功] backend\.env 文件存在
)
echo.

:: 步骤4: 安装前端依赖
echo [4/7] 检查前端依赖...
if not exist "node_modules" (
    echo 安装前端依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
    echo [成功] 前端依赖安装完成
) else (
    echo [成功] 前端依赖已安装
)
echo.

:: 步骤5: 安装后端依赖
echo [5/7] 检查后端依赖...
cd backend
if not exist "node_modules" (
    echo 安装后端依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo [成功] 后端依赖安装完成
) else (
    echo [成功] 后端依赖已安装
)
cd ..
echo.

:: 步骤6: 启动后端服务器
echo [6/7] 启动后端服务器...
start "CSR后端服务器" cmd /k "cd /d %~dp0backend && echo ======================================== && echo           后端服务器 && echo ======================================== && echo. && npm start"
echo [成功] 后端服务器启动中... (http://localhost:5000)
timeout /t 5 /nobreak >nul
echo.

:: 步骤7: 启动前端应用
echo [7/7] 启动前端应用...
start "CSR前端应用" cmd /k "cd /d %~dp0 && echo ======================================== && echo           前端应用 && echo ======================================== && echo. && set BROWSER=none && npm start"
echo [成功] 前端应用启动中... (http://localhost:3000)
echo.

:: 等待并打开浏览器
echo 等待服务启动...
timeout /t 12 /nobreak >nul

echo 打开浏览器...
start http://localhost:3000

:: 显示完成信息
echo.
echo ========================================
echo           启动完成！
echo ========================================
echo.
echo 服务信息:
echo   后端API:  http://localhost:5000
echo   前端应用: http://localhost:3000
echo.
echo 管理员账号:
echo   用户名: admin
echo   密码: admin123
echo.
echo 测试账号:
echo   CSR: csr1 / csr123
echo   PIN: pin1 / pin123
echo.
echo 提示:
echo   - 关闭服务器: 在对应的命令行窗口中按 Ctrl+C
echo   - 查看日志: 查看后端和前端的窗口
echo   - 生成测试数据: 运行 generate-test-data.bat
echo.
pause
