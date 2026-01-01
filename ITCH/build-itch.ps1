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

# Copy required files (rename zombie-game.html to index.html for itch.io)
Write-Host "Copying files..." -ForegroundColor Cyan
Copy-Item "zombie-game.html" -Destination "$buildDir\index.html"
Copy-Item "assets" -Destination $buildDir -Recurse
Copy-Item "css" -Destination $buildDir -Recurse
Copy-Item "js" -Destination $buildDir -Recurse
Copy-Item "sample_assets" -Destination $buildDir -Recurse

Write-Host "Files copied successfully!" -ForegroundColor Green

# Create zip file (handle file locks gracefully)
Write-Host "Creating zip file..." -ForegroundColor Cyan
try {
    # Use .NET compression to handle file locks better
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $zipFile, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Write-Host "Zip file created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Some files may be locked. Trying alternative method..." -ForegroundColor Yellow
    # Fallback to Compress-Archive with error handling
    try {
        Compress-Archive -Path "$buildDir\*" -DestinationPath $zipFile -Force -ErrorAction SilentlyContinue
        Write-Host "Zip file created (some files may be missing due to locks)" -ForegroundColor Yellow
    } catch {
        Write-Host "Error creating zip file. Please close any open files and try again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nBuild complete! Zip file created: $zipFile" -ForegroundColor Green
Write-Host "Ready to upload to Itch.io!" -ForegroundColor Yellow

# Clean up build directory (optional - comment out if you want to keep it)
# Remove-Item $buildDir -Recurse -Force

# Return to original directory
Pop-Location

