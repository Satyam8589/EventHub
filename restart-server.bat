@echo off
echo ========================================
echo Restarting EventHub Development Server
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node processes stopped
) else (
    echo ! No Node processes were running
)

echo.
echo Step 2: Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Step 3: Starting development server...
echo.
cd /d "%~dp0"
start "EventHub Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo ✓ Server restart initiated!
echo ========================================
echo.
echo A new window should open with the dev server.
echo Wait for "Ready" message before refreshing your browser.
echo.
pause
