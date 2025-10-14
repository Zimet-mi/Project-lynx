// Модуль ленивого сохранения с резервным копированием в localStorage
// Всегда пишем в localStorage мгновенно, отправляем на сервер в фоне

class LazySaveManager {
    constructor() {
        this.queue = new Map(); // Очередь для отправки на сервер
        this.isProcessing = false; // Флаг обработки очереди
        this.processingInterval = LAZY_SAVE_CONFIG.processingInterval; // Интервал проверки очереди (мс)
        this.dataMaxAge = LAZY_SAVE_CONFIG.dataMaxAge; // Время жизни данных в localStorage
        this.lastProcessTime = 0; // Время последней обработки
        
        // Запускаем периодическую обработку очереди
        this.startQueueProcessor();
        
        // Обработка события восстановления соединения
        this.setupOnlineHandler();
        
        console.log('🔄 LazySaveManager инициализирован');
    }

    // Сохранение данных (мгновенно в localStorage, в фоне на сервер)
    async saveData(value, column, row, sheetName) {
        const dataKey = `${sheetName}_${column}_${row}`;
        const saveData = {
            value,
            column,
            row,
            sheetName,
            timestamp: Date.now(),
            id: dataKey
        };

        try {
            // 1. МГНОВЕННО сохраняем в localStorage
            this.saveToLocalStorage(dataKey, saveData);
            console.log(`💾 Данные сохранены в localStorage: ${dataKey} = ${value}`);
            
            // 2. Добавляем в очередь для отправки на сервер
            this.addToQueue(dataKey, saveData);
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
            return false;
        }
    }

    // Сохранение в localStorage
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`lazy_save_${key}`, JSON.stringify(data));
            
            // Обновляем метаданные очереди
            const queueMeta = this.getQueueMetadata();
            queueMeta.lastUpdate = Date.now();
            queueMeta.totalItems = this.getLocalStorageQueueSize();
            localStorage.setItem('lazy_save_metadata', JSON.stringify(queueMeta));
            
        } catch (error) {
            console.error('Ошибка записи в localStorage:', error);
            throw error;
        }
    }

    // Добавление в очередь для отправки на сервер
    addToQueue(key, data) {
        this.queue.set(key, data);
        
        // Запускаем обработку очереди если не обрабатывается
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    // Получение размера очереди из localStorage
    getLocalStorageQueueSize() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('lazy_save_') && key !== 'lazy_save_metadata') {
                count++;
            }
        }
        return count;
    }

    // Получение метаданных очереди
    getQueueMetadata() {
        try {
            const meta = localStorage.getItem('lazy_save_metadata');
            return meta ? JSON.parse(meta) : { lastUpdate: 0, totalItems: 0 };
        } catch {
            return { lastUpdate: 0, totalItems: 0 };
        }
    }

    // Обработка очереди отправки на сервер
    async processQueue() {
		if (this.isProcessing || this.queue.size === 0) {
			return;
		}

		this.isProcessing = true;
		console.log(`🔄 Начинаю обработку очереди (${this.queue.size} элементов)`);

		// Создаем копию текущей очереди для обработки
		const currentQueue = new Map(this.queue);
		
		const promises = [];

		// Обрабатываем все элементы очереди
		for (const [key, data] of currentQueue) {
			promises.push(
				this.sendToServer(data, key)
					.then(() => {
						// Успешно отправлено - удаляем из очереди и localStorage
						// Только если данные не изменились во время отправки
						const currentData = this.queue.get(key);
						if (currentData && currentData.timestamp === data.timestamp) {
							this.removeFromQueue(key);
							console.log(`✅ Успешно отправлено: ${key}`);
						} else {
							console.log(`🔄 Данные изменились во время отправки ${key}, оставляю в очереди`);
						}
					})
					.catch(error => {
						console.warn(`❌ Ошибка отправки ${key}:`, error);
						// Не удаляем из очереди - будем пытаться снова
					})
			);
		}

		// Ждем завершения всех попыток отправки
		await Promise.allSettled(promises);

		this.isProcessing = false;
		this.lastProcessTime = Date.now();
		
		console.log(`📊 Обработка завершена. В очереди осталось: ${this.queue.size} элементов`);
		
		// Если в очереди еще есть элементы, планируем следующую обработку
		if (this.queue.size > 0) {
			setTimeout(() => this.processQueue(), 1000);
		}
	}

    // Отправка данных на сервер
    async sendToServer(data, key) {
        return new Promise((resolve, reject) => {
            // Используем существующий API для отправки
            googleSheetsApi.saveData(data.value, data.column, data.row, data.sheetName)
                .then(success => {
                    if (success) {
                        resolve();
                    } else {
                        reject(new Error('Сервер вернул ошибку'));
                    }
                })
                .catch(reject);
        });
    }

    // Удаление из очереди и localStorage
    removeFromQueue(key) {
        this.queue.delete(key);
        
        try {
            localStorage.removeItem(`lazy_save_${key}`);
            
            // Обновляем метаданные
            const queueMeta = this.getQueueMetadata();
            queueMeta.lastUpdate = Date.now();
            queueMeta.totalItems = this.getLocalStorageQueueSize();
            localStorage.setItem('lazy_save_metadata', JSON.stringify(queueMeta));
            
        } catch (error) {
            console.error('Ошибка удаления из localStorage:', error);
        }
    }

    // Запуск периодической обработки очереди
    startQueueProcessor() {
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastProcess = now - this.lastProcessTime;
            
            // Обрабатываем очередь если прошло достаточно времени
            if (timeSinceLastProcess >= this.processingInterval && this.queue.size > 0) {
                this.processQueue();
            }
        }, this.processingInterval);
    }

    // Обработка восстановления соединения
    setupOnlineHandler() {
        window.addEventListener('online', () => {
            console.log('🌐 Соединение восстановлено, запускаю обработку очереди');
            this.processQueue();
        });

        // Также проверяем при фокусе окна
        window.addEventListener('focus', () => {
            if (this.queue.size > 0) {
                console.log('👁️ Окно получило фокус, проверяю очередь');
                this.processQueue();
            }
        });
    }

    // Восстановление очереди из localStorage при загрузке
    restoreQueueFromLocalStorage() {
        try {
            console.log('🔄 Восстанавливаю очередь из localStorage...');
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lazy_save_') && key !== 'lazy_save_metadata') {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        const queueKey = key.replace('lazy_save_', '');
                        
                        // Проверяем актуальность данных (не старше установленного времени)
                        if (Date.now() - data.timestamp < this.dataMaxAge) {
                            this.queue.set(queueKey, data);
                        } else {
                            // Удаляем устаревшие данные
                            localStorage.removeItem(key);
                        }
                    } catch (error) {
                        console.warn(`Ошибка восстановления элемента ${key}:`, error);
                        localStorage.removeItem(key);
                    }
                }
            }
            
            console.log(`📦 Восстановлено ${this.queue.size} элементов в очередь`);
            
            // Запускаем обработку если есть элементы
            if (this.queue.size > 0) {
                this.processQueue();
            }
            
        } catch (error) {
            console.error('Ошибка восстановления очереди:', error);
        }
    }

    // Получение статистики очереди
    getQueueStats() {
        const queueMeta = this.getQueueMetadata();
        return {
            queueSize: this.queue.size,
            localStorageSize: queueMeta.totalItems,
            lastUpdate: new Date(queueMeta.lastUpdate).toLocaleString(),
            isProcessing: this.isProcessing
        };
    }

    // Принудительная очистка всех данных
    clearAllData() {
        try {
            // Очищаем очередь
            this.queue.clear();
            
            // Очищаем localStorage
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lazy_save_')) {
                    localStorage.removeItem(key);
                }
            }
            
            console.log('🗑️ Все данные ленивого сохранения очищены');
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
        }
    }

    // Получение всех неотправленных данных
    getAllPendingData() {
        const pendingData = [];
        for (const [key, data] of this.queue) {
            pendingData.push({
                id: key,
                ...data
            });
        }
        return pendingData;
    }
}

// Создаем единственный экземпляр менеджера
const lazySaveManager = new LazySaveManager();

// Восстанавливаем очередь при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    lazySaveManager.restoreQueueFromLocalStorage();
});

// Также восстанавливаем если DOM уже загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lazySaveManager.restoreQueueFromLocalStorage();
    });
} else {
    lazySaveManager.restoreQueueFromLocalStorage();
}

// Экспортируем для использования в других модулях
window.lazySaveManager = lazySaveManager;
