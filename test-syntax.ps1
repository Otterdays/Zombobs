# Test script to find syntax error - Windows PowerShell version
# This script will test all JavaScript files for syntax errors

$allJsFiles = Get-ChildItem -Recurse -Filter "*.js" | Select-Object -ExpandProperty FullName
$errors = @()

Write-Host "Testing JavaScript syntax..." -ForegroundColor Yellow

# Function to strip Windows path backslashes for Node.js
function Convert-Path($path) {
    return $path -replace "\\", "/"
}

foreach ($file in $allJsFiles) {
    try {
        # Write a test file and require it
        $testContent = @"
// Test to check syntax
test_var = "test"
require('$($file -replace '\\', '\\\\')')
return "Valid"
"@
        $tempFile = "$env:TEMP\test_syntax_$(Get-Random).js"
        Set-Content -Path $tempFile -Value $testContent
        $result = node $tempFile
        Remove-Item -Path $tempFile -Force
        Write-Host "✓ $file" -ForegroundColor Green
    }
    catch {
        $errors += $file
        Write-Host "✗ $file - $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Syntax errors found in: $($errors -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All JavaScript files have valid syntax!" -ForegroundColor Green
    exit 0
}
