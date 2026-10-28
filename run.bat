@echo off
setlocal
cd /d "%~dp0"
title LigtasPangan

if not exist "extension\manifest.json" (
  echo.
  echo   extension\manifest.json was not found.
  echo   Put this file in the ligtas-pangan folder and run it again.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found.
  echo   Install Node.js 18 or newer, then run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting the LigtasPangan test server...
start "LigtasPangan server" cmd /c node serve\server.js

timeout /t 2 /nobreak >nul

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "CHROME=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "CHROME=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if not defined CHROME (
  echo   Chrome and Edge were not found in the usual folders.
  echo   Open chrome://extensions and load the extension folder by hand.
  echo.
  pause
  exit /b 1
)

echo   Opening the browser with LigtasPangan loaded...
echo.
start "" "%CHROME%" --user-data-dir="%~dp0chrome-profile" --no-first-run --no-default-browser-check --disable-extensions-except="%~dp0extension" --load-extension="%~dp0extension" "http://127.0.0.1:4173/home/index.html"

echo   Server window:  LigtasPangan server
echo   Home page:      http://127.0.0.1:4173/home/index.html
echo   Practice pages: http://127.0.0.1:4173/pagsubok/
echo.
echo   Close the server window when you are done.
echo.
timeout /t 6 /nobreak >nul
exit /b 0
