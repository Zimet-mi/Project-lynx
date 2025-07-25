// utils.js

// Глобальные переменные
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
const SHEET_NAME = 'NewRes'; // Страница с результатами

// Диапазон для данных итоговой таблицы
const RANGE = 'A1:H500';

// Время жизни кеша
const CACHE_EXPIRY = 10000; // 10 секунд (для тестирования)

// Функция для получения ID таблицы через Google Apps Script
async function getSheetId() {
    const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec';
    const response = await fetch(url);
    return response.text();
}

// Функция для загрузки данных из Google Sheets с кешированием
async function fetchDataWithCache() {
    try {
        const SHEET_ID = await getSheetId();
        const cacheKey = 'newResData';
        const cacheTimeKey = 'newResDataTime';

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

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${RANGE}?key=${API_KEY}`;
        console.log('Запрос данных по URL:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Получены данные из таблицы:', data);
        
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

        return data;
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        throw error;
    }
}

// Анализ структуры данных и извлечение информации о номинациях, участниках и оценках
async function parseSheetData() {
    try {
        const data = await fetchDataWithCache();
        if (!data || !data.values || data.values.length === 0) {
            console.error('Нет данных для анализа');
            return { nominations: [], participants: [], scores: [] };
        }

        const rows = data.values;
        console.log('Всего строк в таблице:', rows.length);

        // Структуры для хранения распарсенных данных
        const nominations = [];
        const participants = [];
        const scores = [];

        let currentNomination = null;
        let headerRow = -1; // Индекс строки с заголовками (если есть)
        
        // Получаем имена жюри из ячеек C4, D4, E4
        let juryNames = ['Оценка 1', 'Оценка 2', 'Оценка 3']; // значения по умолчанию
        
        // Ячейки C4, D4, E4 (индексы строк и столбцов начинаются с 0, поэтому [3][2], [3][3], [3][4])
        if (rows.length > 3) {
            // Получаем имя жюри 1 из ячейки C4
            if (rows[3] && rows[3].length > 2 && rows[3][2]) {
                juryNames[0] = rows[3][2].toString().trim();
            }
            
            // Получаем имя жюри 2 из ячейки D4
            if (rows[3] && rows[3].length > 3 && rows[3][3]) {
                juryNames[1] = rows[3][3].toString().trim();
            }
            
            // Получаем имя жюри 3 из ячейки E4
            if (rows[3] && rows[3].length > 4 && rows[3][4]) {
                juryNames[2] = rows[3][4].toString().trim();
            }
            
            console.log('Получены имена жюри из ячеек C4, D4, E4:', juryNames);
        }
        
        // Выводим информацию о первых строках для отладки
        console.log('Первые 10 строк для анализа:');
        for (let i = 0; i < Math.min(10, rows.length); i++) {
            console.log(`Строка ${i}:`, rows[i]);
        }

        // Анализ каждой строки
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Пропускаем пустые строки
            if (!row || row.length === 0) continue;
            
            // Создаем строку из всех ячеек для поиска номинации
            const rowText = row.join(' ').toLowerCase();
            
            // Проверяем, является ли строка заголовком номинации
            const nominationText = row.find(cell =>
                cell && (
                    cell.toString().toLowerCase().includes('дефиле') ||
                    cell.toString().toLowerCase().includes('конкурс')
                )
            );
                if (nominationText) {
                    currentNomination = nominationText.trim();
                    nominations.push(currentNomination);
                    console.log(`Найдена номинация [${i}]: "${currentNomination}"`);
                // Получаем имена жюри из следующей строки
                const juryRow = rows[i + 1] || [];
                juryNames = [];
                // C, D, E (2, 3, 4)
                for (let col = 2; col <= 4; col++) {
                    const cell = juryRow[col] ? juryRow[col].toString().trim() : '';
                    if (cell && cell.toLowerCase() !== 'итог') {
                        juryNames.push(cell);
                    }
                }
                // Если в C, D, E только 2 жюри, ищем третьего в F (5)
                if (juryNames.length === 2 && juryRow[5] && juryRow[5].toString().trim().toLowerCase() !== 'итог') {
                    juryNames.push(juryRow[5].toString().trim());
                }
                console.log('Имена жюри для номинации:', juryNames);
                // Пропускаем строку после номинации, так как она содержит имена жюри
                headerRow = i + 2;
                i = i + 1; // чтобы не обработать строку жюри как участника
                    continue;
            }
            
            // Если еще не обнаружили номинацию, пропускаем
            if (!currentNomination) continue;
            
            // Пропускаем строку заголовков (если она есть)
            if (i === headerRow) {
                console.log(`Пропускаем строку заголовков [${i}]:`, row);
                continue;
            }
            
            // Если первая ячейка пустая или не числовая, пропускаем строку
            if (!row[0] || isNaN(parseInt(row[0].toString()))) {
                console.log(`Пропускаем нечисловую строку [${i}]:`, row);
                continue;
            }
            
            // Получаем данные участника
            const number = row[0].toString().trim();
            const name = row[1] ? row[1].toString().trim() : 'Без имени';
            
            console.log(`Анализ строки участника [${i}]: номер=${number}, имя=${name}, ячейки:`, row);
            
            // Собираем данные об оценках
            const jury = [];
            for (let j = 0; j < juryNames.length; j++) {
                const scoreVal = parseScore(row[2 + j]);
                jury.push({ name: juryNames[j], score: scoreVal });
            }
            // ищем индекс 'итог' в строке жюри
            const juryRow = rows[headerRow - 1] || [];
            let finalIdx = juryRow.findIndex(cell => cell && cell.toString().trim().toLowerCase() === 'итог');
            if (finalIdx === -1) finalIdx = 4 + (juryNames.length === 3 ? 1 : 0); // fallback: 4 для 2 жюри, 5 для 3 жюри
            const finalScore = parseScore(row[finalIdx]);
            
            console.log(`  Оценки: ${jury.map(j => `${j.name}: ${j.score}`).join(', ')}, итог=${finalScore}`);
            
            // Создаем объект участника
            const participant = {
                id: `${currentNomination}-${number}`,
                nomination: currentNomination,
                number: number,
                name: name
            };
            
            // Создаем объект оценок
            const score = {
                participantId: `${currentNomination}-${number}`,
                nomination: currentNomination,
                participant: number,
                name: name,
                jury: jury,
                finalScore: finalScore
            };
            
            participants.push(participant);
            scores.push(score);
            
            console.log(`Добавлен участник [${i}]: ${number} - ${name}, оценка: ${finalScore}`);
        }

        console.log('Результат парсинга:');
        console.log('- Номинации:', nominations);
        console.log('- Участники:', participants.length);
        console.log('- Оценки:', scores.length);
        
        // Выводим первых 3 участников для проверки
        if (participants.length > 0) {
            console.log('Первые 3 участника:');
            for (let i = 0; i < Math.min(3, participants.length); i++) {
                console.log(participants[i]);
            }
            
            console.log('Первые 3 оценки:');
            for (let i = 0; i < Math.min(3, scores.length); i++) {
                console.log(scores[i]);
            }
        }

        return {
            nominations: nominations,
            participants: participants,
            scores: scores
        };
    } catch (error) {
        console.error('Ошибка при парсинге данных:', error);
        return { nominations: [], participants: [], scores: [] };
    }
}

// Вспомогательная функция для безопасного парсинга оценок
function parseScore(value) {
    if (value === undefined || value === null || value === '') return null;
    
    // Заменяем запятые на точки (для русской локали)
    const normalized = value.toString().replace(',', '.');
    const parsed = parseFloat(normalized);
    
    if (isNaN(parsed)) {
        console.log('Неверный формат оценки:', value);
        return null;
    }
    return parsed;
}

// Функция для получения списка номинаций
async function getNominations() {
    try {
        const parsed = await parseSheetData();
        return parsed.nominations;
    } catch (error) {
        console.error('Ошибка при получении номинаций:', error);
        return [];
    }
}

// Функция для получения списка участников
async function getParticipants(nomination = '') {
    try {
        const parsed = await parseSheetData();
        if (!nomination) return parsed.participants;
        
        return parsed.participants.filter(p => p.nomination === nomination);
    } catch (error) {
        console.error('Ошибка при получении участников:', error);
        return [];
    }
}

// Функция для получения оценок
async function getScores(nomination = '', participantNumber = '') {
    try {
        const parsed = await parseSheetData();
        let filtered = parsed.scores;
        
        // Фильтруем по номинации
        if (nomination) {
            filtered = filtered.filter(s => s.nomination === nomination);
        }
        
        // Фильтруем по номеру участника
        if (participantNumber) {
            filtered = filtered.filter(s => s.participant === participantNumber);
        }
        
        // Сортируем по итоговой оценке (от большей к меньшей)
        return filtered.sort((a, b) => {
            if (a.finalScore === null) return 1;
            if (b.finalScore === null) return -1;
            return b.finalScore - a.finalScore;
        });
    } catch (error) {
        console.error('Ошибка при получении оценок:', error);
        return [];
    }
}

// Функция для получения лидеров
async function getLeaders(nomination = '', limit = 5) {
    try {
        const scores = await getScores(nomination);
        return scores.slice(0, limit);
    } catch (error) {
        console.error('Ошибка при получении лидеров:', error);
        return [];
    }
}

// Функция для отладки
async function debugData() {
    console.group('Отладка данных');
    try {
        const data = await fetchDataWithCache();
        console.log('Сырые данные из таблицы:', data);
        
        // Анализируем и парсим данные
        const parsed = await parseSheetData();
        console.log('Распарсенные данные:', parsed);
        
        // Проверка работы функций
        const nominations = await getNominations();
        console.log('Номинации:', nominations);
        
        if (nominations.length > 0) {
            const firstNomination = nominations[0];
            console.log(`Участники номинации "${firstNomination}":`, await getParticipants(firstNomination));
            console.log(`Оценки номинации "${firstNomination}":`, await getScores(firstNomination));
            console.log(`Лидеры номинации "${firstNomination}":`, await getLeaders(firstNomination, 3));
        }
    } catch (error) {
        console.error('Ошибка отладки:', error);
    }
    console.groupEnd();
}

// Делаем функции глобальными
window.API_KEY = API_KEY;
window.getSheetId = getSheetId;
window.fetchDataWithCache = fetchDataWithCache;
window.parseSheetData = parseSheetData;
window.getNominations = getNominations;
window.getParticipants = getParticipants;
window.getScores = getScores;
window.getLeaders = getLeaders;
window.debugData = debugData; 