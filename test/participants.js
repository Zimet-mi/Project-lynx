// participants.js
// Нужно вынести в констаны создание полей ввода для оценок, чекбоксов
// А так же, не понятно за что отвечающий, диапазон.
document.addEventListener('DOMContentLoaded', function () {
    	
    // Функция для фильтрации участников по диапазону
    function filterParticipantsByRange(participants, range) {
        return participants.filter(participant => {
            const rowId = participant.row;
            return rowId >= range[0] && rowId <= range[1];
        });
    }

    // Функция для извлечения участников
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

	//Функция дебаунсинга. Для задержки сохранения комментария, чтобы не терять данные
	function debounce(func, wait) {
		let timeout;
		return function(...args) {
			const context = this;
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(context, args), wait);
		};
	}

    // Функция для создания исходного выпадающего списка (с вариантами от 1 до 5)
    function createSelect(id, dataColumn, dataRow, placeholder) {
        const select = document.createElement('select');
        select.className = 'data-input input-field';
        select.id = id;
        select.setAttribute('data-column', dataColumn);
        select.setAttribute('data-row', dataRow);

        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i == placeholder) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        select.addEventListener('input', function () {
            saveData(select.value, dataColumn, dataRow, sheet_Name);
        });

        return select;
    }

    // Функция для создания нового выпадающего списка (с вариантами от 1 до 3)
 function createDropdown(id, dataColumn, dataRow, placeholder) {
    const select = document.createElement('select');
    select.className = 'data-input input-field';
    select.id = id;
    select.setAttribute('data-column', dataColumn);
    select.setAttribute('data-row', dataRow);

    for (let i = 1; i <= 3; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i == placeholder) {
            option.selected = true; // Используем переданный placeholder
        }
        select.appendChild(option);
    }

    select.addEventListener('input', function () {
        saveData(select.value, dataColumn, dataRow, sheet_Name);
    });

    return select;
}

// Функция для создания чекбоксов
function createCheckbox(id, dataColumn, dataRow, initialValue) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'data-input';
    checkbox.id = id;
    checkbox.setAttribute('data-column', dataColumn);
    checkbox.setAttribute('data-row', dataRow);

    // Устанавливаем состояние чекбокса на основе initialValue
    checkbox.checked = initialValue === 'Номинант';

    checkbox.addEventListener('change', function () {
        // Отправляем "Номинант", если чекбокс включён, и пустую строку, если выключен
        const value = checkbox.checked ? 'Номинант' : '';
        saveData(value, dataColumn, dataRow, sheet_Name);
    });

    return checkbox;
}


//Функция создания полей ввода
//Функция создания полей ввода
function createInputFields(container, rowId, placeholders, options = []) {
    const fragment = document.createDocumentFragment();

    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';

    // Контейнер для селектов
    const selectGroup = document.createElement('div');
    selectGroup.className = 'select-group';

    const parameters = [
        { label: 'Костюм', column: 'C', placeholder: placeholders['costum'] },
        { label: 'Схожесть', column: 'D', placeholder: placeholders['shozhest'] },
        { label: 'Выход', column: 'E', placeholder: placeholders['vistup'] }
    ];

    parameters.forEach(param => {
        const selectRow = document.createElement('div');
        selectRow.className = 'select-row';

        const labelDiv = document.createElement('div');
        labelDiv.textContent = param.label;

        const select = createSelect(`data${param.column}${rowId}`, param.column, rowId, param.placeholder);

        selectRow.appendChild(labelDiv);
        selectRow.appendChild(select);
        selectGroup.appendChild(selectRow);
    });

    inputContainer.appendChild(selectGroup);

    // Контейнер для текстового поля
    const textareaGroup = document.createElement('div');
    textareaGroup.className = 'textarea-group';

    const textareaRow = document.createElement('div');
    textareaRow.className = 'textarea-row';

    const commentLabelDiv = document.createElement('div');
    commentLabelDiv.textContent = 'Комментарий';

    const textarea = document.createElement('textarea');
    textarea.className = 'data-input input-field';
    textarea.id = `dataF${rowId}`;
    textarea.setAttribute('data-column', 'F');
    textarea.setAttribute('data-row', rowId);
    textarea.value = placeholders['comment'] || '';

    // Обработчик событий только для текстового поля
    textarea.addEventListener('input', debounce(function () {
        const value = this.value;
        const column = this.getAttribute('data-column');
        const row = this.getAttribute('data-row');
        saveData(value, column, row, sheet_Name);
    }, 300));

    textareaRow.appendChild(commentLabelDiv);
    textareaRow.appendChild(textarea);
    textareaGroup.appendChild(textareaRow);
    inputContainer.appendChild(textareaGroup);

    // Контейнер для чекбоксов
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'checkbox-group';

    const checkboxLabels = ['Пошив', 'Крафт', 'Дефиле', 'Парик', 'Гран-при'];
    const checkboxColumns = ['H', 'I', 'J', 'K', 'L'];

    checkboxLabels.forEach((label, index) => {
        const checkboxRow = document.createElement('div');
        checkboxRow.className = 'checkbox-row';

        const labelDiv = document.createElement('div');
        labelDiv.textContent = label;

        const checkbox = createCheckbox(`data${checkboxColumns[index]}${rowId}`, checkboxColumns[index], rowId, placeholders.checkboxes[index]);

        checkboxRow.appendChild(labelDiv);
        checkboxRow.appendChild(checkbox);
        checkboxGroup.appendChild(checkboxRow);
    });

    inputContainer.appendChild(checkboxGroup);

    // Добавляем всё в фрагмент
    fragment.appendChild(inputContainer);
    container.appendChild(fragment);
}

    // Функция для создания панели участника
	function createParticipantPanel(participant, placeholders) {
		const fragment = document.createDocumentFragment();

		const panel = document.createElement('div');
		panel.className = 'panel';

		const button = document.createElement('button');
		button.className = 'accordion';
		button.textContent = `${participant.id} ${participant.name}`;

		const imgLink = document.createElement('a');
		imgLink.href = `../card/${participant.img}`;
		imgLink.className = 'lightzoom';

		const img = document.createElement('img');
		img.src = `../card/${participant.img}`;
		img.className = 'thumbnail';

		imgLink.appendChild(img);
		panel.appendChild(imgLink);

		const inputFieldsDiv = document.createElement('div');
		inputFieldsDiv.id = `inputFields${participant.id}`;
		inputFieldsDiv.className = 'input-fields';

		// Создаём поля ввода и добавляем их в контейнер
		createInputFields(inputFieldsDiv, participant.row, placeholders, participant.options);
		panel.appendChild(inputFieldsDiv);

		// Добавляем кнопку и панель в фрагмент
		fragment.appendChild(button);
		fragment.appendChild(panel);

		return { button, panel, fragment };
	}

    // Загрузка данных и создание панелей участников
    function renderData(data) {
		const participants = extractParticipants(data);
		const section1Participants = filterParticipantsByRange(participants, section1Range);

		const fragment = document.createDocumentFragment();

		section1Participants.forEach(participant => {
			const placeholders = {
				costum: '',
				shozhest: '',
				vistup: '',
				comment: ''
			};
			const { button, panel } = createParticipantPanel(participant, placeholders);
			fragment.appendChild(button);
			fragment.appendChild(panel);
		});

		document.body.appendChild(fragment);
	}


	async function getSheetId() {
		const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec'; 
		const response = await fetch(url);
		return response.text();
	}

    // Функция для загрузки данных из Google Sheets с кешированием
    async function fetchDataWithCache(sheetName = sheet_Name, includeParticipants = false) {
        const SHEET_ID = await getSheetId(); // Получаем ID динамически
        const RANGE = 'A1:L200';
        const cacheKey = `cachedData_${sheetName}`;
        const cacheTimeKey = `cachedTime_${sheetName}`;

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - parseInt(cachedTime);

            if (timeDiff < CACHE_PARICIPANTS_EXPIRY) {
                const parsedData = JSON.parse(cachedData);
                if (includeParticipants) {
                    return { data: parsedData, participants: extractParticipants(parsedData) };
                } else {
                    return parsedData;
                }
            }
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${RANGE}?key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

        if (includeParticipants) {
            return { data, participants: extractParticipants(data) };
        } else {
            return data;
        }
    }

    // Функция для получения значений placeholder
	function getPlaceholderValues(data, rowId) {

    const row = data.values[rowId - 1] || []; // Получаем строку, соответствующую rowId

		return {
			'costum': row[2] || '',      // Значение для соответствия (столбец C)
			'shozhest': row[3] || '',    // Значение для качества костюма (столбец D)
			'vistup': row[4] || '',      // Значение для аксессуаров (столбец E)
			'comment': row[5] || '',     // Значение для комментария (столбец F)
			'checkboxes': [
				row[7] || '',   // Значение для чекбокса 1 (столбец H)
				row[8] || '',   // Значение для чекбокса 2 (столбец I)
				row[9] || '',  // Значение для чекбокса 3 (столбец J)
				row[10] || '',   // Значение для чекбокса 4 (столбец K)	
				row[11] || ''   // Значение для чекбокса 5 (столбец L)	
			]
		};
	}

    // Функция для отображения данных
    async function renderData(sheetName = sheet_Name) {
    // Загружаем данные с кэшированием
    const { data, participants } = await fetchDataWithCache(sheetName, true);

    // Получаем контейнеры для секций
    const section1Container = document.getElementById('section1');
    const section2Container = document.getElementById('section2');
    const section3Container = document.getElementById('section3');

    // Очищаем контейнеры перед добавлением новых данных
    clearContainer(section1Container);
    clearContainer(section2Container);
    clearContainer(section3Container);

    // Фильтруем участников по диапазонам
    const section1Participants = filterParticipantsByRange(participants, section1Range);
    const section2Participants = filterParticipantsByRange(participants, section2Range);
    const section3Participants = filterParticipantsByRange(participants, section3Range);

    // Параллельная обработка данных для каждой секции с использованием Promise.all
    await Promise.all([
        loadSectionData(section1Participants, section1Container, data),
        loadSectionData(section2Participants, section2Container, data),
        loadSectionData(section3Participants, section3Container, data),
    ]);

    // Инициализация аккордеонов и lightzoom
    initializeAccordions();
    document.dispatchEvent(new Event('tableUpdated'));
}

// Функция для загрузки данных и создания панелей для одной секции
async function loadSectionData(participants, container, data) {
    const fragment = document.createDocumentFragment();

    // Создаём панели участников и добавляем их в фрагмент
    participants.forEach(participant => {
        const placeholders = getPlaceholderValues(data, participant.row);
        const { button, panel } = createParticipantPanel(participant, placeholders);
        fragment.appendChild(button);
        fragment.appendChild(panel);
    });

    // Добавляем фрагмент в контейнер за одну операцию
    container.appendChild(fragment);
}

// Вспомогательная функция для очистки контейнера
function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}




 

// Функция для сохранения данных в кеш
function saveData(value, column, row, sheetName = sheet_Name) {
    const cacheKey = `unsavedData_${row}_${column}`;
    
    // Сохраняем данные в локальное хранилище
    localStorage.setItem(cacheKey, JSON.stringify({
        value: value,
        column: column,
        row: row,
        sheet: sheetName
    }));
    
    if (navigator.onLine) {
        sendDataToServer(cacheKey);
    } else {
        console.log('Оффлайн. Данные сохранены в кеш.');
    }
}

// Функция отправки данных на сервер
async function sendDataToServer(cacheKey) {
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) {
        console.warn('Данные для отправки не найдены:', cacheKey);
        return;
    }

    const { value, column, row, sheet } = JSON.parse(cachedData);
    const url = 'https://script.google.com/macros/s/AKfycbxQ3MrknFLRGXb6J7YJcNEVe5IShT-AITtvSvZHHSwK1OPvs-4ikzDXeSWQ60czU5z1/exec';
    const params = new URLSearchParams({
        column: column,
        row: row,
        value: value,
        sheet: sheet
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
        }

        localStorage.removeItem(cacheKey);
        console.log('Данные успешно отправлены:', cacheKey);
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        throw error; // Пробрасываем ошибку для повторной попытки
    }
}

// Функция для отправки всех кешированных данных
async function sendAllCachedData() {
    const promises = []; // Массив для хранения промисов

    for (let i = 0; i < localStorage.length; i++) {
        const cacheKey = localStorage.key(i);
        if (cacheKey.startsWith('unsavedData_')) {
            // Добавляем промис для отправки данных в массив
            promises.push(sendDataToServer(cacheKey));
        }
    }

    // Ожидаем завершения всех промисов параллельно
    await Promise.all(promises);
}

// Обработчик кнопки для отправки кешированных данных
document.getElementById('sendCacheButton').addEventListener('click', async () => {
    await sendAllCachedData();
});

// Событие при потере интернета
window.addEventListener('offline', () => {
});

// Событие при восстановлении интернета
window.addEventListener('online', () => {
});

// Привязка события change к функции сохранения данных
function attachInputListeners() {
    const textareas = document.querySelectorAll('textarea.data-input');
    textareas.forEach(textarea => {
        textarea.addEventListener('change', function () {
            saveData(this.value, this.getAttribute('data-column'), this.getAttribute('data-row'), sheet_Name);
        });
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', function () {
    // Остальной код для инициализации
    attachInputListeners();
});
	
	// Инициализация загрузки данных и отображение таблицы
    renderData(sheet_Name);


});