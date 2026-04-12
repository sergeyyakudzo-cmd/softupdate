@echo off
chcp 65001 >nul
title 1C Заявки - Монитор
color 0A

set EXTENSION_FOLDER=C:\Projects\Notificationbot\Complete\1c-notification-extension
set GITHUB_BASE=https://raw.githubusercontent.com/sergeyyakudzo-cmd/softupdate/main/1c-notification-extensionv0.8.0/

echo ========================================
echo    1C Заявки - Монитор
echo    Полное обновление
echo ========================================
echo.

echo Папка расширения: %EXTENSION_FOLDER%
echo.

if not exist "%EXTENSION_FOLDER%" (
    echo [ОШИБКА] Папка не найдена!
    pause
    exit /b 1
)

:: Закрываем Chrome
echo [1/5] Закрываю Chrome...
taskkill /f /im chrome.exe >nul 2>&1
ping 127.0.0.1 -n 3 >nul
echo OK
echo.

:: Проверяем версию на GitHub
echo [2/5] Проверяю обновление...
powershell -Command "$response = Invoke-WebRequest -Uri '%GITHUB_BASE%version.txt' -UseBasicParsing; $response.Content.Trim()" > "%TEMP%\new_version.txt" 2>nul

if not exist "%TEMP%\new_version.txt" (
    echo [ОШИБКА] Не удалось подключиться к GitHub
    pause
    exit /b 1
)

set /p NEW_VERSION=<"%TEMP%\new_version.txt"

:: Читаем текущую версию
if exist "%EXTENSION_FOLDER%\manifest.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr "\"version\"" "%EXTENSION_FOLDER%\manifest.json"') do (
        set CURRENT_VERSION=%%~a
        set CURRENT_VERSION=%CURRENT_VERSION:"=%
        set CURRENT_VERSION=%CURRENT_VERSION: =%
    )
) else (
    set CURRENT_VERSION=0.0.0
)

echo Текущая версия: %CURRENT_VERSION%
echo Новая версия: %NEW_VERSION%
echo.

if "%CURRENT_VERSION%"=="%NEW_VERSION%" (
    echo Обновление не требуется
    del "%TEMP%\new_version.txt" 2>nul
    start "" "chrome.exe"
    timeout /t 3 >nul
    exit /b 0
)

:: Удаляем ВСЕ старые файлы и папки
echo [3/5] Удаляю старые файлы...

:: Удаляем все файлы в корне
del /f /q "%EXTENSION_FOLDER%\*.*" 2>nul

:: Удаляем вложенные папки
rmdir /s /q "%EXTENSION_FOLDER%\shared" 2>nul
rmdir /s /q "%EXTENSION_FOLDER%\icons" 2>nul
rmdir /s /q "%EXTENSION_FOLDER%\css" 2>nul
rmdir /s /q "%EXTENSION_FOLDER%\popup" 2>nul
rmdir /s /q "%EXTENSION_FOLDER%\webfonts" 2>nul

echo OK
echo.

:: Создаём папки заново
echo [4/5] Создаю папки...
mkdir "%EXTENSION_FOLDER%\shared" 2>nul
mkdir "%EXTENSION_FOLDER%\icons" 2>nul
mkdir "%EXTENSION_FOLDER%\css" 2>nul
mkdir "%EXTENSION_FOLDER%\popup" 2>nul
mkdir "%EXTENSION_FOLDER%\webfonts" 2>nul
echo OK
echo.

:: Скачиваем новые файлы
echo [5/5] Скачиваю новые файлы...

echo   - manifest.json
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%manifest.json' -OutFile '%EXTENSION_FOLDER%\manifest.json' -UseBasicParsing" >nul 2>&1

echo   - background.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%background.js' -OutFile '%EXTENSION_FOLDER%\background.js' -UseBasicParsing" >nul 2>&1

echo   - content.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%content.js' -OutFile '%EXTENSION_FOLDER%\content.js' -UseBasicParsing" >nul 2>&1

echo   - popup.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%popup.js' -OutFile '%EXTENSION_FOLDER%\popup.js' -UseBasicParsing" >nul 2>&1

echo   - popup.css
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%popup.css' -OutFile '%EXTENSION_FOLDER%\popup.css' -UseBasicParsing" >nul 2>&1

echo   - popup.html
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%popup.html' -OutFile '%EXTENSION_FOLDER%\popup.html' -UseBasicParsing" >nul 2>&1

echo   - utils.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%utils.js' -OutFile '%EXTENSION_FOLDER%\utils.js' -UseBasicParsing" >nul 2>&1

echo   - logger.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%logger.js' -OutFile '%EXTENSION_FOLDER%\logger.js' -UseBasicParsing" >nul 2>&1

echo   - max.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%max.js' -OutFile '%EXTENSION_FOLDER%\max.js' -UseBasicParsing" >nul 2>&1

echo   - telegram.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%telegram.js' -OutFile '%EXTENSION_FOLDER%\telegram.js' -UseBasicParsing" >nul 2>&1

echo   - constants.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%constants.js' -OutFile '%EXTENSION_FOLDER%\constants.js' -UseBasicParsing" >nul 2>&1

echo   - shared/constants.js
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%shared/constants.js' -OutFile '%EXTENSION_FOLDER%\shared\constants.js' -UseBasicParsing" >nul 2>&1

echo   - icons/icon16.png
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%icons/icon16.png' -OutFile '%EXTENSION_FOLDER%\icons\icon16.png' -UseBasicParsing" >nul 2>&1

echo   - icons/icon48.png
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%icons/icon48.png' -OutFile '%EXTENSION_FOLDER%\icons\icon48.png' -UseBasicParsing" >nul 2>&1

echo   - icons/icon128.png
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%icons/icon128.png' -OutFile '%EXTENSION_FOLDER%\icons\icon128.png' -UseBasicParsing" >nul 2>&1

echo   - css/inter-font.css
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_BASE%css/inter-font.css' -OutFile '%EXTENSION_FOLDER%\css\inter-font.css' -UseBasicParsing" >nul 2>&1

echo OK
echo.

:: Сохраняем версию
echo %NEW_VERSION% > "%EXTENSION_FOLDER%\version.txt" 2>nul

:: Чистим
del "%TEMP%\new_version.txt" 2>nul

:: Запускаем Chrome
echo Запускаю Chrome...
start "" "chrome.exe"

echo.
echo ========================================
echo    ОБНОВЛЕНИЕ УСПЕШНО!
echo ========================================
echo Версия обновлена: %CURRENT_VERSION% ^-> %NEW_VERSION%
echo.
echo ВАЖНО: Обновите расширение в Chrome:
echo 1. Откройте chrome://extensions
echo 2. Нажмите кнопку "Обновить"
echo.
pause