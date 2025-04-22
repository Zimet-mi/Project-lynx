// Модуль для работы со специальными призами

// Глобальные переменные
const SPECIALS_API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
const SPECIALS_SHEET_NAME = 'Specials'; // Страница со специальными призами
const SPECIALS_RANGE = 'A1:Z500';

// Функция для загрузки данных из Google Sheets со страницы Specials
async function fetchSpecialsData() {
    try {
        // Используем функцию getSheetId из utils.js
        const SHEET_ID = await window.getSheetId();
        const cacheKey = 'specialsData';
        const cacheTimeKey = 'specialsDataTime';
        const CACHE_EXPIRY = 10000; // 10 секунд (для тестирования)

        // Во время разработки отключаем кеширование
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimeKey);

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - parseInt(cachedTime);

            if (timeDiff < CACHE_EXPIRY) {
                return JSON.parse(cachedData);
            }
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SPECIALS_SHEET_NAME}!${SPECIALS_RANGE}?key=${SPECIALS_API_KEY}`;
        console.log('Запрос специальных призов по URL:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Получены данные специальных призов из таблицы:', data);
        
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

        return data;
    } catch (error) {
        console.error('Ошибка при загрузке данных специальных призов:', error);
        throw error;
    }
}

// Парсинг данных специальных призов
async function parseSpecialsData() {
    try {
        const data = await fetchSpecialsData();
        if (!data || !data.values || data.values.length === 0) {
            console.error('Нет данных специальных призов для анализа');
            return { nominations: [], winners: [] };
        }

        const rows = data.values;
        console.log('Всего строк в таблице специальных призов:', rows.length);

        // Структуры для хранения распарсенных данных
        const nominations = [];
        const winners = [];

        let currentNomination = null;
        
        // Анализ каждой строки
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Пропускаем пустые строки
            if (!row || row.length === 0) continue;
            
            // Если первая ячейка содержит название приза и вторая пустая - это заголовок номинации
            if (row[0] && (!row[1] || row[1].trim() === '')) {
                currentNomination = row[0].trim();
                if (!nominations.includes(currentNomination)) {
                    nominations.push(currentNomination);
                }
                console.log(`Найдена номинация спецприза [${i}]: "${currentNomination}"`);
                continue;
            }
            
            // Если еще не обнаружили номинацию, пропускаем
            if (!currentNomination) continue;
            
            // Если первая ячейка содержит число (номер участника) - это победитель
            const participantNumber = row[0] ? row[0].toString().trim() : '';
            if (participantNumber && !isNaN(parseInt(participantNumber))) {
                const name = row[1] ? row[1].toString().trim() : '';
                const place = row[2] ? row[2].toString().trim() : '';
                
                winners.push({
                    nomination: currentNomination,
                    participant: participantNumber,
                    name: name,
                    place: place
                });
                
                console.log(`Добавлен победитель [${i}]: "${currentNomination}" - ${participantNumber} (${name}), место: ${place}`);
            }
        }

        console.log('Результат парсинга специальных призов:');
        console.log('- Номинации:', nominations);
        console.log('- Победители:', winners.length);

        return {
            nominations: nominations,
            winners: winners
        };
    } catch (error) {
        console.error('Ошибка при парсинге данных специальных призов:', error);
        return { nominations: [], winners: [] };
    }
}

// Получение списка номинаций спецпризов
async function getSpecialNominations() {
    try {
        const parsed = await parseSpecialsData();
        return parsed.nominations;
    } catch (error) {
        console.error('Ошибка при получении номинаций спецпризов:', error);
        return [];
    }
}

// Получение победителей определенной номинации
async function getSpecialPrizeWinners(nomination) {
    try {
        const parsed = await parseSpecialsData();
        return parsed.winners.filter(winner => winner.nomination === nomination);
    } catch (error) {
        console.error('Ошибка при получении победителей спецприза:', error);
        return [];
    }
}

// Получение всех победителей спецпризов
async function getAllSpecialPrizeWinners() {
    try {
        const parsed = await parseSpecialsData();
        return parsed.winners;
    } catch (error) {
        console.error('Ошибка при получении всех победителей спецпризов:', error);
        return [];
    }
}

// Экспортируем функции в глобальный объект
window.SpecialPrizes = {
    getSpecialNominations,
    getSpecialPrizeWinners,
    getAllSpecialPrizeWinners,
    isInitialized: true
};

// Уведомляем систему, что модуль SpecialPrizes загружен и готов к использованию
document.dispatchEvent(new CustomEvent('specialPrizesReady', { detail: window.SpecialPrizes })); 