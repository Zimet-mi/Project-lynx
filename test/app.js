// Основное React приложение Valerie

const saveImmediately = async (value, column, row, sheetName) => {
    try {
        await googleSheetsApi.saveData(value, column, row, sheetName);
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        telegramApi.showAlert('Ошибка сохранения данных');
    }
};

const { useState, useEffect, useCallback } = React;

// Компонент загрузки
const LoadingIndicator = ({ message = 'Загрузка данных...' }) => {
    return React.createElement('div', { className: 'preload-indicator' },
        React.createElement('div', { className: 'preload-indicator-text' }, message),
        React.createElement('div', { className: 'preload-loader' })
    );
};

//Оффлайн режим
async fetchDataWithCache(sheetName, range, cacheExpiry = CACHE_CONFIG.generalExpiry) {
    const cacheKey = `data_${sheetName}_${range}`;
    const timeKey = `time_${sheetName}_${range}`;
    
    // Всегда сначала пробуем кеш
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(timeKey);
    
    if (cachedData && cachedTime) {
        const currentTime = Date.now();
        const timeDiff = currentTime - parseInt(cachedTime);
        
        // Если данные свежие - возвращаем
        if (timeDiff < cacheExpiry) {
            return JSON.parse(cachedData);
        }
        
        // Если данные устарели, но интернета нет - все равно возвращаем
        if (!navigator.onLine) {
            console.warn('Оффлайн режим: использую устаревшие данные');
            return JSON.parse(cachedData);
        }
    }
    
    // Пытаемся обновить данные (только если есть интернет)
    try {
        if (!navigator.onLine && cachedData) {
            throw new Error('OFFLINE_MODE'); // Специальная ошибка для оффлайн
        }
        
        const sheetId = await this.getSheetId();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${API_KEY}`;
        const response = await axios.get(url);
        
        const data = response.data;
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(timeKey, Date.now().toString());
        
        return data;
    } catch (error) {
        // Если оффлайн и есть кеш - возвращаем кеш
        if ((!navigator.onLine || error.message === 'OFFLINE_MODE') && cachedData) {
            return JSON.parse(cachedData);
        }
        
        // Если кеша нет вообще - бросаем ошибку
        if (!cachedData) {
            throw new Error('Нет данных в кеше и отсутствует интернет');
        }
        
        throw error;
    }
}

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

// Общий компонент для полей оценки
const EvaluationFields = ({ 
    scores, 
    checkboxes, 
    onScoreChange, 
    onCheckboxChange, 
    onCommentChange,
    participantId = '',
    compact = false
}) => {
    return React.createElement('div', { className: `evaluation-form ${compact ? 'compact' : ''}` },
        // Оценки
        React.createElement('div', { className: 'select-group' },
            ...PARTICIPANT_PARAMETERS.map(param => 
                React.createElement('div', { key: param.column, className: 'select-row' },
                    React.createElement('div', null, param.label),
                    React.createElement('select', {
                        className: 'data-input input-field',
                        value: scores[param.column] || '',
                        onChange: (e) => onScoreChange(param.column, e.target.value)
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
                    value: scores.comment || '',
                    onChange: (e) => onCommentChange(e.target.value),
                    rows: 3,
                    placeholder: 'Введите комментарий...'
                })
            )
        ),

        // Чекбоксы спецпризов
		React.createElement('div', { className: 'checkbox-group' },
			...getActiveSpecialPrizes().map((prize, index) => 
				React.createElement('div', { key: prize.column, className: 'checkbox-row' },
					React.createElement('label', { 
						htmlFor: `checkbox-${participantId}-${prize.column}`
					}, prize.label),
					React.createElement('input', {
						type: 'checkbox',
						id: `checkbox-${participantId}-${prize.column}`,
						checked: checkboxes[index] || false,
						onChange: (e) => onCheckboxChange(index, e.target.checked)
					})
				)
			)
		)
    );
};

// Компонент формы оценки
const EvaluationForm = ({ participant, onScoreChange, onCommentChange }) => {
    const [scores, setScores] = useState({
        C: '', // Костюм
        D: '', // Схожесть  
        E: '', // Выход
        F: '', // Аксессуар
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
                        C: row[2] || '',
                        D: row[3] || '',
                        E: row[4] || '',
                        F: row[5] || '',
                        comment: row[6] || ''
                    });
                    
                    const checkboxValues = {};
                    const activePrizes = getActiveSpecialPrizes();
                    activePrizes.forEach((prize, index) => {
                        const colIndex = prize.column.charCodeAt(0) - 'A'.charCodeAt(0);
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

    // Обработчики с вибрацией
    const handleScoreChange = async (column, value) => {
        setScores(prev => ({ ...prev, [column]: value }));
        telegramApi.hapticFeedback('selection');
        await saveImmediately(value, column, participant.row, SHEET_CONFIG.mainSheet);
        onScoreChange?.(participant.id, column, value);
    };

    const handleCommentChange = async (value) => {
        setScores(prev => ({ ...prev, comment: value }));
        await saveImmediately(value, 'G', participant.row, SHEET_CONFIG.mainSheet);
        onCommentChange?.(participant.id, value);
    };

    const handleCheckboxChange = async (index, checked) => {
        setCheckboxes(prev => ({ ...prev, [index]: checked }));
        telegramApi.hapticFeedback('selection');
        const activePrizes = getActiveSpecialPrizes();
        const prize = activePrizes[index];
        if (prize) {
            const value = checked ? prize.value : '';
            await saveImmediately(value, prize.column, participant.row, SHEET_CONFIG.mainSheet);
        }
    };

    return React.createElement(EvaluationFields, {
        scores,
        checkboxes,
        onScoreChange: handleScoreChange,
        onCheckboxChange: handleCheckboxChange,
        onCommentChange: handleCommentChange,
        participantId: participant.id
    });
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
        telegramApi.hapticFeedback('impact', 'soft');
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
                'A1:N200', // Уменьшили диапазон для оптимизации
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
        C: '', // Костюм
        D: '', // Схожесть  
        E: '', // Выход
        F: '', // Аксессуар
        comment: ''
    });
    const [editingCheckboxes, setEditingCheckboxes] = useState({});

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
                                    C: row[2] || '', // Костюм
                                    D: row[3] || '', // Схожесть
                                    E: row[4] || '', // Выход
                                    F: row[5] || '', // Аксессуар
                                    comment: row[6] || ''
                                },
                                checkboxes: getActiveSpecialPrizes().reduce((acc, prize, index) => {
                                    const colIndex = prize.column.charCodeAt(0) - 'A'.charCodeAt(0);
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
        telegramApi.hapticFeedback('impact', 'soft');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedParticipant(null);
    };

    const handleImageModalClose = (e) => {
        if (e) e.stopPropagation();
        setIsImageModalOpen(false);
        setSelectedImageParticipant(null);
    };

    const handleImageModalContentClick = (e) => {
        e.stopPropagation();
    };

    // Обработчики для формы редактирования с немедленным сохранением
    const handleScoreChange = async (column, value) => {
        if (!selectedParticipant) return;
        
        setEditingScores(prev => ({ ...prev, [column]: value }));
        telegramApi.hapticFeedback('selection');
        await saveImmediately(value, column, selectedParticipant.dataRow, selectedParticipant.sheet);
    };

    const handleCommentChange = async (value) => {
        if (!selectedParticipant) return;
        
        setEditingScores(prev => ({ ...prev, comment: value }));
        await saveImmediately(value, 'G', selectedParticipant.dataRow, selectedParticipant.sheet);
    };

    const handleCheckboxChange = async (index, checked) => {
        if (!selectedParticipant) return;
        
        setEditingCheckboxes(prev => ({ ...prev, [index]: checked }));
        const activePrizes = getActiveSpecialPrizes();
        const prize = activePrizes[index];
        if (prize) {
            const value = checked ? prize.value : '';
            await saveImmediately(value, prize.column, selectedParticipant.dataRow, selectedParticipant.sheet);
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
									className: 'participant-total-score'
								}, 
									(() => {
										// Вычисляем сумму оценок
										const scores = participant.scores;
										const sum = [scores.C, scores.D, scores.E, scores.F]
											.reduce((total, score) => total + (parseInt(score) || 0), 0);
										return sum > 0 ? sum : '-';
									})()
								)
                            )
                        );
                    })
                )
            )
        ),
        
        // Модальное окно редактирования участника - УПРОЩЕННАЯ ВЕРСИЯ БЕЗ КНОПКИ
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
					
					React.createElement(EvaluationFields, {
						scores: editingScores,
						checkboxes: editingCheckboxes,
						onScoreChange: handleScoreChange,
						onCheckboxChange: handleCheckboxChange,
						onCommentChange: handleCommentChange,
						participantId: selectedParticipant.id,
						compact: true
					})
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

    const handleImageClick = (imageId) => {
        setSelectedImage(imageId);
        setIsImageModalOpen(true);
        telegramApi.hapticFeedback('impact', 'soft');
    };

    const handleImageModalClose = (e) => {
        if (e) e.stopPropagation();
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    const handleImageModalContentClick = (e) => {
        e.stopPropagation();
    };

    // Эффект для обработки ESC
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.keyCode === 27 && isImageModalOpen) {
                handleImageModalClose();
            }
        };

        if (isImageModalOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isImageModalOpen]);

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
                            if (colIndex === 0 && cell) {
                                return React.createElement('td', { key: colIndex },
                                    React.createElement('span', {
                                        className: 'participant-id-link',
                                        onClick: () => handleImageClick(cell),
                                        style: {
                                            cursor: 'pointer'
                                            // Убраны цвет и подчёркивание
                                        }
                                    }, cell)
                                );
                            }
                            return React.createElement('td', { key: colIndex }, cell);
                        })
                    );
                })
            )
        ),

        // Модальное окно для увеличенного изображения
        isImageModalOpen && selectedImage && React.createElement('div', {
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
                    src: `../card/${selectedImage}.jpg`,
                    alt: `Участник ${selectedImage}`,
                    className: 'image-modal-img',
                    onError: (e) => {
                        e.target.src = '../card/no-image.jpg';
                    }
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

    const handleImageClick = (imageId) => {
        setSelectedImage(imageId);
        setIsImageModalOpen(true);
        telegramApi.hapticFeedback('impact', 'soft');
    };

    const handleImageModalClose = (e) => {
        if (e) e.stopPropagation();
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    const handleImageModalContentClick = (e) => {
        e.stopPropagation();
    };

    const createTableCell = (cellContent, isLink = false, rowIndex = 0) => {
        if (isLink && cellContent) {
            return React.createElement('td', null,
                React.createElement('span', {
                    className: 'participant-id-link',
                    onClick: () => handleImageClick(cellContent),
                    style: {
                        cursor: 'pointer'
                        // Убраны цвет и подчёркивание
                    }
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
                            createTableCell(cellContent, colIndex === 0, rowIndex)
                        )
                    )
                )
            )
        );
    };

    const handleAccordionToggle = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    // Эффект для обработки ESC
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.keyCode === 27 && isImageModalOpen) {
                handleImageModalClose();
            }
        };

        if (isImageModalOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isImageModalOpen]);

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
        ),

        // Модальное окно для увеличенного изображения
        isImageModalOpen && selectedImage && React.createElement('div', {
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
                    src: `../card/${selectedImage}.jpg`,
                    alt: `Участник ${selectedImage}`,
                    className: 'image-modal-img',
                    onError: (e) => {
                        e.target.src = '../card/no-image.jpg';
                    }
                })
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
	const [isOnline, setIsOnline] = useState(navigator.onLine);	
	
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

	// Оффлайн режим
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
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
		
		!isOnline && React.createElement('div', { 
        className: 'offline-indicator' 
		}, 'Оффлайн режим. Данные могут быть устаревшими.'),
		
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
