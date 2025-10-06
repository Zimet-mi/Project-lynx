// Константы для приложения Valerie

// API ключ для работы с Google Sheets
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM';

// Настройки листов
const SHEET_CONFIG = {
    // Основная страница с выставлением оценок жюри
    mainSheet: 'valerieDay2', // Можно переключать на 'valerieDay1'
    resultSheet: 'valerieRes', // Страница с итогами конкретного жюри
    timetableSheet: 'Day2' // Лист расписания
};

// Диапазоны для секций с участниками
const SECTION_RANGES = {
    // Второй день
    section1: [2, 38],
    section2: [39, 72],
    section3: [73, 90],
    
    // Первый день (закомментировано)
    // section1: [2, 47],
    // section2: [48, 84],
    // section3: [85, 116],
};

// Диапазоны для таблицы с результатами
const RESULT_RANGES = [
    'A1:H136',   // Диапазон для первой части
    'A137:H210', // Диапазон для второй части
    'A211:H235', // Диапазон для третьей части
    'A236:H700'  // Диапазон для четвертой части
];

// Массив для всех листов/дней с участниками
const ALL_PARTICIPANTS_SHEETS = [
    { sheet: 'valerieDay1', range: 'A1:N120' },
    { sheet: 'valerieDay2', range: 'A1:N90' },
];

// Настройки кеширования
const CACHE_CONFIG = {
    // Время жизни общего кеша (7 минут)
    generalExpiry: 420000,
    // Время жизни кеша для вкладок участников (2 минуты)
    participantsExpiry: 120000
};

// ID таблицы расписания
const TIMETABLE_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds';

// Диапазон расписания
const TIMETABLE_RANGE = 'Day2!A1:B250'; // Можно переключать на 'Day1!A1:B250'

// Диапазон для данных итоговой таблицы
const RESULT_SHEET_RANGE = 'A1:N700';

// Параметры оценок для участников
const PARTICIPANT_PARAMETERS = [
    { label: 'Костюм', column: 'C', options: 5, field: 'costum' },
    { label: 'Схожесть', column: 'D', options: 5, field: 'shozhest' },
    { label: 'Выход', column: 'E', options: 5, field: 'vistup' },
    { label: 'Аксессуар', column: 'F', options: 3, field: 'aks' }
];

// Лейблы чекбоксов спецпризов
const CHECKBOX_LABELS = ['Пошив', 'Крафт', 'Дефиле', 'Парик', 'Русский источник', 'Гран-при'];

// Столбцы для чекбоксов спецпризов
const CHECKBOX_COLUMNS = ['I', 'J', 'K', 'L', 'M', 'N'];

// URL для Google Apps Script
const GOOGLE_SCRIPT_URLS = {
    getSheetId: 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec',
    saveData: 'https://script.google.com/macros/s/AKfycbxQ3MrknFLRGXb6J7YJcNEVe5IShT-AITtvSvZHHSwK1OPvs-4ikzDXeSWQ60czU5z1/exec'
};

// Названия вкладок
const TAB_NAMES = {
    ONE: 'One',
    TWO: 'Two', 
    THREE: 'Three',
    ALL: 'all',
    TABLE: 'table',
    RED: 'red'
};

// Названия секций аккордеона результатов
const RESULT_SECTIONS = [
    'Одиночное',
    'Малое групповое', 
    'Групповое и тематическое',
    'Спецпризы'
];
