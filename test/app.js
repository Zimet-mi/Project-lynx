// Основное React приложение Valerie

const { useState, useEffect, useCallback } = React;

// Компонент загрузки
const LoadingIndicator = ({ message = 'Загрузка данных...' }) => {
    return React.createElement('div', { className: 'preload-indicator' },
        React.createElement('div', { className: 'preload-indicator-text' }, message),
        React.createElement('div', { className: 'preload-loader' })
    );
};

// Компонент навигации
const Navigation = ({ activeTab, onTabChange, onSendCache }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const tabs = [
        { id: 'One', icon: '1️⃣', label: 'Первый' },
        { id: 'Two', icon: '2️⃣', label: 'Второй' },
        { id: 'Three', icon: '3️⃣', label: 'Третий' },
        { id: 'all', icon: '👥', label: 'Участники' }
    ];

    const handleTabClick = (tabId) => {
        onTabChange(tabId);
        setDropdownOpen(false);
        telegramApi.hapticFeedback('selection');
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setDropdownOpen(!dropdownOpen);
    };

    // Закрытие dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    return React.createElement('nav', { className: 'top-nav' },
        ...tabs.map(tab => 
            React.createElement('button', {
                key: tab.id,
                className: `tablinks ${activeTab === tab.id ? 'active' : ''}`,
                onClick: () => handleTabClick(tab.id)
            },
                React.createElement('span', { className: 'nav-icon' }, tab.icon),
                React.createElement('span', { className: 'nav-label' }, tab.label)
            )
        ),
        React.createElement('div', { className: `dropdown ${dropdownOpen ? 'open' : ''}` },
            React.createElement('button', {
                className: 'dropdown-toggle',
                onClick: toggleDropdown,
                type: 'button',
                'aria-label': 'Меню'
            },
                React.createElement('span', { className: 'burger-icon', 'aria-hidden': true },
                    React.createElement('svg', {
                        width: '28',
                        height: '28',
                        viewBox: '0 0 28 28',
                        fill: 'none',
                        xmlns: 'http://www.w3.org/2000/svg'
                    },
                        React.createElement('rect', { y: '6', width: '28', height: '3', rx: '1.5', fill: '#1976d2' }),
                        React.createElement('rect', { y: '13', width: '28', height: '3', rx: '1.5', fill: '#1976d2' }),
                        React.createElement('rect', { y: '20', width: '28', height: '3', rx: '1.5', fill: '#1976d2' })
                    )
                )
            ),
            React.createElement('div', { className: 'dropdown-menu' },
                React.createElement('button', {
                    className: `dropdown-item tablinks ${activeTab === 'table' ? 'active' : ''}`,
                    onClick: () => handleTabClick('table')
                },
                    React.createElement('span', { className: 'nav-icon' }, '🗓️'),
                    React.createElement('span', { className: 'nav-label' }, 'Расписание')
                ),
                React.createElement('button', {
                    className: `dropdown-item tablinks ${activeTab === 'red' ? 'active' : ''}`,
                    onClick: () => handleTabClick('red')
                },
                    React.createElement('span', { className: 'nav-icon' }, '📊'),
                    React.createElement('span', { className: 'nav-label' }, 'Итог')
                ),
                React.createElement('button', {
                    className: 'dropdown-item send-btn',
                    onClick: onSendCache,
                    id: 'sendCacheButton'
                },
                    React.createElement('span', { className: 'nav-icon' }, '📤'),
                    React.createElement('span', { className: 'nav-label' }, 'Отправить')
                )
            )
        )
    );
};

// Компонент заголовка
const Header = ({ activeTab, onTabChange, onSendCache }) => {
    return React.createElement('div', { className: 'head' },
        React.createElement('header', null,
            React.createElement('div', { className: 'nav-wrapper' },
                React.createElement(Navigation, {
                    activeTab,
                    onTabChange,
                    onSendCache
                })
            )
        )
    );
};

// Компонент формы оценки
const EvaluationForm = ({ participant, onScoreChange, onCommentChange }) => {
    const [scores, setScores] = useState({
        costum: '',
        shozhest: '',
        vistup: '',
        aks: '',
        comment: ''
    });
    const [checkboxes, setCheckboxes] = useState({});

    // Загрузка текущих значений
    useEffect(() => {
        const loadCurrentValues = async () => {
            try {
                const data = await googleSheetsApi.fetchDataWithCache(
                    SHEET_CONFIG.mainSheet,
                    `A${participant.row}:N${participant.row}`,
                    120000
                );
                
                if (data && data.values && data.values[0]) {
                    const row = data.values[0];
                    
                    setScores({
                        costum: row[2] || '',
                        shozhest: row[3] || '',
                        vistup: row[4] || '',
                        aks: row[5] || '',
                        comment: row[6] || ''
                    });
                    
                    const checkboxValues = {};
                    CHECKBOX_COLUMNS.forEach((column, index) => {
                        const colIndex = column.charCodeAt(0) - 'A'.charCodeAt(0);
                        checkboxValues[index] = row[colIndex] ? row[colIndex].toString().trim() !== '' : false;
                    });
                    setCheckboxes(checkboxValues);
                }
            } catch (error) {
                console.error('Ошибка загрузки значений:', error);
            }
        };

        loadCurrentValues();
    }, [participant.row]);

    // Функция немедленного сохранения
    const saveImmediately = async (value, column, row, sheetName) => {
        try {
            await googleSheetsApi.saveData(value, column, row, sheetName);
            // Легкая вибрация для подтверждения сохранения
            telegramApi.hapticFeedback('impact', 'light');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            telegramApi.showAlert('Ошибка сохранения данных');
        }
    };

    const handleScoreChange = async (field, value) => {
        const param = PARTICIPANT_PARAMETERS.find(p => p.field === field);
        if (param) {
            setScores(prev => ({ ...prev, [field]: value }));
            await saveImmediately(value, param.column, participant.row, SHEET_CONFIG.mainSheet);
            onScoreChange?.(participant.id, field, value);
        }
    };

    const handleCommentChange = async (value) => {
        setScores(prev => ({ ...prev, comment: value }));
        await saveImmediately(value, 'G', participant.row, SHEET_CONFIG.mainSheet);
        onCommentChange?.(participant.id, value);
    };

    const handleCheckboxChange = async (index, checked) => {
        setCheckboxes(prev => ({ ...prev, [index]: checked }));
        const value = checked ? 'Номинант' : '';
        const column = CHECKBOX_COLUMNS[index];
        await saveImmediately(value, column, participant.row, SHEET_CONFIG.mainSheet);
    };

    return React.createElement('div', { className: 'evaluation-form' },
        // Оценки
        React.createElement('div', { className: 'select-group' },
            ...PARTICIPANT_PARAMETERS.map(param => 
                React.createElement('div', { key: param.field, className: 'select-row' },
                    React.createElement('div', null, param.label),
                    React.createElement('select', {
                        className: 'data-input input-field',
                        value: scores[param.field] || '',
                        onChange: (e) => handleScoreChange(param.field, e.target.value)
                    },
                        ...Array.from({ length: param.options }, (_, i) => 
                            React.createElement('option', { key: i + 1, value: i + 1 }, i + 1)
                        )
                    )
                )
            )
        ),
        // Комментарий
        React.createElement('div', { className: 'textarea-group' },
            React.createElement('div', { className: 'textarea-row' },
                React.createElement('div', null, 'Комментарий'),
                React.createElement('textarea', {
                    className: 'data-input input-field',
                    value: scores.comment || '',
                    onChange: (e) => handleCommentChange(e.target.value),
                    rows: 3,
                    placeholder: 'Введите комментарий...'
                })
            )
        ),
        // Чекбоксы спецпризов
        React.createElement('div', { className: 'checkbox-group' },
            ...CHECKBOX_LABELS.map((label, index) => 
                React.createElement('div', { key: index, className: 'checkbox-row' },
                    React.createElement('input', {
                        type: 'checkbox',
                        id: `checkbox-${participant.id}-${index}`,
                        checked: checkboxes[index] || false,
                        onChange: (e) => handleCheckboxChange(index, e.target.checked)
                    }),
                    React.createElement('label', { htmlFor: `checkbox-${participant.id}-${index}` }, label)
                )
            )
        )
    );
};

// Компонент карточки участника
const ParticipantCard = ({ participant, onScoreChange, onCommentChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const handleImageClick = (e) => {
        e.stopPropagation(); // Предотвращаем открытие/закрытие карточки
        setIsImageModalOpen(true);
        telegramApi.hapticFeedback('impact', 'light');
    };

    const handleImageModalClose = (e) => {
        if (e) {
            e.stopPropagation();
        }
        setIsImageModalOpen(false);
    };

    const handleImageModalContentClick = (e) => {
        e.stopPropagation(); // Предотвращаем закрытие при клике на изображение
    };

    // Закрытие модального окна по ESC
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.keyCode === 27 && isImageModalOpen) {
                setIsImageModalOpen(false);
            }
        };

        if (isImageModalOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden'; // Блокируем скролл
        } else {
            document.body.style.overflow = 'auto'; // Возвращаем скролл
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isImageModalOpen]);

    return React.createElement('div', { className: 'participant-card' },
        React.createElement('div', {
            className: 'participant-header',
            onClick: handleToggle
        },
            React.createElement('img', {
                src: `../card/${participant.img}`,
                alt: participant.name,
                className: 'participant-thumbnail',
                onError: (e) => {
                    e.target.src = '../card/no-image.jpg';
                },
                onClick: handleImageClick
            }),
            React.createElement('div', { className: 'participant-info' },
                React.createElement('div', { className: 'participant-name' }, participant.name),
                React.createElement('div', { className: 'participant-id' }, `Номер: ${participant.id}`)
            )
        ),
        isExpanded && React.createElement('div', { className: 'input-container' },
            React.createElement(EvaluationForm, {
                participant,
                onScoreChange,
                onCommentChange
            })
        ),
        
        // Модальное окно для увеличенного изображения
        isImageModalOpen && React.createElement('div', {
            className: 'image-modal show',
            onClick: handleImageModalClose
        },
            React.createElement('div', {
                className: 'image-modal-content',
                onClick: handleImageModalContentClick
            },
                React.createElement('span', {
                    className: 'image-modal-close',
                    onClick: handleImageModalClose,
                    title: 'Закрыть (Esc)'
                }, '×'),
                React.createElement('img', {
                    src: `../card/${participant.img}`,
                    alt: participant.name,
                    className: 'image-modal-img',
                    onError: (e) => {
                        e.target.src = '../card/no-image.jpg';
                    }
                })
            )
        )
    );
};

// Компонент секции аккордеона
const AccordionSection = ({ 
    title, 
    participants, 
    onScoreChange, 
    onCommentChange,
    isActive,
    onToggle 
}) => {
    return React.createElement('div', { className: 'accordion-section' },
        React.createElement('button', {
            className: `accordion ${isActive ? 'active' : ''}`,
            onClick: onToggle
        }, title),
        isActive && React.createElement('div', { className: 'panel active' },
            participants.length > 0 ? 
                participants.map((participant) => 
                    React.createElement(ParticipantCard, {
                        key: `${participant.id}-${participant.row}`,
                        participant,
                        onScoreChange,
                        onCommentChange
                    })
                ) :
                React.createElement('div', { className: 'no-participants' },
                    React.createElement('p', null, 'Нет участников в этой секции')
                )
        )
    );
};

// Компонент страницы участников
const ParticipantsPage = ({ section = 'One' }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadParticipants();
    }, [section]);

    const loadParticipants = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await googleSheetsApi.fetchDataWithCache(
                SHEET_CONFIG.mainSheet,
                'A1:N700',
                120000
            );

            if (data && data.values) {
                const extractedParticipants = data.values.slice(1)
                    .filter(row => row && row[1] && row[1].toString().trim() !== '')
                    .map((row, index) => ({
                        id: row[0],
                        name: row[1],
                        img: `${row[0]}.jpg`,
                        row: index + 2
                    }));
                setParticipants(extractedParticipants);
            }
        } catch (err) {
            setError(err);
            console.error('Ошибка загрузки участников:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterParticipantsByRange = (participants, range) => {
        return participants.filter(participant => {
            const rowId = participant.row;
            return rowId >= range[0] && rowId <= range[1];
        });
    };

    const handleScoreChange = (participantId, field, value) => {
        console.log(`Оценка изменена: ${participantId}, ${field} = ${value}`);
    };

    const handleCommentChange = (participantId, comment) => {
        console.log(`Комментарий изменен: ${participantId}, ${comment}`);
    };

    if (loading) {
        return React.createElement(LoadingIndicator, { message: 'Загрузка участников...' });
    }

    if (error) {
        return React.createElement('div', { className: 'error-message' },
            React.createElement('p', null, `Ошибка загрузки участников: ${error.message}`),
            React.createElement('button', { onClick: loadParticipants }, 'Попробовать снова')
        );
    }

    const getRangeForSection = (section) => {
        switch (section) {
            case 'One': return SECTION_RANGES.section1;
            case 'Two': return SECTION_RANGES.section2;
            case 'Three': return SECTION_RANGES.section3;
            default: return [1, 1000];
        }
    };

    const range = getRangeForSection(section);
    const sectionParticipants = filterParticipantsByRange(participants, range);

    // Убираем аккордеон и показываем карточки напрямую
    return React.createElement('div', { className: 'participants-page' },
        React.createElement('div', { id: `section${section === 'One' ? '1' : section === 'Two' ? '2' : '3'}` },
            sectionParticipants.length > 0 ? 
                sectionParticipants.map((participant) => 
                    React.createElement(ParticipantCard, {
                        key: `${participant.id}-${participant.row}`,
                        participant,
                        onScoreChange: handleScoreChange,
                        onCommentChange: handleCommentChange
                    })
                ) :
                React.createElement('div', { className: 'no-participants' },
                    React.createElement('p', null, 'Нет участников в этой секции')
                )
        )
    );
};

// Компонент страницы всех участников с редактированием оценок
const AllParticipantsPage = () => {
    const [allParticipants, setAllParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageParticipant, setSelectedImageParticipant] = useState(null);
    
    // Состояния для формы редактирования
    const [editingScores, setEditingScores] = useState({
        costum: '',
        shozhest: '',
        vistup: '',
        aks: '',
        comment: ''
    });
    const [editingCheckboxes, setEditingCheckboxes] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadAllParticipants();
    }, []);

    const loadAllParticipants = async () => {
        try {
            setLoading(true);
            setError(null);

            let allParticipantsData = [];

            for (const { sheet, range } of ALL_PARTICIPANTS_SHEETS) {
                try {
                    const data = await googleSheetsApi.fetchDataWithCache(sheet, range, 420000);

                    if (data && data.values) {
                        const participants = data.values.slice(1)
                            .filter(row => row && row[1] && row[1].toString().trim() !== '')
                            .map((row, idx) => ({
                                id: row[0],
                                name: row[1],
                                img: `${row[0]}.jpg`,
                                row: idx + 2,
                                sheet,
                                dataRow: idx + 2,
                                raw: row,
                                // Добавляем текущие оценки из данных
                                scores: {
                                    costum: row[2] || '',
                                    shozhest: row[3] || '',
                                    vistup: row[4] || '',
                                    aks: row[5] || '',
                                    comment: row[6] || ''
                                },
                                checkboxes: CHECKBOX_COLUMNS.reduce((acc, column, index) => {
                                    const colIndex = column.charCodeAt(0) - 'A'.charCodeAt(0);
                                    acc[index] = row[colIndex] ? row[colIndex].toString().trim() !== '' : false;
                                    return acc;
                                }, {})
                            }));

                        allParticipantsData = allParticipantsData.concat(participants);
                    }
                } catch (err) {
                    console.warn(`Ошибка загрузки ${sheet}:`, err);
                }
            }

            setAllParticipants(allParticipantsData);
            console.log(`Загружено ${allParticipantsData.length} участников`);
        } catch (err) {
            setError(err);
            console.error('Ошибка загрузки всех участников:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleParticipantClick = (participant) => {
        setSelectedParticipant(participant);
        // Загружаем текущие значения оценок
        setEditingScores(participant.scores);
        setEditingCheckboxes(participant.checkboxes);
        setIsModalOpen(true);
    };

    const handleImageClick = (participant, e) => {
        if (e) e.stopPropagation();
        setSelectedImageParticipant(participant);
        setIsImageModalOpen(true);
        telegramApi.hapticFeedback('impact', 'light');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedParticipant(null);
        setIsSaving(false);
    };

    const handleImageModalClose = (e) => {
        if (e) e.stopPropagation();
        setIsImageModalOpen(false);
        setSelectedImageParticipant(null);
    };

    const handleImageModalContentClick = (e) => {
        e.stopPropagation();
    };

    // Обработчики для формы редактирования
    const handleScoreChange = (field, value) => {
        setEditingScores(prev => ({ ...prev, [field]: value }));
    };

    const handleCommentChange = (value) => {
        setEditingScores(prev => ({ ...prev, comment: value }));
    };

    const handleCheckboxChange = (index, checked) => {
        setEditingCheckboxes(prev => ({ ...prev, [index]: checked }));
    };

    // Функция сохранения оценок
    const handleSaveScores = async () => {
        if (!selectedParticipant) return;

        setIsSaving(true);
        try {
            const savePromises = [];

            // Сохраняем оценки
            PARTICIPANT_PARAMETERS.forEach(param => {
                const value = editingScores[param.field] || '';
                savePromises.push(
                    googleSheetsApi.saveData(value, param.column, selectedParticipant.dataRow, selectedParticipant.sheet)
                );
            });

            // Сохраняем комментарий
            savePromises.push(
                googleSheetsApi.saveData(editingScores.comment || '', 'G', selectedParticipant.dataRow, selectedParticipant.sheet)
            );

            // Сохраняем чекбоксы
            CHECKBOX_COLUMNS.forEach((column, index) => {
                const value = editingCheckboxes[index] ? 'Номинант' : '';
                savePromises.push(
                    googleSheetsApi.saveData(value, column, selectedParticipant.dataRow, selectedParticipant.sheet)
                );
            });

            await Promise.all(savePromises);
            
            telegramApi.showAlert('Оценки успешно сохранены!');
            telegramApi.hapticFeedback('impact', 'medium');
            
            // Обновляем данные участников
            await loadAllParticipants();
            
        } catch (error) {
            console.error('Ошибка сохранения оценок:', error);
            telegramApi.showAlert('Ошибка сохранения оценок');
        } finally {
            setIsSaving(false);
        }
    };

    // Эффект для обработки ESC
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.keyCode === 27) {
                if (isImageModalOpen) {
                    setIsImageModalOpen(false);
                    setSelectedImageParticipant(null);
                }
                if (isModalOpen) {
                    handleModalClose();
                }
            }
        };

        if (isImageModalOpen || isModalOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isImageModalOpen, isModalOpen]);

    if (loading) {
        return React.createElement(LoadingIndicator, { message: 'Загрузка всех участников...' });
    }

    if (error) {
        return React.createElement('div', { className: 'error-message' },
            React.createElement('p', null, `Ошибка загрузки участников: ${error.message}`),
            React.createElement('button', { onClick: loadAllParticipants }, 'Попробовать снова')
        );
    }

    if (allParticipants.length === 0) {
        return React.createElement('div', { className: 'no-data' },
            React.createElement('p', null, 'Нет участников для отображения')
        );
    }

    // Группируем участников по листу
    const groupedParticipants = {};
    allParticipants.forEach(p => {
        if (!groupedParticipants[p.sheet]) groupedParticipants[p.sheet] = [];
        groupedParticipants[p.sheet].push(p);
    });

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
                        
                        return group.map(participant => 
                            React.createElement('tr', {
                                key: `${participant.sheet}-${participant.row}`,
                                className: 'participant-row',
                                onClick: () => handleParticipantClick(participant),
                                style: { cursor: 'pointer' }
                            },
                                React.createElement('td', null,
                                    React.createElement('img', {
                                        src: `../card/${participant.img}`,
                                        alt: participant.name,
                                        className: 'participant-preview-img-small',
                                        onError: (e) => {
                                            e.target.src = '../card/no-image.jpg';
                                        },
                                        onClick: (e) => handleImageClick(participant, e)
                                    })
                                ),
                                React.createElement('td', null, participant.name || ''),
                                React.createElement('td', null, participant.id || ''),
                                React.createElement('td', null, dayLabel),
                                React.createElement('td', { 
                                    style: { 
                                        fontSize: '12px', 
                                        color: '#666',
                                        textAlign: 'center'
                                    } 
                                }, 
                                    `К:${participant.scores.costum || '-'} ` +
                                    `С:${participant.scores.shozhest || '-'} ` +
                                    `В:${participant.scores.vistup || '-'} ` +
                                    `А:${participant.scores.aks || '-'}`
                                )
                            )
                        );
                    })
                )
            )
        ),
        
        // Модальное окно редактирования участника - ИСПРАВЛЕННАЯ ЧАСТЬ
        isModalOpen && selectedParticipant && React.createElement('div', {
            className: 'participant-modal show',
            onClick: handleModalClose
        },
            React.createElement('div', {
                className: 'participant-modal-content',
                onClick: (e) => e.stopPropagation(),
                style: { maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }
            },
                React.createElement('span', {
                    className: 'participant-modal-close',
                    onClick: handleModalClose,
                    title: 'Закрыть (Esc)'
                }, '×'),
                
                // Заголовок с информацией об участнике
                React.createElement('div', { className: 'participant-modal-header' },
                    React.createElement('img', {
                        src: `../card/${selectedParticipant.img}`,
                        alt: selectedParticipant.name,
                        className: 'participant-modal-img',
                        onError: (e) => {
                            e.target.src = '../card/no-image.jpg';
                        },
                        onClick: () => {
                            setSelectedImageParticipant(selectedParticipant);
                            setIsImageModalOpen(true);
                        },
                        style: { cursor: 'pointer' }
                    }),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'participant-modal-name' }, selectedParticipant.name),
                        React.createElement('div', { className: 'participant-modal-id' }, `Номер: ${selectedParticipant.id}`),
                        React.createElement('div', { className: 'participant-modal-sheet' }, `День: ${selectedParticipant.sheet}`)
                    )
                ),

                // Форма редактирования оценок
                React.createElement('div', { className: 'participant-modal-marks' },
                    React.createElement('h3', { style: { margin: '0 0 20px 0', color: '#333' } }, 'Редактирование оценок'),
                    
                    // Оценки
                    React.createElement('div', { className: 'select-group', style: { marginBottom: '20px' } },
                        ...PARTICIPANT_PARAMETERS.map(param => 
                            React.createElement('div', { key: param.field, className: 'select-row' },
                                React.createElement('div', null, param.label),
                                React.createElement('select', {
                                    className: 'data-input input-field',
                                    value: editingScores[param.field] || '',
                                    onChange: (e) => handleScoreChange(param.field, e.target.value)
                                },
                                    React.createElement('option', { value: '' }, '-'),
                                    ...Array.from({ length: param.options }, (_, i) => 
                                        React.createElement('option', { key: i + 1, value: i + 1 }, i + 1)
                                    )
                                )
                            )
                        )
                    ),

                    // Комментарий
                    React.createElement('div', { className: 'textarea-group' },
                        React.createElement('div', { className: 'textarea-row' },
                            React.createElement('div', null, 'Комментарий'),
                            React.createElement('textarea', {
                                className: 'data-input input-field',
                                value: editingScores.comment || '',
                                onChange: (e) => handleCommentChange(e.target.value),
                                rows: 3,
                                placeholder: 'Введите комментарий...',
                                style: { width: '100%' }
                            })
                        )
                    ),

                    // Чекбоксы спецпризов
                    React.createElement('div', { className: 'checkbox-group', style: { marginTop: '20px' } },
                        CHECKBOX_LABELS.map((label, index) => 
                            React.createElement('div', { key: index, className: 'checkbox-row' },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    id: `modal-checkbox-${selectedParticipant.id}-${index}`,
                                    checked: editingCheckboxes[index] || false,
                                    onChange: (e) => handleCheckboxChange(index, e.target.checked)
                                }),
                                React.createElement('label', { 
                                    htmlFor: `modal-checkbox-${selectedParticipant.id}-${index}`,
                                    style: { fontSize: '14px' }
                                }, label)
                            )
                        )
                    ),

                    // Кнопка сохранения
                    React.createElement('div', { style: { textAlign: 'center', marginTop: '25px', padding: '0 30px' } },
                        React.createElement('button', {
                            onClick: handleSaveScores,
                            disabled: isSaving,
                            style: {
                                padding: '12px 30px',
                                backgroundColor: isSaving ? '#ccc' : '#df3031',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                width: '100%',
                                maxWidth: '200px'
                            }
                        }, isSaving ? 'Сохранение...' : 'Сохранить оценки')
                    )
                )
            )
        ),

        // Модальное окно для увеличенного изображения
        isImageModalOpen && selectedImageParticipant && React.createElement('div', {
            className: 'image-modal show',
            onClick: handleImageModalClose
        },
            React.createElement('div', {
                className: 'image-modal-content',
                onClick: handleImageModalContentClick
            },
                React.createElement('span', {
                    className: 'image-modal-close',
                    onClick: handleImageModalClose,
                    title: 'Закрыть (Esc)'
                }, '×'),
                React.createElement('img', {
                    src: `../card/${selectedImageParticipant.img}`,
                    alt: selectedImageParticipant.name,
                    className: 'image-modal-img',
                    onError: (e) => {
                        e.target.src = '../card/no-image.jpg';
                    }
                })
            )
        )
    );
};

// Компонент таблицы расписания
const ScheduleTable = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            setError(null);
            const scheduleData = await googleSheetsApi.fetchSchedule();
            setData(scheduleData);
        } catch (err) {
            setError(err);
            console.error('Ошибка загрузки расписания:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return React.createElement(LoadingIndicator, { message: 'Загрузка расписания...' });
    }

    if (error) {
        return React.createElement('div', { className: 'error-message' },
            React.createElement('p', null, `Ошибка загрузки расписания: ${error.message}`),
            React.createElement('button', { onClick: loadSchedule }, 'Попробовать снова')
        );
    }

    if (!data || !data.values) {
        return React.createElement('div', { className: 'no-data' },
            React.createElement('p', null, 'Нет данных для отображения')
        );
    }

    return React.createElement('div', { className: 'schedule-container' },
        React.createElement('table', { id: 'schedule', className: 'table_blur' },
            React.createElement('thead', null,
                React.createElement('tr', null,
                    ...data.values[0]?.map((header, index) => 
                        React.createElement('th', { key: index }, header)
                    )
                )
            ),
            React.createElement('tbody', null,
                ...data.values.slice(1).map((row, rowIndex) => {
                    let rowClass = '';
                    
                    if (row.some(cell => cell && cell.toLowerCase().includes('смотр'))) {
                        rowClass = 'smort';
                    } else if (row.some(cell => cell && cell.toLowerCase().includes('блок'))) {
                        rowClass = 'block';
                    } else if (row.some(cell => cell && cell.includes(':'))) {
                        rowClass = 'B';
                    }

                    return React.createElement('tr', { key: rowIndex, className: rowClass },
                        ...row.map((cell, colIndex) => {
                            if (colIndex === 0) {
                                return React.createElement('td', { key: colIndex },
                                    React.createElement('a', {
                                        href: `../card/${cell}.jpg`,
                                        target: '_blank',
                                        rel: 'noopener noreferrer'
                                    }, cell)
                                );
                            }
                            return React.createElement('td', { key: colIndex }, cell);
                        })
                    );
                })
            )
        )
    );
};

// Компонент страницы расписания
const SchedulePage = () => {
    return React.createElement('div', { className: 'schedule-page' },
        React.createElement(ScheduleTable)
    );
};

// Компонент аккордеона результатов
const ResultsAccordion = () => {
    const [resultsData, setResultsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeAccordion, setActiveAccordion] = useState(null);

    useEffect(() => {
        loadResultsData();
    }, []);

    const loadResultsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const dataParts = await Promise.all(
                RESULT_RANGES.map(range => 
                    googleSheetsApi.fetchDataWithCache(SHEET_CONFIG.resultSheet, range, 420000)
                        .catch(err => {
                            console.error(`Ошибка при загрузке данных для диапазона ${range}:`, err);
                            return null;
                        })
                )
            );

            setResultsData(dataParts);
        } catch (error) {
            setError(error);
            console.error('Ошибка при загрузке данных результатов:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTableCell = (cellContent, isLink = false) => {
        if (isLink) {
            return React.createElement('td', null,
                React.createElement('a', {
                    href: `../card/${cellContent}.jpg`,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }, cellContent)
            );
        }
        return React.createElement('td', null, cellContent);
    };

    const createTableFromData = (data) => {
        if (!data || !data.values || data.values.length === 0) {
            return React.createElement('div', { className: 'no-data' }, 'Нет данных для отображения');
        }

        return React.createElement('table', { className: 'data-table' },
            React.createElement('thead', null,
                React.createElement('tr', null,
                    ...data.values[0]?.map((header, index) => 
                        React.createElement('th', { key: index }, header)
                    )
                )
            ),
            React.createElement('tbody', null,
                ...data.values.slice(1).map((row, rowIndex) => 
                    React.createElement('tr', { key: rowIndex },
                        ...row.map((cellContent, colIndex) => 
                            createTableCell(cellContent, colIndex === 0)
                        )
                    )
                )
            )
        );
    };

    const handleAccordionToggle = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    if (loading) {
        return React.createElement(LoadingIndicator, { message: 'Загрузка результатов...' });
    }

    if (error) {
        return React.createElement('div', { className: 'error-message' },
            React.createElement('p', null, `Ошибка загрузки результатов: ${error.message}`),
            React.createElement('button', { onClick: loadResultsData }, 'Попробовать снова')
        );
    }

    return React.createElement('div', { id: 'accordion-container' },
        ...RESULT_SECTIONS.map((sectionName, index) => 
            React.createElement('div', { key: index, className: 'accordion-section' },
                React.createElement('button', {
                    className: `accordion ${activeAccordion === index ? 'active' : ''}`,
                    onClick: () => handleAccordionToggle(index)
                }, sectionName),
                activeAccordion === index && React.createElement('div', { className: 'panel active' },
                    resultsData[index] && createTableFromData(resultsData[index])
                )
            )
        )
    );
};

// Компонент страницы результатов
const ResultsPage = () => {
    return React.createElement('div', { className: 'results-page' },
        React.createElement(ResultsAccordion)
    );
};

// Главный компонент приложения
const App = () => {
    const [activeTab, setActiveTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [preloadComplete, setPreloadComplete] = useState(false);
    const [telegramReady, setTelegramReady] = useState(false);

    // Инициализация Telegram
    useEffect(() => {
        const initTelegram = () => {
            if (telegramApi.init()) {
                setTelegramReady(true);
            } else {
                // Fallback для разработки
                setTelegramReady(true);
                console.log('Telegram WebApp API недоступен, используется fallback режим');
            }
        };

        if (window.Telegram && window.Telegram.WebApp) {
            initTelegram();
        } else {
            const checkTelegram = setInterval(() => {
                if (window.Telegram && window.Telegram.WebApp) {
                    clearInterval(checkTelegram);
                    initTelegram();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkTelegram);
                initTelegram();
            }, 3000);
        }
    }, []);

    // Предзагрузка данных
    useEffect(() => {
        const preloadData = async () => {
            try {
                setIsLoading(true);
                await googleSheetsApi.preloadAllData();
                setPreloadComplete(true);
            } catch (error) {
                console.error('Ошибка предзагрузки данных:', error);
                telegramApi.showAlert('Ошибка загрузки данных. Проверьте подключение к интернету.');
            } finally {
                setIsLoading(false);
            }
        };

        if (telegramReady) {
            preloadData();
        }
    }, [telegramReady]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        telegramApi.hapticFeedback('selection');
    };

    const handleSendCache = async () => {
        try {
            telegramApi.hapticFeedback('impact', 'medium');
            telegramApi.showAlert('Данные отправлены!');
        } catch (error) {
            console.error('Ошибка отправки данных:', error);
            telegramApi.showAlert('Ошибка отправки данных');
        }
    };

    const renderContent = () => {
        if (isLoading || !preloadComplete) {
            return React.createElement(LoadingIndicator, { message: 'Загрузка данных...' });
        }

		if (!activeTab) {
            return React.createElement('div', { 
                className: 'no-data',
                style: { 
                    padding: '100px 20px', 
                    textAlign: 'center', 
                    color: '#6c757d' 
                } 
            }, 'Выберите раздел для начала работы');
        }
		
        switch (activeTab) {
            case 'One':
            case 'Two':
            case 'Three':
                return React.createElement(ParticipantsPage, { section: activeTab, key: activeTab });
            case 'all':
                return React.createElement(AllParticipantsPage);
            case 'table':
                return React.createElement(SchedulePage);
            case 'red':
                return React.createElement(ResultsPage);
            default:
                return React.createElement(ParticipantsPage, { section: 'One' });
        }
    };

    return React.createElement('div', { className: 'main' },
        React.createElement(Header, {
            activeTab,
            onTabChange: handleTabChange,
            onSendCache: handleSendCache
        }),
        React.createElement('div', { className: 'content' },
            React.createElement('div', { className: `tabcontent ${activeTab === activeTab ? 'active' : ''}` },
                renderContent()
            )
        )
    );
};

// Рендеринг приложения
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
