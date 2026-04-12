/**
 * Генератор update.bat для расширения
 */

function generateUpdateBat(extFolder, githubBase) {
    console.log('generateUpdateBat called:', extFolder, githubBase);
    
    var lines = [];
    
    lines.push("@echo off");
    lines.push("chcp 65001 >nul");
    lines.push("title 1C Monitor Update");
    lines.push("color 0A");
    lines.push("");
    lines.push("set EXT=" + extFolder);
    lines.push("set GH=" + githubBase);
    lines.push("");
    lines.push("echo ==============================");
    lines.push("echo    1C Monitor Auto Update");
    lines.push("echo ==============================");
    lines.push("echo.");
    
    lines.push("if not exist \"%EXT%\" (");
    lines.push("    echo [ERROR] Folder not found!");
    lines.push("    pause");
    lines.push("    exit /b 1");
    lines.push(")");
    
    lines.push("");
    lines.push("echo [1/3] Closing Chrome...");
    lines.push("taskkill /f /im chrome.exe >nul 2>&1");
    lines.push("ping 127.0.0.1 -n 2 >nul");
    lines.push("echo OK");
    
    lines.push("");
    lines.push("echo [2/3] Deleting old files...");
    lines.push("del /f /q \"%EXT%\\*.js\" 2>nul");
    lines.push("del /f /q \"%EXT%\\*.css\" 2>nul");
    lines.push("del /f /q \"%EXT%\\*.html\" 2>nul");
    lines.push("echo OK");
    
    lines.push("");
    lines.push("echo [3/3] Downloading new files...");
    lines.push("powershell -Command \"iwr -Uri %GH%manifest.json -OutFile %EXT%\\manifest.json -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%background.js -OutFile %EXT%\\background.js -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%content.js -OutFile %EXT%\\content.js -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%popup.js -OutFile %EXT%\\popup.js -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%popup.css -OutFile %EXT%\\popup.css -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%popup.html -OutFile %EXT%\\popup.html -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%utils.js -OutFile %EXT%\\utils.js -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%logger.js -OutFile %EXT%\\logger.js -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%max.js -OutFile %EXT%\\max.js -UseBasicParsing\" >nul 2>&1");
    lines.push("powershell -Command \"iwr -Uri %GH%constants.js -OutFile %EXT%\\constants.js -UseBasicParsing\" >nul 2>&1");
    lines.push("echo OK");
    
    lines.push("");
    lines.push("echo Starting Chrome...");
    lines.push("start \"\" \"chrome.exe\"");
    lines.push("");
    lines.push("echo ==============================");
    lines.push("echo    UPDATE COMPLETE!");
    lines.push("echo ==============================");
    lines.push("echo Reload extension in chrome://extensions");
    lines.push("pause");
    
    return lines.join("\r\n");
}

if (typeof window !== 'undefined') {
    window.generateUpdateBat = generateUpdateBat;
}