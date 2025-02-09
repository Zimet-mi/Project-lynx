// result.js
// Выноса в константы более не требуется
// Функция для создания ячейки таблицы
function createTableCell(cellContent, isLink = false, colspan = 1, isHeader = false) {
    const cell = document.createElement(isHeader ? 'th' : 'td');

    if (isLink) {
        const link = document.createElement('a');
        link.href = `../card/${cellContent}.jpg`; // Формирование ссылки на изображение
        link.textContent = cellContent;
        link.classList.add('lightzoom'); // Добавляем класс для lightzoom
        cell.appendChild(link);
    } else {
        cell.textContent = cellContent;
    }

    // Устанавливаем colspan только для ячеек, содержащих ключевые слова
    if (cellContent.toLowerCase().includes('лучш') || cellContent.toLowerCase().includes('дефиле')) {
        cell.classList.add('tableHead'); // Применение класса
        cell.setAttribute('colspan', '8'); // Устанавливаем colspan для ячеек с ключевыми словами
    } else {
        // Убираем colspan для обычных ячеек
        cell.removeAttribute('colspan');
    }

    return cell;
}

// Функция для создания таблицы из данных и вставки ее в указанный элемент
function createTableFromData(data, panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    if (!data || !data.values || data.values.length === 0) {
        console.warn(`Нет данных для панели ${panelId}`);
        panel.innerHTML = 'Нет данных для отображения.';
        return;
    }

    const fragment = document.createDocumentFragment();
    const table = document.createElement('table');
    table.classList.add('data-table');

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Заголовки таблицы
    const headerRow = document.createElement('tr');
    data.values[0].forEach(cellContent => {
        const th = document.createElement('th');
        th.textContent = cellContent;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Тело таблицы
    data.values.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cellContent, colIndex) => {
            tr.appendChild(createTableCell(cellContent, colIndex === 0));
        });
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    fragment.appendChild(table);

    panel.innerHTML = ''; // Очистка перед добавлением
    panel.appendChild(fragment); // Добавление всей таблицы сразу

    // Инициализация lightzoom
    $(panel).find('a.lightzoom').lightzoom({ speed: 400, overlayOpacity: 0.5 });
}

// Функция для загрузки данных из Google Sheets с кешированием
async function fetchDataWithCache(sheetName = ResultSheet, range = rangeRes) {
    const SHEET_ID = await getSheetId();
    const cacheKey = `cachedData_${sheetName}_${range}`;
    const cacheTimeKey = `cachedTime_${sheetName}_${range}`;

    const cached = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < CACHE_EXPIRY)) {
        return JSON.parse(cached);
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(cacheTimeKey, Date.now().toString());

    return data;
}

// Функция для рендеринга таблицы с данными
async function renderTable() {
    try {
        const dataParts = await Promise.all(RANGE_PARTS.map(range => fetchDataWithCache(ResultSheet, range).catch(err => {
            console.error(`Ошибка при загрузке данных для диапазона ${range}:`, err);
            return null;
        })));

        // Создание таблиц для каждой части
        createTableFromData(dataParts[0] || {}, 'panel1');
        createTableFromData(dataParts[1] || {}, 'panel2');
        createTableFromData(dataParts[2] || {}, 'panel3');
        createTableFromData(dataParts[3] || {}, 'panel4');
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}


// Функция для отображения данных
async function renderData(sheetName = ResultSheet) {
    try {
        await renderTable();

        // Проверяем, загружена ли функция initializeAccordions
        document.addEventListener("DOMContentLoaded", function () {
            if (typeof initializeAccordions === "function") {
                initializeAccordions();
            } else {
                console.warn("Функция initializeAccordions не найдена, возможно, скрипт не загружен.");
            }
        });

    } catch (error) {
        console.error("Ошибка при рендеринге данных:", error);
    }
}



// Инициализация загрузки данных и отображение таблицы
document.addEventListener('DOMContentLoaded', function() {
    renderData(ResultSheet);
});
