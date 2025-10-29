'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;
    const { Header, Loading } = (window.SimpleUI || {});
    const { ParticipantsSimple, AllParticipantsSimple } = (window.SimpleParticipants || {});

    function App() {
        const [activeTab, setActiveTab] = useState('One');
        const [isLoading, setIsLoading] = useState(true);
        const [ready, setReady] = useState(false);

        useEffect(() => {
            const initTelegram = () => { if (window.telegramApi && telegramApi.init) telegramApi.init(); };
            initTelegram();
        }, []);

        useEffect(() => {
            const preload = async () => {
                try {
                    setIsLoading(true);
                    if (window.googleSheetsApi && googleSheetsApi.preloadAllData) {
                        await googleSheetsApi.preloadAllData();
                    }
                } finally {
                    setIsLoading(false);
                    setReady(true);
                }
            };
            // Ранний прогрев стора из кеша и после — из сети
            if (window.AppStore && AppStore.initFromCache) AppStore.initFromCache();
            preload();
        }, []);

        const renderTab = () => {
            if (!ready || isLoading) return React.createElement(Loading, { message: 'Загрузка данных...' });
            switch (activeTab) {
                case 'One':
                case 'Two':
                case 'Three':
                    return React.createElement(ParticipantsSimple, { section: activeTab });
                case 'all':
                    return React.createElement(AllParticipantsSimple);
                default:
                    return React.createElement(ParticipantsSimple, { section: 'One' });
            }
        };

        return React.createElement('div', { className: 'main' },
            React.createElement(Header, { activeTab, onTabChange: setActiveTab }),
            React.createElement('div', { className: 'content' },
                React.createElement('div', { className: 'tabcontent active' }, renderTab())
            )
        );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
})();


