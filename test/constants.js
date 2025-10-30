/* Standalone copy of constants.js */
/* eslint-disable */
// API ключ для работы с Google Sheets
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM';

// УКАЖИТЕ ID волонтёрской таблицы здесь, чтобы клиент использовал его напрямую
// Пример: window.VOLUNTEER_SHEET_ID = '1AbCdEf...';
// Вставьте фактический ID вместо PLACE_YOUR_SHEET_ID и сохраните файл
window.VOLUNTEER_SHEET_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds';

const SHEET_CONFIG = {
    mainSheet: 'accordionDay1'
};

const SECTION_RANGES = {
    section1: [2, 32],
    section2: [33, 71],
    section3: [72, 13]
};

const ALL_PARTICIPANTS_SHEETS = [
    { sheet: 'accordionDay1', range: 'A1:N120', day: 'День 1' }
//    { sheet: 'valerieDay2', range: 'A1:N90', day: 'День 2' }
];

const CACHE_CONFIG = { generalExpiry: 420000, participantsExpiry: 120000 };

const GOOGLE_SCRIPT_URLS = {
    getSheetId: 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec',
    saveData: 'https://script.google.com/macros/s/AKfycbxQ3MrknFLRGXb6J7YJcNEVe5IShT-AITtvSvZHHSwK1OPvs-4ikzDXeSWQ60czU5z1/exec'
};

const RangeHelper = {
    getSheetRange: (sheetName) => {
        const sheetConfig = ALL_PARTICIPANTS_SHEETS.find(c => c.sheet === sheetName);
        return sheetConfig ? sheetConfig.range : null;
    },
    getCurrentSheetRange: () => RangeHelper.getSheetRange(SHEET_CONFIG.mainSheet),
    getParticipantsRange: () => {
        const currentRange = RangeHelper.getCurrentSheetRange();
        if (currentRange) return currentRange;
        return 'A1:N200';
    }
};

console.log('🎯 Volunteer constants loaded');

