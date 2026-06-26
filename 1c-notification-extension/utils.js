/**
 * Общие утилиты для 1C Notification Extension
 */

// Получение числительного словом
function getNumberWord(num) {
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
    
    if (words[num]) {
        return words[num];
    }
    return num.toString();
}

// Склонение слов по числам
function getCaseWord(num, forms) {
    // forms: [форма для 1, форма для 2-4, форма для остальных]
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

// Форматирование времени
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.utils = {
        getNumberWord,
        getCaseWord,
        formatTime
    };
}

// Промисификация chrome.storage для использования во всех модулях
if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.storage) {
    window.storageUtils = {
        get: (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
        set: (data) => new Promise(resolve => chrome.storage.local.set(data, resolve)),
        remove: (keys) => new Promise(resolve => chrome.storage.local.remove(keys, resolve))
    };
}