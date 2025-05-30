// Константы для улучшения читаемости
const SHEET_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds'; // Идентификатор таблицы
const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // Ключ API
const CACHE_EXPIRY = 420000; // 7 минут в миллисекундах
const TABLE_RANGE = 'Day1!A1:B196'; // Диапазон для таблицы
const ACCORDION_RANGE = 'accordionDay1!A1:B110'; // Диапазон для аккордеона
const SECTION_RANGES = {
    section1: [1, 23],
    section2: [24, 67],
    section3: [68, 77]
};

// Функция для создания ячейки таблицы
const createTableCell = (cellContent, isLink = false) => {
    const cell = document.createElement('td');
    if (isLink) {
        const link = document.createElement('a');
        link.href = `../card/${cellContent}.jpg`; // Предполагаем, что изображения хранятся в папке card
        link.textContent = cellContent;
        link.setAttribute('data-lightzoom', ''); // Настройка lightzoom
        cell.appendChild(link);
    } else {
        cell.textContent = cellContent;
    }
    return cell;
};

// Функция для извлечения участников из данных Google Sheets
const extractParticipants = (data) => {
    if (!data || !data.values || data.values.length <= 1) {
        throw new Error('Неверный формат данных: отсутствуют значения');
    }

    return data.values.slice(1)
        .map((row, index) => {
            // Проверяем, что id и name существуют и не пустые
            if (!row[0] || !row[1]) {
                return null;
            }
            return {
                id: row[0], // ID участника
                name: row[1], // Имя участника
                img: `${row[0]}.jpg`, // Путь к изображению
                row: index + 2 // Номер строки в таблице
            };
        })
        .filter(participant => participant !== null); // Удаляем пустые элементы
};

// Функция для фильтрации участников по диапазону строк
const filterParticipantsByRange = (participants, range) => {
    return participants.filter(participant => {
        const rowId = participant.row;
        return rowId >= range[0] && rowId <= range[1];
    });
};

// Функция для создания панели участника
const createParticipantPanel = (participant) => {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const button = document.createElement('button');
    button.className = 'accordion';
    button.textContent = `${participant.id} ${participant.name}`;

    const imgLink = document.createElement('a');
    imgLink.href = `../card/${participant.img}`;
    imgLink.className = 'lightzoom';
    imgLink.setAttribute('data-lightzoom', ''); // Настройка lightzoom

    const img = document.createElement('img');
    img.src = `../card/${participant.img}`;
    img.className = 'thumbnail';

    imgLink.appendChild(img);
    panel.appendChild(imgLink);

    return { button, panel };
};

// Функция для инициализации аккордеона
const initializeAccordions = () => {
    const accordions = document.getElementsByClassName('accordion');

    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener('click', function () {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;

            if (panel.style.display === 'block') {
                panel.style.display = 'none';
            } else {
                panel.style.display = 'block';
            }
        });
    }
};

// Функция для переключения вкладок
function openCity(evt, cityName) {
    const tabcontent = document.getElementsByClassName('tabcontent');
    const tablinks = document.getElementsByClassName('tablinks');

    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    document.getElementById(cityName).style.display = 'block';
    evt.currentTarget.className += ' active';
}

// Функция для работы с Google Sheets API и кэшированием
const fetchDataWithCache = async (range, cacheKeyPrefix) => {
    const cacheKey = `${cacheKeyPrefix}_cachedData`;
    const cacheTimeKey = `${cacheKeyPrefix}_cachedTime`;

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(cachedTime);

        if (timeDiff < CACHE_EXPIRY) {
            return JSON.parse(cachedData);
        }
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;
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

// Функция для рендеринга таблицы
const renderTable = (data) => {
    const tableBody = document.querySelector('#schedule tbody');
    if (!tableBody) return;

    const fragment = document.createDocumentFragment();

    data.values.forEach((row) => {
        const newRow = document.createElement('tr');
        let rowClass = '';

        row.forEach((cell, colIndex) => {
            if (cell.toLowerCase().includes('смотр')) {
                rowClass = 'smort';
            } else if (cell.toLowerCase().includes('блок')) {
                rowClass = 'block';
            } else if (cell.toLowerCase().includes(':')) {
                rowClass = 'B';
            }
            const isLink = colIndex === 0;
            const newCell = createTableCell(cell, isLink);
            newRow.appendChild(newCell);
        });

        if (rowClass) {
            newRow.classList.add(rowClass);
        }

        fragment.appendChild(newRow);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);

    document.dispatchEvent(new Event('tableUpdated'));
};

// Функция для рендеринга аккордеона
const renderAccordions = (data) => {
    const participants = extractParticipants(data);

    const section1Container = document.getElementById('section1');
    const section2Container = document.getElementById('section2');
    const section3Container = document.getElementById('section3');

    section1Container.innerHTML = '';
    section2Container.innerHTML = '';
    section3Container.innerHTML = '';

    const section1Participants = filterParticipantsByRange(participants, SECTION_RANGES.section1);
    const section2Participants = filterParticipantsByRange(participants, SECTION_RANGES.section2);
    const section3Participants = filterParticipantsByRange(participants, SECTION_RANGES.section3);

    section1Participants.forEach(participant => {
        const { button, panel } = createParticipantPanel(participant);
        section1Container.appendChild(button);
        section1Container.appendChild(panel);
    });

    section2Participants.forEach(participant => {
        const { button, panel } = createParticipantPanel(participant);
        section2Container.appendChild(button);
        section2Container.appendChild(panel);
    });

    section3Participants.forEach(participant => {
        const { button, panel } = createParticipantPanel(participant);
        section3Container.appendChild(button);
        section3Container.appendChild(panel);
    });

    initializeAccordions();
};

// Инициализация Lightzoom и рендеринг данных
document.addEventListener('DOMContentLoaded', async function() {
    await renderData();
    $('a[data-lightzoom]').lightzoom({ speed: 400, overlayOpacity: 0.5 });
});

// Объявление renderData
const renderData = async () => {
    try {
        const [tableData, accordionData] = await Promise.all([
            fetchDataWithCache(TABLE_RANGE, 'table'),
            fetchDataWithCache(ACCORDION_RANGE, 'accordion')
        ]);

        renderTable(tableData);
        renderAccordions(accordionData);
    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
};