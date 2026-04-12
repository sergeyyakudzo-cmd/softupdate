@echo off
chcp 65001 >nul
title 1C Заявки - Монитор
color 0A

set EXTENSION_FOLDER=C:\test_ch\1c-notification-extensionv0.8.0
set GITHUB_BASE=https://raw.githubusercontent.com/sergeyyakudzo-cmd/softupdate/main/1c-notification-extensionv0.8.0/

echo ========================================
echo    1C Заявки - Монитор
echo    Обновление (Safe Mode)
echo ========================================
echo.

if not exist "%EXTENSION_FOLDER%" (
    echo [ОШИБКА] Папка не найдена!
    echo %EXTENSION_FOLDER%
    pause
    exit /b 1
)

:: Закрываем Chrome
echo [1/4] Закрываю Chrome...
taskkill /f /im chrome.exe >nul 2>&1
ping 127.0.0.1 -n 2 >nul
echo OK
echo.

:: Обновляем файлы в корне (кроме config.js)
echo [2/4] Обновляю файлы...

:: manifest.json
echo   - manifest.json
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%manifest.json' -OutFile '%EXTENSION_FOLDER%\manifest.json' -UseBasicParsing" >nul 2>&1

:: background.js  
echo   - background.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%background.js' -OutFile '%EXTENSION_FOLDER%\background.js' -UseBasicParsing" >nul 2>&1

:: content.js
echo   - content.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%content.js' -OutFile '%EXTENSION_FOLDER%\content.js' -UseBasicParsing" >nul 2>&1

:: popup.js
echo   - popup.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%popup.js' -OutFile '%EXTENSION_FOLDER%\popup.js' -UseBasicParsing" >nul 2>&1

:: popup.css
echo   - popup.css
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%popup.css' -OutFile '%EXTENSION_FOLDER%\popup.css' -UseBasicParsing" >nul 2>&1

:: popup.html
echo   - popup.html
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%popup.html' -OutFile '%EXTENSION_FOLDER%\popup.html' -UseBasicParsing" >nul 2>&1

:: utils.js
echo   - utils.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%utils.js' -OutFile '%EXTENSION_FOLDER%\utils.js' -UseBasicParsing" >nul 2>&1

:: logger.js
echo   - logger.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%logger.js' -OutFile '%EXTENSION_FOLDER%\logger.js' -UseBasicParsing" >nul 2>&1

:: max.js
echo   - max.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%max.js' -OutFile '%EXTENSION_FOLDER%\max.js' -UseBasicParsing" >nul 2>&1

:: constants.js
echo   - constants.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%constants.js' -OutFile '%EXTENSION_FOLDER%\constants.js' -UseBasicParsing" >nul 2>&1

echo OK
echo.

:: Обновляем папку shared
echo [3/4] Обновляю shared...
if not exist "%EXTENSION_FOLDER%\shared" mkdir "%EXTENSION_FOLDER%\shared"
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%shared/constants.js' -OutFile '%EXTENSION_FOLDER%\shared\constants.js' -UseBasicParsing" >nul 2>&1
echo OK
echo.

:: Обновляем icons и css
echo [4/4] Обновляю icons и css...
if not exist "%EXTENSION_FOLDER%\icons" mkdir "%EXTENSION_FOLDER%\icons"
if not exist "%EXTENSION_FOLDER%\css" mkdir "%EXTENSION_FOLDER%\css"
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%icons/icon16.png' -OutFile '%EXTENSION_FOLDER%\icons\icon16.png' -UseBasicParsing" >nul 2>&1
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%icons/icon48.png' -OutFile '%EXTENSION_FOLDER%\icons\icon48.png' -UseBasicParsing" >nul 2>&1
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%icons/icon128.png' -OutFile '%EXTENSION_FOLDER%\icons\icon128.png' -UseBasicParsing" >nul 2>&1
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%css/inter-font.css' -OutFile '%EXTENSION_FOLDER%\css\inter-font.css' -UseBasicParsing" >nul 2>&1
echo OK
echo.

:: Запускаем Chrome
echo Запускаю Chrome...
start "" "chrome.exe"

echo.
echo ========================================
echo    ОБНОВЛЕНИЕ УСПЕШНО!
echo ========================================
echo.
echo Не забудь обновить расширение:
echo chrome://extensions -> Обновить
echo.
pause