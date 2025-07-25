// utils.js

// Глобальные переменные
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
const sheet_Name = 'archangel'; //Основная страница с выставлением оценок жюри
const ResultSheet = 'archangelRes'; // страница с итогами конкретного жюри

// Диапазоны для секций с участниками для аккардеона
    const section1Range = [2, 23];
    const section2Range = [24, 67];
    const section3Range = [68, 77];

//Диапазоны для таблицы с результатами в личных итогах каждого жюри
const RANGE_PARTS = [
    'A1:H80', // Диапазон для первой части
    'A81:H120', // Диапазон для второй части
    'A121:H141', // Диапазон для третьей части
    'A142:H500'  // Диапазон для четвертой части
];

// Массив для всех листов/дней с участниками (заполняется вручную)
const ALL_PARTICIPANTS_SHEETS = [
    { sheet: 'archangel', range: 'A1:N80' },
	{ sheet: 'skywalker', range: 'A1:N80' },
    // Пример: { sheet: 'archangelDay2', range: 'A1:H80' },
    // Добавляй сюда новые дни/листы и диапазоны
];

//Диапазон для данных итоговой таблицы каждого жюри. Общий парсинг
const rangeRes = 'A1:N500';

//Страница и диапазон расписания
    const timetableID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds'; // ID гугл таблицы
    const timetableRANGE = 'Day1!A1:B250'; // Имя страницы и диапазон ячеек
	
//Время жизни общего кеша
const CACHE_EXPIRY = 420000; // 7 минут в миллисекундах

//Время жизни кеша для вкладок участников. Нужно для сохранения выставленных оценок, чтобы каждый раз их не запрашивать
const CACHE_PARICIPANTS_EXPIRY = 120000; // 2 минуты в миллисекундах	
	
//___________________ДАЛЬШЕ ИДУТ ФУНКЦИИ_________________________
// Функция для получения ID таблицы через Google Apps Script
async function getSheetId() {
    const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec';
    const response = await fetch(url);
    return response.text();
}

// Функция для загрузки данных из Google Sheets с кешированием. Основная таблица со страницами жюри
async function fetchDataWithCache(sheetName, range, cacheKey, cacheTimeKey, cacheExpiry) {
    const SHEET_ID = await getSheetId();

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(cachedTime);

        if (timeDiff < cacheExpiry) {
            return JSON.parse(cachedData);
        }
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

    return data;
}

    // Функция для инициализации аккордеонов
    function initializeAccordions() {
    const accordions = document.getElementsByClassName("accordion");

    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener("click", function () {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;

            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";

                // Ленивая загрузка данных для аккордеона
                if (!panel.dataset.loaded) {
                    loadAccordionData(panel);
                    panel.dataset.loaded = true;
                }

                $(panel).find('a.lightzoom').lightzoom({ speed: 400, overlayOpacity: 0.5 });
            }
        });
    }
}

async function loadAccordionData(panel) {
    // Загрузите данные для аккордеона, если это необходимо
    // Например, можно загрузить дополнительные данные с сервера
}



// Делаем функции и переменные глобальными
window.API_KEY = API_KEY;
window.getSheetId = getSheetId;
window.fetchDataWithCache = fetchDataWithCache;
window.ALL_PARTICIPANTS_SHEETS = ALL_PARTICIPANTS_SHEETS;