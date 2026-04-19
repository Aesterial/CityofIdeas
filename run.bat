@echo off
chcp 65001 >nul
setlocal EnableExtensions
title aesterial
color 0C


set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend"

goto menu


:menu
cls
call :banner
echo.
echo     [1] install deps
echo         - npm ci                 (frontend/)
echo         - go mod download        (backend/)
echo.
echo     [2] run dev
echo         - npm run dev            (frontend/)
echo         - go run ./cmd/city-ideasd (backend/)
echo.
echo     [Q] quit
echo.
set /p "CHOICE=     [~] select option: "

if /i "%CHOICE%"=="1" goto install
if /i "%CHOICE%"=="2" goto dev
if /i "%CHOICE%"=="Q" goto end
if /i "%CHOICE%"=="QUIT" goto end

echo.
echo     [-] invalid option. try again.
timeout /t 2 >nul
goto menu


:install
cls
color 0E
call :banner
echo.
echo     [~] installing...
echo.

call :check_paths || (pause & goto menu)

start "Frontend - npm install" cmd /k ^
  "cd /d "%FRONTEND%" && echo. && echo [frontend] npm ci && echo. && npm ci"

start "Backend - go mod download" cmd /k ^
  "cd /d "%BACKEND%" && echo. && echo [backend]  go mod download && echo. && go mod download"

echo.
echo     [+] opened two windows for install tasks.
echo.
pause
color 0B
goto menu


:dev
cls
color 0A
call :banner
echo.
echo     [~] starting dev servers...
echo.

call :check_paths || (pause & goto menu)

start "Frontend - dev" cmd /k ^
  "cd /d "%FRONTEND%" && echo. && echo [frontend] npm run dev && echo. && npm run dev"

start "Backend - api" cmd /k ^
  "cd /d "%BACKEND%" && echo. && echo [backend]  go run ./cmd/city-ideasd && echo. && go run ./cmd/city-ideasd"

echo.
echo     [+] opened two windows for dev servers.
echo.
pause
color 0B
goto menu


:end
endlocal
exit /b 0


=
:hr
exit /b

:banner
call :hr
echo.
echo                             __               .__       .__
echo _____    ____   _______/  ^|_  ___________^|__^|____  ^|  ^|
echo \__  \ _/ __ \ /  ___/\   __\/ __ \_  __ \  \__  \ ^|  ^|
echo  / __ \\  ___/ \___ \  ^|  ^| \  ___/^|  ^| \/  ^|/ __ \^|  ^|__
echo (____  /\___  ^>____  ^> ^|__^|  \___  ^>__^|  ^|__(____  /____/
echo      \/     \/     \/            \/              \/
echo.
call :hr
exit /b

:check_paths
if not exist "%FRONTEND%\" (
  echo     ERROR: folder not found: %FRONTEND%
  exit /b 1
)
if not exist "%BACKEND%\" (
  echo     ERROR: folder not found: %BACKEND%
  exit /b 1
)
exit /b 0
