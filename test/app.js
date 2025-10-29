// Основное React приложение (сборка из библиотек)
const { useState, useEffect } = React;
const { useDebounce } = window.AppHooks || {};
const { Header, LoadingIndicator } = window.AppUI || {};
const { ParticipantsPage, AllParticipantsPage } = window.AppParticipants || {};
const { SchedulePage } = window.AppSchedule || {};
const { ResultsPage } = window.AppResults || {};

const App = () => {
    const [activeTab, setActiveTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [preloadComplete, setPreloadComplete] = useState(false);
    const [telegramReady, setTelegramReady] = useState(false); // ← ВОССТАНОВЛЕНО
    const [allImages, setAllImages] = useState(new Set());
    
    const globalDebounce = useDebounce ? useDebounce() : { debounce: null };

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
                if (window.lazySaveManager) lazySaveManager.flushQueue();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Быстрая инициализация стора из кеша, чтобы секции не были пустыми до предзагрузки
    useEffect(() => {
        if (window.AppStore && AppStore.initFromCache) {
            AppStore.initFromCache();
        }
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
                // Инициализируем глобальный стор из кеша
                if (window.AppStore && AppStore.initFromCache) {
                    AppStore.initFromCache();
                }
            } catch (error) {
                console.error('Ошибка предзагрузки данных:', error);
                const hasCachedData = checkCachedData();
                if (hasCachedData) {
                    console.log('🔄 Использую кешированные данные после ошибки');
                    setPreloadComplete(true);
                    
                    const allUrls = getAllImagesUrls();
                    setAllImages(allUrls);
                    if (window.AppStore && AppStore.initFromCache) {
                        AppStore.initFromCache();
                    }
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