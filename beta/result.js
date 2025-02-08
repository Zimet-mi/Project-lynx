import { getSheetId } from './utils.js';
import { fetchDataWithCache } from './utils.js';
import { initializeAccordions } from './utils.js';
import { createTableCell } from './utils.js';

// Функция для создания ячейки таблицы
const cell = createTableCell(cellContent, isLink, colspan, isHeader);

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

// Функция для загрузки данных из Google Sheets с кешированием
const data = await fetchDataWithCache('juryRes', 'A1:L120', 'cachedData_juryRes', 'cachedTime_juryRes', 420000);


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
