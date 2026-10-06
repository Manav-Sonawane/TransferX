@echo off
setlocal

set "ROOT=%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
    echo npm was not found. Install Node.js 18 or newer, then try again.
    pause
    exit /b 1
)

if not exist "%ROOT%server\package.json" (
    echo Server project was not found at "%ROOT%server".
    pause
    exit /b 1
)

if not exist "%ROOT%client\package.json" (
    echo Client project was not found at "%ROOT%client".
    pause
    exit /b 1
)

start "TransferX Server" /D "%ROOT%server" cmd /k npm run dev
start "TransferX Client" /D "%ROOT%client" cmd /k npm run dev

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

endlocal
