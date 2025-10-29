'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { withImagePreload, LazyImage } = (window.LazyImage || {});
    const Img = withImagePreload ? withImagePreload(LazyImage) : LazyImage;

    function ZoomableImage(props) {
        const { src, alt, className = '', preloadPriority = 'high', stopPropagation = false, onClick } = props || {};
        const handleClick = (e) => {
            if (stopPropagation) e.stopPropagation();
            // На мобильных открываем нативно
            if (window.telegramApi && telegramApi.isMobile && telegramApi.isMobile()) {
                e.preventDefault();
                telegramApi.openLink(src);
                return;
            }
            // На ПК не открываем новую вкладку; если передан onClick (например, открыть модалку) — выполняем его
            if (onClick) {
                e.preventDefault();
                onClick(e);
                return;
            }
            // Иначе просто отменяем переход, чтобы не было новой вкладки
            e.preventDefault();
        };
        return React.createElement('a', {
            href: src,
            onClick: handleClick,
            rel: 'noopener noreferrer'
        }, React.createElement(Img, {
            src,
            alt,
            className,
            preloadPriority
        }));
    }

    window.AppMedia = { ZoomableImage };
})();


