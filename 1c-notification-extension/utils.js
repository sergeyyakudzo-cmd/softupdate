/**
 * Общие утилиты для 1C Notification Extension
 */

/** @param {number} num @returns {string} */
function getNumberWord(num) {
    /** @type {Record<number, string>} */
    const words = {
        1: 'одна',
        2: 'две',
        3: 'три',
        4: 'четыре',
        5: 'пять',
        6: 'шесть',
        7: 'семь',
        8: 'восемь',
        9: 'девять',
        10: 'десять',
        11: 'одиннадцать',
        12: 'двенадцать',
        13: 'тринадцать',
        14: 'четырнадцать',
        15: 'пятнадцать',
        16: 'шестнадцать',
        17: 'семнадцать',
        18: 'восемнадцать',
        19: 'девятнадцать',
        20: 'двадцать'
    };
    
    if (num in words) {
        return words[num];
    }
    return num.toString();
}

/** @param {number} num @param {[string, string, string]} forms @returns {string} */
function getCaseWord(num, forms) {
    num = Math.abs(num) % 100;
    const num1 = num % 10;
    
    if (num > 10 && num < 20) {
        return forms[2];
    }
    if (num1 > 1 && num1 < 5) {
        return forms[1];
    }
    if (num1 === 1) {
        return forms[0];
    }
    return forms[2];
}

/** @param {Date} [date] @returns {string} */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

if (typeof window !== 'undefined') {
    window.utils = {
        getNumberWord,
        getCaseWord,
        formatTime
    };
}

if (typeof globalThis !== 'undefined') {
    globalThis.getNumberWord = getNumberWord;
    globalThis.getCaseWord = getCaseWord;
    globalThis.formatTime = formatTime;
}

if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.storage) {
    window.storageUtils = {
        /** @param {string | string[] | Record<string, unknown> | null} keys */
        get: (keys) => new Promise(resolve => chrome.storage.local.get(/** @type {*} */ (keys), resolve)),
        /** @param {Record<string, unknown>} data */
        set: (data) => new Promise(resolve => chrome.storage.local.set(data, resolve)),
        /** @param {string | string[]} keys */
        remove: (keys) => new Promise(resolve => chrome.storage.local.remove(keys, resolve))
    };
}