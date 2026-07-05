/**
 * Централизованный логгер для 1C Notification Extension
 * Логи хранятся в chrome.storage.local и не выводятся в консоль.
 * Максимум MAX_LOG_ENTRIES записей (старые удаляются при переполнении).
 * Запись в хранилище сериализована через очередь (race-condition protection).
 */

const Logger = (function() {
    const STORAGE_KEY = 'app_logs';
    const MAX_LOG_ENTRIES = 500;
    const _loadStart = performance.now();

    // --- Очередь записей (сериализация saveLog) ---
    const _writeQueue = [];
    let _writing = false;

    async function _processQueue() {
        if (_writing || _writeQueue.length === 0) return;
        _writing = true;

        try {
            // Read current logs once per batch
            const data = await new Promise(resolve =>
                chrome.storage.local.get([STORAGE_KEY], resolve)
            );
            let logs = data[STORAGE_KEY] || [];

            // Append all queued entries
            while (_writeQueue.length > 0) {
                logs.push(_writeQueue.shift());
            }

            // Trim if over limit
            if (logs.length > MAX_LOG_ENTRIES) {
                logs = logs.slice(logs.length - MAX_LOG_ENTRIES);
            }

            await new Promise(resolve =>
                chrome.storage.local.set({ [STORAGE_KEY]: logs }, resolve)
            );
        } catch (e) {
            // Storage quota exceeded — flush queue, keep only last 100
            _writeQueue.length = 0;
            try {
                const data = await new Promise(resolve =>
                    chrome.storage.local.get([STORAGE_KEY], resolve)
                );
                const logs = (data[STORAGE_KEY] || []).slice(-100);
                await new Promise(resolve =>
                    chrome.storage.local.set({ [STORAGE_KEY]: logs }, resolve)
                );
            } catch (_) { /* give up */ }
        }

        _writing = false;

        // Process any entries that arrived during write
        if (_writeQueue.length > 0) {
            _processQueue();
        }
    }

    function saveLog(entry) {
        _writeQueue.push(entry);
        _processQueue();
    }

    function logModuleLoad(moduleName) {
        const elapsed = (performance.now() - _loadStart).toFixed(1);
        const entry = formatEntry('log', `📦 ${moduleName}: loaded за ${elapsed}мс`);
        saveLog(entry);
    }

    function getTimestamp() {
        return new Date().toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function formatEntry(level, ...args) {
        const timestamp = getTimestamp();
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    function log(...args) {
        const entry = formatEntry('log', ...args);
        saveLog(entry);
    }

    function warn(...args) {
        const entry = formatEntry('warn', ...args);
        saveLog(entry);
    }

    function error(...args) {
        const entry = formatEntry('error', ...args);
        saveLog(entry);
    }

    function info(...args) {
        const entry = formatEntry('info', ...args);
        saveLog(entry);
    }

    async function getAll() {
        const data = await new Promise(resolve =>
            chrome.storage.local.get([STORAGE_KEY], resolve)
        );
        return data[STORAGE_KEY] || [];
    }

    async function clear() {
        await new Promise(resolve =>
            chrome.storage.local.remove(STORAGE_KEY, resolve)
        );
    }

    /**
     * Скачивает логи как .txt файл
     */
    async function download() {
        const logs = await getAll();
        if (logs.length === 0) return false;

        const content = logs.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `1c-monitor-logs-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    }

    return { log, warn, error, info, getAll, clear, download, logModuleLoad };
})();

if (typeof window !== 'undefined') {
    window.logger = Logger;
}
if (typeof globalThis !== 'undefined') {
    globalThis.logger = Logger;
}
