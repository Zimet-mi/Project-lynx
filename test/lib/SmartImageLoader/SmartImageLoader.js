class SmartImageLoader {
    constructor() {
        this.queue = [];
        this.inProgress = new Set();
        this.loaded = new Set();
        this.maxConcurrent = this.getOptimalConcurrency();
        this.isIdle = false;
        this.callbacks = new Map();
    }

    getOptimalConcurrency() {
        // Для слабых устройств - меньше одновременных загрузок
        const isWeakDevice = 
            (navigator.hardwareConcurrency || 4) <= 2 ||
            (navigator.deviceMemory || 4) <= 2;
        
        return isWeakDevice ? 2 : 4;
    }

    addImages(urls, priority = 'normal', onLoadCallback = null) {
        urls.forEach(url => {
            if (this.loaded.has(url)) {
                if (onLoadCallback) onLoadCallback(url);
                return;
            }

            if (this.queue.some(item => item.url === url)) {
                // Уже в очереди - обновляем приоритет если нужно
                const existing = this.queue.find(item => item.url === url);
                if (this.getPriorityValue(priority) > existing.priority) {
                    existing.priority = this.getPriorityValue(priority);
                    this.queue.sort((a, b) => b.priority - a.priority);
                }
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
            'critical': 100,
            'high': 75,
            'normal': 50,
            'low': 25
        };
        return priorities[priority] || 50;
    }

    processQueue() {
        while (this.inProgress.size < this.maxConcurrent && this.queue.length > 0) {
            const task = this.queue.shift();
            this.loadImage(task.url);
        }
        
        if (this.queue.length === 0 && this.inProgress.size === 0) {
            this.isIdle = true;
        }
    }

    loadImage(url) {
        if (this.inProgress.has(url)) return;
        
        this.inProgress.add(url);
        
        const img = new Image();
        img.onload = () => {
            this.loaded.add(url);
            const callback = this.callbacks.get(url);
            if (callback) {
                callback(url);
                this.callbacks.delete(url);
            }
            this.inProgress.delete(url);
            this.processQueue();
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image: ${url}`);
            this.inProgress.delete(url);
            this.processQueue();
        };
        
        img.src = url;
    }

    startBackgroundLoading(urls) {
        if (this.isIdle) {
            this.addImages(urls, 'low');
        }
    }
}

// Создаем глобальный инстанс
window.imageLoader = new SmartImageLoader();