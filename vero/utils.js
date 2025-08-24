// utils.js

// Глобальные переменные
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
//const sheet_Name = 'veroDay1'; //Основная страница с выставлением оценок жюри
const sheet_Name = 'veroDay2'; //Второй день
const ResultSheet = 'veroRes'; // страница с итогами конкретного жюри

// Диапазоны для секций с участниками для аккардеона
//Первый день
//    const section1Range = [2, 47];
//    const section2Range = [48, 84];
//    const section3Range = [85, 116];
	
//Второй день
    const section1Range = [2, 38];
    const section2Range = [39, 72];
    const section3Range = [73, 90];
	
	

//Диапазоны для таблицы с результатами в личных итогах каждого жюри
const RANGE_PARTS = [
    'A1:H136', // Диапазон для первой части
    'A137:H210', // Диапазон для второй части
    'A211:H235', // Диапазон для третьей части
    'A236:H700'  // Диапазон для четвертой части
];

// Массив для всех листов/дней с участниками (заполняется вручную)
const ALL_PARTICIPANTS_SHEETS = [
    { sheet: 'veroDay1', range: 'A1:N120' },
	{ sheet: 'veroDay2', range: 'A1:N90' },
    // Пример: { sheet: 'archangelDay2', range: 'A1:H80' },
    // Добавляй сюда новые дни/листы и диапазоны
];

//Диапазон для данных итоговой таблицы каждого жюри. Общий парсинг
const rangeRes = 'A1:N700';

//Страница и диапазон расписания
    const timetableID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds'; // ID гугл таблицы
//    const timetableRANGE = 'Day1!A1:B250'; // Имя страницы и диапазон ячеек
    const timetableRANGE = 'Day2!A1:B250'; // Второй день
	
//Время жизни общего кеша
const CACHE_EXPIRY = 420000; // 7 минут в миллисекундах

//Время жизни кеша для вкладок участников. Нужно для сохранения выставленных оценок, чтобы каждый раз их не запрашивать
const CACHE_PARICIPANTS_EXPIRY = 120000; // 2 минуты в миллисекундах	
	
//___________________ДАЛЬШЕ ИДУТ ФУНКЦИИ_________________________
// Функция для получения ID таблицы через Google Apps Script (с кэшированием в сессии)
let __SHEET_ID_CACHE;
async function getSheetId() {
    if (__SHEET_ID_CACHE) return __SHEET_ID_CACHE;
    try {
        const fromSession = sessionStorage.getItem('SHEET_ID');
        if (fromSession) {
            __SHEET_ID_CACHE = fromSession;
            return __SHEET_ID_CACHE;
        }
    } catch (_) {}
    const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec';
    const response = await fetch(url);
    const id = await response.text();
    __SHEET_ID_CACHE = id;
    try { sessionStorage.setItem('SHEET_ID', id); } catch (_) {}
    return id;
}

// Функция для загрузки данных из Google Sheets с кешированием. Основная таблица со страницами жюри
async function fetchDataWithCache(sheetName, range, cacheKey, cacheTimeKey, cacheExpiry) {
	const label = `[utils.fetchDataWithCache] ${sheetName}!${range}`;
	console.groupCollapsed(label);
	console.log('Ключи кеша:', { cacheKey, cacheTimeKey, TTL_ms: cacheExpiry });
	const t0 = performance.now();
	const SHEET_ID = await getSheetId();
	console.log('Получен SHEET_ID');

	const cachedData = localStorage.getItem(cacheKey);
	const cachedTime = localStorage.getItem(cacheTimeKey);

	if (cachedData && cachedTime) {
		const currentTime = Date.now();
		const timeDiff = currentTime - parseInt(cachedTime);
		console.log('Найден кеш:', { age_ms: timeDiff, isFresh: timeDiff < cacheExpiry });
		if (timeDiff < cacheExpiry) {
			console.log('Возвращаю данные из кеша (localStorage).');
			console.timeEnd?.(label);
			console.groupEnd();
			return JSON.parse(cachedData);
		}
	}

	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
	console.log('Запрашиваю из сети:');
	const response = await fetch(url);
	console.log('HTTP статус:', response.status);

	if (!response.ok) {
		console.groupEnd();
		throw new Error(`Ошибка HTTP: ${response.status}`);
	}

	const data = await response.json();
	localStorage.setItem(cacheKey, JSON.stringify(data));
	localStorage.setItem(cacheTimeKey, Date.now().toString());
	console.log('Сохранил в кеш (localStorage).');
	console.log('Время выполнения, мс:', Math.round(performance.now() - t0));
	console.groupEnd();
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
