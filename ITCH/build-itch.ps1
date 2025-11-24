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
Copy-Item "index.html" -Destination $buildDir
Copy-Item "zombie-game.html" -Destination $buildDir
Copy-Item "assets" -Destination $buildDir -Recurse
Copy-Item "css" -Destination $buildDir -Recurse
Copy-Item "js" -Destination $buildDir -Recurse
Copy-Item "sample_assets" -Destination $buildDir -Recurse

Write-Host "Files copied successfully!" -ForegroundColor Green

# Create zip file
Write-Host "Creating zip file..." -ForegroundColor Cyan
Compress-Archive -Path "$buildDir\*" -DestinationPath $zipFile -Force

Write-Host "`nBuild complete! Zip file created: $zipFile" -ForegroundColor Green
Write-Host "Ready to upload to Itch.io!" -ForegroundColor Yellow

# Clean up build directory (optional - comment out if you want to keep it)
# Remove-Item $buildDir -Recurse -Force

# Return to original directory
Pop-Location

