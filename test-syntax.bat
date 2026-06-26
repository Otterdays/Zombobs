@echo off
: Test script to find syntax error
goto :main

:main
for /r /b %%f in (*.js) do (
    echo Testing: %%f
    node -e "require('^'$f'^')" > nul 2>&1
    if errorlevel 1 (
        echo Syntax error in: %%f
        set errors=true
        rem Continue to test remaining files
    ) else (
        echo OK - %%f
    )
)

if defined errors (
    echo.
    echo Syntax errors found!
    exit /b 1
) else (
    echo.
    echo All JavaScript files have valid syntax!
    exit /b 0
)