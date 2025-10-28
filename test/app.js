// Основное React приложение

console.log('=== DIAGNOSTICS ===');
console.log('React:', typeof React);
console.log('ReactDOM:', typeof ReactDOM);
console.log('axios:', typeof axios);
console.log('imageLoader:', typeof window.imageLoader);
console.log('LazyImage:', typeof window.LazyImage);
console.log('googleSheetsApi:', typeof googleSheetsApi);
console.log('lazySaveManager:', typeof lazySaveManager);
console.log('telegramApi:', typeof telegramApi);
console.log('==================');


// Импортируем компоненты из библиотеки LazyImage
const { LazyImage, withImagePreload, LazyImageProvider } = window.LazyImage;
const OptimizedLazyImage = withImagePreload(LazyImage);

const saveImmediately = async (value, column, row, sheetName) => {
    try {
        // Используем ленивое сохранение вместо прямого вызова API
        await lazySaveManager.saveData(value, column, row, sheetName);
        console.log(`💾 Данные подготовлены к сохранению: ${sheetName} ${column}${row} = ${value}`);
    } catch (error) {
        console.error('Ошибка подготовки к сохранению:', error);
        telegramApi.showAlert('Ошибка сохранения данных');
    }
};

const handleImageError = (e) => {
    // Теперь ошибки обрабатываются внутри LazyImage, но оставляем как fallback
    console.warn('Ошибка загрузки изображения:', e.target.src);
};

const { useState, useEffect, useCallback, useRef } = React;

// Хук useDebounce для управления задержкой сохранения
const useDebounce = () => {
    const timeoutsRef = useRef({});
    const pendingSavesRef = useRef({});

    const debounce = useCallback((key, callback, delay, ...args) => {
        // Очищаем предыдущий таймаут
        if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
        }

        // Сохраняем callback для возможного принудительного выполнения
        pendingSavesRef.current[key] = { callback, args };

        // Устанавливаем новый таймаут
        timeoutsRef.current[key] = setTimeout(() => {
            callback(...args);
            delete pendingSavesRef.current[key];
            delete timeoutsRef.current[key];
        }, delay);
    }, []);

    // Принудительно выполнить все ожидающие сохранения
    const flush = useCallback(() => {
        Object.entries(timeoutsRef.current).forEach(([key, timeout]) => {
            clearTimeout(timeout);
            const pending = pendingSavesRef.current[key];
            if (pending) {
                pending.callback(...pending.args);
            }
            delete timeoutsRef.current[key];
            delete pendingSavesRef.current[key];
        });
    }, []);

    // Очистить все таймауты без выполнения
    const cancelAll = useCallback(() => {
        Object.values(timeoutsRef.current).forEach(clearTimeout);
        timeoutsRef.current = {};
        pendingSavesRef.current = {};
    }, []);

    // Очистить конкретный таймаут
    const cancel = useCallback((key) => {
        if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
            delete timeoutsRef.current[key];
            delete pendingSavesRef.current[key];
        }
    }, []);

    return { debounce, flush, cancelAll, cancel };
};

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

// Toast уведомление
const Toast = ({ message, type = 'error', isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const getToastStyle = () => {
        const baseStyle = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(0)',
            transition: 'all 0.3s ease-in-out',
            maxWidth: '300px',
            wordWrap: 'break-word'
        };

        switch (type) {
            case 'error':
                return { ...baseStyle, background: '#f44336' };
            case 'success':
                return { ...baseStyle, background: '#4caf50' };
            case 'warning':
                return { ...baseStyle, background: '#ff9800' };
            case 'info':
                return { ...baseStyle, background: '#2196f3' };
            default:
                return { ...baseStyle, background: '#666' };
        }
    };

    return React.createElement('div', {
        className: `toast toast-${type}`,
        style: getToastStyle()
    },
        React.createElement('div', { 
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
        },
            React.createElement('span', null, message),
            onClose && React.createElement('button', {
                onClick: onClose,
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    marginLeft: '12px',
                    padding: '0',
                    opacity: '0.8'
                },
                onMouseOver: (e) => e.target.style.opacity = '1',
                onMouseOut: (e) => e.target.style.opacity = '0.8'
            }, '×')
        )
    );
};

// Компонент для управления Toast уведомлениями
const NetworkToast = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showToast, setShowToast] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowToast(true);
            // Скрываем через 5 секунд после восстановления сети
            setTimeout(() => {
                setShowToast(false);
            }, 5000);
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setShowToast(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleCloseToast = () => {
        if (isOnline) {
            setShowToast(false);
        }
    };

    return React.createElement(Toast, {
        message: isOnline ? '🌐 Соединение восстановлено' : '📡 Нет подключения к интернету',
        type: isOnline ? 'success' : 'error',
        isVisible: showToast,
        onClose: isOnline ? handleCloseToast : undefined
    });
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
        ),
        React.createElement(NetworkToast)
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
                    placeholder: 'комментарий'
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

// Компонент формы оценки с debounce
const EvaluationForm = ({ participant, onScoreChange, onCommentChange, debounce }) => {
    const [scores, setScores] = useState({
        C: '', // Костюм
        D: '', // Схожесть  
        E: '', // Выход
        F: '', // Аксессуар
        comment: ''
    });
    const [checkboxes, setCheckboxes] = useState({});

    // Загрузка текущих значений из предзагруженных данных
    useEffect(() => {
        const loadCurrentValues = () => {
            try {
                const cachedData = googleSheetsApi.getCachedData(
                    SHEET_CONFIG.mainSheet,
                    RangeHelper.getParticipantsRange()
                );
                
                if (cachedData && cachedData.values) {
                    const rowIndex = participant.row - 1;
                    
                    if (rowIndex >= 0 && rowIndex < cachedData.values.length) {
                        const row = cachedData.values[rowIndex];
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
                }
            } catch (error) {
                console.warn('Ошибка загрузки значений из кеша:', error);
            }
        };

        loadCurrentValues();
    }, [participant.row]);

    if (!debounce) {
        console.error('❌ EvaluationForm: debounce функция не передана!');
        // Можно вернуть fallback или просто использовать сохранение без debounce
    }

        // Обработчики с debounce
    const handleScoreChange = (column, value) => {
        setScores(prev => ({ ...prev, [column]: value }));
        telegramApi.hapticFeedback('selection');
        
        if (debounce) {
            debounce(
                `score_${participant.id}_${column}`,
                async (val, col) => {
                    await saveImmediately(val, col, participant.row, SHEET_CONFIG.mainSheet);
                    onScoreChange?.(participant.id, col, val);
                },
                500,
                value, column
            );
        } else {
            // Fallback: сохраняем сразу
            saveImmediately(value, column, participant.row, SHEET_CONFIG.mainSheet);
            onScoreChange?.(participant.id, column, value);
        }
    };

    const handleCommentChange = (value) => {
        setScores(prev => ({ ...prev, comment: value }));
        
        if (debounce) {
            debounce(
                `comment_${participant.id}`,
                async (val) => {
                    await saveImmediately(val, 'G', participant.row, SHEET_CONFIG.mainSheet);
                    onCommentChange?.(participant.id, val);
                },
                1000,
                value
            );
        } else {
            // Fallback
            saveImmediately(value, 'G', participant.row, SHEET_CONFIG.mainSheet);
            onCommentChange?.(participant.id, value);
        }
    };

    const handleCheckboxChange = (index, checked) => {
        setCheckboxes(prev => ({ ...prev, [index]: checked }));
        telegramApi.hapticFeedback('selection');
        
        const activePrizes = getActiveSpecialPrizes();
        const prize = activePrizes[index];
        if (prize) {
            const value = checked ? prize.value : '';
            
            if (debounce) {
                debounce(
                    `checkbox_${participant.id}_${index}`,
                    async (val) => {
                        await saveImmediately(val, prize.column, participant.row, SHEET_CONFIG.mainSheet);
                    },
                    300,
                    value
                );
            } else {
                // Fallback
                saveImmediately(value, prize.column, participant.row, SHEET_CONFIG.mainSheet);
            }
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
const ParticipantCard = ({ participant, onScoreChange, onCommentChange, debounce }) => {
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
            // ЗАМЕНА: Используем новую библиотеку LazyImage
            React.createElement(LazyImage, {
                src: `../card/${participant.img}`,
                alt: participant.name,
                className: 'participant-thumbnail',
                onError: handleImageError,
                onClick: handleImageClick,
                fallback: '../card/no-image.jpg'
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
                onCommentChange,
                debounce: debounce
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
                // ЗАМЕНА: Используем OptimizedLazyImage для модальных окон (предзагрузка)
                React.createElement(OptimizedLazyImage, {
                    src: `../card/${participant.img}`,
                    alt: participant.name,
                    className: 'image-modal-img',
                    onError: handleImageError,
                    preloadPriority: 'high' // Важные изображения загружаем сразу
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
    onToggle,
    debounce
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
                        onCommentChange,
                        debounce: debounce
                    })
                ) :
                React.createElement('div', { className: 'no-participants' },
                    React.createElement('p', null, 'Нет участников в этой секции')
                )
        )
    );
};

// Компонент страницы участников
const ParticipantsPage = ({ section = 'One', debounce }) => { // ← debounce ПЕРЕДАН как prop
    const [participants, setParticipants] = useState([]);
    const observerRef = useRef(null);

    useEffect(() => {
        loadParticipants();
    }, [section]);

    const loadParticipants = () => {
        try {
            const data = googleSheetsApi.getCachedData(
                SHEET_CONFIG.mainSheet,
                RangeHelper.getParticipantsRange()
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

                // НЕМЕДЛЕННАЯ загрузка текущей секции с высоким приоритетом
                const urls = extractedParticipants.map(p => `../card/${p.img}`);
                window.imageLoader.addImages(urls, 'high');
            }
        } catch (err) {
            console.warn('Ошибка загрузки участников из кеша:', err);
            setParticipants([]);
        }
    };

    const handleScoreChange = (participantId, field, value) => {
        console.log(`Оценка изменена: ${participantId}, ${field} = ${value}`);
    };

    const handleCommentChange = (participantId, comment) => {
        console.log(`Комментарий изменен: ${participantId}, ${comment}`);
    };

    // Убрали условие loading, так как данные уже предзагружены
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
                        onCommentChange: handleCommentChange,
                        debounce: debounce // ← ПЕРЕДАЁМ debounce вниз
                    })
                ) :
                React.createElement('div', { className: 'no-participants' },
                    React.createElement('p', null, 'Нет участников в этой секции')
                )
        )
    );
};

// Компонент страницы всех участников с редактированием оценок
const AllParticipantsPage = ({ debounce }) => {
    const [allParticipants, setAllParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
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
    
    // Проверяем, что debounce функция передана
    if (!debounce) {
        console.warn('⚠️ AllParticipantsPage: debounce функция не передана, используется прямое сохранение');
    }
    
    useEffect(() => {
        loadAllParticipants();
    }, []);

    const loadAllParticipants = () => {
        let allParticipantsData = [];
        
        try {
            // Используем только предзагруженные данные из кеша
            for (const { sheet } of ALL_PARTICIPANTS_SHEETS) {
                const range = RangeHelper.getSheetRange(sheet);
                if (!range) {
                    console.warn(`Не найден диапазон для листа ${sheet}`);
                    continue;
                }
                
                const cachedData = googleSheetsApi.getCachedData(sheet, range);
                if (cachedData && cachedData.values) {
                    const participants = cachedData.values.slice(1)
                        .filter(row => row && row[1] && row[1].toString().trim() !== '')
                        .map((row, idx) => ({
                            id: row[0],
                            name: row[1],
                            img: `${row[0]}.jpg`,
                            row: idx + 2,
                            sheet,
                            dataRow: idx + 2,
                            raw: row,
                            scores: {
                                C: row[2] || '',
                                D: row[3] || '',
                                E: row[4] || '',
                                F: row[5] || '',
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
            }

            setAllParticipants(allParticipantsData);
            console.log(`Загружено ${allParticipantsData.length} участников из кеша`);
            
        } catch (error) {
            console.error('Ошибка загрузки участников из кеша:', error);
        }
    };

    const handleParticipantClick = (participant) => {
        if (!participant) {
            console.error('Participant is undefined in handleParticipantClick');
            return;
        }
        setSelectedParticipant(participant);
        // Загружаем текущие значения оценок из данных участника
        setEditingScores(participant.scores);
        setEditingCheckboxes(participant.checkboxes);
        setIsModalOpen(true);
    };

    // Исправленный обработчик клика по изображению
    const handleImageClick = (participant, e) => {
        if (e) e.stopPropagation();
        if (!participant) {
            console.error('Participant is undefined in handleImageClick');
            return;
        }
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

    // Обработчики для формы редактирования с debounce
    const handleScoreChange = (column, value) => {
        if (!selectedParticipant) return;
        
        setEditingScores(prev => ({ ...prev, [column]: value }));
        telegramApi.hapticFeedback('selection');
        
        if (debounce) {
            debounce(
                `modal_score_${selectedParticipant.id}_${column}`,
                async (val, col) => {
                    await saveImmediately(val, col, selectedParticipant.dataRow, selectedParticipant.sheet);
                },
                500, // 500ms для селектов
                value, column
            );
        } else {
            // Fallback: сохраняем сразу
            saveImmediately(value, column, selectedParticipant.dataRow, selectedParticipant.sheet);
        }
    };

    const handleCommentChange = (value) => {
        if (!selectedParticipant) return;
        
        setEditingScores(prev => ({ ...prev, comment: value }));
        
        if (debounce) {
            debounce(
                `modal_comment_${selectedParticipant.id}`,
                async (val) => {
                    await saveImmediately(val, 'G', selectedParticipant.dataRow, selectedParticipant.sheet);
                },
                1000, // 1 секунда для комментариев
                value
            );
        } else {
            // Fallback
            saveImmediately(value, 'G', selectedParticipant.dataRow, selectedParticipant.sheet);
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
                debounce(
                    `modal_checkbox_${selectedParticipant.id}_${index}`,
                    async (val) => {
                        await saveImmediately(val, prize.column, selectedParticipant.dataRow, selectedParticipant.sheet);
                    },
                    300, // 300ms для чекбоксов
                    value
                );
            } else {
                // Fallback
                saveImmediately(value, prize.column, selectedParticipant.dataRow, selectedParticipant.sheet);
            }
        }
    };

    // Эффект для обработки ESC без изменений
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

    // Убрали loading состояние, т.к. данные уже предзагружены
    if (allParticipants.length === 0) {
        return React.createElement('div', { className: 'no-data' },
            React.createElement('p', null, 'Нет участников для отображения')
        );
    }

    // Группируем участников по листу
    const groupedParticipants = {};
    allParticipants.forEach(p => {
        if (!p) return; // Защита от undefined
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
                        
                        return group.map(participant => {
                            if (!participant) return null; // Защита от undefined
                            
                            return React.createElement('tr', {
                                key: `${participant.sheet}-${participant.row}`,
                                className: 'participant-row',
                                onClick: () => handleParticipantClick(participant),
                                style: { cursor: 'pointer' }
                            },
                                React.createElement('td', null,
                                    // ЗАМЕНА: Используем LazyImage для превью
                                    React.createElement(LazyImage, {
                                        src: `../card/${participant.img}`,
                                        alt: participant.name,
                                        className: 'participant-preview-img-small',
                                        onError: handleImageError,
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
                            );
                        });
                    })
                )
            )
        ),
        
        // Модальное окно редактирования участника
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
                    // ЗАМЕНА: Используем OptimizedLazyImage для модальных окон
                    React.createElement(OptimizedLazyImage, {
                        src: `../card/${selectedParticipant.img}`,
                        alt: selectedParticipant.name,
                        className: 'participant-modal-img',
                        onError: handleImageError,
                        onClick: () => {
                            setSelectedImageParticipant(selectedParticipant);
                            setIsImageModalOpen(true);
                        },
                        preloadPriority: 'high', // Важное изображение - загружаем сразу
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
                // ЗАМЕНА: Используем OptimizedLazyImage для модальных окон
                React.createElement(OptimizedLazyImage, {
                    src: `../card/${selectedImageParticipant.img}`,
                    alt: selectedImageParticipant.name,
                    className: 'image-modal-img',
                    onError: handleImageError,
                    preloadPriority: 'high' // Важное изображение - загружаем сразу
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
            const scheduleData = await googleSheetsApi.fetchSchedule();
            setData(scheduleData);
        } catch (err) {
            console.warn('Ошибка загрузки расписания:', err);
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
                // ЗАМЕНА: Используем OptimizedLazyImage для расписания
                React.createElement(OptimizedLazyImage, {
                    src: `../card/${selectedImage}.jpg`,
                    alt: `Участник ${selectedImage}`,
                    className: 'image-modal-img',
                    onError: handleImageError,
                    preloadPriority: 'high'
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

            const dataParts = await Promise.all(
                RESULT_RANGES.map(range => 
                    googleSheetsApi.fetchDataWithCache(SHEET_CONFIG.resultSheet, range, 420000)
                        .catch(err => {
                            console.warn(`Ошибка при загрузке данных для диапазона ${range}:`, err);
                            return null;
                        })
                )
            );

            setResultsData(dataParts);
        } catch (error) {
            console.warn('Ошибка при загрузке данных результатов:', error);
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
                // ЗАМЕНА: Используем OptimizedLazyImage для результатов
                React.createElement(OptimizedLazyImage, {
                    src: `../card/${selectedImage}.jpg`,
                    alt: `Участник ${selectedImage}`,
                    className: 'image-modal-img',
                    onError: handleImageError,
                    preloadPriority: 'high'
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
    const [telegramReady, setTelegramReady] = useState(false); // ← ВОССТАНОВЛЕНО
    const [allImages, setAllImages] = useState(new Set());
    
    // Глобальный экземпляр useDebounce
    const globalDebounce = useDebounce();

    // Защита при закрытии страницы (оставляем как было)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (lazySaveManager.hasPendingSaves()) {
                e.preventDefault();
                e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
                return 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('📱 Страница скрыта, принудительно сохраняем данные...');
                lazySaveManager.flushQueue();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Инициализация Telegram (оставляем как было)
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

    // Предзагрузка данных (обновляем с учетом imageLoader)
    useEffect(() => {
        const checkCachedData = () => {
            try {
                for (const { sheet } of ALL_PARTICIPANTS_SHEETS) {
                    const range = RangeHelper.getSheetRange(sheet);
                    if (range) {
                        const cacheKey = `data_${sheet}_${range}`;
                        const cachedData = localStorage.getItem(cacheKey);
                        if (cachedData) {
                            return true;
                        }
                    }
                }
                return false;
            } catch (error) {
                return false;
            }
        };
        
        // Собираем все URLs изображений для фоновой загрузки
        const getAllImagesUrls = () => {
            const urls = new Set();
            try {
                for (const { sheet } of ALL_PARTICIPANTS_SHEETS) {
                    const range = RangeHelper.getSheetRange(sheet);
                    if (!range) continue;
                    
                    const cachedData = googleSheetsApi.getCachedData(sheet, range);
                    if (cachedData && cachedData.values) {
                        cachedData.values.slice(1).forEach(row => {
                            if (row && row[0]) {
                                urls.add(`../card/${row[0]}.jpg`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn('Ошибка сбора URLs изображений:', error);
            }
            return urls;
        };

        // Предзагрузка данных
        const preloadData = async () => {
            try {
                setIsLoading(true);
                
                if (typeof googleSheetsApi === 'undefined' || !googleSheetsApi.preloadAllData) {
                    console.error('googleSheetsApi не определен');
                    const hasCachedData = checkCachedData();
                    if (hasCachedData) {
                        console.log('🔄 Использую кешированные данные');
                        setPreloadComplete(true);
                        
                        // Инициализируем imageLoader с собранными URLs
                        const allUrls = getAllImagesUrls();
                        setAllImages(allUrls);
                        return;
                    } else {
                        throw new Error('API не инициализирован');
                    }
                }
                
                await googleSheetsApi.preloadAllData();
                
                // После загрузки данных, собираем все URLs изображений
                const allUrls = getAllImagesUrls();
                setAllImages(allUrls);
                
                setPreloadComplete(true);
            } catch (error) {
                console.error('Ошибка предзагрузки данных:', error);
                const hasCachedData = checkCachedData();
                if (hasCachedData) {
                    console.log('🔄 Использую кешированные данные после ошибки');
                    setPreloadComplete(true);
                    
                    const allUrls = getAllImagesUrls();
                    setAllImages(allUrls);
                } else {
                    telegramApi.showAlert('Ошибка загрузки данных. Проверьте подключение к интернету.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (telegramReady) {
            preloadData();
        }
    }, [telegramReady]);

    // Фоновая загрузка изображений
    useEffect(() => {
        const backgroundInterval = setInterval(() => {
            if (!allImages.size) return;
            
            const remainingUrls = Array.from(allImages).filter(url => 
                !window.imageLoader.loaded.has(url) && 
                !window.imageLoader.inProgress.has(url)
            );
            
            if (remainingUrls.length > 0 && window.imageLoader.isIdle) {
                console.log('🔄 Фоновая загрузка изображений:', remainingUrls.length);
                window.imageLoader.startBackgroundLoading(remainingUrls.slice(0, 10)); // По 10 за раз
            }
        }, 5000);

        return () => clearInterval(backgroundInterval);
    }, [allImages]);

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
                return React.createElement(ParticipantsPage, { 
                    section: activeTab, 
                    key: activeTab,
                    debounce: globalDebounce.debounce 
                });
            case 'all':
                return React.createElement(AllParticipantsPage, {
                    debounce: globalDebounce.debounce
                });
            case 'table':
                return React.createElement(SchedulePage);
            case 'red':
                return React.createElement(ResultsPage);
            default:
                return React.createElement(ParticipantsPage, { 
                    section: 'One',
                    debounce: globalDebounce.debounce 
                });
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