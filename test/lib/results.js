'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;
    const { LoadingIndicator } = window.AppUI || {};
    const { withImagePreload, LazyImage } = window.LazyImage || {};
    const OptimizedLazyImage = withImagePreload ? withImagePreload(LazyImage) : LazyImage;

    const handleImageError = (e) => { console.warn('Ошибка загрузки изображения:', e.target?.src); };

    const ResultsAccordion = () => {
        const [resultsData, setResultsData] = useState([]);
        const [loading, setLoading] = useState(true);
        const [activeAccordion, setActiveAccordion] = useState(null);
        const [selectedImage, setSelectedImage] = useState(null);
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);

        useEffect(() => { loadResultsData(); }, []);
        const loadResultsData = async () => {
            try {
                setLoading(true);
                const dataParts = await Promise.all(
                    RESULT_RANGES.map(range =>
                        googleSheetsApi.fetchDataWithCache(SHEET_CONFIG.resultSheet, range, 420000).catch(() => null)
                    )
                );
                setResultsData(dataParts);
            } catch (e) { console.warn('Ошибка при загрузке данных результатов:', e); }
            finally { setLoading(false); }
        };

        const handleImageClick = (imageId) => { setSelectedImage(imageId); setIsImageModalOpen(true); telegramApi.hapticFeedback('impact', 'soft'); };
        const handleImageModalClose = (e) => { if (e) e.stopPropagation(); setIsImageModalOpen(false); setSelectedImage(null); };
        const handleImageModalContentClick = (e) => e.stopPropagation();

        const createTableCell = (cellContent, isLink = false) => {
            if (isLink && cellContent) {
                return React.createElement('td', null, React.createElement('span', { className: 'participant-id-link', onClick: () => handleImageClick(cellContent), style: { cursor: 'pointer' } }, cellContent));
            }
            return React.createElement('td', null, cellContent);
        };

        const createTableFromData = (data) => {
            if (!data || !data.values || data.values.length === 0) {
                return React.createElement('div', { className: 'no-data' }, 'Нет данных для отображения');
            }
            return React.createElement('table', { className: 'data-table' },
                React.createElement('thead', null, React.createElement('tr', null, ...data.values[0]?.map((header, index) => React.createElement('th', { key: index }, header)))),
                React.createElement('tbody', null, ...data.values.slice(1).map((row, rowIndex) => React.createElement('tr', { key: rowIndex }, ...row.map((cellContent, colIndex) => createTableCell(cellContent, colIndex === 0)))))
            );
        };

        useEffect(() => {
            const handleEscKey = (event) => { if (event.keyCode === 27 && isImageModalOpen) handleImageModalClose(); };
            if (isImageModalOpen) { document.addEventListener('keydown', handleEscKey); document.body.style.overflow = 'hidden'; }
            else { document.body.style.overflow = 'auto'; }
            return () => { document.removeEventListener('keydown', handleEscKey); document.body.style.overflow = 'auto'; };
        }, [isImageModalOpen]);

        if (loading) return React.createElement(LoadingIndicator, { message: 'Загрузка результатов...' });

        return React.createElement('div', { id: 'accordion-container' },
            ...RESULT_SECTIONS.map((sectionName, index) => React.createElement('div', { key: index, className: 'accordion-section' },
                React.createElement('button', { className: `accordion ${activeAccordion === index ? 'active' : ''}`, onClick: () => setActiveAccordion(activeAccordion === index ? null : index) }, sectionName),
                activeAccordion === index && React.createElement('div', { className: 'panel active' }, resultsData[index] && createTableFromData(resultsData[index]))
            )),
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

    const ResultsPage = () => React.createElement('div', { className: 'results-page' }, React.createElement(ResultsAccordion));

    window.AppResults = { ResultsAccordion, ResultsPage };
})();


