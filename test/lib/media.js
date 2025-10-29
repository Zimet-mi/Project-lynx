'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { withImagePreload, LazyImage } = (window.LazyImage || {});
    const Img = withImagePreload ? withImagePreload(LazyImage) : LazyImage;

    function ZoomableImage(props) {
        const { src, alt, className = '', preloadPriority = 'high', stopPropagation = false } = props || {};
        const handleClick = (e) => {
            if (stopPropagation) e.stopPropagation();
            if (window.telegramApi && telegramApi.isMobile && telegramApi.isMobile()) {
                e.preventDefault();
                telegramApi.openLink(src);
            }
        };
        return React.createElement('a', {
            href: src,
            onClick: handleClick,
            target: '_blank',
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


