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
    if (!window.ALL_PARTICIPANTS_SHEETS) return;
    if (!window.sheetDataCache) window.sheetDataCache = {};
    const SHEET_ID = await window.getSheetId();
    for (const { sheet, range } of window.ALL_PARTICIPANTS_SHEETS) {
        if (window.sheetDataCache[sheet]) continue;
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheet}!${range}?key=${window.API_KEY}`;
            const response = await fetch(url);
            if (!response.ok) continue; // Не падаем, если листа нет
            const data = await response.json();
            window.sheetDataCache[sheet] = data;
            // Сохраняем в localStorage для loadAllParticipantsPreview
            localStorage.setItem(`sheetDataCache_${sheet}`, JSON.stringify(data));
            localStorage.setItem(`sheetDataCacheTime_${sheet}`, new Date().getTime().toString());
        } catch (e) { continue; }
    }
}

async function preloadAllData() {
    showPreloadIndicator();
    try {
        // Участники (основные)
        if (window.fetchDataWithCache) {
            await window.fetchDataWithCache(
                window.sheet_Name,
                'A1:M200',
                `cachedData_${window.sheet_Name}`,
                `cachedTime_${window.sheet_Name}`,
                window.CACHE_PARICIPANTS_EXPIRY || 120000
            );
        }
        // Все участники (только preload, без рендера, с кешем в localStorage)
        await preloadAllParticipantsSheets();
        // Итоги
        if (window.fetchData && window.ResultSheet && window.rangeRes) {
            await window.fetchData(window.ResultSheet, window.rangeRes);
        }
        // Расписание
        if (typeof timetableID !== 'undefined' && typeof timetableRANGE !== 'undefined' && typeof API_KEY !== 'undefined') {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${timetableID}/values/${timetableRANGE}?key=${API_KEY}`;
            await fetch(url);
        }
    } catch (e) {
        // Можно добавить обработку ошибок
        console.error('Ошибка preload:', e);
    }
    preloadComplete = true;
    hidePreloadIndicator();
}

document.addEventListener('DOMContentLoaded', async function () {
    // Сначала preload, потом разрешаем работу вкладок
    // Явно прокидываем константы из utils.js в window (без ||, только прямое присваивание)
    window.sheet_Name = 'archangel';
    window.ResultSheet = 'archangelRes';
    window.rangeRes = 'A1:N500';
    window.CACHE_PARICIPANTS_EXPIRY = 120000;
    await preloadAllData();

    const tabButtons = document.querySelectorAll('.tablinks');
    const tabContents = document.querySelectorAll('.tabcontent');

    tabButtons.forEach(button => {
        button.addEventListener('click', async function (event) {
            const targetTab = event.currentTarget.getAttribute('data-tab'); // Используем data-tab
            const tabContent = document.getElementById(targetTab);

            // Скрываем все вкладки
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            // Убираем активный класс у всех кнопок
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            // Показываем текущую вкладку и добавляем класс active
            if (tabContent) {
                tabContent.style.display = 'block';
                event.currentTarget.classList.add('active');

                // Загружаем данные только при первом открытии вкладки
                if (!tabContent.dataset.loaded) {
                    await loadTabData(targetTab);
                    tabContent.dataset.loaded = true;
                }
            }
        });
    });

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
            // Убедитесь, что функция renderScheduleData определена
            // await renderScheduleData();
            break;
        case 'red':
            await renderTable();
            break;
        // Добавьте другие вкладки по аналогии
    }
}

// Для заполнения расписания
document.addEventListener('DOMContentLoaded', async function() {

    const fetchDataWithCache = async () => {
        const cacheKey = `cachedData`;
        const cacheTimeKey = `cachedTime`;

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - parseInt(cachedTime);

            if (timeDiff < CACHE_EXPIRY) {
                return JSON.parse(cachedData);
            }
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${timetableID}/values/${timetableRANGE}?key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            const message = `An error has occurred: ${response.status} ${response.statusText}`;
            const errorData = await response.json();
            console.error('Error details:', errorData);
            throw new Error(message);
        }

        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

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
            const data = await fetchDataWithCache();
            renderTable(data);
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    };

    await renderData();
    
    // Подключение lightzoom после обновления таблицы
    document.addEventListener('tableUpdated', function() {
        $('.lightzoom').lightzoom(); // Настройка lightzoom, если используется jQuery
    });
});