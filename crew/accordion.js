

// Функция для переключения вкладок в шапке
 function openCity(evt, cityName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
       tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
        evt.currentTarget.className += " active";
    }



document.addEventListener('DOMContentLoaded', async function() {
    const SHEET_ID = '1ib2932BhZqfIcAj2oBk_zETt9JYRbHVptvm9ThAVDiU';
    const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM';
    const TABLE_RANGE = 'Day1!A1:B230'; // Укажите правильный диапазон для расписания
    const ACCORDION_RANGE = 'accordionDay1!A1:B150'; // Укажите правильный диапазон для аккордеона
    const CACHE_EXPIRY = 420000; // 7 минут в миллисекундах

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

    // Функции для работы с таблицей
    const createTableCell = (cellContent, isLink = false) => {
        const cell = document.createElement('td');
        if (isLink) {
            const link = document.createElement('a');
            link.href = `card/${cellContent}.jpg`;
            link.textContent = cellContent;
            link.setAttribute('data-lightzoom', ''); // Настройка lightzoom
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
                } else if (cell.toLowerCase().includes(':')) {   // Здесь задаётся класс для ячеек, включающих двоеточие.
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

    // Функции для работы с аккордеоном
    const section1Range = [1, 38];
    const section2Range = [39, 84];
    const section3Range = [85, 90];

    function filterParticipantsByRange(participants, range) {
        return participants.filter(participant => {
            const rowId = participant.row;
            return rowId >= range[0] && rowId <= range[1];
        });
    }

    function extractParticipants(data) {
        if (!data || !data.values || data.values.length <= 1) {
            throw new Error('Неверный формат данных: отсутствуют значения');
        }

        return data.values.slice(1).map((row, index) => {
            return {
                id: row[0],
                name: row[1],
                img: `${row[0]}.jpg`,
                row: index + 2
            };
        });
    }

    function createParticipantPanel(participant) {
        const panel = document.createElement('div');
        panel.className = 'panel';

        const button = document.createElement('button');
        button.className = 'accordion';
        button.textContent = `${participant.id} ${participant.name}`;

        const imgLink = document.createElement('a');
        imgLink.href = `card/${participant.img}`;
        imgLink.className = 'lightzoom';
        imgLink.setAttribute('data-lightzoom', ''); // Настройка lightzoom

        const img = document.createElement('img');
        img.src = `card/${participant.img}`;
        img.className = 'thumbnail';

        imgLink.appendChild(img);
        panel.appendChild(imgLink);

        return { button, panel };
    }

    const renderAccordions = (data) => {
        const participants = extractParticipants(data);

        const section1Container = document.getElementById('section1');
        const section2Container = document.getElementById('section2');
        const section3Container = document.getElementById('section3');

        section1Container.innerHTML = '';
        section2Container.innerHTML = '';
        section3Container.innerHTML = '';

        const section1Participants = filterParticipantsByRange(participants, section1Range);
        const section2Participants = filterParticipantsByRange(participants, section2Range);
        const section3Participants = filterParticipantsByRange(participants, section3Range);

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
    }

    function initializeAccordions() {
        const accordions = document.getElementsByClassName("accordion");

        for (let i = 0; i < accordions.length; i++) {
            accordions[i].addEventListener("click", function () {
                this.classList.toggle("active");
                const panel = this.nextElementSibling;
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                } else {
                    panel.style.display = "block";
                }
            });
        }
    }

    // Главная функция для рендеринга данных
    const renderData = async () => {
        try {
            const tableData = await fetchDataWithCache(TABLE_RANGE, 'table');
            renderTable(tableData);

            const accordionData = await fetchDataWithCache(ACCORDION_RANGE, 'accordion');
            renderAccordions(accordionData);

            // Подключение lightzoom после обновления таблицы и аккордеона
            document.dispatchEvent(new Event('lightzoomUpdated'));
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    };

    await renderData();

    // Подключение lightzoom после обновления таблицы и аккордеона
    document.addEventListener('tableUpdated', function () {
        $('a[data-lightzoom]').lightzoom({ speed: 400, overlayOpacity: 0.5 }); // Настройка lightzoom, если используется jQuery
    });

    document.addEventListener('lightzoomUpdated', function () {
        $('a[data-lightzoom]').lightzoom({ speed: 400, overlayOpacity: 0.5 }); // Настройка lightzoom, если используется jQuery
    });
});
