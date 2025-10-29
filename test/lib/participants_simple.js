'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;
    const { ZoomableImage } = (window.AppMedia || {});

    function Card({ participant }) {
        const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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
        useEffect(() => {
            function update() {
                const list = (window.AppStore && AppStore.getAllParticipants) ? AppStore.getAllParticipants() : [];
                setAll(list);
            }
            update();
            const unsub = (window.AppStore && AppStore.subscribe) ? AppStore.subscribe(update) : null;
            return () => { if (unsub) unsub(); };
        }, []);
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
                                React.createElement('td', null, React.createElement(ZoomableImage, { src: `../card/${participant.img}`, alt: participant.name, className: 'participant-preview-img-small', preloadPriority: 'normal' })),
                                React.createElement('td', null, participant.name || ''),
                                React.createElement('td', null, participant.id || ''),
                                React.createElement('td', null, dayLabel)
                            ));
                        })
                    )
                )
            )
        );
    }

    window.SimpleParticipants = { ParticipantsSimple, AllParticipantsSimple };
})();


