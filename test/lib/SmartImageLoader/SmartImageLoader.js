class SmartImageLoader {
    constructor() {
        this.queue = [];
        this.inProgress = new Set();
        this.loaded = new Set();
        this.maxConcurrent = this.getOptimalConcurrency();
        this.isIdle = false;
        this.callbacks = new Map(); // Колбэки для уведомления компонентов
    }

    getOptimalConcurrency() {
        const isWeakDevice = 
            (navigator.hardwareConcurrency || 4) <= 2 ||
            (navigator.deviceMemory || 4) <= 2;
        
        return isWeakDevice ? 2 : 4;
    }

    // Добавить изображения с приоритетом
    addImages(urls, priority = 'normal', onLoadCallback = null) {
        urls.forEach(url => {
            if (this.loaded.has(url) || this.queue.some(item => item.url === url)) {
                // Если уже загружено или в очереди, сразу вызываем колбэк
                if (onLoadCallback) onLoadCallback(url);
                return;
            }
            
            if (onLoadCallback) {
                this.callbacks.set(url, onLoadCallback);
            }
            
            this.queue.push({
                url,
                priority: this.getPriorityValue(priority),
                added: Date.now()
            });
        });

        this.queue.sort((a, b) => b.priority - a.priority);
        this.processQueue();
    }

    getPriorityValue(priority) {
        const priorities = {
            'critical': 100,  // Видимые в viewport
            'high': 75,       // Текущая секция
            'normal': 50,     // Следующие секции
            'low': 25         // Всё остальное
        };
        return priorities[priority] || 50;
    }

    async processQueue() {
        while (this.inProgress.size < this.maxConcurrent && this.queue.length > 0) {
            const task = this.queue.shift();
            this.loadImage(task.url);
        }
        
        // Проверяем idle состояние
        if (this.queue.length === 0 && this.inProgress.size === 0) {
            this.isIdle = true;
        }
    }

    async loadImage(url) {
        if (this.inProgress.has(url)) return;
        
        this.inProgress.add(url);
        
        try {
            await this.fetchImage(url);
            this.loaded.add(url);
            
            // Вызываем колбэк если есть
            const callback = this.callbacks.get(url);
            if (callback) {
                callback(url);
                this.callbacks.delete(url);
            }
        } catch (error) {
            console.warn(`Failed to load image: ${url}`);
        } finally {
            this.inProgress.delete(url);
            this.processQueue();
        }
    }

    fetchImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(url);
            img.src = url;
        });
    }

    // Для фоновой загрузки
    startBackgroundLoading(allRemainingUrls) {
        if (this.isIdle) {
            this.addImages(allRemainingUrls, 'low');
        }
    }
}

// Глобальный инстанс
window.imageLoader = new SmartImageLoader();