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
    { 
        sheet: 'valerieDay1', 
        range: 'A1:N120',
        day: 'День 1'
    },
    { 
        sheet: 'valerieDay2', 
        range: 'A1:N90',
        day: 'День 2' 
    },
];

// Настройки кеширования
const CACHE_CONFIG = {
    // Время жизни общего кеша (7 минут)
    generalExpiry: 420000,
    // Время жизни кеша для вкладок участников (2 минуты)
    participantsExpiry: 120000
};

const CACHE_TIMES = {
    general: CACHE_CONFIG.generalExpiry,
    participants: CACHE_CONFIG.participantsExpiry,
    allParticipants: CACHE_CONFIG.generalExpiry
};

// Настройки ленивого сохранения
const LAZY_SAVE_CONFIG = {
    // Интервал проверки и отправки очереди на сервер (5 секунд)
    processingInterval: 5000,
    // Время жизни данных в localStorage (24 часа)
    dataMaxAge: 24 * 60 * 60 * 1000
};

// ID таблицы расписания
const TIMETABLE_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds';

// Диапазон расписания
const TIMETABLE_RANGE = 'Day2!A1:B250'; // Можно переключать на 'Day1!A1:B250'

// Диапазон для данных итоговой таблицы
const RESULT_SHEET_RANGE = 'A1:N700';

// ========================================
// НАСТРОЙКА ПАРАМЕТРОВ ОЦЕНКИ
// ========================================

// Параметры оценок для участников
// Для добавления нового параметра просто добавьте объект в массив
const PARTICIPANT_PARAMETERS = [
    { label: 'Костюм',    column: 'C', options: 5 },
    { label: 'Схожесть',  column: 'D', options: 5 },
    { label: 'Выход',     column: 'E', options: 5 },
    { label: 'Аксессуар', column: 'F', options: 3 }
    // Для добавления нового параметра:
    // { label: 'Новый параметр', column: 'G', options: 5 }
];

// ========================================
// НАСТРОЙКА СПЕЦПРИЗОВ (ЧЕКБОКСЫ)
// ========================================

// Спецпризы и награды
// Для добавления нового спецприза просто добавьте объект в массив
const SPECIAL_PRIZES = [
    { label: 'Пошив',             column: 'I', active: true, value: 'Номинант' },
    { label: 'Крафт',             column: 'J', active: true, value: 'Номинант' },
    { label: 'Дефиле',            column: 'K', active: true, value: 'Номинант' },
    { label: 'Парик',             column: 'L', active: true, value: 'Номинант' },
    { label: 'Русский источник',  column: 'M', active: true, value: 'Номинант' },
    { label: 'Гран-при',          column: 'N', active: true, value: 'Номинант' }
    // Для добавления нового спецприза:
    // { label: 'Новый спецприз', column: 'O', active: true, value: 'Номинант' }
];

// ========================================
// НАСТРОЙКА ДОПОЛНИТЕЛЬНЫХ ПОЛЕЙ
// ========================================

// Дополнительные поля для участников
const ADDITIONAL_FIELDS = {
    // Поле комментария
    comment: {
        label: 'Комментарий',
        column: 'G',
        type: 'textarea',
        placeholder: 'Введите комментарий...',
        maxLength: 500
    }
    // Для добавления нового поля:
    // newField: { label: 'Новое поле', column: 'H', type: 'text', placeholder: 'Введите значение...' }
};

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

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И УТИЛИТЫ
// ========================================

// Получить только активные спецпризы
function getActiveSpecialPrizes() {
    return SPECIAL_PRIZES.filter(prize => prize.active);
}

// Получить все параметры оценки
function getAllParameters() { return PARTICIPANT_PARAMETERS; }

// Получить столбцы для всех параметров оценки
function getParameterColumns() {
    return PARTICIPANT_PARAMETERS.map(param => param.column);
}

// Получить столбцы для всех активных спецпризов
function getActiveSpecialPrizeColumns() {
    return getActiveSpecialPrizes().map(prize => prize.column);
}

// Получить все используемые столбцы
function getAllUsedColumns() {
    const paramColumns = getParameterColumns();
    const prizeColumns = getActiveSpecialPrizeColumns();
    const additionalColumns = Object.values(ADDITIONAL_FIELDS).map(field => field.column);
    
    return [...paramColumns, ...prizeColumns, ...additionalColumns];
}

// Валидация настроек
function validateSettings() {
    const errors = [];
    
    // Проверяем уникальность полей
    // Проверка полей больше не требуется (идентификация по column)
    
    // Проверяем уникальность столбцов
    const allColumns = getAllUsedColumns();
    const duplicateColumns = allColumns.filter((col, index) => allColumns.indexOf(col) !== index);
    if (duplicateColumns.length > 0) {
        errors.push(`Дублирующиеся столбцы: ${duplicateColumns.join(', ')}`);
    }
    
    // Проверяем корректность диапазонов баллов
    PARTICIPANT_PARAMETERS.forEach(param => {
        if (param.options < 1 || param.options > 10) {
            errors.push(`Некорректное количество баллов для параметра "${param.label}": ${param.options}`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Получить статистику настроек
function getSettingsStats() {
    return {
        totalParameters: PARTICIPANT_PARAMETERS.length,
        totalSpecialPrizes: SPECIAL_PRIZES.length,
        activeSpecialPrizes: getActiveSpecialPrizes().length,
        inactiveSpecialPrizes: SPECIAL_PRIZES.length - getActiveSpecialPrizes().length,
        additionalFields: Object.keys(ADDITIONAL_FIELDS).length,
        totalUsedColumns: getAllUsedColumns().length
    };
}

// Экспорт настроек в JSON (для бэкапа или передачи)
function exportSettings() {
    return {
        participantParameters: PARTICIPANT_PARAMETERS,
        specialPrizes: SPECIAL_PRIZES,
        additionalFields: ADDITIONAL_FIELDS,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
}

// ========================================
// НАСТРОЙКИ ОТОБРАЖЕНИЯ
// ========================================

// Настройки интерфейса
const UI_CONFIG = {
    // Максимальная ширина контейнера
    maxContainerWidth: '1200px',
    
    // Количество колонок для чекбоксов на разных экранах
    checkboxColumns: {
        desktop: 3,
        tablet: 2,
        mobile: 1
    },
    
    // Количество колонок для параметров оценки на разных экранах
    parameterColumns: {
        desktop: 2,
        tablet: 2,
        mobile: 1
    },
    
    // Анимации
    animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out'
    },
    
    // Автосохранение
    autosave: {
        enabled: true,
        delay: 1000 // миллисекунды
    }
};

// ========================================
// НАСТРОЙКИ ВАЛИДАЦИИ
// ========================================

const VALIDATION_CONFIG = {
    // Минимальная длина комментария
    minCommentLength: 0,
    
    // Максимальная длина комментария
    maxCommentLength: 500,
    
    // Обязательные поля
    requiredFields: {
        participantName: true,
        participantId: true
    },
    
    // Регулярные выражения для валидации
    patterns: {
        participantId: /^[0-9]+$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+?[1-9]\d{1,14}$/
    }
};

// Функции для работы с диапазонами
const RangeHelper = {
    // Получить диапазон для листа
    getSheetRange: (sheetName) => {
        const sheetConfig = ALL_PARTICIPANTS_SHEETS.find(config => config.sheet === sheetName);
        return sheetConfig ? sheetConfig.range : null;
    },

    // Получить диапазон для текущего основного листа
    getCurrentSheetRange: () => {
        return RangeHelper.getSheetRange(SHEET_CONFIG.mainSheet);
    },

    // Получить диапазон для строки участника
    getParticipantRowRange: (row) => {
        const lastColumn = RangeHelper.getLastColumn();
        return `A${row}:${lastColumn}${row}`;
    },

    // Получить последний используемый столбец на основе конфигурации
    getLastColumn: () => {
        const allColumns = [
            'A', 'B', // ID и имя - обязательные
            ...PARTICIPANT_PARAMETERS.map(p => p.column),
            ...getActiveSpecialPrizes().map(p => p.column),
            ...Object.values(ADDITIONAL_FIELDS).map(f => f.column)
        ];
        
        // Находим максимальный столбец
        return allColumns.reduce((max, col) => {
            return col > max ? col : max;
        }, 'A');
    },

    // Получить диапазон для блока участников
    getParticipantsRange: () => {
        const currentRange = RangeHelper.getCurrentSheetRange();
        if (currentRange) return currentRange;
        
        // Fallback - используем все столбцы до последнего используемого
        const lastColumn = RangeHelper.getLastColumn();
        return `A1:${lastColumn}200`;
    }
};


// ========================================
// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
// ========================================

/*
// 1. Добавление нового параметра оценки:
// Добавьте в массив PARTICIPANT_PARAMETERS:
{
    label: 'Новый параметр',
    column: 'G',           // Следующий свободный столбец
    options: 5,            // От 1 до 5 баллов
    field: 'new_param',    // Уникальное поле
    description: 'Описание нового параметра',
    required: false        // Необязательный параметр
}

// 2. Добавление нового спецприза:
// Добавьте в массив SPECIAL_PRIZES:
{
    label: 'Новый спецприз',
    column: 'O',           // Следующий свободный столбец
    field: 'new_prize',    // Уникальное поле
    description: 'Описание нового спецприза',
    active: true,          // Активен
    value: 'Номинант'      // Значение при активации
}

// 3. Отключение спецприза:
// Измените active: false в нужном спецпризе

// 4. Изменение количества баллов:
// Измените options в нужном параметре (например, с 5 на 10)

// 5. Изменение обязательности параметра:
// Измените required: true/false в нужном параметре

// 6. Использование вспомогательных функций:
const activePrizes = getActiveSpecialPrizes();
const requiredParams = getRequiredParameters();
const validation = validateSettings();
const stats = getSettingsStats();
*/

// ========================================
// СОВМЕСТИМОСТЬ С СТАРЫМ КОДОМ
// ========================================

// Для обратной совместимости создаем старые константы
const CHECKBOX_LABELS = getActiveSpecialPrizes().map(prize => prize.label);
const CHECKBOX_COLUMNS = getActiveSpecialPrizes().map(prize => prize.column);

// Логирование загрузки настроек
console.log('🎯 Настройки Valerie загружены:', getSettingsStats());

// Проверка валидности настроек при загрузке
const settingsValidation = validateSettings();
if (!settingsValidation.isValid) {
    console.warn('⚠️ Обнаружены проблемы в настройках:', settingsValidation.errors);
} else {
    console.log('✅ Настройки валидны');
}

// ========================================
// УПРАВЛЕНИЕ НАСТРОЙКАМИ ЛЕНИВОГО СОХРАНЕНИЯ
// ========================================
/*
Для изменения интервала отправки данных на сервер:
- processingInterval: интервал в миллисекундах (по умолчанию 5000 = 5 секунд)
- dataMaxAge: время жизни данных в localStorage в миллисекундах (по умолчанию 24 часа)

Примеры изменения:
- Для более частой отправки: processingInterval: 2000 (каждые 2 секунды)
- Для менее частой отправки: processingInterval: 10000 (каждые 10 секунд)
- Для более длительного хранения: dataMaxAge: 48 * 60 * 60 * 1000 (48 часов)

Примечание: Система будет пытаться отправлять данные до тех пор, пока не получится.
Ограничение только по времени жизни данных в localStorage.
*/
