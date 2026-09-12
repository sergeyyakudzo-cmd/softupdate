/** @param {string} extFolder @param {string} githubBase @returns {string | null} */
function generateUpdateBat(extFolder, githubBase) {
    const files = [
        'background.js', 'content.js', 'popup.js', 'popup.html',
        'popup.css', 'popup-animations.css',
        'manifest.json', 'config.js', 'logger.js', 'utils.js', 'max.js',
        'shared/constants.js', 'update-generator.js'
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
        bat += `powershell -Command "try { $r = Invoke-WebRequest -Uri '${url}' -ErrorAction Stop; if ($r.Content.Length -lt 100) { Write-Host 'FAIL: file too small'; exit 1 } [IO.File]::WriteAllBytes('${dest}', $r.Content); Write-Host 'OK' } catch { Write-Host 'FAIL: $($_.Exception.Message)'; exit 1 }"\n`;
    }

    bat += `\necho.\necho Обновление завершено! Перезагрузите расширение в chrome://extensions/\npause\n`;
    return bat;
}

window.generateUpdateBat = generateUpdateBat;
