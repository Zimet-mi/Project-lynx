// participants.js
// Нужно вынести в констаны создание полей ввода для оценок, чекбоксов
// А так же, не понятно за что отвечающий, диапазон.

// Универсальные параметры оценок для всех участников (используются и в createInputFields, и в модалке)
const PARTICIPANT_PARAMETERS = [
    { label: 'Костюм', column: 'C', options: 5, field: 'costum' },
    { label: 'Схожесть', column: 'D', options: 5, field: 'shozhest' },
    { label: 'Выход', column: 'E', options: 5, field: 'vistup' },
    { label: 'Аксессуар', column: 'F', options: 3, field: 'aks' }
];

// Универсальные параметры чекбоксов спецпризов для всех участников
const CHECKBOX_LABELS = ['Пошив', 'Крафт', 'Дефиле', 'Парик', 'Гран-при'];
const CHECKBOX_COLUMNS = ['I', 'J', 'K', 'L', 'M'];

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

    // Функция для создания нового выпадающего списка 
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

    // Проверка наличия значения в initialValue
    checkbox.checked = initialValue !== undefined && initialValue !== null && initialValue.toString().trim() !== '';

    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            saveData('Номинант', dataColumn, dataRow, sheet_Name);
        } else {
            saveData('', dataColumn, dataRow, sheet_Name);
        }
    });

    return checkbox;
}
window.createCheckbox = createCheckbox;


function createUniversalDropdown(id, dataColumn, dataRow, placeholder, optionsCount) {
    const select = document.createElement('select');
    select.className = 'data-input input-field';
    select.id = id;
    select.setAttribute('data-column', dataColumn);
    select.setAttribute('data-row', dataRow);

    for (let i = 1; i <= optionsCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i == placeholder) {
            option.selected = true;
        }
        select.appendChild(option);
    }

    select.addEventListener('input', function() {
        saveData(select.value, dataColumn, dataRow, sheet_Name);
    });

    return select;
}

//Функция создания полей ввода
function createInputFields(container, rowId, placeholders, options = []) {
    const parameters = PARTICIPANT_PARAMETERS;

    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';

    // Контейнер для селектов
    const selectGroup = document.createElement('div');
    selectGroup.className = 'select-group';

    parameters.forEach(param => {
        const selectRow = document.createElement('div');
        selectRow.className = 'select-row';

        const labelDiv = document.createElement('div');
        labelDiv.textContent = param.label;

        // Создаем выпадающий список с указанным количеством вариантов
        const select = createUniversalDropdown(
            `data${param.column}${rowId}`,
            param.column,
            rowId,
            param.placeholder,
            param.options // Количество вариантов из параметра
        );

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
    textarea.id = `dataG${rowId}`;
    textarea.setAttribute('data-column', 'H');
    textarea.setAttribute('data-row', rowId);
    textarea.value = placeholders['comment'] || '';

	function debounce(func, wait) {
		let timeout;
		return function (...args) {
			const context = this;
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(context, args), wait);
		};
	}

	textarea.addEventListener('input', debounce(function () {
		saveData(this.value, 'G', rowId, sheet_Name);
	}, 300));

    textareaRow.appendChild(commentLabelDiv);
    textareaRow.appendChild(textarea);
    textareaGroup.appendChild(textareaRow);
    inputContainer.appendChild(textareaGroup);

    // Контейнер для чекбоксов
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'checkbox-group';

    CHECKBOX_LABELS.forEach((label, index) => {
        const checkboxRow = document.createElement('div');
        checkboxRow.className = 'checkbox-row';

        const labelDiv = document.createElement('div');
        labelDiv.textContent = label;

        const checkbox = createCheckbox(`data${CHECKBOX_COLUMNS[index]}${rowId}`, CHECKBOX_COLUMNS[index], rowId, placeholders.checkboxes[index]);

        checkboxRow.appendChild(labelDiv);
        checkboxRow.appendChild(checkbox);
        checkboxGroup.appendChild(checkboxRow);
    });

    inputContainer.appendChild(checkboxGroup);

    container.appendChild(inputContainer);
}

    // Функция для создания панели участника
 function createParticipantPanel(participant, placeholders) {
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

    panel.appendChild(inputFieldsDiv);

    createInputFields(inputFieldsDiv, participant.row, placeholders, participant.options);

    return { button, panel };
}

    // Загрузка данных и создание панелей участников
    function renderData(data) {
        const participants = extractParticipants(data);
        
        // Пример использования, можно фильтровать по диапазонам, если нужно
        const section1Participants = filterParticipantsByRange(participants, section1Range);

        section1Participants.forEach(participant => {
            const placeholders = {
                costum: '', // Замените на реальные данные или добавьте в participant
                shozhest: '',
                vistup: '',
                comment: ''
            };
            const { button, panel } = createParticipantPanel(participant, placeholders);
            document.body.appendChild(button);
            document.body.appendChild(panel);
        });
    }


	async function getSheetId() {
		const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec'; 
		const response = await fetch(url);
		return response.text();
	}

    // Функция для загрузки данных из Google Sheets с кешированием
    async function fetchDataWithCache(sheetName = sheet_Name, includeParticipants = false) {
        const SHEET_ID = await getSheetId(); // Получаем ID динамически
        const RANGE = 'A1:M200';
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
			'vistup': row[4] || '',			// Значение для аксессуаров (столбец E)
			'aks': row[5] || '',
			'comment': row[6] || '',
			'checkboxes': [
				row[8] || '',
				row[9] || '',
				row[10] || '',
				row[11] || '',
				row[12] || ''
			]
		};
	}
window.getPlaceholderValues = getPlaceholderValues;

    // Функция для отображения данных
    async function renderData(sheetName = sheet_Name) {
        const { data, participants } = await fetchDataWithCache(sheetName, true);
        
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
            const placeholders = getPlaceholderValues(data, participant.row);
            const { button, panel } = createParticipantPanel(participant, placeholders);
            section1Container.appendChild(button);
            section1Container.appendChild(panel);
        });

        section2Participants.forEach(participant => {
            const placeholders = getPlaceholderValues(data, participant.row);
            const { button, panel } = createParticipantPanel(participant, placeholders);
            section2Container.appendChild(button);
            section2Container.appendChild(panel);
        });

        section3Participants.forEach(participant => {
            const placeholders = getPlaceholderValues(data, participant.row);
            const { button, panel } = createParticipantPanel(participant, placeholders);
            section3Container.appendChild(button);
            section3Container.appendChild(panel);
        });

        // Инициализация аккордеонов после загрузки данных и создания панелей участников
        initializeAccordions();

        // Инициализация lightzoom для всех элементов с классом lightzoom после обновления таблицы
        document.dispatchEvent(new Event('tableUpdated'));
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
    }
}
window.saveData = saveData;

// Функция отправки данных на сервер
async function sendDataToServer(cacheKey) {
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) {
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

        if (response.ok) {
            localStorage.removeItem(cacheKey); 
        } else {
        }
    } catch (error) {
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

// === Вкладка "Все участники" ===
// Глобальный кеш для данных по листам (только для текущей сессии)
window.sheetDataCache = window.sheetDataCache || {};

async function loadAllParticipantsPreview() {
    const previewContainer = document.getElementById('allParticipantsPreview');
    if (!previewContainer) return;
    previewContainer.innerHTML = '<div class="loading">Загрузка участников...</div>';

    // Собираем всех участников из всех листов/дней
    let allParticipants = [];
    let allDataBySheet = {};
    for (const { sheet, range } of window.ALL_PARTICIPANTS_SHEETS) {
        let data;
        if (window.sheetDataCache[sheet]) {
            data = window.sheetDataCache[sheet];
        } else {
            try {
                const SHEET_ID = await getSheetId();
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheet}!${range}?key=${API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) continue;
                data = await response.json();
                window.sheetDataCache[sheet] = data;
            } catch (e) { continue; }
        }
        const participants = (data.values || []).slice(1).map((row, idx) => ({
            id: row[0],
            name: row[1],
            img: `${row[0]}.jpg`,
            row: idx + 2,
            sheet,
            dataRow: idx + 2,
            raw: row
        }));
        participants.forEach(p => p.dayIndex = allParticipants.length === 0 ? 1 : allParticipants[allParticipants.length-1].dayIndex + 0);
        allParticipants = allParticipants.concat(participants);
        allDataBySheet[sheet] = data;
    }
    if (!allParticipants.length) {
        previewContainer.innerHTML = '<div class="no-data">Нет участников для отображения</div>';
        return;
    }
    // Группируем участников по листу (дню)
    const bySheet = {};
    allParticipants.forEach(p => {
        if (!bySheet[p.sheet]) bySheet[p.sheet] = [];
        bySheet[p.sheet].push(p);
    });
    // Формируем таблицу
    let html = '<table class="all-participants-table"><thead><tr><th>Фото</th><th>Имя</th><th>Номер</th><th>День</th></tr></thead><tbody>';
    window.ALL_PARTICIPANTS_SHEETS.forEach(({sheet}, sheetIdx) => {
        const group = bySheet[sheet] || [];
        group.forEach(participant => {
            html += `<tr class="participant-row" data-sheet="${participant.sheet}" data-row="${participant.row}">
                <td><img src="../card/${participant.img}" alt="${participant.name}" class="participant-preview-img-small" onerror="this.src='../card/no-image.jpg';"></td>
                <td>${participant.name || ''}</td>
                <td>${participant.id || ''}</td>
                <td>${sheet}</td>
            </tr>`;
        });
    });
    html += '</tbody></table>';
    previewContainer.innerHTML = html;
    // Навешиваем обработчик на строки
    previewContainer.querySelectorAll('.participant-row').forEach(row => {
        row.addEventListener('click', function() {
            const sheet = this.getAttribute('data-sheet');
            const rowNum = parseInt(this.getAttribute('data-row'), 10);
            const participant = allParticipants.find(p => p.sheet === sheet && p.row === rowNum);
            if (participant) openParticipantModal(participant, allDataBySheet);
        });
    });
}

// Модальное окно участника для просмотра/редактирования оценок и комментария
function openParticipantModal(participant, allDataBySheet) {
    // Получаем данные строки участника
    const data = allDataBySheet[participant.sheet];
    const row = data && data.values ? data.values[participant.row - 1] : [];
    const placeholders = getPlaceholderValues(data, participant.row);

    // Формируем форму для оценок и комментария по универсальным параметрам
    let marksHtml = PARTICIPANT_PARAMETERS.map((param, idx) => {
        // Индекс столбца: 'A' = 0, 'B' = 1, ...
        const colIdx = param.column.charCodeAt(0) - 'A'.charCodeAt(0);
        const value = row && row[colIdx] ? row[colIdx] : '';
        let inputHtml = '';
        if (typeof param.options === 'number') {
            inputHtml = `<select name="mark${idx}">`;
            for (let i = 1; i <= param.options; i++) {
                inputHtml += `<option value="${i}"${value == i ? ' selected' : ''}>${i}</option>`;
            }
            inputHtml += '</select>';
        } else {
            inputHtml = `<input type="number" min="0" max="10" step="0.01" name="mark${idx}" value="${value}">`;
        }
        return `<label>${param.label}: ${inputHtml}</label>`;
    }).join('<br>');

    // Комментарий (столбец G)
    const commentValue = placeholders.comment || '';
    let commentHtml = `<label>Комментарий:<br><textarea name="comment" rows="3" style="width:98%">${commentValue}</textarea></label>`;

    // Чекбоксы спецпризов
    let checkboxesHtml = '<div class="participant-modal-checkboxes" id="modalCheckboxes"></div>';

    // Модальное окно
    let modal = document.getElementById('participantModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'participantModal';
        modal.className = 'participant-modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="participant-modal-content">
            <span class="participant-modal-close" id="closeParticipantModal">×</span>
            <div class="participant-modal-header">
                <a href="../card/${participant.img}" class="lightzoom" data-lightzoom>
                    <img src="../card/${participant.img}" alt="${participant.name}" class="participant-modal-img" onerror="this.src='../card/no-image.jpg';">
                </a>
                <div>
                    <div class="participant-modal-name">${participant.name || ''}</div>
                    <div class="participant-modal-id">Номер: ${participant.id || ''}</div>
                    <div class="participant-modal-sheet">День: ${participant.sheet}</div>
                </div>
            </div>
            <form id="participantModalForm" autocomplete="off">
                <div class="participant-modal-marks">${marksHtml}</div>
                ${checkboxesHtml}
                <div class="participant-modal-comment">${commentHtml}</div>
            </form>
        </div>
    `;
    modal.style.display = 'block';

    // Вставляем чекбоксы через createCheckbox
    const modalCheckboxes = document.getElementById('modalCheckboxes');
    if (modalCheckboxes) {
        CHECKBOX_LABELS.forEach((label, idx) => {
            const checkbox = createCheckbox(`modalCheckbox${idx}`, CHECKBOX_COLUMNS[idx], participant.row, '');
            // Выставляем checked по логике из блоков
            checkbox.checked = placeholders.checkboxes && placeholders.checkboxes[idx] && placeholders.checkboxes[idx].toString().trim() !== '';
            checkbox.addEventListener('change', function() {
                if (checkbox.checked) {
                    saveData('Номинант', CHECKBOX_COLUMNS[idx], participant.row, participant.sheet);
                } else {
                    saveData('', CHECKBOX_COLUMNS[idx], participant.row, participant.sheet);
                }
            });
            const labelElem = document.createElement('label');
            labelElem.style.marginRight = '12px';
            labelElem.appendChild(checkbox);
            labelElem.appendChild(document.createTextNode(' ' + label));
            modalCheckboxes.appendChild(labelElem);
        });
    }

    // Инициализация lightzoom для фото
    if (window.$ && typeof window.$.fn.lightzoom === 'function') {
        window.$(modal).find('.lightzoom').lightzoom({ speed: 200, isOverlayClickClosing: true });
    }

    // Автосохранение оценок и комментария
    const form = document.getElementById('participantModalForm');
    PARTICIPANT_PARAMETERS.forEach((param, idx) => {
        const input = form[`mark${idx}`];
        if (input) {
            input.addEventListener('input', function() {
                saveData(this.value, param.column, participant.row, participant.sheet);
            });
        }
    });
    // Чекбоксы спецпризов
    CHECKBOX_LABELS.forEach((label, idx) => {
        const checkbox = form[`checkbox${idx}`];
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (checkbox.checked) {
                    saveData('Номинант', CHECKBOX_COLUMNS[idx], participant.row, participant.sheet);
                } else {
                    saveData('', CHECKBOX_COLUMNS[idx], participant.row, participant.sheet);
                }
            });
        }
    });
    // Комментарий с debounce
    const commentInput = form['comment'];
    if (commentInput) {
        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        }
        commentInput.addEventListener('input', debounce(function() {
            saveData(this.value, 'G', participant.row, participant.sheet);
        }, 300));
    }

    // Закрытие модалки
    document.getElementById('closeParticipantModal').onclick = () => {
        modal.style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target === modal) modal.style.display = 'none';
    };

    // Сохранение
    // document.getElementById('participantModalForm').onsubmit = async function(e) {
    //     e.preventDefault();
    //     // Собираем оценки
    //     const form = e.target;
    //     let updates = [];
    //     PARTICIPANT_PARAMETERS.forEach((param, idx) => {
    //         const col = param.column;
    //         const val = form[`mark${idx}`].value;
    //         updates.push({ col, val });
    //     });
    //     // Комментарий
    //     updates.push({ col: 'G', val: form.comment.value });
    //     // Сохраняем через saveData
    //     for (const upd of updates) {
    //         await saveData(participant.sheet, participant.row, upd.col, upd.val);
    //     }
    //     modal.style.display = 'none';
    //     // Обновляем превью (можно перезагрузить таблицу или только строку)
    //     loadAllParticipantsPreview();
    // };
}

// Автоматически загружать превью при открытии вкладки "Все участники"
document.addEventListener('DOMContentLoaded', function() {
    const allTabBtn = document.querySelector('.tablinks[data-tab="all"]');
    if (allTabBtn) {
        allTabBtn.addEventListener('click', loadAllParticipantsPreview);
    }
});