// JavaScript.js

const tg = window.Telegram.WebApp;

// Инициализация
tg.ready(); // Сообщает Telegram, что Mini App готов к использованию
const user = tg.initDataUnsafe.user;
console.log(user); // { id: 12345, first_name: "John", last_name: "Doe", username: "johndoe" }
tg.BackButton.show();
tg.BackButton.onClick(() => {
    tg.close(); // Закрыть Mini App
});
tg.sendData(JSON.stringify({ action: 'saveData', sheet: sheet_Name, row: 5, column: 'A', value: 'Test' }));

// Функции для работы аккордеона
function openCity(evt, cityName) {
    // Объявляем все переменные
    var i, tabcontent, tablinks;

    // Получаем все элементы с классом "tabcontent" и скрываем их
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Получаем все элементы с классом "tablinks" и удаляем класс "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Отображаем текущую вкладку и добавляем класс "active" к кнопке, открывшей вкладку
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Для заполнения расписания
document.addEventListener('DOMContentLoaded', async function() {
    const SHEET_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds'; // ID гугл таблицы
    const API_KEY = 'AIzaSyBj2W1tUafEz-lBa8CIwiILl28XlmAhyFM'; // API ключ для работы с таблицами
    const RANGE = 'Day1!A1:B250'; // Имя страницы и диапазон ячеек
    const CACHE_EXPIRY = 420000; // 7 минут в миллисекундах

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

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
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
            link.href = `card/${cellContent}.jpg`;
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