@echo off
REM Terraria Companion - Local Server Launcher (Windows)
REM This script starts the local server for offline use

echo.
echo ============================================
echo   Terraria Companion Local Server
echo ============================================
echo.

REM Check if dist folder exists
if not exist "dist\" (
    echo ERROR: dist folder not found!
    echo Please run: npm run build
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Start the server
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

node server.js
pause