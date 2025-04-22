// Модуль для работы со специальными призами

// Глобальные переменные
const SPECIALS_API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
const SPECIALS_SHEET_NAME = 'Specials'; // Страница со специальными призами
const SPECIALS_RANGE = 'A1:I670';

// Переменная для хранения данных в памяти
let cachedParsedData = null;
let dataLoadPromise = null;

// Функция для загрузки данных из Google Sheets со страницы Specials
async function fetchSpecialsData() {
    try {
        // Используем функцию getSheetId из utils.js
        const SHEET_ID = await window.getSheetId();
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SPECIALS_SHEET_NAME}!${SPECIALS_RANGE}?key=${SPECIALS_API_KEY}`;
        console.log('Запрос специальных призов по URL:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Получены данные специальных призов из таблицы:', data);
        
        return data;
    } catch (error) {
        console.error('Ошибка при загрузке данных специальных призов:', error);
        throw error;
    }
}

// Парсинг данных специальных призов
async function parseSpecialsData() {
    // Если у нас уже есть кэшированные данные, возвращаем их
    if (cachedParsedData) {
        console.log('Используются кэшированные данные спецпризов');
        return cachedParsedData;
    }
    
    // Если загрузка уже началась, ждем ее завершения
    if (dataLoadPromise) {
        console.log('Ожидание текущей загрузки данных спецпризов...');
        return dataLoadPromise;
    }
    
    // Начинаем загрузку данных
    dataLoadPromise = (async () => {
        try {
            const data = await fetchSpecialsData();
            if (!data || !data.values || data.values.length === 0) {
                console.error('Нет данных специальных призов для анализа');
                return { nominations: [], winners: [] };
            }

            const rows = data.values;
            console.log('Всего строк в таблице специальных призов:', rows.length);
            
            // Выводим первые несколько строк для отладки
            if (rows.length > 0) console.log('Строка 1 (заголовок):', rows[0]);
            if (rows.length > 1) console.log('Строка 2 (жюри):', rows[1]);
            if (rows.length > 2) console.log('Строка 3 (пример данных):', rows[2]);

            // Структуры для хранения распарсенных данных
            const nominations = [];
            const winners = [];

            let currentNomination = null;
            
            // Получим имена жюри из конкретных ячеек
            let juryNames = ['Жюри 1', 'Жюри 2', 'Жюри 3']; // значения по умолчанию
            
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
            
            // Анализ каждой строки
            for (let i = 2; i < rows.length; i++) { // Начинаем с 2, чтобы пропустить заголовки и строку с именами жюри
                const row = rows[i];
                
                // Пропускаем пустые строки
                if (!row || row.length === 0) continue;
                
                // Логируем потенциальные заголовки номинаций для отладки
                if (row[0] && row[0].trim()) {
                    console.log(`Потенциальная номинация [${i}]:`, row[0], row.length > 1 ? `Вторая ячейка: "${row[1] || ''}"` : 'Вторая ячейка пуста');
                }
                
                // Расширенная логика определения заголовка номинации:
                // 1. Если первая ячейка содержит текст, а вторая пуста
                // 2. Если первая ячейка содержит текст, который включает "Гран-при" или "пошив" (без учета регистра)
                const firstCell = row[0] ? row[0].toString().trim() : '';
                const secondCell = row[1] ? row[1].toString().trim() : '';
                
                const isNominationHeader = 
                    (firstCell && !secondCell) || // стандартный случай - первая ячейка заполнена, вторая пуста
                    (firstCell && (
                        firstCell.toLowerCase().includes('гран-при') || 
                        firstCell.toLowerCase().includes('пошив')
                    ));
                
                if (isNominationHeader) {
                    currentNomination = firstCell;
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
                    
                    // Проверяем отметки жюри (столбцы C, D, E)
                    const juryMarkValues = [
                        row[2] ? row[2].toString().trim() : '',  // столбец C (индекс 2)
                        row[3] ? row[3].toString().trim() : '',  // столбец D (индекс 3)
                        row[4] ? row[4].toString().trim() : ''   // столбец E (индекс 4)
                    ];
                    
                    // Создаем объект с отметками жюри
                    const juryMarks = juryMarkValues.map((mark, index) => ({
                        juryName: juryNames[index],
                        mark: mark,
                        hasVoted: mark !== ''
                    }));
                    
                    // Считаем количество отметок (непустых ячеек)
                    const marksCount = juryMarkValues.filter(mark => mark !== '').length;
                    
                    // Получаем отметивших жюри для отображения
                    const votedJury = juryMarks
                        .filter(jury => jury.hasVoted)
                        .map(jury => jury.juryName);
                    
                    // Место можно получить из одного из столбцов с отметками
                    const place = juryMarkValues.find(mark => mark !== '') || '';
                    
                    winners.push({
                        nomination: currentNomination,
                        participant: participantNumber,
                        name: name,
                        place: place,
                        juryMarks: juryMarks,
                        juryMarkValues: juryMarkValues,
                        marksCount: marksCount,
                        votedJury: votedJury
                    });
                    
                    console.log(`Добавлен победитель [${i}]: "${currentNomination}" - ${participantNumber} (${name}), отметок жюри: ${marksCount}, жюри: ${votedJury.join(', ')}`);
                }
            }

            console.log('Результат парсинга специальных призов:');
            console.log('- Номинации:', nominations);
            console.log('- Победители:', winners.length);

            // Сохраняем распарсенные данные в кэш
            cachedParsedData = {
                nominations: nominations,
                winners: winners
            };

            // Возвращаем результат
            return cachedParsedData;
        } catch (error) {
            console.error('Ошибка при парсинге данных специальных призов:', error);
            return { nominations: [], winners: [] };
        } finally {
            // Сбрасываем промис загрузки данных
            dataLoadPromise = null;
        }
    })();
    
    return dataLoadPromise;
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
        const winners = parsed.winners.filter(winner => winner.nomination === nomination);
        
        // Сортируем по количеству отметок (от большего к меньшему)
        return winners.sort((a, b) => b.marksCount - a.marksCount);
    } catch (error) {
        console.error('Ошибка при получении победителей спецприза:', error);
        return [];
    }
}

// Получение всех победителей спецпризов
async function getAllSpecialPrizeWinners() {
    try {
        const parsed = await parseSpecialsData();
        
        // Сортируем сначала по номинации, затем по количеству отметок
        return parsed.winners.sort((a, b) => {
            // Сначала сортировка по номинации
            if (a.nomination !== b.nomination) {
                return a.nomination.localeCompare(b.nomination);
            }
            // Затем по количеству отметок (от большего к меньшему)
            return b.marksCount - a.marksCount;
        });
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