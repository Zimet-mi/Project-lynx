'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;

    function Loading({ message = 'Загрузка данных...' }) {
        return React.createElement('div', { className: 'preload-indicator' },
            React.createElement('div', { className: 'preload-indicator-text' }, message),
            React.createElement('div', { className: 'preload-loader' })
        );
    }

    function Navigation({ activeTab, onTabChange }) {
        const tabs = [
            { id: 'One', label: 'Первый' },
            { id: 'Two', label: 'Второй' },
            { id: 'Three', label: 'Третий' },
            { id: 'all', label: 'Участники' }
        ];
        return React.createElement('nav', { className: 'top-nav' },
            ...tabs.map(tab => React.createElement('button', {
                key: tab.id,
                className: `tablinks ${activeTab === tab.id ? 'active' : ''}`,
                onClick: () => onTabChange(tab.id)
            }, tab.label))
        );
    }

    function Header({ activeTab, onTabChange }) {
        return React.createElement('div', { className: 'head' },
            React.createElement('header', null,
                React.createElement('div', { className: 'nav-wrapper' },
                    React.createElement(Navigation, { activeTab, onTabChange })
                )
            )
        );
    }

    window.SimpleUI = { Loading, Header };
})();


