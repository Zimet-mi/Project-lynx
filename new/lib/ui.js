'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;

    const LoadingIndicator = ({ message = 'Загрузка данных...' }) => (
        React.createElement('div', { className: 'preload-indicator' },
            React.createElement('div', { className: 'preload-indicator-text' }, message),
            React.createElement('div', { className: 'preload-loader' })
        )
    );

    const Toast = ({ message, type = 'error', isVisible, onClose }) => {
        useEffect(() => {
            if (isVisible && onClose) {
                const timer = setTimeout(() => onClose(), 5000);
                return () => clearTimeout(timer);
            }
        }, [isVisible, onClose]);

        if (!isVisible) return null;

        const baseStyle = {
            position: 'fixed', top: '20px', right: '20px', padding: '12px 16px', borderRadius: '8px',
            color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(0)', transition: 'all 0.3s ease-in-out', maxWidth: '300px', wordWrap: 'break-word'
        };
        const bg = type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'info' ? '#2196f3' : '#f44336';

        return React.createElement('div', { className: `toast toast-${type}`, style: { ...baseStyle, background: bg } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement('span', null, message),
                onClose && React.createElement('button', {
                    onClick: onClose,
                    style: { background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', marginLeft: '12px', padding: '0', opacity: '0.8' },
                    onMouseOver: (e) => e.target.style.opacity = '1',
                    onMouseOut: (e) => e.target.style.opacity = '0.8'
                }, '×')
            )
        );
    };

    const NetworkToast = () => {
        const [isOnline, setIsOnline] = useState(navigator.onLine);
        const [showToast, setShowToast] = useState(!navigator.onLine);

        useEffect(() => {
            const handleOnline = () => {
                setIsOnline(true);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
            };
            const handleOffline = () => { setIsOnline(false); setShowToast(true); };
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }, []);

        return React.createElement(Toast, {
            message: isOnline ? '🌐 Соединение восстановлено' : '📡 Нет подключения к интернету',
            type: isOnline ? 'success' : 'error',
            isVisible: showToast,
            onClose: isOnline ? () => setShowToast(false) : undefined
        });
    };

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
            if (window.telegramApi) telegramApi.hapticFeedback('selection');
        };

        useEffect(() => {
            const handleClickOutside = () => { if (dropdownOpen) setDropdownOpen(false); };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [dropdownOpen]);

        const toggleDropdown = (e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); };

        return React.createElement('nav', { className: 'top-nav' },
            ...tabs.map(tab => React.createElement('button', {
                key: tab.id,
                className: `tablinks ${activeTab === tab.id ? 'active' : ''}`,
                onClick: () => handleTabClick(tab.id)
            }, React.createElement('span', { className: 'nav-icon' }, tab.icon), React.createElement('span', { className: 'nav-label' }, tab.label))),
            React.createElement('div', { className: `dropdown ${dropdownOpen ? 'open' : ''}` },
                React.createElement('button', { className: 'dropdown-toggle', onClick: toggleDropdown, type: 'button', 'aria-label': 'Меню' },
                    React.createElement('span', { className: 'burger-icon', 'aria-hidden': true },
                        React.createElement('svg', { width: '28', height: '28', viewBox: '0 0 28 28', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
                            React.createElement('rect', { y: '6', width: '28', height: '3', rx: '1.5', fill: '#1976d2' }),
                            React.createElement('rect', { y: '13', width: '28', height: '3', rx: '1.5', fill: '#1976d2' }),
                            React.createElement('rect', { y: '20', width: '28', height: '3', rx: '1.5', fill: '#1976d2' })
                        )
                    )
                ),
                React.createElement('div', { className: 'dropdown-menu' },
                    React.createElement('button', { className: `dropdown-item tablinks ${activeTab === 'table' ? 'active' : ''}`, onClick: () => handleTabClick('table') },
                        React.createElement('span', { className: 'nav-icon' }, '🗓️'), React.createElement('span', { className: 'nav-label' }, 'Расписание')
                    ),
                    React.createElement('button', { className: `dropdown-item tablinks ${activeTab === 'red' ? 'active' : ''}`, onClick: () => handleTabClick('red') },
                        React.createElement('span', { className: 'nav-icon' }, '📊'), React.createElement('span', { className: 'nav-label' }, 'Итог')
                    )
                )
            )
        );
    };

    const Header = ({ activeTab, onTabChange, onSendCache }) => (
        React.createElement('div', { className: 'head' },
            React.createElement('header', null,
                React.createElement('div', { className: 'nav-wrapper' },
                    React.createElement(Navigation, { activeTab, onTabChange, onSendCache })
                )
            ),
            React.createElement(NetworkToast)
        )
    );

    window.AppUI = { LoadingIndicator, Toast, NetworkToast, Navigation, Header };
})();


