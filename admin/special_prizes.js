// Модуль для работы со специальными призами
const SpecialPrizes = (() => {
    // Кеш для хранения данных о спецпризах
    let specialPrizesData = {
        nominations: [],
        winners: {}
    };

    /**
     * Получение сервиса Google Sheets API
     * Пытается использовать существующую функцию в глобальном контексте или в импортированном модуле
     */
    async function getSheetService() {
        // Проверяем разные способы получения сервиса Google Sheets API
        if (typeof window !== 'undefined') {
            // Вариант 1: В глобальном пространстве имен (window)
            if (window.getSheetService) {
                return window.getSheetService();
            }
            
            // Вариант 2: В импортированном модуле google_sheets
            if (window.google_sheets && window.google_sheets.getSheetService) {
                return window.google_sheets.getSheetService();
            }
            
            // Вариант 3: Если есть глобальные функции google_sheets_api
            if (window.googleSheetsApi && window.googleSheetsApi.getService) {
                return window.googleSheetsApi.getService();
            }
        } else {
            // Вариант 4: Если запущено в Node.js, пытаемся импортировать модуль
            try {
                const googleSheets = require('./google_sheets');
                if (googleSheets.getSheetService) {
                    return googleSheets.getSheetService();
                }
            } catch (e) {
                console.error('Ошибка импорта модуля google_sheets:', e);
            }
        }
        
        // Если не удалось получить сервис, возвращаем null
        console.error('Не удалось получить сервис Google Sheets API');
        return null;
    }

    /**
     * Получение номинаций спецпризов из таблицы
     * @returns {Promise<Array>} Массив с названиями номинаций
     */
    async function getSpecialNominations() {
        try {
            console.log('Получение номинаций спецпризов...');
            
            // Если уже загружены - возвращаем из кеша
            if (specialPrizesData.nominations.length > 0) {
                return specialPrizesData.nominations;
            }
            
            // Получаем сервис Google Sheets API
            const sheets = await getSheetService();
            if (!sheets) {
                console.error('Сервис Google Sheets не доступен');
                return [];
            }
            
            const spreadsheetId = process.env.SPREADSHEET_ID || window.SPREADSHEET_ID;
            const range = 'Specials!A1:I50'; // Берем достаточно большой диапазон для поиска заголовков
            
            const response = await sheets.values.get({
                spreadsheetId,
                range,
            });
            
            const rows = response.data.values || [];
            if (rows.length === 0) {
                console.log('Данные о спецпризах не найдены');
                return [];
            }
            
            // Ищем строки с заголовками номинаций (содержащие "лучш" или "гран-при")
            const nominations = [];
            
            rows.forEach((row) => {
                // Объединяем ячейки строки для поиска номинации
                const rowText = row.join(' ').toLowerCase();
                
                // Проверяем, содержит ли строка ключевые слова для номинаций
                if (rowText.includes('лучш') || rowText.includes('гран-при')) {
                    // Очищаем номинацию от лишних пробелов
                    const nomination = row.join(' ').trim();
                    if (nomination) {
                        nominations.push(nomination);
                    }
                }
            });
            
            console.log('Найдено номинаций спецпризов:', nominations.length);
            
            // Сохраняем в кеш
            specialPrizesData.nominations = nominations;
            
            return nominations;
        } catch (error) {
            console.error('Ошибка при получении номинаций спецпризов:', error);
            return [];
        }
    }

    /**
     * Получение победителей в выбранной номинации
     * @param {string} nomination Название номинации
     * @returns {Promise<Array>} Массив победителей
     */
    async function getSpecialPrizeWinners(nomination) {
        try {
            console.log('Получение победителей для номинации:', nomination);
            
            // Если данные уже в кеше, возвращаем их
            if (specialPrizesData.winners[nomination]) {
                return specialPrizesData.winners[nomination];
            }
            
            // Если номинация не указана, возвращаем пустой массив
            if (!nomination) {
                return [];
            }
            
            // Получаем сервис Google Sheets API
            const sheets = await getSheetService();
            if (!sheets) {
                console.error('Сервис Google Sheets не доступен');
                return [];
            }
            
            const spreadsheetId = process.env.SPREADSHEET_ID || window.SPREADSHEET_ID;
            const range = 'Specials!A1:I50'; // Берем тот же диапазон
            
            const response = await sheets.values.get({
                spreadsheetId,
                range,
            });
            
            const rows = response.data.values || [];
            if (rows.length === 0) {
                return [];
            }
            
            // Ищем номинацию в таблице
            let nominationRowIndex = -1;
            
            for (let i = 0; i < rows.length; i++) {
                const rowText = rows[i].join(' ').trim();
                if (rowText === nomination) {
                    nominationRowIndex = i;
                    break;
                }
            }
            
            if (nominationRowIndex === -1) {
                console.log('Номинация не найдена в таблице');
                return [];
            }
            
            // Получаем данные о победителях из следующих строк после заголовка номинации
            const winners = [];
            let currentRow = nominationRowIndex + 1;
            
            // Ищем, пока не дойдем до пустой строки или следующей номинации
            while (currentRow < rows.length) {
                const row = rows[currentRow];
                
                // Если строка пустая или содержит ключевые слова для номинаций, останавливаемся
                if (!row || row.length === 0 || 
                    row.join(' ').toLowerCase().includes('лучш') || 
                    row.join(' ').toLowerCase().includes('гран-при')) {
                    break;
                }
                
                // Если в строке есть данные о победителе (минимум номер участника)
                if (row[0] && row[0].trim()) {
                    winners.push({
                        participant: row[0].trim(), // Номер участника
                        name: row[1] ? row[1].trim() : '', // Имя участника (если есть)
                        nomination: nomination,
                        place: row[2] ? row[2].trim() : '' // Место (если есть)
                    });
                }
                
                currentRow++;
            }
            
            console.log('Найдено победителей:', winners.length);
            
            // Сохраняем в кеш
            specialPrizesData.winners[nomination] = winners;
            
            return winners;
        } catch (error) {
            console.error('Ошибка при получении победителей спецприза:', error);
            return [];
        }
    }

    /**
     * Получение всех победителей спецпризов
     * @returns {Promise<Array>} Массив всех победителей
     */
    async function getAllSpecialPrizeWinners() {
        try {
            const nominations = await getSpecialNominations();
            const allWinners = [];
            
            // Получаем победителей для каждой номинации
            for (const nomination of nominations) {
                const winners = await getSpecialPrizeWinners(nomination);
                allWinners.push(...winners);
            }
            
            return allWinners;
        } catch (error) {
            console.error('Ошибка при получении всех победителей спецпризов:', error);
            return [];
        }
    }

    /**
     * Очистка кеша
     */
    function clearCache() {
        specialPrizesData = {
            nominations: [],
            winners: {}
        };
    }

    // Публичное API модуля
    return {
        getSpecialNominations,
        getSpecialPrizeWinners,
        getAllSpecialPrizeWinners,
        clearCache
    };
})();

// Если используется в браузере, делаем модуль доступным глобально
if (typeof window !== 'undefined') {
    window.SpecialPrizes = SpecialPrizes;
}

// Если используется в Node.js, экспортируем модуль
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpecialPrizes;
} 