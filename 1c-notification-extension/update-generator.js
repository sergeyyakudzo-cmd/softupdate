/** @param {string} extFolder @param {string} githubBase @returns {string | null} */
function generateUpdateBat(extFolder, githubBase) {
    const files = [
        'background.js', 'content.js', 'popup.js', 'popup.html',
        'popup.css', 'popup-animations.css',
        'manifest.json', 'config.js', 'logger.js', 'utils.js', 'max.js',
        'shared/constants.js', 'update-generator.js',
        'report/report.html', 'report/report.js', 'report/chart.umd.js'
    ];

    let bat = '\uFEFF@echo off\r\nchcp 65001 >nul\r\n';
    bat += `set "EXT_FOLDER=${extFolder}"\r\n`;
    bat += `set "BASE_URL=${githubBase}"\r\n\r\n`;
    bat += `echo Обновление расширения 1C Notification...\r\n\r\n`;

    for (const file of files) {
        const dir = file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : '';
        if (dir) {
            bat += `if not exist "${extFolder}\\${dir.replace('/', '\\')}" mkdir "${extFolder}\\${dir.replace('/', '\\')}"\r\n`;
        }
        bat += `echo Downloading ${file}...\r\n`;
        const dest = `${extFolder}\\${file.replace('/', '\\')}`;
        const url = `${githubBase}${file}`;
        bat += `powershell -Command "try { Invoke-WebRequest -Uri '${url}' -OutFile '${dest}' -ErrorAction Stop; if ((Get-Item '${dest}').Length -lt 100) { Remove-Item '${dest}'; Write-Host 'FAIL: file too small'; exit 1 }; Write-Host 'OK' } catch { Write-Host ('FAIL: ' + $_.Exception.Message); exit 1 }"\r\n`;
    }

    bat += `\r\necho.\r\necho Обновление завершено! Перезагрузите расширение в chrome://extensions/\r\npause\r\n`;
    return bat;
}

window.generateUpdateBat = generateUpdateBat;
