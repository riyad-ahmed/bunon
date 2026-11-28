@echo off
rem Double-click to open the BUNON product dashboard in your browser.
title BUNON Products
cd /d "%~dp0"

rem Already running? Then just open it again.
curl -s -o nul -m 2 http://localhost:5173/admin/api/state && (
  start "" http://localhost:5173/admin/
  exit /b
)

echo.
echo   BUNON product dashboard
echo   Opening in your browser... keep this window open while you work.
echo   Close this window when you are done.
echo.
call npm run admin
echo.
pause
