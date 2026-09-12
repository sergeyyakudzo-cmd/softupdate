const SHARED_CONSTANTS = typeof self !== 'undefined' ? self.SHARED_CONSTANTS : { URLS: { MAX_API: 'https://platform-api.max.ru' } };

export async function getMaxBotInfo(botToken) {
    const startTime = performance.now();
    try {
        const response = await fetch(`${SHARED_CONSTANTS.URLS.MAX_API}/me`, {
            method: 'GET',
            headers: { 'Authorization': botToken }
        });
        const elapsed = (performance.now() - startTime).toFixed(0);
        if (!response.ok) {
            const errText = await response.text();
            let errMsg;
            try { const err = JSON.parse(errText); errMsg = err.message || err.error; } catch { errMsg = errText; }
            logger.error(`❌ MAX ← ${response.status} за ${elapsed}мс: ${errMsg}`);
            return { valid: false, error: errMsg || 'Ошибка' };
        }
        const data = await response.json();
        if (data.ok || data.user_id || data.is_bot) {
            logger.log(`✅ MAX ← OK за ${elapsed}мс`);
            return { valid: true, botName: data.name || data.first_name || 'Bot', username: data.username || '' };
        }
        logger.error(`❌ MAX ← FAIL за ${elapsed}мс: ${data.message}`);
        return { valid: false, error: data.message || 'Ошибка получения информации о боте' };
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ MAX ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { valid: false, error: 'Ошибка сети: ' + error.message };
    }
}

export async function sendMaxMessage(botToken, userId, text) {
    const startTime = performance.now();
    try {
        const response = await fetch(`${SHARED_CONSTANTS.URLS.MAX_API}/messages?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Authorization': botToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const elapsed = (performance.now() - startTime).toFixed(0);
        if (!response.ok) {
            const errText = await response.text();
            let errMsg;
            try { const err = JSON.parse(errText); errMsg = err.message || err.error; } catch { errMsg = errText; }
            logger.error(`❌ MAX ← ${response.status} за ${elapsed}мс: ${errMsg}`);
            return { success: false, error: errMsg || 'Ошибка отправки' };
        }
        const data = await response.json();
        if (data.ok || data.message_id || data.status === 'sent') {
            logger.log(`✅ MAX ← OK за ${elapsed}мс`);
            return { success: true };
        }
        const errorMsg = typeof data.message === 'object' ? JSON.stringify(data.message) : (data.error || data.message || 'Ошибка MAX');
        logger.log(`⚠️ MAX ← response: ${JSON.stringify(data)}`);
        return { success: false, error: errorMsg };
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ MAX ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { success: false, error: 'Ошибка сети: ' + error.message };
    }
}
