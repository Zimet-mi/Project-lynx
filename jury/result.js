// Функция для создания ячейки таблицы
function createTableCell(cellContent, isLink = false, colspan = 1, isHeader = false) {
    const cell = document.createElement(isHeader ? 'th' : 'td');

    if (isLink) {
        const link = document.createElement('a');
        link.href = `card/${cellContent}.jpg`; // Формирование ссылки на изображение
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

    // Проверяем, есть ли данные и содержат ли они значения
    if (!data || !data.values || data.values.length === 0) {
        console.warn(`Нет данных для панели ${panelId}`);
        panel.innerHTML = 'Нет данных для отображения.';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('data-table'); // Класс для стилизации таблицы

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Создание заголовков таблицы (если нужно)
    const headerRow = document.createElement('tr');
    data.values[0].forEach(cellContent => {
        const th = document.createElement('th');
        th.textContent = cellContent;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Создание строк таблицы
    data.values.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cellContent, colIndex) => {
            const isLink = colIndex === 0; // Предполагаем, что ссылки на изображения находятся в первом столбце
            const td = createTableCell(cellContent, isLink);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    // Очистка панели и добавление новой таблицы
    panel.innerHTML = '';
    panel.appendChild(table);

    // Инициализируем lightzoom для изображений в таблице
    $(panel).find('a.lightzoom').lightzoom({ speed: 400, overlayOpacity: 0.5 });
}

// Функция для получения ID таблицы через Google Apps Script
async function getSheetId() {
    const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec';
    const response = await fetch(url);
    return response.text();
}

// Функция для загрузки данных из Google Sheets с кешированием
async function fetchDataWithCache(sheetName = 'juryRes', range = 'A1:L120') {
    const SHEET_ID = await getSheetId(); // Получаем ID динамически
    const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // Замените YOUR_API_KEY на ваш ключ API
    const CACHE_EXPIRY = 420000; // 7 минут в миллисекундах
    const cacheKey = `cachedData_${sheetName}_${range}`;
    const cacheTimeKey = `cachedTime_${sheetName}_${range}`;

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(cachedTime);

        if (timeDiff < CACHE_EXPIRY) {
            return JSON.parse(cachedData);
        }
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

    return data;
}


// Функция для рендеринга таблицы с данными
async function renderTable() {
    const RANGE_PARTS = [
        'A1:G55', // Диапазон для первой части
        'A57:G88', // Диапазон для второй части
        'A90:G112', // Диапазон для третьей части
        'A114:C500'  // Диапазон для четвертой части
    ];

    const parts = [];
    for (const range of RANGE_PARTS) {
        try {
            const data = await fetchDataWithCache('juryRes', range);
            if (!data || !data.values) {
                console.warn(`Нет данных для диапазона ${range}`);
                continue;
            }
            parts.push(data);
        } catch (error) {
            console.error(`Ошибка при загрузке данных для диапазона ${range}:`, error);
        }
    }

    // Создание таблиц для каждой части и добавление в соответствующие аккордеоны
    createTableFromData(parts[0] || {}, 'panel1');
    createTableFromData(parts[1] || {}, 'panel2');
    createTableFromData(parts[2] || {}, 'panel3');
    createTableFromData(parts[3] || {}, 'panel4');
}

// Функция для инициализации аккордеонов
function initializeAccordions() {
    const accordions = document.getElementsByClassName("accordion");
    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener("click", function () {
            this.classList.toggle("active");
            const panelId = this.id.replace('accordion', 'panel');
            const panel = document.getElementById(panelId);
            if (panel) {
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                } else {
                    panel.style.display = "block";
                    // Инициализируем lightzoom для изображений в этом открытом аккордеоне
                    $(panel).find('a.lightzoom').lightzoom({ speed: 400, overlayOpacity: 0.5 });
                }
            } else {
                console.warn(`Panel with id ${panelId} not found.`);
            }
        });
    }
}


// Функция для отображения данных
async function renderData(sheetName = 'juryRes') {
    try {
        // Рендеринг итоговой таблицы с данными
        await renderTable();

        // Инициализация аккордеонов
        initializeAccordions();

    } catch (error) {
        console.error('Error rendering data:', error);
    }
}

// Инициализация загрузки данных и отображение таблицы
document.addEventListener('DOMContentLoaded', function() {
    renderData('juryRes');
});
