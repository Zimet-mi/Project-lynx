'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;
    const { ZoomableImage } = (window.AppMedia || {});

    function Card({ participant }) {
        const mainSheet = SHEET_CONFIG.mainSheet;
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);
        const [comment, setComment] = useState(participant.comment || '');
        const [edited, setEdited] = useState(false);
        useEffect(() => {
            // ONLY подгружать с сервера когда нет редактирования
            if (!edited) {
                setComment(participant.comment || '');
            }
        }, [participant.row, participant.comment]);

        async function saveImmediately(value, row) {
            console.log('[vol] saveData: sheet=', mainSheet, 'row=', row, 'col=C', 'value=', value);
            try {
                const result = await googleSheetsApi.saveData(value, 'C', row, mainSheet);
                console.log('[vol] saveData result:', result);
                if (result) setEdited(false);
                return result;
            } catch (e) {
                console.warn('[vol] saveData ERROR:', e);
                return false;
            }
        }

        function handleSaveDebounced(value) {
            const debounce = (window.debounce)
                ? window.debounce
                : function fakeDebounce(key, fn, delay, ...args) { return setTimeout(() => fn(...args), delay || 700); };
            debounce(`vol_comment_${participant.id}_${participant.row}`, async (val) => {
                console.log('[vol] DEBOUNCE go', val);
                const ok = await saveImmediately(val, participant.row);
                if (ok) {
                    if (window.googleSheetsApi && googleSheetsApi.updateCachedCell) {
                        const up = googleSheetsApi.updateCachedCell(mainSheet, participant.row, 'C', val);
                        console.log('[vol] updateCachedCell =', up);
                    }
                    if (window.AppEvents && typeof AppEvents.emit === 'function') {
                        console.log('[vol] EMIT cellChanged', mainSheet, participant.row);
                        window.AppEvents.emit('cellChanged', { sheet: mainSheet, row: participant.row, column: 'C', value: val });
                    }
                } else {
                    console.warn('[vol] Could not save, alert!');
                    alert('Ошибка сохранения комментария!');
                }
            }, 700, value);
        }
        const handleThumbClick = (e) => { e.stopPropagation(); setIsImageModalOpen(true); };
        const handleClose = () => setIsImageModalOpen(false);
        const stop = (e) => e.stopPropagation();
        return React.createElement('div', { className: 'participant-card' },
            React.createElement('div', { className: 'participant-header', onClick: () => {} },
                React.createElement(ZoomableImage, {
                    src: `../card/${participant.img}`,
                    alt: participant.name,
                    className: 'participant-thumbnail',
                    preloadPriority: 'high',
                    onClick: handleThumbClick,
                    stopPropagation: true
                }),
                React.createElement('div', { className: 'participant-info' },
                    React.createElement('div', { className: 'participant-name' }, participant.name),
                    React.createElement('div', { className: 'participant-id' }, `Номер: ${participant.id}`)
                ),
                React.createElement('div', { className: 'participant-info' },
                    React.createElement('textarea', {
                        className: 'input-field comment-textarea',
                        placeholder: 'Комментарий (сохраняется в колонку C)...',
                        value: comment,
                        onChange: (e) => {
                            const val = e.target.value;
                            setComment(val);
                            setEdited(true);
                        },
                        onBlur: async () => {
                            if (edited && comment !== (participant.comment || '')) {
                                const ok = await saveImmediately(comment, participant.row);
                                console.log('[vol] onBlur: save', ok, 'edited:', edited);
                                // setEdited внутри saveImmediately
                                setComment(participant.comment || '');
                            } else {
                                console.log('[vol] onBlur: not changed or not edited, skip save. edited:', edited);
                                setComment(participant.comment || '');
                            }
                        },
                    })
                )
            ),
            isImageModalOpen && React.createElement('div', { className: 'image-modal show', onClick: handleClose },
                React.createElement('div', { className: 'image-modal-content', onClick: stop },
                    React.createElement('span', { className: 'image-modal-close', onClick: handleClose, title: 'Закрыть (Esc)' }, '×'),
                    React.createElement(ZoomableImage, {
                        src: `../card/${participant.img}`,
                        alt: participant.name,
                        className: 'image-modal-img',
                        preloadPriority: 'high',
                        stopPropagation: true
                    })
                )
            )
        );
    }

    function ParticipantsSimple({ section = 'One' }) {
        const [participants, setParticipants] = useState([]);
        useEffect(() => {
            function update() {
                if (!window.AppStore) return;
                const list = AppStore.getParticipantsForSection ? AppStore.getParticipantsForSection(section) : [];
                setParticipants(list);
            }
            update();
            const unsub = (window.AppStore && AppStore.subscribe) ? AppStore.subscribe(update) : null;
            return () => { if (unsub) unsub(); };
        }, [section]);
        return React.createElement('div', { className: 'participants-page' },
            React.createElement('div', { id: `section${section}` },
                participants.map(p => React.createElement(Card, { key: `${p.id}-${p.dataRow}`, participant: p }))
            )
        );
    }

    function AllParticipantsSimple() {
        const [all, setAll] = useState([]);
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);
        const [selectedImageParticipant, setSelectedImageParticipant] = useState(null);

        useEffect(() => {
            function update() {
                const list = (window.AppStore && AppStore.getAllParticipants) ? AppStore.getAllParticipants() : [];
                setAll(list);
            }
            update();
            const unsub = (window.AppStore && AppStore.subscribe) ? AppStore.subscribe(update) : null;
            return () => { if (unsub) unsub(); };
        }, []);

        const handleImageClick = (participant, e) => {
            if (e) e.stopPropagation();
            if (!participant) return;
            setSelectedImageParticipant(participant);
            setIsImageModalOpen(true);
            if (window.telegramApi && telegramApi.hapticFeedback) telegramApi.hapticFeedback('impact', 'soft');
        };
        const handleImageModalClose = (e) => { if (e) e.stopPropagation(); setIsImageModalOpen(false); setSelectedImageParticipant(null); };
        const handleImageModalContentClick = (e) => e.stopPropagation();

        if (!all.length) return React.createElement('div', { className: 'no-data' }, React.createElement('p', null, 'Нет участников для отображения'));

        const grouped = {};
        all.forEach(p => { if (!grouped[p.sheet]) grouped[p.sheet] = []; grouped[p.sheet].push(p); });

        return React.createElement('div', { className: 'all-participants-page' },
            React.createElement('div', { id: 'allParticipantsPreview' },
                React.createElement('table', { className: 'all-participants-table' },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, 'Фото'),
                            React.createElement('th', null, 'Имя'),
                            React.createElement('th', null, 'Номер'),
                            React.createElement('th', null, 'День')
                        )
                    ),
                    React.createElement('tbody', null,
                        ...ALL_PARTICIPANTS_SHEETS.map(({ sheet }, sheetIdx) => {
                            const group = grouped[sheet] || [];
                            const dayLabel = `День ${sheetIdx + 1}`;
                            return group.map(participant => React.createElement('tr', {
                                key: `${participant.sheet}-${participant.dataRow}`,
                                className: 'participant-row'
                            },
                                React.createElement('td', null,
                                    React.createElement(ZoomableImage, {
                                        src: `../card/${participant.img}`,
                                        alt: participant.name,
                                        className: 'participant-preview-img-small',
                                        preloadPriority: 'normal',
                                        stopPropagation: true,
                                        onClick: (e) => handleImageClick(participant, e)
                                    })
                                ),
                                React.createElement('td', null, participant.name || ''),
                                React.createElement('td', null, participant.id || ''),
                                React.createElement('td', null, dayLabel)
                            ));
                        })
                    )
                )
            ),
            isImageModalOpen && selectedImageParticipant && React.createElement('div', { className: 'image-modal show', onClick: handleImageModalClose },
                React.createElement('div', { className: 'image-modal-content', onClick: handleImageModalContentClick },
                    React.createElement('span', { className: 'image-modal-close', onClick: handleImageModalClose, title: 'Закрыть (Esc)' }, '×'),
                    React.createElement(ZoomableImage, {
                        src: `../card/${selectedImageParticipant.img}`,
                        alt: selectedImageParticipant.name,
                        className: 'image-modal-img',
                        preloadPriority: 'high',
                        stopPropagation: true
                    })
                )
            )
        );
    }

    window.SimpleParticipants = { ParticipantsSimple, AllParticipantsSimple };
})();


