import { getSheetId } from './utils.js';
import { fetchDataWithCache } from './utils.js';
import { createTableCell } from './utils.js';

const tg = window.Telegram.WebApp;

// Инициализация
tg.ready(); // Сообщает Telegram, что Mini App готов к использованию
const user = tg.initDataUnsafe.user;
console.log(user); // { id: 12345, first_name: "John", last_name: "Doe", username: "johndoe" }
tg.BackButton.show();
tg.BackButton.onClick(() => {
    tg.close(); // Закрыть Mini App
});
tg.sendData(JSON.stringify({ action: 'saveData', sheet: 'jury', row: 5, column: 'A', value: 'Test' }));

// Функции для работы аккордеона
window.openCity = function(evt, cityName) {
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

// Проверка на существование элемента с классом .time перед попыткой доступа к его textContent
let timeElement = document.querySelector('.time');
	if (timeElement) {
		let text = timeElement.textContent;
		console.log(text);
	}

// Для заполнения расписания
document.addEventListener('DOMContentLoaded', async function() {
    const SHEET_ID = '1_p2Wb9MU6VCHkdM0ZZcj7Kjfg-LHK6h_qwdEKztXdds'; // ID гугл таблицы

    const data = await fetchDataWithCache('Day1', 'A1:B250', 'cachedData', 'cachedTime', 420000);

    const cell = createTableCell(cellContent, isLink);

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

    await renderData();
    
    // Подключение lightzoom после обновления таблицы
    document.addEventListener('tableUpdated', function() {
        $('.lightzoom').lightzoom(); // Настройка lightzoom, если используется jQuery
    });
});
window.openCity = openCity;
