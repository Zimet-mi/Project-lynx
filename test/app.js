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

    // Debounce функция
    const debounce = useCallback((func, wait) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }, []);

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

    // Debounced сохранение данных
    const debouncedSave = useCallback(debounce(async (value, column, row, sheetName) => {
        try {
            await googleSheetsApi.saveData(value, column, row, sheetName);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }, 300), []);

    const handleScoreChange = (field, value) => {
        const param = PARTICIPANT_PARAMETERS.find(p => p.field === field);
        if (param) {
            setScores(prev => ({ ...prev, [field]: value }));
            debouncedSave(value, param.column, participant.row, SHEET_CONFIG.mainSheet);
            onScoreChange?.(participant.id, field, value);
        }
    };

    const handleCommentChange = (value) => {
        setScores(prev => ({ ...prev, comment: value }));
        debouncedSave(value, 'G', participant.row, SHEET_CONFIG.mainSheet);
        onCommentChange?.(participant.id, value);
    };

    const handleCheckboxChange = (index, checked) => {
        setCheckboxes(prev => ({ ...prev, [index]: checked }));
        const value = checked ? 'Номинант' : '';
        const column = CHECKBOX_COLUMNS[index];
        debouncedSave(value, column, participant.row, SHEET_CONFIG.mainSheet);
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

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

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
                }
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

// Компонент страницы всех участников
const AllParticipantsPage = () => {
    const [allParticipants, setAllParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                                raw: row
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
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedParticipant(null);
    };

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
                        React.createElement('th', null, 'День')
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
                                        }
                                    })
                                ),
                                React.createElement('td', null, participant.name || ''),
                                React.createElement('td', null, participant.id || ''),
                                React.createElement('td', null, dayLabel)
                            )
                        );
                    })
                )
            )
        ),
        isModalOpen && selectedParticipant && React.createElement('div', {
            className: 'participant-modal show',
            onClick: handleModalClose
        },
            React.createElement('div', {
                className: 'participant-modal-content',
                onClick: (e) => e.stopPropagation()
            },
                React.createElement('span', {
                    className: 'participant-modal-close',
                    onClick: handleModalClose
                }, '×'),
                React.createElement('div', { className: 'participant-modal-header' },
                    React.createElement('img', {
                        src: `../card/${selectedParticipant.img}`,
                        alt: selectedParticipant.name,
                        className: 'participant-modal-img',
                        onError: (e) => {
                            e.target.src = '../card/no-image.jpg';
                        }
                    }),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'participant-modal-name' }, selectedParticipant.name),
                        React.createElement('div', { className: 'participant-modal-id' }, `Номер: ${selectedParticipant.id}`),
                        React.createElement('div', { className: 'participant-modal-sheet' }, `День: ${selectedParticipant.sheet}`)
                    )
                ),
                React.createElement('div', { className: 'participant-modal-marks' },
                    React.createElement('p', null, 'Функция редактирования в модальном окне будет добавлена в следующей версии')
                )
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
