/**
 * Централизованный логгер для 1C Notification Extension
 * Логи хранятся в chrome.storage.local и не выводятся в консоль.
 * Максимум MAX_LOG_ENTRIES записей (старые удаляются при переполнении).
 * Запись в хранилище сериализована через очередь (race-condition protection).
 *
 * Уровни логирования: DEBUG=0, INFO=1, WARN=2, ERROR=3
 * По умолчанию WARN — пишутся только предупреждения и ошибки.
 * Для отладки: chrome.storage.local.set({ logLevel: 0 }) — включает все логи.
 */

const Logger = (function() {
    const STORAGE_KEY = 'app_logs';
    const LEVEL_KEY = 'logLevel';
    const MAX_LOG_ENTRIES = 500;
    const _loadStart = performance.now();

    const LEVEL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    let _level = LEVEL.WARN;

    // Загружаем уровень из storage (асинхронно, без блокировки)
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([LEVEL_KEY], (r) => {
                if (typeof r[LEVEL_KEY] === 'number') _level = r[LEVEL_KEY];
            });
        }
    } catch (_) {}

    /** @type {string[]} */
    const _writeQueue = [];
    let _writing = false;

    async function _processQueue() {
        if (_writing || _writeQueue.length === 0) return;
        _writing = true;

        try {
            const data = await new Promise(resolve =>
                chrome.storage.local.get([STORAGE_KEY], /** @param {chrome.storage.StorageResult} r */ resolve)
            );
            /** @type {string[]} */
            let logs = data[STORAGE_KEY] || [];

            while (_writeQueue.length > 0) {
                const /** @type {string | undefined} */ entry = _writeQueue.shift();
                if (entry !== undefined) logs.push(entry);
            }

            if (logs.length > MAX_LOG_ENTRIES) {
                logs = logs.slice(logs.length - MAX_LOG_ENTRIES);
            }

            await new Promise(resolve =>
                chrome.storage.local.set({ [STORAGE_KEY]: logs }, () => resolve(undefined))
            );
        } catch (e) {
            try {
                const data = await new Promise(resolve =>
                    chrome.storage.local.get([STORAGE_KEY], /** @param {chrome.storage.StorageResult} r */ resolve)
                );
                let logs = /** @type {string[]} */ (data[STORAGE_KEY] || []);
                while (_writeQueue.length > 0) {
                    const entry = _writeQueue.shift();
                    if (entry !== undefined) logs.push(entry);
                }
                if (logs.length > MAX_LOG_ENTRIES) {
                    logs = logs.slice(logs.length - MAX_LOG_ENTRIES);
                }
                await new Promise(resolve =>
                    chrome.storage.local.set({ [STORAGE_KEY]: logs }, () => resolve(undefined))
                );
            } catch (_) {
                _writeQueue.length = 0;
            }
        }

        _writing = false;

        if (_writeQueue.length > 0) {
            _processQueue();
        }
    }

    /** @param {string} entry */
    function saveLog(entry) {
        _writeQueue.push(entry);
        _processQueue();
    }

    /** @param {string} moduleName */
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

    /** @param {string} level @param {...unknown} args */
    function formatEntry(level, ...args) {
        const timestamp = getTimestamp();
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    /** @param {...unknown} args */
    function log(...args) {
        if (_level > LEVEL.DEBUG) return;
        const entry = formatEntry('log', ...args);
        saveLog(entry);
    }

    /** @param {...unknown} args */
    function warn(...args) {
        if (_level > LEVEL.WARN) return;
        const entry = formatEntry('warn', ...args);
        saveLog(entry);
    }

    /** @param {...unknown} args */
    function error(...args) {
        if (_level > LEVEL.ERROR) return;
        const entry = formatEntry('error', ...args);
        saveLog(entry);
    }

    /** @param {...unknown} args */
    function info(...args) {
        if (_level > LEVEL.INFO) return;
        const entry = formatEntry('info', ...args);
        saveLog(entry);
    }

    /** @param {number} level */
    function setLevel(level) {
        _level = level;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [LEVEL_KEY]: level }).catch(() => {});
        }
    }

    /** @returns {number} */
    function getLevel() { return _level; }

    /** @returns {Promise<string[]>} */
    async function getAll() {
        const data = await new Promise(resolve =>
            chrome.storage.local.get([STORAGE_KEY], /** @param {chrome.storage.StorageResult} r */ resolve)
        );
        return /** @type {string[]} */ (data[STORAGE_KEY] || []);
    }

    /** @returns {Promise<void>} */
    async function clear() {
        await new Promise(resolve =>
            chrome.storage.local.remove(STORAGE_KEY, () => resolve(undefined))
        );
    }

    /** @returns {Promise<boolean>} */
    async function download() {
        if (typeof document === 'undefined' || !document.body) {
            return false;
        }
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

    return { log, warn, error, info, getAll, clear, download, logModuleLoad, setLevel, getLevel, LEVEL };
})();

if (typeof window !== 'undefined') {
    window.logger = Logger;
}
if (typeof globalThis !== 'undefined') {
    globalThis.logger = Logger;
}
