function generateUpdateBat(extFolder, githubBase) {
    const files = [
        'background.js', 'content.js', 'popup.js', 'popup.html',
        'manifest.json', 'config.js', 'logger.js', 'constants.js',
        'shared/constants.js', 'update.js', 'update-generator.js'
    ];

    let bat = `@echo off\nchcp 65001 >nul\n`;
    bat += `set "EXT_FOLDER=${extFolder}"\n`;
    bat += `set "BASE_URL=${githubBase}"\n\n`;
    bat += `echo Обновление расширения 1C Notification...\n\n`;

    for (const file of files) {
        const dir = file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : '';
        if (dir) {
            bat += `if not exist "${extFolder}\\${dir.replace('/', '\\')}" mkdir "${extFolder}\\${dir.replace('/', '\\')}"\n`;
        }
        bat += `echo Downloading ${file}...\n`;
        const dest = `${extFolder}\\${file.replace('/', '\\')}`;
        const url = `${githubBase}${file}`;
        bat += `powershell -Command "try { Invoke-WebRequest -Uri '${url}' -OutFile '${dest}' -ErrorAction Stop; Write-Host 'OK' } catch { Write-Host 'FAIL: $($_.Exception.Message)'; exit 1 }"\n`;
    }

    bat += `\necho.\necho Обновление завершено! Перезагрузите расширение в chrome://extensions/\npause\n`;
    return bat;
}

window.generateUpdateBat = generateUpdateBat;
