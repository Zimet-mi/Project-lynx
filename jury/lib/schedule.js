'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;
    const { LoadingIndicator } = window.AppUI || {};
    const { withImagePreload, LazyImage } = window.LazyImage || {};
    const OptimizedLazyImage = withImagePreload ? withImagePreload(LazyImage) : LazyImage;

    const handleImageError = (e) => { console.warn('Ошибка загрузки изображения:', e.target?.src); };

    const ScheduleTable = () => {
        const [data, setData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [selectedImage, setSelectedImage] = useState(null);
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);

        useEffect(() => { loadSchedule(); }, []);
        const loadSchedule = async () => {
            try { setLoading(true); const scheduleData = await googleSheetsApi.fetchSchedule(); setData(scheduleData); }
            catch (err) { console.warn('Ошибка загрузки расписания:', err); }
            finally { setLoading(false); }
        };

        const handleImageClick = (imageId) => { setSelectedImage(imageId); setIsImageModalOpen(true); telegramApi.hapticFeedback('impact', 'soft'); };
        const handleImageModalClose = (e) => { if (e) e.stopPropagation(); setIsImageModalOpen(false); setSelectedImage(null); };
        const handleImageModalContentClick = (e) => e.stopPropagation();

        useEffect(() => {
            const handleEscKey = (event) => { if (event.keyCode === 27 && isImageModalOpen) handleImageModalClose(); };
            if (isImageModalOpen) { document.addEventListener('keydown', handleEscKey); document.body.style.overflow = 'hidden'; }
            else { document.body.style.overflow = 'auto'; }
            return () => { document.removeEventListener('keydown', handleEscKey); document.body.style.overflow = 'auto'; };
        }, [isImageModalOpen]);

        if (loading) return React.createElement(LoadingIndicator, { message: 'Загрузка расписания...' });
        if (!data || !data.values) return React.createElement('div', { className: 'no-data' }, React.createElement('p', null, 'Нет данных для отображения'));

        return React.createElement('div', { className: 'schedule-container' },
            React.createElement('table', { id: 'schedule', className: 'table_blur' },
                React.createElement('thead', null, React.createElement('tr', null, ...data.values[0]?.map((header, index) => React.createElement('th', { key: index }, header)))),
                React.createElement('tbody', null,
                    ...data.values.slice(1).map((row, rowIndex) => {
                        let rowClass = '';
                        if (row.some(cell => cell && cell.toLowerCase().includes('смотр'))) rowClass = 'smort';
                        else if (row.some(cell => cell && cell.toLowerCase().includes('блок'))) rowClass = 'block';
                        else if (row.some(cell => cell && cell.includes(':'))) rowClass = 'B';
                        return React.createElement('tr', { key: rowIndex, className: rowClass },
                            ...row.map((cell, colIndex) => {
                                if (colIndex === 0 && cell) {
                                    return React.createElement('td', { key: colIndex }, React.createElement('span', { className: 'participant-id-link', onClick: () => handleImageClick(cell), style: { cursor: 'pointer' } }, cell));
                                }
                                return React.createElement('td', { key: colIndex }, cell);
                            })
                        );
                    })
                )
            ),
            isImageModalOpen && selectedImage && React.createElement('div', { className: 'image-modal show', onClick: handleImageModalClose },
                React.createElement('div', { className: 'image-modal-content', onClick: handleImageModalContentClick },
                    React.createElement('span', { className: 'image-modal-close', onClick: handleImageModalClose, title: 'Закрыть (Esc)' }, '×'),
                    React.createElement((window.AppMedia && AppMedia.ZoomableImage) || 'div', {
                        src: `../card/${selectedImage}.jpg`,
                        alt: `Участник ${selectedImage}`,
                        className: 'image-modal-img',
                        preloadPriority: 'high',
                        stopPropagation: true
                    })
                )
            )
        );
    };

    const SchedulePage = () => React.createElement('div', { className: 'schedule-page' }, React.createElement(ScheduleTable));

    window.AppSchedule = { ScheduleTable, SchedulePage };
})();


