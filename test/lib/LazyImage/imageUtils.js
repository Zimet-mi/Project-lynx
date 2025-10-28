// Утилиты для работы с изображениями
class ImageUtils {
    constructor() {
        this.webpSupported = null;
        this.imageCache = new Map();
        this.observer = null;
    }

    // Проверка поддержки WebP
    async checkWebPSupport() {
        if (this.webpSupported !== null) return this.webpSupported;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.webpSupported = (img.width > 0) && (img.height > 0);
                resolve(this.webpSupported);
            };
            img.onerror = () => {
                this.webpSupported = false;
                resolve(this.webpSupported);
            };
            img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
        });
    }

    // Конвертация в WebP если поддерживается
    getOptimizedSrc(originalSrc) {
        if (this.webpSupported === false || !originalSrc) return originalSrc;
        
        // Заменяем расширение на .webp если поддерживается
        return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // Предзагрузка изображений
    preloadImages(urls) {
        return Promise.allSettled(
            urls.map(src => {
                if (this.imageCache.has(src)) return Promise.resolve();
                
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => {
                        this.imageCache.set(src, true);
                        resolve();
                    };
                    img.onerror = reject;
                });
            })
        );
    }

    // Создание Intersection Observer для ленивой загрузки
    createObserver(callback, options = {}) {
        if (this.observer) this.observer.disconnect();

        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver(callback, { ...defaultOptions, ...options });
        return this.observer;
    }

    // Очистка
    disconnectObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    // Получение оптимального размера для устройства
    getOptimalSize(originalSrc, maxWidth = 800) {
        // Здесь можно интегрировать с CDN или серверным ресайзингом
        return originalSrc;
    }
}

// Создаем глобальный экземпляр
window.ImageUtils = new ImageUtils();