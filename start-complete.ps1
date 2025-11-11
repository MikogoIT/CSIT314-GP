# CSR Volunteer System - Complete Startup Script
# PowerShell Version

param(
    [switch]$SkipInstall,
    [switch]$SkipBrowser
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n>>> $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[OK] $Message" "Green"
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-WarningMsg {
    param([string]$Message)
    Write-ColorOutput "[WARN] $Message" "Yellow"
}

$RootDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $RootDir

Clear-Host
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "   CSR System - Complete Startup" "Cyan"
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "Project Directory: $RootDir`n" "Gray"

Write-Step "Step 1: Checking Node.js environment..."
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Success "Node.js installed: $nodeVersion"
    } else {
        throw "Node.js not installed"
    }
} catch {
    Write-ErrorMsg "Node.js is not installed or not in PATH"
    Write-ColorOutput "Please visit https://nodejs.org/" "Yellow"
    Read-Host "`nPress Enter to exit"
    exit 1
}

try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Success "npm installed: v$npmVersion"
    }
} catch {
    Write-ErrorMsg "npm is not installed"
    exit 1
}

Write-Step "Step 2: Checking MongoDB connection..."
try {
    $mongoTest = netstat -an | Select-String "27017.*LISTENING"
    if ($mongoTest) {
        Write-Success "MongoDB is running on port 27017"
    } else {
        Write-WarningMsg "MongoDB may not be running on port 27017"
        Write-ColorOutput "Please ensure MongoDB is started" "Yellow"
    }
} catch {
    Write-WarningMsg "Cannot detect MongoDB status"
}

Write-Step "Step 3: Checking environment configuration..."
$envPath = Join-Path $RootDir "backend\.env"
if (Test-Path $envPath) {
    Write-Success "Backend .env file exists"
} else {
    Write-WarningMsg "Backend .env file does not exist"
    Write-ColorOutput "Creating .env template..." "Yellow"
    
    $envContent = "# MongoDB Configuration`r`nMONGODB_URI=mongodb://localhost:27017/csr-volunteer`r`n`r`n# JWT Secret`r`nJWT_SECRET=your-secret-key-change-this`r`n`r`n# Server Configuration`r`nPORT=5000`r`nNODE_ENV=development`r`n`r`n# Frontend URL`r`nFRONTEND_URL=http://localhost:3000"
    
    [System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.Encoding]::UTF8)
    Write-Success "Created backend\.env template"
    Write-WarningMsg "Please edit backend\.env to configure JWT_SECRET"
}

if (-not $SkipInstall) {
    Write-Step "Step 4: Installing dependencies..."
    
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "Installing frontend dependencies..." "Yellow"
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend dependencies installed"
        } else {
            Write-ErrorMsg "Frontend installation failed"
            Read-Host "`nPress Enter to exit"
            exit 1
        }
    } else {
        Write-Success "Frontend dependencies already installed"
    }
    
    Set-Location "backend"
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "Installing backend dependencies..." "Yellow"
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend dependencies installed"
        } else {
            Write-ErrorMsg "Backend installation failed"
            Set-Location $RootDir
            Read-Host "`nPress Enter to exit"
            exit 1
        }
    } else {
        Write-Success "Backend dependencies already installed"
    }
    Set-Location $RootDir
} else {
    Write-WarningMsg "Skipping dependency installation"
}

Write-Step "Step 5: Checking port availability..."
$port5000 = netstat -an | Select-String "0.0.0.0:5000.*LISTENING|127.0.0.1:5000.*LISTENING"
$port3000 = netstat -an | Select-String "0.0.0.0:3000.*LISTENING|127.0.0.1:3000.*LISTENING"

if ($port5000) {
    Write-WarningMsg "Port 5000 is already in use"
    $response = Read-Host "Continue anyway? [y/N]"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 0
    }
} else {
    Write-Success "Port 5000 is available"
}

if ($port3000) {
    Write-WarningMsg "Port 3000 is already in use"
    $response = Read-Host "Continue anyway? [y/N]"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 0
    }
} else {
    Write-Success "Port 3000 is available"
}

Write-Step "Step 6: Starting backend server..."
$backendScript = "Set-Location '$RootDir\backend'; Write-Host '======================================' -ForegroundColor Cyan; Write-Host '     Backend Server' -ForegroundColor Cyan; Write-Host '======================================' -ForegroundColor Cyan; Write-Host ''; npm start"
$backendScriptPath = Join-Path $env:TEMP "csr-backend-start.ps1"
[System.IO.File]::WriteAllText($backendScriptPath, $backendScript, [System.Text.Encoding]::UTF8)

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScriptPath
Write-Success "Backend server starting... (http://localhost:5000)"
Start-Sleep -Seconds 5

Write-Step "Step 7: Starting frontend application..."
$frontendScript = "Set-Location '$RootDir'; Write-Host '======================================' -ForegroundColor Cyan; Write-Host '     Frontend Application' -ForegroundColor Cyan; Write-Host '======================================' -ForegroundColor Cyan; Write-Host ''; `$env:BROWSER='none'; npm start"
$frontendScriptPath = Join-Path $env:TEMP "csr-frontend-start.ps1"
[System.IO.File]::WriteAllText($frontendScriptPath, $frontendScript, [System.Text.Encoding]::UTF8)

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScriptPath
Write-Success "Frontend application starting... (http://localhost:3000)"

if (-not $SkipBrowser) {
    Write-Step "Step 8: Opening browser..."
    Write-ColorOutput "Waiting for frontend to compile..." "Yellow"
    Start-Sleep -Seconds 12
    
    try {
        Start-Process "http://localhost:3000"
        Write-Success "Browser opened"
    } catch {
        Write-WarningMsg "Cannot open browser automatically"
        Write-ColorOutput "Please visit: http://localhost:3000" "Yellow"
    }
}

Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "          Startup Complete!" "Green"
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput ""
Write-ColorOutput "Service Information:" "White"
Write-ColorOutput "  Backend API:  http://localhost:5000" "Green"
Write-ColorOutput "  Frontend App: http://localhost:3000" "Green"
Write-ColorOutput ""
Write-ColorOutput "Default Admin Account:" "White"
Write-ColorOutput "  Username: admin" "Yellow"
Write-ColorOutput "  Password: admin123" "Yellow"
Write-ColorOutput ""
Write-ColorOutput "Test Accounts:" "White"
Write-ColorOutput "  CSR: csr1 / csr123" "Yellow"
Write-ColorOutput "  PIN: pin1 / pin123" "Yellow"
Write-ColorOutput ""
Write-ColorOutput "Tips:" "Gray"
Write-ColorOutput "  - Stop servers: Press Ctrl+C in respective windows" "Gray"
Write-ColorOutput "  - View logs: Check backend and frontend windows" "Gray"
Write-ColorOutput "  - Generate test data: Run generate-test-data.bat" "Gray"
Write-ColorOutput ""

Write-ColorOutput "Press any key to close this window..." "Gray"
Read-Host
