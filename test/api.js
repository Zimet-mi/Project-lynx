// API сервисы для работы с Google Sheets

class GoogleSheetsApi {
    constructor() {
        this.sheetIdCache = null;
    }

    // Получение ID таблицы через Google Apps Script
    async getSheetId() {
        if (this.sheetIdCache) {
            return this.sheetIdCache;
        }

        try {
            // Проверяем sessionStorage
            const fromSession = sessionStorage.getItem('SHEET_ID');
            if (fromSession) {
                this.sheetIdCache = fromSession;
                return this.sheetIdCache;
            }
        } catch (error) {
            console.warn('Ошибка доступа к sessionStorage:', error);
        }

        try {
            const response = await axios.get(GOOGLE_SCRIPT_URLS.getSheetId);
            this.sheetIdCache = response.data;
            
            try {
                sessionStorage.setItem('SHEET_ID', this.sheetIdCache);
            } catch (error) {
                console.warn('Не удалось сохранить в sessionStorage:', error);
            }
            
            return this.sheetIdCache;
        } catch (error) {
            console.error('Ошибка получения Sheet ID:', error);
            throw error;
        }
    }

    // Загрузка данных из Google Sheets с кешированием
    async fetchDataWithCache(sheetName, range, cacheExpiry = CACHE_CONFIG.generalExpiry) {
        const cacheKey = `data_${sheetName}_${range}`;
        const timeKey = `time_${sheetName}_${range}`;
        
        console.group(`[GoogleSheetsApi] ${sheetName}!${range}`);
        const startTime = performance.now();
        
        try {
            // Проверяем кеш
            const cachedData = localStorage.getItem(cacheKey);
            const cachedTime = localStorage.getItem(timeKey);
            
            if (cachedData && cachedTime) {
                const currentTime = Date.now();
                const timeDiff = currentTime - parseInt(cachedTime);
                
                if (timeDiff < cacheExpiry) {
                    console.log('Возвращаю данные из кеша');
                    console.groupEnd();
                    return JSON.parse(cachedData);
                }
            }

            // Загружаем из API
            const sheetId = await this.getSheetId();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${API_KEY}`;
            
            console.log('Запрашиваю из сети:', url);
            const response = await axios.get(url);
            
            const data = response.data;
            
            // Сохраняем в кеш
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(timeKey, Date.now().toString());
            
            console.log('Сохранил в кеш');
            console.log('Время выполнения, мс:', Math.round(performance.now() - startTime));
            console.groupEnd();
            
            return data;
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            console.groupEnd();
            throw error;
        }
    }

    // Сохранение данных в Google Sheets
    async saveData(value, column, row, sheetName) {
        try {
            const params = new URLSearchParams({
                column: column,
                row: row,
                value: value,
                sheet: sheetName
            });

            const response = await axios.get(`${GOOGLE_SCRIPT_URLS.saveData}?${params.toString()}`);
            
            if (response.status === 200) {
                console.log(`Данные сохранены: ${sheetName} ${column}${row} = ${value}`);
                return true;
            } else {
                console.error('Ошибка сохранения данных:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            return false;
        }
    }

    // Загрузка данных расписания
    async fetchSchedule() {
        const cacheKey = 'schedule_data';
        const timeKey = 'schedule_time';
        
        // Проверяем кеш
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);
        
        if (cachedData && cachedTime) {
            const currentTime = Date.now();
            const timeDiff = currentTime - parseInt(cachedTime);
            
            if (timeDiff < CACHE_CONFIG.generalExpiry) {
                return JSON.parse(cachedData);
            }
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${TIMETABLE_ID}/values/${TIMETABLE_RANGE}?key=${API_KEY}`;
            const response = await axios.get(url);
            
            const data = response.data;
            
            // Сохраняем в кеш
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(timeKey, Date.now().toString());
            
            return data;
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
            throw error;
        }
    }

    // Предзагрузка всех данных
    async preloadAllData() {
        const promises = [];
        
        // Основные данные участников
        promises.push(
            this.fetchDataWithCache(
                SHEET_CONFIG.mainSheet,
                'A1:M200',
                CACHE_CONFIG.participantsExpiry
            ).catch(err => console.warn('Ошибка предзагрузки основных участников:', err))
        );
        
        // Все участники из всех листов
        ALL_PARTICIPANTS_SHEETS.forEach(({ sheet, range }) => {
            promises.push(
                this.fetchDataWithCache(sheet, range, CACHE_CONFIG.generalExpiry)
                    .catch(err => console.warn(`Ошибка предзагрузки ${sheet}:`, err))
            );
        });
        
        // Расписание
        promises.push(
            this.fetchSchedule()
                .catch(err => console.warn('Ошибка предзагрузки расписания:', err))
        );
        
        await Promise.all(promises);
        console.log('Предзагрузка данных завершена');
    }
}

// Создаем единственный экземпляр
const googleSheetsApi = new GoogleSheetsApi();
