@echo off
echo ===============================================
echo 社区关怀系统 - 测试数据生成器
echo ===============================================
echo.
echo 正在生成测试数据...
echo 这个过程可能需要几分钟，请耐心等待...
echo.

cd /d "%~dp0backend"

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    echo.
)

REM 运行数据生成脚本
echo 开始生成测试数据...
node generate-test-data.js

echo.
echo 按任意键退出...
pause > nul