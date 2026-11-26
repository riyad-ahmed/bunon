@echo off
rem Double-click to put the Business Manager dashboard's latest products on the live BUNON website.
cd /d "%~dp0"
call npm run publish:site
echo.
pause
