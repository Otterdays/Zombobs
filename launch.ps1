# Zombobs Server Launcher
# PowerShell wrapper with styled output and enhanced information

$Host.UI.RawUI.WindowTitle = "Zombobs Server"

# Server configuration
$script:SERVER_PORT = 3000
$SERVER_PORT = $script:SERVER_PORT  # For backward compatibility
$SERVER_VERSION = "0.8.1.7-ALPHA"
$HF_SPACE_URL = "https://ottertondays-zombs.hf.space"
$HF_SPACE_PAGE = "https://huggingface.co/spaces/OttertonDays/zombs"

# Taskbar configuration
$script:TaskbarEnabled = $true
$script:TaskbarUpdateInterval = 2  # Update every 2 seconds
$script:TaskbarTimer = $null

function Write-Colored {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    if ([string]::IsNullOrEmpty($Message)) {
        Write-Host ""
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Get-BackendRAM {
    try {
        # Get Node.js processes (server should be running as node.exe)
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            # Sum up memory usage of all Node.js processes (in MB)
            $totalBackendRAM = ($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
            return [math]::Round($totalBackendRAM, 2)
        }
        return 0
    } catch {
        return 0
    }
}

function Get-SystemStats {
    $stats = @{}
    try {
        # Get RAM usage
        $os = Get-CimInstance Win32_OperatingSystem
        $totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        $freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
        $usedRAM = [math]::Round($totalRAM - $freeRAM, 2)
        $ramPercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
        
        $stats.TotalRAM = $totalRAM
        $stats.UsedRAM = $usedRAM
        $stats.FreeRAM = $freeRAM
        $stats.RAMPercent = $ramPercent
        
        # Get backend RAM usage
        $stats.BackendRAM = Get-BackendRAM
        
        # Get CPU usage (average over 1 second)
        $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
        if ($cpu) {
            $stats.CPUPercent = [math]::Round($cpu.CounterSamples[0].CookedValue, 1)
        } else {
            $stats.CPUPercent = 0
        }
        
        # Get uptime
        $uptime = (Get-Date) - $os.LastBootUpTime
        $stats.Uptime = "{0:D2}:{1:D2}:{2:D2}" -f $uptime.Hours, $uptime.Minutes, $uptime.Seconds
        
        # Get current time
        $stats.CurrentTime = Get-Date -Format "HH:mm:ss"
        
    } catch {
        $stats.Error = $_.Exception.Message
    }
    return $stats
}

function Show-Taskbar {
    $stats = Get-SystemStats
    
    # Save current cursor position
    $cursorTop = [Console]::CursorTop
    $cursorLeft = [Console]::CursorLeft
    
    # Move to top of screen
    [Console]::SetCursorPosition(0, 0)
    
    # Build taskbar line
    $ramColor = if ($stats.RAMPercent -gt 80) { "Red" } elseif ($stats.RAMPercent -gt 60) { "Yellow" } else { "Green" }
    $cpuColor = if ($stats.CPUPercent -gt 80) { "Red" } elseif ($stats.CPUPercent -gt 60) { "Yellow" } else { "Green" }
    $backendRAMColor = if ($stats.BackendRAM -gt 500) { "Yellow" } elseif ($stats.BackendRAM -gt 0) { "Cyan" } else { "DarkGray" }
    
    $taskbarLine = "RAM: $($stats.UsedRAM)GB/$($stats.TotalRAM)GB ($($stats.RAMPercent)%) | CPU: $($stats.CPUPercent)% | Backend: $($stats.BackendRAM)MB | Uptime: $($stats.Uptime) | Time: $($stats.CurrentTime) | Port: $SERVER_PORT"
    
    # Clear the line and write taskbar
    Write-Host (" " * ([Console]::WindowWidth - 1)) -NoNewline
    [Console]::SetCursorPosition(0, 0)
    
    # Write colored taskbar
    Write-Host "RAM: " -NoNewline
    Write-Host "$($stats.UsedRAM)GB/$($stats.TotalRAM)GB ($($stats.RAMPercent)%)" -ForegroundColor $ramColor -NoNewline
    Write-Host " | CPU: " -NoNewline
    Write-Host "$($stats.CPUPercent)%" -ForegroundColor $cpuColor -NoNewline
    Write-Host " | Backend: " -NoNewline
    Write-Host "$($stats.BackendRAM)MB" -ForegroundColor $backendRAMColor -NoNewline
    Write-Host " | Uptime: $($stats.Uptime) | Time: $($stats.CurrentTime) | Port: $($script:SERVER_PORT)" -NoNewline
    
    # Restore cursor position
    [Console]::SetCursorPosition($cursorLeft, $cursorTop)
}

function Start-TaskbarMonitor {
    if (-not $script:TaskbarEnabled) { return }
    
    # Stop existing timer if any
    if ($script:TaskbarTimer) {
        $script:TaskbarTimer.Stop()
        $script:TaskbarTimer.Dispose()
    }
    
    # Use script-scoped variables
    $interval = $script:TaskbarUpdateInterval
    
    # Create a timer to update taskbar periodically
    $script:TaskbarTimer = New-Object System.Timers.Timer
    $script:TaskbarTimer.Interval = $interval * 1000
    $script:TaskbarTimer.AutoReset = $true
    
    # Register event to update taskbar
    $null = Register-ObjectEvent -InputObject $script:TaskbarTimer -EventName Elapsed -Action {
        try {
            # Get stats
            $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
            if (-not $os) { return }
            
            $totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
            $freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
            $usedRAM = [math]::Round($totalRAM - $freeRAM, 2)
            $ramPercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
            
            $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
            $cpuPercent = if ($cpu) { [math]::Round($cpu.CounterSamples[0].CookedValue, 1) } else { 0 }
            
            $uptime = (Get-Date) - $os.LastBootUpTime
            $uptimeStr = "{0:D2}:{1:D2}:{2:D2}" -f $uptime.Hours, $uptime.Minutes, $uptime.Seconds
            $currentTime = Get-Date -Format "HH:mm:ss"
            
            # Save cursor position
            $cursorTop = [Console]::CursorTop
            $cursorLeft = [Console]::CursorLeft
            
            # Update taskbar at top
            [Console]::SetCursorPosition(0, 0)
            Write-Host (" " * ([Console]::WindowWidth - 1)) -NoNewline
            [Console]::SetCursorPosition(0, 0)
            
            $ramColor = if ($ramPercent -gt 80) { "Red" } elseif ($ramPercent -gt 60) { "Yellow" } else { "Green" }
            $cpuColor = if ($cpuPercent -gt 80) { "Red" } elseif ($cpuPercent -gt 60) { "Yellow" } else { "Green" }
            
            # Get backend RAM usage
            $backendRAM = 0
            try {
                $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
                if ($nodeProcesses) {
                    $backendRAM = [math]::Round(($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
                }
            } catch {
                # Silently fail
            }
            $backendRAMColor = if ($backendRAM -gt 500) { "Yellow" } elseif ($backendRAM -gt 0) { "Cyan" } else { "DarkGray" }
            
            Write-Host "RAM: " -NoNewline
            Write-Host "$usedRAM GB/$totalRAM GB ($ramPercent%)" -ForegroundColor $ramColor -NoNewline
            Write-Host " | CPU: " -NoNewline
            Write-Host "$cpuPercent%" -ForegroundColor $cpuColor -NoNewline
            Write-Host " | Backend: " -NoNewline
            Write-Host "$backendRAM MB" -ForegroundColor $backendRAMColor -NoNewline
            Write-Host " | Uptime: $uptimeStr | Time: $currentTime | Port: $($script:SERVER_PORT)" -NoNewline
            
            # Restore cursor
            [Console]::SetCursorPosition($cursorLeft, $cursorTop)
        } catch {
            # Silently fail
        }
    }
    
    $script:TaskbarTimer.Start()
}

function Stop-TaskbarMonitor {
    if ($script:TaskbarTimer) {
        $script:TaskbarTimer.Stop()
        $script:TaskbarTimer.Dispose()
        $script:TaskbarTimer = $null
    }
    # Clean up registered events
    Get-EventSubscriber | Where-Object { $_.SourceObject -eq $script:TaskbarTimer } | Unregister-Event -ErrorAction SilentlyContinue
}

function Write-Banner {
    Clear-Host
    # Show taskbar at top
    if ($script:TaskbarEnabled) {
        Show-Taskbar
        Write-Host ""
    }
    Write-Colored "Zombobs Server v$SERVER_VERSION" "Cyan"
    Write-Host ""
}

function Check-NodeJS {
    Write-Colored "[*] Checking Node.js..." "Yellow"
    try {
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodeCmd) {
            return $false
        }
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo.FileName = "node"
        $process.StartInfo.Arguments = "--version"
        $process.StartInfo.RedirectStandardOutput = $true
        $process.StartInfo.RedirectStandardError = $true
        $process.StartInfo.UseShellExecute = $false
        $process.StartInfo.CreateNoWindow = $true
        $process.Start() | Out-Null
        $nodeVersion = $process.StandardOutput.ReadToEnd().Trim()
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0 -and $nodeVersion) {
            Write-Colored "[+] Node.js $nodeVersion" "Green"
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

function Check-PortAvailable {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($connection) {
            Write-Colored "[-] Port $Port is in use" "Red"
            return $false
        }
        return $true
    } catch {
        return $true
    }
}

function Get-LocalIP {
    try {
        $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*","Wi-Fi*","Local Area Connection*" -ErrorAction SilentlyContinue | 
            Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "127.*" } | 
            Select-Object -First 1 -ExpandProperty IPAddress
        return $ipAddresses
    } catch {
        return $null
    }
}

function Show-ServerInfo {
    $localIP = Get-LocalIP
    Write-Colored "Local: http://localhost:$SERVER_PORT" "Cyan"
    if ($localIP) {
        Write-Colored "Network: http://${localIP}:$SERVER_PORT" "Cyan"
    }
    Write-Host ""
}

function Install-Dependencies {
    Write-Colored "[*] Checking dependencies..." "Yellow"
    
    if (-not (Test-Path "LOCAL_SERVER\node_modules")) {
        Write-Colored "[*] Installing dependencies..." "Yellow"
        Push-Location LOCAL_SERVER
        & npm install | Out-Null
        $installSuccess = $?
        Pop-Location
        
        if (-not $installSuccess) {
            Write-Colored "[-] Failed to install dependencies" "Red"
            return $false
        }
        Write-Colored "[+] Dependencies installed" "Green"
    } else {
        Write-Colored "[+] Dependencies ready" "Green"
    }
    return $true
}

function Test-HuggingFaceServer {
    try {
        $response = Invoke-WebRequest -Uri "$HF_SPACE_URL/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Show-ConnectionInstructions {
    # Removed - info already shown in Show-ServerInfo
}

function Start-Server {
    Write-Colored "[*] Starting server..." "Yellow"
    
    # Check port availability
    if (-not (Check-PortAvailable -Port $SERVER_PORT)) {
        Write-Colored "Cannot start server - port is in use." "Red"
        return $false
    }
    
    # Show server information
    Show-ServerInfo
    
    Write-Colored "Press Ctrl+C to stop the server" "DarkGray"
    Write-Host ""
    
    # Clear screen and show taskbar
    Clear-Host
    if ($script:TaskbarEnabled) {
        Show-Taskbar
        Start-TaskbarMonitor
    }
    
    Push-Location LOCAL_SERVER
    try {
        $confirmationShown = $false
        $localIP = Get-LocalIP
        
        # Start npm and filter output in real-time
        & npm start 2>&1 | ForEach-Object {
            $line = $_
            
            # Update taskbar periodically
            if ($script:TaskbarEnabled) {
                Show-Taskbar
            }
            
            # Check for server startup
            if ($line -match "Server running on port|Local server running on port|server running on port") {
                if (-not $confirmationShown) {
                    $confirmationShown = $true
                    Write-Host ""
                    Write-Colored "[+] Server started successfully!" "Green"
                    Write-Host ""
                }
            }
            
            # Highlight connection/disconnection messages
            if ($line -match "CLIENT CONNECTED|CLIENT CONNECTED!") {
                Write-Host $line -ForegroundColor Green
            }
            elseif ($line -match "CLIENT DISCONNECTED|CLIENT DISCONNECTED") {
                Write-Host $line -ForegroundColor Red
            }
            elseif ($line -match "Player:|Total Players Online:|Active Players:") {
                Write-Host $line -ForegroundColor Cyan
            }
            elseif ($line -match "set name to|READY|NOT READY") {
                Write-Host $line -ForegroundColor Yellow
            }
            elseif ($line -match "^={60}$|^={60}") {
                # Highlight separator lines for connections
                Write-Host $line -ForegroundColor DarkGray
            }
            # Filter out npm noise but show everything else
            elseif ($line -notmatch "^npm WARN|^npm notice|^> zombobs-server@|^\s*$") {
                Write-Host $line
            }
        }
        
        $serverSuccess = $confirmationShown
        
        # If server exits with failure, it crashed
        if (-not $serverSuccess) {
            Write-Host ""
            Write-Colored "[-] Server crashed. Check error messages above." "Red"
            Write-Host ""
            return $false
        }
        
        # If exit code is 0, server stopped normally (user pressed Ctrl+C)
        return $true
    }
    catch {
        Write-Colored "[-] Server startup error: $($_.Exception.Message)" "Red"
        return $false
    }
    finally {
        Stop-TaskbarMonitor
        Pop-Location
    }
}

# Main execution
try {
    Write-Banner
    
    if (-not (Check-NodeJS)) {
        Write-Colored "[-] Node.js is required. Install from: https://nodejs.org/" "Red"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    if (-not (Install-Dependencies)) {
        Write-Colored "[-] Failed to install dependencies. Check errors above." "Red"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Call Start-Server - this will run until server is stopped
    $serverStarted = Start-Server
    
    # Check if server started successfully
    if (-not $serverStarted) {
        Write-Colored "[-] Server failed to start or crashed." "Red"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # If we get here, the server has stopped normally
    Stop-TaskbarMonitor
    Write-Colored "[*] Server stopped." "Yellow"
    
} catch {
    Stop-TaskbarMonitor
    Write-Colored "[-] Fatal error: $($_.Exception.Message)" "Red"
    Read-Host "Press Enter to exit"
    exit 1
}
