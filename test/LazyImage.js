'use strict';

// Глобальная библиотека LazyImage с поддержкой withImagePreload и провайдера (no-op)
(function() {
    if (typeof window === 'undefined') return;
    if (typeof React === 'undefined') {
        console.error('React is not available');
        window.LazyImage = window.LazyImage || {};
        return;
    }

    const { useState, useEffect, useRef } = React;

    function BaseLazyImage({ src, alt, className = '', onClick, onError, priority = 'normal', fallback = '../card/no-image.png', preloadPriority }) {
        const [currentSrc, setCurrentSrc] = useState('');
        const [isLoaded, setIsLoaded] = useState(false);
        const imgRef = useRef(null);
        const triedFallbacksRef = useRef(new Set());

        // Список кандидатов для заглушки на случай разных относительных путей на GitHub Pages
        const fallbackCandidates = [
            fallback,
            'card/no-image.png',
            './card/no-image.png',
            '../card/no-image.png',
            'no-image.png'
        ].filter((v, i, a) => typeof v === 'string' && v && a.indexOf(v) === i);

        const effectivePriority = preloadPriority || priority || 'normal';

        useEffect(() => {
            if (!src || !window.imageLoader) {
                setCurrentSrc(src || fallbackCandidates[0]);
                setIsLoaded(true);
                return;
            }

            if (window.imageLoader.loaded && window.imageLoader.loaded.has(src)) {
                setCurrentSrc(src);
                setIsLoaded(true);
                return;
            }

            const onImageLoad = (loadedSrc) => {
                if (loadedSrc === src) {
                    setCurrentSrc(src);
                    setIsLoaded(true);
                }
            };

            window.imageLoader.addImages([src], effectivePriority, onImageLoad);

            if (effectivePriority === 'normal' && imgRef.current) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            window.imageLoader.addImages([src], 'critical', onImageLoad);
                            observer.unobserve(entry.target);
                        }
                    });
                }, { rootMargin: '50px', threshold: 0.1 });

                observer.observe(imgRef.current);
                return () => observer.disconnect();
            }
        }, [src, effectivePriority, fallback]);

        const handleError = (e) => {
            const target = e.target;
            const current = target.getAttribute('src') || '';
            // Если текущий src уже один из пробованных заглушек — ищем следующую
            triedFallbacksRef.current.add(current);
            const next = fallbackCandidates.find(u => !triedFallbacksRef.current.has(u));
            if (next) {
                target.src = next;
                return;
            }
            // Больше вариантов нет — прекращаем попытки
            target.onerror = null;
            if (onError) onError(e);
        };

        return React.createElement('img', {
            ref: imgRef,
            src: currentSrc || fallbackCandidates[0],
            alt: alt,
            className: `${className} ${isLoaded ? 'loaded' : 'loading'}`,
            onClick: onClick,
            onError: handleError,
            style: { opacity: isLoaded ? 1 : 0.7, transition: 'opacity 0.3s ease-in-out' }
        });
    }

    // HOC для предзагрузки с высоким приоритетом
    function withImagePreload(Component) {
        return function PreloadedImage(props) {
            return React.createElement(Component, { ...props, preloadPriority: props.preloadPriority || 'high' });
        };
    }

    // Провайдер на будущее (для совместимости)
    function LazyImageProvider({ children }) {
        return children || null;
    }

    window.LazyImage = {
        LazyImage: BaseLazyImage,
        withImagePreload,
        LazyImageProvider
    };
})();


