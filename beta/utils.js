// utils.js

// Глобальные переменные
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
const sheet_Name = 'jury'; //Основная страница с выставлением оценок жюри
const ResultSheet = 'juryRes'; // страница с итогами конкретного жюри

// Диапазоны для секций с участниками
    const section1Range = [2, 38];
    const section2Range = [39, 84];
    const section3Range = [85, 90];

//Диапазоны для таблицы с результатами
const RANGE_PARTS = [
    'A1:G55', // Диапазон для первой части
    'A57:G88', // Диапазон для второй части
    'A90:G112', // Диапазон для третьей части
    'A114:C500'  // Диапазон для четвертой части
];

// Функция для получения ID таблицы через Google Apps Script
async function getSheetId() {
    const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec';
    const response = await fetch(url);
    return response.text();
}

// Функция для загрузки данных из Google Sheets с кешированием
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

// Делаем функции и переменные глобальными
window.API_KEY = API_KEY;
window.getSheetId = getSheetId;
window.fetchDataWithCache = fetchDataWithCache;