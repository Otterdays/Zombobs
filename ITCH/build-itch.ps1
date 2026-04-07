# Build script for Itch.io upload
# Run this from the project root directory
$buildDir = "ZOMBOBS_Web_Build"
$zipFile = "Zombobs_Web.zip"
$rootDir = Split-Path -Parent $PSScriptRoot

# Change to project root directory
Push-Location $rootDir

# Clean up old build
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
}

# Clean up old zip
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Create build directory
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Copy required files
Write-Host "Copying files..." -ForegroundColor Cyan
Copy-Item "index.html" -Destination "$buildDir\index.html"
Copy-Item "landing.html" -Destination "$buildDir\landing.html"
Copy-Item "assets" -Destination $buildDir -Recurse
Copy-Item "css" -Destination $buildDir -Recurse
Copy-Item "js" -Destination $buildDir -Recurse
Copy-Item "sample_assets" -Destination $buildDir -Recurse

Write-Host "Files copied successfully!" -ForegroundColor Green

# Create zip with POSIX-style paths (forward slashes only in entry names).
# Itch.io's HTML CDN maps URLs like css/style.css to zip entries; Windows
# ZipFile::CreateFromDirectory stores css\style.css, which does NOT match (403).
Write-Host "Creating zip file (forward-slash paths for Itch.io)..." -ForegroundColor Cyan
try {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $buildFull = (Resolve-Path -LiteralPath $buildDir).Path
    if (Test-Path -LiteralPath $zipFile) {
        Remove-Item -LiteralPath $zipFile -Force
    }
    $archive = [System.IO.Compression.ZipFile]::Open(
        (Join-Path (Get-Location) $zipFile),
        [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -LiteralPath $buildFull -Recurse -File | ForEach-Object {
            $rel = $_.FullName.Substring($buildFull.Length).TrimStart('\')
            $entryName = $rel -replace '\\', '/'
            [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive, $_.FullName, $entryName)
        }
    } finally {
        $archive.Dispose()
    }
    Write-Host "Zip file created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error creating zip: $_" -ForegroundColor Red
    Write-Host "Do not use Compress-Archive for Itch.io - it also emits backslashes on Windows." -ForegroundColor Yellow
    exit 1
}

# Hard gate: Itch.io CDN matches URL paths with forward slashes only. Backslashes in entry
# names (default Windows zip behavior) cause 403 on css/js — fail the build if detected.
Write-Host "Validating zip (Itch.io path rules)..." -ForegroundColor Cyan
$zipFullPath = Join-Path (Get-Location) $zipFile
$zipRead = [System.IO.Compression.ZipFile]::OpenRead($zipFullPath)
try {
    $badEntries = [System.Collections.Generic.List[string]]::new()
    foreach ($entry in $zipRead.Entries) {
        if ($entry.FullName.Contains('\')) {
            [void]$badEntries.Add($entry.FullName)
        }
    }
    if ($badEntries.Count -gt 0) {
        Write-Host "BUILD FAILED: Zip has backslash in entry paths (Itch.io returns 403):" -ForegroundColor Red
        foreach ($name in $badEntries) {
            Write-Host "  $name" -ForegroundColor Red
        }
        exit 1
    }
    $required = @(
        'index.html',
        'css/style.css',
        'css/fonts.css',
        'js/main.js',
        'js/vendor/socket.io.min.js'
    )
    foreach ($req in $required) {
        $match = $false
        foreach ($entry in $zipRead.Entries) {
            if ($entry.FullName -eq $req) {
                $match = $true
                break
            }
        }
        if (-not $match) {
            Write-Host "BUILD FAILED: Required zip entry missing: $req" -ForegroundColor Red
            exit 1
        }
    }
} finally {
    $zipRead.Dispose()
}
Write-Host "Zip validation passed (POSIX paths + required files)." -ForegroundColor Green

Write-Host "`nBuild complete! Zip file created: $zipFile" -ForegroundColor Green
Write-Host "Ready to upload to Itch.io!" -ForegroundColor Yellow

# Clean up build directory (optional - comment out if you want to keep it)
# Remove-Item $buildDir -Recurse -Force

# Return to original directory
Pop-Location

