// JavaScript.js
// Выноса в константы более не требуется
// Функции для работы аккордеона
// === PRELOAD ДАННЫХ И ИНДИКАТОР ЗАГРУЗКИ ===
let preloadComplete = false;

function showPreloadIndicator() {
    let indicator = document.getElementById('preload-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'preload-indicator';
        indicator.className = 'preload-indicator';
        indicator.innerHTML = '<div class="preload-indicator-text">Загрузка данных...</div><div class="preload-loader"></div>';
        document.body.appendChild(indicator);
    } else {
        indicator.style.display = 'flex';
    }
}

function hidePreloadIndicator() {
    const indicator = document.getElementById('preload-indicator');
    if (indicator) indicator.style.display = 'none';
}

// Добавлено: preload для всех листов с участниками (без рендера, с кешем в localStorage)
async function preloadAllParticipantsSheets() {
    const label = '[preloadAllParticipantsSheets]';
    console.groupCollapsed(label);
    const t0 = performance.now();
    if (!window.ALL_PARTICIPANTS_SHEETS) { console.warn(label, 'ALL_PARTICIPANTS_SHEETS отсутствует'); console.groupEnd(); return; }
    if (!window.sheetDataCache) window.sheetDataCache = {};
    const SHEET_ID = await window.getSheetId();
    console.log(label, 'SHEET_ID получен');
    await Promise.all(window.ALL_PARTICIPANTS_SHEETS.map(async ({ sheet, range }) => {
        if (window.sheetDataCache[sheet]) { console.log(label, sheet, 'пропускаем (уже в памяти)'); return; }
        try {
            // Запрашиваем только 3 колонки (A:C) на превью, чтобы сократить объём ответа
            const compactRange = range.replace(/:.+$/, ':N400');
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheet}!${compactRange}?key=${window.API_KEY}`;
            const tReq = performance.now();
            const response = await fetch(url);
            console.log(label, sheet, 'HTTP', response.status, 'время, мс:', Math.round(performance.now() - tReq));
            if (!response.ok) return;
            const data = await response.json();
            window.sheetDataCache[sheet] = data;
            localStorage.setItem(`sheetDataCache_${sheet}`, JSON.stringify(data));
            localStorage.setItem(`sheetDataCacheTime_${sheet}`, new Date().getTime().toString());
        } catch (e) { console.warn(label, sheet, 'ошибка', e); return; }
    }));
    console.log(label, 'Готово. Время, мс:', Math.round(performance.now() - t0));
    console.groupEnd();
}

async function preloadAllData() {
    const label = '[preloadAllData]';
    console.groupCollapsed(label);
    const t0 = performance.now();
    showPreloadIndicator();
    try {
        // Участники (основные)
        if (typeof window.fetchDataWithCache === 'function' && typeof window.sheet_Name !== 'undefined') {
            const tA = performance.now();
            await window.fetchDataWithCache(
                window.sheet_Name,
                'A1:M200',
                `cachedData_${window.sheet_Name}`,
                `cachedTime_${window.sheet_Name}`,
                window.CACHE_PARICIPANTS_EXPIRY || 120000
            );
            console.log(label, 'Основные участники загружены. Время, мс:', Math.round(performance.now() - tA));
        } else {
            console.warn(label, 'Пропущена загрузка основных участников: нет sheet_Name или fetchDataWithCache');
        }
        
        // Все участники (только preload, без рендера, с кешем в localStorage)
        const tB = performance.now();
        await preloadAllParticipantsSheets();
        console.log(label, 'Все участники (preload) загружены. Время, мс:', Math.round(performance.now() - tB));
        
        // Итоги
        if (window.fetchData && window.ResultSheet && window.rangeRes) {
            const tC = performance.now();
            await window.fetchData(window.ResultSheet, window.rangeRes);
            console.log(label, 'Итоги загружены. Время, мс:', Math.round(performance.now() - tC));
        }
        
        // Расписание
        if (typeof timetableID !== 'undefined' && typeof timetableRANGE !== 'undefined' && typeof API_KEY !== 'undefined') {
            const tD = performance.now();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${timetableID}/values/${timetableRANGE}?key=${API_KEY}`;
            const resp = await fetch(url);
            console.log(label, 'Расписание HTTP', resp.status, 'Время, мс:', Math.round(performance.now() - tD));
        }
        
        // ДАННЫЕ УЧАСТНИКОВ ДЛЯ ВКЛАДКИ "УЧАСТНИКИ" - ДОБАВЛЯЕМ ЗДЕСЬ
        if (typeof window.fetchDataWithCache === 'function' && typeof window.sheet_Name !== 'undefined') {
            const tE = performance.now();
            // Загружаем данные для основной вкладки участников
            await window.fetchDataWithCache(
                window.sheet_Name,
                'A1:N700', // Увеличиваем диапазон, чтобы охватить всех участников
                `cachedParticipantsData_${window.sheet_Name}`,
                `cachedParticipantsTime_${window.sheet_Name}`,
                window.CACHE_PARICIPANTS_EXPIRY || 120000
            );
            console.log(label, 'Данные для вкладки Участники загружены. Время, мс:', Math.round(performance.now() - tE));
        }

        // Предварительно рендерим вкладку "Все участники", чтобы избежать подзагрузки при первом открытии
        if (typeof window.loadAllParticipantsPreview === 'function') {
            try {
                const tF = performance.now();
                await window.loadAllParticipantsPreview();
                console.log(label, 'Вкладка "Все участники" отрендерена. Время, мс:', Math.round(performance.now() - tF));
            } catch (e) {
                console.warn(label, 'Не удалось предварительно отрендерить вкладку Все участники', e);
            }
        }
        
    } catch (e) {
        console.error(label, 'Ошибка preload:', e);
    }
    preloadComplete = true;
    hidePreloadIndicator();
    console.log(label, 'Готово. Общее время, мс:', Math.round(performance.now() - t0));
    console.groupEnd();
}

document.addEventListener('DOMContentLoaded', async function () {
    console.time('[DOMContentLoaded]');
    // Сначала preload, потом разрешаем работу вкладок
    // Подхватываем значения из utils.js, даже если они объявлены как глобальные лексические (const/let),
    // и в window нет соответствующих свойств.
    if (typeof window.sheet_Name === 'undefined' && typeof sheet_Name !== 'undefined') {
        window.sheet_Name = sheet_Name;
    }
    if (typeof window.ResultSheet === 'undefined' && typeof ResultSheet !== 'undefined') {
        window.ResultSheet = ResultSheet;
    }
    if (typeof window.rangeRes === 'undefined' && typeof rangeRes !== 'undefined') {
        window.rangeRes = rangeRes;
    }
    if (typeof window.CACHE_PARICIPANTS_EXPIRY === 'undefined' && typeof CACHE_PARICIPANTS_EXPIRY !== 'undefined') {
        window.CACHE_PARICIPANTS_EXPIRY = CACHE_PARICIPANTS_EXPIRY;
    }
    // Без фоллбэков: если что-то не определено, соответствующие разделы preload будут пропущены
    await preloadAllData();

    const tabButtons = document.querySelectorAll('.tablinks');
    const tabContents = document.querySelectorAll('.tabcontent');

    tabButtons.forEach(button => {
        button.addEventListener('click', async function (event) {
            const targetTab = event.currentTarget.getAttribute('data-tab');
            console.log('[Tabs] Клик по вкладке', targetTab);
            const tabContent = document.getElementById(targetTab);

            tabContents.forEach(content => { content.style.display = 'none'; });
            tabButtons.forEach(btn => { btn.classList.remove('active'); });

            if (tabContent) {
                tabContent.style.display = 'block';
                event.currentTarget.classList.add('active');
                if (!tabContent.dataset.loaded) {
                    const tTab = performance.now();
                    await loadTabData(targetTab);
                    console.log('[Tabs] Данные вкладки загружены', targetTab, 'время, мс:', Math.round(performance.now() - tTab));
                    tabContent.dataset.loaded = true;
                }
            }
        });
    });
    console.timeEnd('[DOMContentLoaded]');

    // --- Dropdown menu logic ---
    const moreMenuBtn = document.getElementById('moreMenuBtn');
    const moreMenu = document.getElementById('moreMenu');
    const dropdown = moreMenuBtn ? moreMenuBtn.closest('.dropdown') : null;
    if (moreMenuBtn && moreMenu && dropdown) {
        moreMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = dropdown.classList.toggle('open');
            if (isOpen) {
                // Позиционируем меню под кнопкой
                const btnRect = moreMenuBtn.getBoundingClientRect();
                moreMenu.style.position = 'fixed';
                moreMenu.style.top = (btnRect.bottom + 4) + 'px';
                // Сначала пытаемся справа, если не влезает — слева
                const menuWidth = moreMenu.offsetWidth || 180;
                let left = btnRect.right - menuWidth;
                if (left < 8) left = 8;
                moreMenu.style.left = left + 'px';
                moreMenu.style.right = 'auto';
                moreMenu.style.zIndex = 3000;
            } else {
                // Сбросить стили
                moreMenu.style.position = '';
                moreMenu.style.top = '';
                moreMenu.style.left = '';
                moreMenu.style.right = '';
                moreMenu.style.zIndex = '';
            }
        });
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
                moreMenu.style.position = '';
                moreMenu.style.top = '';
                moreMenu.style.left = '';
                moreMenu.style.right = '';
                moreMenu.style.zIndex = '';
            }
        });
        // Закрытие по Esc
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                dropdown.classList.remove('open');
                moreMenu.style.position = '';
                moreMenu.style.top = '';
                moreMenu.style.left = '';
                moreMenu.style.right = '';
                moreMenu.style.zIndex = '';
            }
        });
    }
});

async function loadTabData(tabId) {
    switch (tabId) {
        case 'One':
        case 'Two':
        case 'Three':
            await renderData(sheet_Name);
            break;
        case 'table':
            if (typeof window.loadSchedule === 'function') {
                await window.loadSchedule();
            }
            break;
        case 'red':
            await renderTable();
            break;
        // Добавьте другие вкладки по аналогии
    }
}

// Для заполнения расписания
document.addEventListener('DOMContentLoaded', async function() {

    const label = '[schedule]';
    console.groupCollapsed(label);
    const t0 = performance.now();

    const fetchDataWithCache = async () => {
        const cacheKey = `cachedData`;
        const cacheTimeKey = `cachedTime`;

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - parseInt(cachedTime);
            console.log(label, 'Кеш:', { age_ms: timeDiff, TTL_ms: CACHE_EXPIRY });
            if (timeDiff < CACHE_EXPIRY) {
                console.log(label, 'Возвращаю из кеша (localStorage)');
                return JSON.parse(cachedData);
            }
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${timetableID}/values/${timetableRANGE}?key=${API_KEY}`;
        console.log(label, 'Запрашиваю из сети:', url);
        const response = await fetch(url);

        if (!response.ok) {
            const message = `An error has occurred: ${response.status} ${response.statusText}`;
            const errorData = await response.json();
            console.error(label, 'Ошибка сети', errorData);
            throw new Error(message);
        }

        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, new Date().getTime().toString());
        console.log(label, 'Сохранил в кеш');

        return data;
    };

    const createTableCell = (cellContent, isLink = false) => {
        const cell = document.createElement('td');
        if (isLink) {
            const link = document.createElement('a');
            link.href = `../card/${cellContent}.jpg`;
            link.textContent = cellContent;
            link.classList.add('lightzoom'); // Настройка lightzoom
            cell.appendChild(link);
        } else {
            cell.textContent = cellContent;
        }
        return cell;
    };

    const renderTable = (data) => {
        const tableBody = document.querySelector('#schedule tbody');
        if (!tableBody) return;

        tableBody.innerHTML = ''; // Очистка таблицы перед вставкой новых данных
        if (!data.values) {
            throw new Error('Data values are undefined.');
        }

        data.values.forEach((row) => {
            const newRow = document.createElement('tr');
            let rowClass = '';

            row.forEach((cell, colIndex) => {
                if (cell.toLowerCase().includes('смотр')) {
                    rowClass = 'smort';
                } else if (cell.toLowerCase().includes('блок')) {
                    rowClass = 'block';
                } else if (cell.toLowerCase().includes(':')) {   // Здесь задаётся класс для ячеек, включающих двоеточие. Строки, где в ячейках есть двоеточие, будут центрироваться в таблице, и выводиться жирным шрифтом. Вообще это рассчитано для обозначения начала номинаций, но некоторые участники используют двоеточие для названия фандома
                    rowClass = 'B';
                }
                const isLink = colIndex === 0;
                const newCell = createTableCell(cell, isLink);
                newRow.appendChild(newCell);
            });

            if (rowClass) {
                newRow.classList.add(rowClass);
            }

            tableBody.appendChild(newRow);
        });

        // Триггерим событие для переподключения lightzoom
        document.dispatchEvent(new Event('tableUpdated'));
    };

    const renderData = async () => {
        try {
            const t1 = performance.now();
            const data = await fetchDataWithCache();
            console.log(label, 'Данные получены. Время, мс:', Math.round(performance.now() - t1));
            const t2 = performance.now();
            renderTable(data);
            console.log(label, 'Таблица отрендерена. Время, мс:', Math.round(performance.now() - t2));
        } catch (error) {
            console.error(label, error);
            alert(`Error: ${error.message}`);
        }
    };

    // Делаем загрузку расписания ленивой — по открытию вкладки
    window.loadSchedule = renderData;
    console.log(label, 'Инициализировано. Готово. Общее время, мс:', Math.round(performance.now() - t0));
    console.groupEnd();

    // Локальная инициализация lightzoom только для расписания и в idle
    document.addEventListener('tableUpdated', function() {
        const idle = window.requestIdleCallback || function(cb){ return setTimeout(cb, 0); };
        idle(function(){
            if (window.$ && typeof window.$.fn.lightzoom === 'function') {
                window.$('#schedule .lightzoom').lightzoom();
            }
        });
    });
});