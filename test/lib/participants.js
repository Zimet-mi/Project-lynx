'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect, useRef } = React;
    const { EvaluationFields, EvaluationForm } = window.AppEvaluation || {};
    const { withImagePreload, LazyImage } = window.LazyImage || {};
    const OptimizedLazyImage = withImagePreload ? withImagePreload(LazyImage) : LazyImage;

    const handleImageError = (e) => {
        console.warn('Ошибка загрузки изображения:', e.target?.src);
    };

    const ParticipantCard = ({ participant, onScoreChange, onCommentChange, debounce }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);

        const handleToggle = () => setIsExpanded(!isExpanded);
        const handleImageClick = (e) => { e.stopPropagation(); setIsImageModalOpen(true); telegramApi.hapticFeedback('impact', 'soft'); };
        const handleImageModalClose = (e) => { if (e) e.stopPropagation(); setIsImageModalOpen(false); };
        const handleImageModalContentClick = (e) => e.stopPropagation();

        useEffect(() => {
            const handleEscKey = (event) => { if (event.keyCode === 27 && isImageModalOpen) setIsImageModalOpen(false); };
            if (isImageModalOpen) { document.addEventListener('keydown', handleEscKey); document.body.style.overflow = 'hidden'; }
            else { document.body.style.overflow = 'auto'; }
            return () => { document.removeEventListener('keydown', handleEscKey); document.body.style.overflow = 'auto'; };
        }, [isImageModalOpen]);

        return React.createElement('div', { className: 'participant-card' },
            React.createElement('div', { className: 'participant-header', onClick: handleToggle },
                React.createElement(LazyImage, { src: `../card/${participant.img}`, alt: participant.name, className: 'participant-thumbnail', onError: handleImageError, onClick: handleImageClick, fallback: '../card/no-image.png' }),
                React.createElement('div', { className: 'participant-info' },
                    React.createElement('div', { className: 'participant-name' }, participant.name),
                    React.createElement('div', { className: 'participant-id' }, `Номер: ${participant.id}`)
                )
            ),
            isExpanded && React.createElement('div', { className: 'input-container' },
                React.createElement(EvaluationForm, { participant, onScoreChange, onCommentChange, debounce })
            ),
            isImageModalOpen && React.createElement('div', { className: 'image-modal show', onClick: handleImageModalClose },
                React.createElement('div', { className: 'image-modal-content', onClick: handleImageModalContentClick },
                    React.createElement('span', { className: 'image-modal-close', onClick: handleImageModalClose, title: 'Закрыть (Esc)' }, '×'),
                    React.createElement(OptimizedLazyImage, { src: `../card/${participant.img}`, alt: participant.name, className: 'image-modal-img', onError: handleImageError, preloadPriority: 'high' })
                )
            )
        );
    };

    const ParticipantsPage = ({ section = 'One', debounce }) => {
        const [participants, setParticipants] = useState([]);

        useEffect(() => {
            function updateFromStore() {
                const list = (window.AppStore && AppStore.getParticipantsForSection) ? AppStore.getParticipantsForSection(section) : [];
                console.log('[ParticipantsPage] section', section, 'count', list.length);
                setParticipants(list);
                if (list && list.length) {
                    const urls = list.map(p => `../card/${p.img}`);
                    if (window.imageLoader) window.imageLoader.addImages(urls, 'high');
                }
            }
            updateFromStore();
            let unsubscribe = null;
            if (window.AppStore && AppStore.subscribe) {
                unsubscribe = AppStore.subscribe(updateFromStore);
            }
            return () => { if (unsubscribe) unsubscribe(); };
        }, [section]);

        const getRangeForSection = (section) => {
            switch (section) {
                case 'One': return SECTION_RANGES.section1;
                case 'Two': return SECTION_RANGES.section2;
                case 'Three': return SECTION_RANGES.section3;
                default: return [1, 1000];
            }
        };

        const filterParticipantsByRange = (list, [start, end]) => list.filter(p => p.dataRow >= start && p.dataRow <= end);
        const range = getRangeForSection(section);
        const sectionParticipants = filterParticipantsByRange(participants, range);

        return React.createElement('div', { className: 'participants-page' },
            React.createElement('div', { id: `section${section === 'One' ? '1' : section === 'Two' ? '2' : '3'}` },
                sectionParticipants.length > 0 ? sectionParticipants.map((participant) =>
                    React.createElement(ParticipantCard, { key: `${participant.id}-${participant.row}`, participant, onScoreChange: () => {}, onCommentChange: () => {}, debounce })
                ) : React.createElement('div', { className: 'no-participants' }, React.createElement('p', null, 'Нет участников в этой секции'))
            )
        );
    };

    const AllParticipantsPage = ({ debounce }) => {
        const [allParticipants, setAllParticipants] = useState([]);
        const [selectedParticipant, setSelectedParticipant] = useState(null);
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);
        const [selectedImageParticipant, setSelectedImageParticipant] = useState(null);
        const [editingScores, setEditingScores] = useState({ C: '', D: '', E: '', F: '', comment: '' });
        const [editingCheckboxes, setEditingCheckboxes] = useState({});

        useEffect(() => {
            function updateFromStore() {
                const list = (window.AppStore && AppStore.getAllParticipants) ? AppStore.getAllParticipants() : [];
                setAllParticipants(list);
            }
            updateFromStore();
            let unsubscribe = null;
            if (window.AppStore && AppStore.subscribe) {
                unsubscribe = AppStore.subscribe(updateFromStore);
            }
            return () => { if (unsubscribe) unsubscribe(); };
        }, []);

        // Подписка на локальные изменения ячеек: обновляем таблицу "Все участники" без перезагрузки
        useEffect(() => {
            if (!window.AppEvents) return;
            const unsubscribe = AppEvents.on('cellChanged', ({ sheet, row, column, value }) => {
                setAllParticipants(prev => {
                    if (!prev || prev.length === 0) return prev;
                    let changed = false;
                    const next = prev.map(p => {
                        if (p.sheet === sheet && p.dataRow === row) {
                            const updated = { ...p, scores: { ...p.scores } };
                            if (column === 'C' || column === 'D' || column === 'E' || column === 'F') {
                                updated.scores[column] = value || '';
                                changed = true;
                                return updated;
                            }
                            if (column === 'G') {
                                updated.scores.comment = value || '';
                                changed = true;
                                return updated;
                            }
                            // Колонки спецпризов: I..N
                            const colCode = column && column.charCodeAt && column.charCodeAt(0);
                            if (colCode && colCode >= 'I'.charCodeAt(0) && colCode <= 'N'.charCodeAt(0)) {
                                // Пересоберём чекбоксы на основе value
                                const activePrizes = getActiveSpecialPrizes();
                                const checkboxes = { ...p.checkboxes };
                                activePrizes.forEach((prize, idx) => {
                                    if (prize.column === column) {
                                        checkboxes[idx] = !!(value && value.toString().trim() !== '');
                                    }
                                });
                                updated.checkboxes = checkboxes;
                                changed = true;
                                return updated;
                            }
                        }
                        return p;
                    });
                    return changed ? next : prev;
                });
            });
            return () => { if (unsubscribe) unsubscribe(); };
        }, []);
        // loadAllParticipants больше не нужен: используем AppStore

        const saveImmediately = async (value, column, row, sheetName) => { try { await lazySaveManager.saveData(value, column, row, sheetName); } catch (e) { telegramApi.showAlert('Ошибка сохранения данных'); } };
        const handleParticipantClick = (participant) => { if (!participant) return; setSelectedParticipant(participant); setEditingScores(participant.scores); setEditingCheckboxes(participant.checkboxes); setIsModalOpen(true); };
        const handleImageClick = (participant, e) => { if (e) e.stopPropagation(); if (!participant) return; setSelectedImageParticipant(participant); setIsImageModalOpen(true); telegramApi.hapticFeedback('impact', 'soft'); };
        const handleModalClose = () => { setIsModalOpen(false); setSelectedParticipant(null); };
        const handleImageModalClose = (e) => { if (e) e.stopPropagation(); setIsImageModalOpen(false); setSelectedImageParticipant(null); };
        const handleImageModalContentClick = (e) => e.stopPropagation();

        const handleScoreChange = (column, value) => {
            if (!selectedParticipant) return;
            setEditingScores(prev => ({ ...prev, [column]: value }));
            telegramApi.hapticFeedback('selection');
            if (debounce) {
                debounce(`modal_score_${selectedParticipant.id}_${column}`, async (val, col) => { 
                    await saveImmediately(val, col, selectedParticipant.dataRow, selectedParticipant.sheet);
                    if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                        googleSheetsApi.updateCachedCell(selectedParticipant.sheet, selectedParticipant.dataRow, col, val);
                    }
                }, 500, value, column);
                if (window.AppEvents) AppEvents.emit('cellChanged', { sheet: selectedParticipant.sheet, row: selectedParticipant.dataRow, column, value });
            } else { 
                saveImmediately(value, column, selectedParticipant.dataRow, selectedParticipant.sheet);
                if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                    googleSheetsApi.updateCachedCell(selectedParticipant.sheet, selectedParticipant.dataRow, column, value);
                }
                if (window.AppEvents) AppEvents.emit('cellChanged', { sheet: selectedParticipant.sheet, row: selectedParticipant.dataRow, column, value });
            }
        };
        const handleCommentChange = (value) => {
            if (!selectedParticipant) return;
            setEditingScores(prev => ({ ...prev, comment: value }));
            if (debounce) { 
                debounce(`modal_comment_${selectedParticipant.id}`, async (val) => { 
                    await saveImmediately(val, 'G', selectedParticipant.dataRow, selectedParticipant.sheet);
                    if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                        googleSheetsApi.updateCachedCell(selectedParticipant.sheet, selectedParticipant.dataRow, 'G', val);
                    }
                }, 1000, value);
                if (window.AppEvents) AppEvents.emit('cellChanged', { sheet: selectedParticipant.sheet, row: selectedParticipant.dataRow, column: 'G', value });
            } else { 
                saveImmediately(value, 'G', selectedParticipant.dataRow, selectedParticipant.sheet);
                if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                    googleSheetsApi.updateCachedCell(selectedParticipant.sheet, selectedParticipant.dataRow, 'G', value);
                }
                if (window.AppEvents) AppEvents.emit('cellChanged', { sheet: selectedParticipant.sheet, row: selectedParticipant.dataRow, column: 'G', value });
            }
        };
        const handleCheckboxChange = (index, checked) => {
            if (!selectedParticipant) return;
            setEditingCheckboxes(prev => ({ ...prev, [index]: checked }));
            const activePrizes = getActiveSpecialPrizes();
            const prize = activePrizes[index];
            if (prize) {
                const value = checked ? prize.value : '';
                if (debounce) { 
                    debounce(`modal_checkbox_${selectedParticipant.id}_${index}`, async (val) => { 
                        await saveImmediately(val, prize.column, selectedParticipant.dataRow, selectedParticipant.sheet);
                        if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                            googleSheetsApi.updateCachedCell(selectedParticipant.sheet, selectedParticipant.dataRow, prize.column, val);
                        }
                    }, 300, value); 
                    if (window.AppEvents) AppEvents.emit('cellChanged', { sheet: selectedParticipant.sheet, row: selectedParticipant.dataRow, column: prize.column, value });
                }
                else { 
                    saveImmediately(value, prize.column, selectedParticipant.dataRow, selectedParticipant.sheet);
                    if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                        googleSheetsApi.updateCachedCell(selectedParticipant.sheet, selectedParticipant.dataRow, prize.column, value);
                    }
                    if (window.AppEvents) AppEvents.emit('cellChanged', { sheet: selectedParticipant.sheet, row: selectedParticipant.dataRow, column: prize.column, value });
                }
            }
        };

        useEffect(() => {
            const handleEscKey = (event) => {
                if (event.keyCode === 27) {
                    if (isImageModalOpen) { setIsImageModalOpen(false); setSelectedImageParticipant(null); }
                    if (isModalOpen) { handleModalClose(); }
                }
            };
            if (isImageModalOpen || isModalOpen) { document.addEventListener('keydown', handleEscKey); document.body.style.overflow = 'hidden'; }
            else { document.body.style.overflow = 'auto'; }
            return () => { document.removeEventListener('keydown', handleEscKey); document.body.style.overflow = 'auto'; };
        }, [isImageModalOpen, isModalOpen]);

        if (allParticipants.length === 0) {
            return React.createElement('div', { className: 'no-data' }, React.createElement('p', null, 'Нет участников для отображения'));
        }

        const groupedParticipants = {};
        allParticipants.forEach(p => { if (!p) return; if (!groupedParticipants[p.sheet]) groupedParticipants[p.sheet] = []; groupedParticipants[p.sheet].push(p); });

        return React.createElement('div', { className: 'all-participants-page' },
            React.createElement('div', { id: 'allParticipantsPreview' },
                React.createElement('table', { className: 'all-participants-table' },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, 'Фото'),
                            React.createElement('th', null, 'Имя'),
                            React.createElement('th', null, 'Номер'),
                            React.createElement('th', null, 'День'),
                            React.createElement('th', null, 'Оценки')
                        )
                    ),
                    React.createElement('tbody', null,
                        ...ALL_PARTICIPANTS_SHEETS.map(({ sheet }, sheetIdx) => {
                            const group = groupedParticipants[sheet] || [];
                            const dayLabel = `День ${sheetIdx + 1}`;
                            return group.map(participant => participant && React.createElement('tr', {
                                key: `${participant.sheet}-${participant.row}`,
                                className: 'participant-row',
                                onClick: () => handleParticipantClick(participant),
                                style: { cursor: 'pointer' }
                            },
                                React.createElement('td', null, React.createElement(LazyImage, { src: `../card/${participant.img}`, alt: participant.name, className: 'participant-preview-img-small', onError: handleImageError, onClick: (e) => handleImageClick(participant, e) })),
                                React.createElement('td', null, participant.name || ''),
                                React.createElement('td', null, participant.id || ''),
                                React.createElement('td', null, dayLabel),
                                React.createElement('td', { className: 'participant-total-score' }, (() => { const s = participant.scores; const sum = [s.C, s.D, s.E, s.F].reduce((t, sc) => t + (parseInt(sc) || 0), 0); return sum > 0 ? sum : '-'; })())
                            ));
                        })
                    )
                )
            ),
            isModalOpen && selectedParticipant && React.createElement('div', { className: 'participant-modal show', onClick: handleModalClose },
                React.createElement('div', { className: 'participant-modal-content', onClick: (e) => e.stopPropagation(), style: { maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' } },
                    React.createElement('span', { className: 'participant-modal-close', onClick: handleModalClose, title: 'Закрыть (Esc)' }, '×'),
                    React.createElement('div', { className: 'participant-modal-header' },
                        React.createElement(OptimizedLazyImage, { src: `../card/${selectedParticipant.img}`, alt: selectedParticipant.name, className: 'participant-modal-img', onError: handleImageError, onClick: () => { setSelectedImageParticipant(selectedParticipant); setIsImageModalOpen(true); }, preloadPriority: 'high', style: { cursor: 'pointer' } }),
                        React.createElement('div', null,
                            React.createElement('div', { className: 'participant-modal-name' }, selectedParticipant.name),
                            React.createElement('div', { className: 'participant-modal-id' }, `Номер: ${selectedParticipant.id}`),
                            React.createElement('div', { className: 'participant-modal-sheet' }, `День: ${selectedParticipant.sheet}`)
                        )
                    ),
                    React.createElement('div', { className: 'participant-modal-marks' },
                        React.createElement('h3', { style: { margin: '0 0 20px 0', color: '#333' } }, 'Редактирование оценок'),
                        React.createElement(EvaluationFields, { scores: editingScores, checkboxes: editingCheckboxes, onScoreChange: handleScoreChange, onCheckboxChange: handleCheckboxChange, onCommentChange: handleCommentChange, participantId: selectedParticipant.id, compact: true })
                    )
                )
            ),
            isImageModalOpen && selectedImageParticipant && React.createElement('div', { className: 'image-modal show', onClick: handleImageModalClose },
                React.createElement('div', { className: 'image-modal-content', onClick: handleImageModalContentClick },
                    React.createElement('span', { className: 'image-modal-close', onClick: handleImageModalClose, title: 'Закрыть (Esc)' }, '×'),
                    React.createElement(OptimizedLazyImage, { src: `../card/${selectedImageParticipant.img}`, alt: selectedImageParticipant.name, className: 'image-modal-img', onError: handleImageError, preloadPriority: 'high' })
                )
            )
        );
    };

    window.AppParticipants = { ParticipantCard, ParticipantsPage, AllParticipantsPage };
})();


