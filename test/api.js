// API сервисы для работы с Google Sheets

if (typeof GOOGLE_SCRIPT_URLS === 'undefined') {
    var GOOGLE_SCRIPT_URLS = {
        getSheetId: 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec',
        saveData: 'https://script.google.com/macros/s/AKfycbxQ3MrknFLRGXb6J7YJcNEVe5IShT-AITtvSvZHHSwK1OPvs-4ikzDXeSWQ60czU5z1/exec'
    };
}

if (typeof CACHE_CONFIG === 'undefined') {
    var CACHE_CONFIG = {
        generalExpiry: 420000,
        participantsExpiry: 120000
    };
}

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

    // Загрузка данных из Google Sheets с кешированием и оффлайн-режимом
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
				
				// Если данные устарели, но интернета нет - все равно возвращаем
				if (!navigator.onLine) {
					console.warn('Оффлайн режим: использую устаревшие данные');
					console.groupEnd();
					return JSON.parse(cachedData);
				}
			}

			// Пытаемся обновить данные (только если есть интернет)
			if (!navigator.onLine && cachedData) {
				throw new Error('OFFLINE_MODE');
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
			
			// Если оффлайн и есть кеш - возвращаем кеш
			if ((!navigator.onLine || error.message === 'OFFLINE_MODE') && cachedData) {
				console.warn('Оффлайн режим: использую устаревшие данные из кеша');
				console.groupEnd();
				return JSON.parse(cachedData);
			}
			
			// Если кеша нет вообще - бросаем ошибку
			if (!cachedData) {
				console.groupEnd();
				throw new Error('Нет данных в кеше и отсутствует интернет');
			}
			
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
        const loadedSheets = new Set();
        
        // Все участники из всех листов (оптимизировано - избегаем дубликатов)
        ALL_PARTICIPANTS_SHEETS.forEach(({ sheet, range }) => {
            if (!loadedSheets.has(sheet)) {
                loadedSheets.add(sheet);
                promises.push(
                    this.fetchDataWithCache(sheet, range, CACHE_CONFIG.generalExpiry)
                        .catch(err => console.warn(`Ошибка предзагрузки ${sheet}:`, err))
                );
            }
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
