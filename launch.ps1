# Zombobs Server Launcher - Simplified
$Host.UI.RawUI.WindowTitle = "Zombobs Server"

$SERVER_PORT = 3000
$SERVER_VERSION = "0.8.2.1-ALPHA"

function Write-Info {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host $Message -ForegroundColor $Color
}

# Clear and show banner
Clear-Host
Write-Info "Zombobs Server v$SERVER_VERSION" "Cyan"
Write-Host ""

# Quick Node.js check
Write-Info "[*] Checking Node.js..." "Yellow"
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Info "[+] Node.js $nodeVersion" "Green"
    } else {
        Write-Info "[-] Node.js not found. Install from: https://nodejs.org/" "Red"
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Info "[-] Node.js not found. Install from: https://nodejs.org/" "Red"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check port
Write-Info "[*] Checking port $SERVER_PORT..." "Yellow"
$portInUse = Get-NetTCPConnection -LocalPort $SERVER_PORT -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Info "[-] Port $SERVER_PORT is in use" "Red"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Info "[+] Port $SERVER_PORT available" "Green"

# Install dependencies if needed
Write-Info "[*] Checking dependencies..." "Yellow"
if (-not (Test-Path "LOCAL_SERVER\node_modules")) {
    Write-Info "[*] Installing dependencies (this may take a moment)..." "Yellow"
    Push-Location LOCAL_SERVER
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Info "[-] Failed to install dependencies" "Red"
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
    Write-Info "[+] Dependencies installed" "Green"
} else {
    Write-Info "[+] Dependencies ready" "Green"
}

# Show server info
Write-Host ""
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*","Wi-Fi*","Local Area Connection*" -ErrorAction SilentlyContinue | 
    Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "127.*" } | 
    Select-Object -First 1 -ExpandProperty IPAddress)
Write-Info "Local: http://localhost:$SERVER_PORT" "Cyan"
if ($localIP) {
    Write-Info "Network: http://${localIP}:$SERVER_PORT" "Cyan"
}
Write-Host ""
Write-Info "Starting server... (Press Ctrl+C to stop)" "Yellow"
Write-Host ""

# Start server and show all output
Push-Location LOCAL_SERVER
try {
    & npm start
} catch {
    Write-Info "[-] Server error: $($_.Exception.Message)" "Red"
} finally {
    Pop-Location
}

Write-Host ""
Write-Info "[*] Server stopped." "Yellow"
Read-Host "Press Enter to exit"
