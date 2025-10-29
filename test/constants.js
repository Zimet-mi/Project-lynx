/* Standalone copy of constants.js */
/* eslint-disable */
// API ключ для работы с Google Sheets
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM';

const SHEET_CONFIG = {
    mainSheet: 'valerieDay2',
    resultSheet: 'valerieRes',
    timetableSheet: 'Day2'
};

const SECTION_RANGES = {
    section1: [2, 38],
    section2: [39, 72],
    section3: [73, 90]
};

const RESULT_RANGES = ['A1:H136','A137:H210','A211:H235','A236:H700'];

const ALL_PARTICIPANTS_SHEETS = [
    { sheet: 'valerieDay1', range: 'A1:N120', day: 'День 1' },
    { sheet: 'valerieDay2', range: 'A1:N90', day: 'День 2' },
];

const CACHE_CONFIG = { generalExpiry: 420000, participantsExpiry: 120000 };
const LAZY_SAVE_CONFIG = { processingInterval: 5000, dataMaxAge: 24 * 60 * 60 * 1000 };

const TIMETABLE_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds';
const TIMETABLE_RANGE = 'Day2!A1:B250';
const RESULT_SHEET_RANGE = 'A1:N700';

const GOOGLE_SCRIPT_URLS = {
    getSheetId: 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec',
    saveData: 'https://script.google.com/macros/s/AKfycbxQ3MrknFLRGXb6J7YJcNEVe5IShT-AITtvSvZHHSwK1OPvs-4ikzDXeSWQ60czU5z1/exec'
};

function getActiveSpecialPrizes() {
    return [
        { label: 'Пошив', column: 'I', active: true, value: 'Номинант' },
        { label: 'Крафт', column: 'J', active: true, value: 'Номинант' },
        { label: 'Дефиле', column: 'K', active: true, value: 'Номинант' },
        { label: 'Парик', column: 'L', active: true, value: 'Номинант' },
        { label: 'Русский источник', column: 'M', active: true, value: 'Номинант' },
        { label: 'Гран-при', column: 'N', active: true, value: 'Номинант' }
    ];
}

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

console.log('🎯 Example constants loaded');

