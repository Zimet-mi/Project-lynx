// Инициализация Telegram WebApp (если доступен)
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
}

// Глобальные переменные для хранения данных
let appData = {
    nominations: [],
    participants: [],
    scores: []
};

// Ждем загрузки DOM перед инициализацией
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM загружен, начинаем инициализацию...');
    
    // Получаем элементы DOM
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const nominationFilter = document.getElementById('nominationFilter');
    const leadersNomination = document.getElementById('leadersNomination');
    const leadersLimit = document.getElementById('leadersLimit');
    const participantsNomination = document.getElementById('participantsNomination');
    const participantsFilter = document.getElementById('participantsFilter');
    const scoreCards = document.getElementById('scoreCards');
    const leadersList = document.getElementById('leadersList');
    const participantsList = document.getElementById('participantsList');

    // Подробное логирование для отладки
    console.log('Проверка элементов:');
    console.log('tabs:', tabs.length > 0 ? 'найдены' : 'не найдены');
    console.log('tabContents:', tabContents.length > 0 ? 'найдены' : 'не найдены');
    console.log('nominationFilter:', nominationFilter ? 'найден' : 'не найден');
    console.log('leadersNomination:', leadersNomination ? 'найден' : 'не найден');
    console.log('leadersLimit:', leadersLimit ? 'найден' : 'не найден');
    console.log('participantsNomination:', participantsNomination ? 'найден' : 'не найден');
    console.log('participantsFilter:', participantsFilter ? 'найден' : 'не найден');
    console.log('scoreCards:', scoreCards ? 'найден' : 'не найден');
    console.log('leadersList:', leadersList ? 'найден' : 'не найден');
    console.log('participantsList:', participantsList ? 'найден' : 'не найден');

    // Проверяем наличие всех необходимых элементов
    const missingElements = [];
    if (!nominationFilter) missingElements.push('nominationFilter');
    if (!leadersNomination) missingElements.push('leadersNomination');
    if (!leadersLimit) missingElements.push('leadersLimit');
    if (!participantsNomination) missingElements.push('participantsNomination');
    if (!participantsFilter) missingElements.push('participantsFilter');
    if (!scoreCards) missingElements.push('scoreCards');
    if (!leadersList) missingElements.push('leadersList');
    if (!participantsList) missingElements.push('participantsList');

    if (missingElements.length > 0) {
        console.error('Отсутствующие элементы:', missingElements);
        return;
    }

    // Инициализация обработчиков событий
    nominationFilter.addEventListener('change', async () => {
        console.log('Выбрана номинация:', nominationFilter.value);
        await loadScores();
    });

    leadersNomination.addEventListener('change', () => {
        console.log('Выбрана номинация для лидеров:', leadersNomination.value);
        loadLeaders();
    });

    leadersLimit.addEventListener('change', () => {
        console.log('Выбран лимит для лидеров:', leadersLimit.value);
        loadLeaders();
    });

    participantsNomination.addEventListener('change', () => {
        console.log('Выбрана номинация для участников:', participantsNomination.value);
        loadParticipants();
    });

    participantsFilter.addEventListener('input', () => {
        console.log('Поиск участников:', participantsFilter.value);
        loadParticipants();
    });

    // Инициализация вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Загрузка начальных данных
    try {
        console.log('Загрузка данных...');
        showLoading(true);
        
        // Загружаем и парсим данные
        const parsedData = await parseSheetData();
        
        // Сохраняем данные в глобальную переменную
        appData = {
            nominations: parsedData.nominations || [],
            participants: parsedData.participants || [],
            scores: parsedData.scores || []
        };
        
        console.log('Данные загружены:', appData);
        
        // Заполняем фильтры
        await updateFilters();
        
        // Загружаем данные вкладки
        await loadTabData('scores');
        
        showLoading(false);
        console.log('Инициализация завершена успешно');
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError('Ошибка загрузки данных: ' + error.message);
        showLoading(false);
    }
});

// Функция для отображения состояния загрузки
function showLoading(isLoading) {
    const existingLoader = document.getElementById('loader');
    
    if (isLoading) {
        if (!existingLoader) {
            const loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loader';
            loader.textContent = 'Загрузка...';
            document.body.appendChild(loader);
        }
    } else {
        if (existingLoader) {
            existingLoader.remove();
        }
    }
}

// Функция для обновления фильтров
async function updateFilters() {
    try {
        // Заполняем выпадающие списки номинаций
        const nominationSelects = [nominationFilter, leadersNomination, participantsNomination];
        
        nominationSelects.forEach(select => {
            select.innerHTML = '<option value="">Все номинации</option>';
            appData.nominations.forEach(nomination => {
                const option = document.createElement('option');
                option.value = nomination;
                option.textContent = nomination;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Ошибка обновления фильтров:', error);
        showError('Ошибка загрузки фильтров');
    }
}

// Функция для отображения ошибок
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 7000);
}

// Функция для переключения вкладок
function switchTab(tabId) {
    // Скрываем все вкладки
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    const selectedTab = document.getElementById(`${tabId}Tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Обновляем активную кнопку
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Загружаем данные для выбранной вкладки
    loadTabData(tabId);
}

// Функция для загрузки данных вкладки
async function loadTabData(tabId) {
    try {
        switch (tabId) {
            case 'scores':
                await loadScores();
                break;
            case 'leaders':
                await loadLeaders();
                break;
            case 'participants':
                await loadParticipants();
                break;
        }
    } catch (error) {
        console.error(`Ошибка загрузки данных для вкладки ${tabId}:`, error);
        showError(`Ошибка загрузки данных для вкладки ${tabId}`);
    }
}

// Функция для загрузки оценок
async function loadScores() {
    try {
        const nomination = nominationFilter.value;
        console.log('Загрузка оценок для номинации:', nomination);
        
        // Фильтруем оценки из глобальных данных
        let filteredScores = appData.scores;
        
        if (nomination) {
            filteredScores = filteredScores.filter(score => score.nomination === nomination);
        }
        
        // Сортируем по итоговой оценке (от большей к меньшей)
        filteredScores = filteredScores.sort((a, b) => {
            if (a.finalScore === null) return 1;
            if (b.finalScore === null) return -1;
            return b.finalScore - a.finalScore;
        });
        
        console.log('Отфильтрованные оценки:', filteredScores);
        
        // Очищаем контейнер
        scoreCards.innerHTML = '';
        
        if (filteredScores.length === 0) {
            scoreCards.innerHTML = '<div class="no-data">Нет данных для отображения</div>';
            return;
        }
        
        // Создаем карточки для каждого участника
        filteredScores.forEach(score => {
            const card = document.createElement('div');
            card.className = 'score-card';
            
            // Создаем путь к изображению (предполагаем, что номер участника используется в имени файла)
            const imgPath = `../card/${score.participant}.jpg`;
            
            card.innerHTML = `
                <div class="score-header">
                    <div class="score-info">
                        <h3>${score.nomination}</h3>
                        <p>Участник ${score.participant} - ${score.name}</p>
                    </div>
                    <div class="score-image">
                        <a href="${imgPath}" class="lightzoom" data-lightzoom>
                            <img src="${imgPath}" alt="Участник ${score.participant}" onerror="this.src='../card/no-image.jpg';">
                        </a>
                    </div>
                </div>
                <div class="score-details">
                    <div class="score-item">
                        <span class="score-label">Оценка 1:</span>
                        <span class="score-value">${score.score1 !== null ? score.score1.toFixed(2) : 'Нет данных'}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Оценка 2:</span>
                        <span class="score-value">${score.score2 !== null ? score.score2.toFixed(2) : 'Нет данных'}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Оценка 3:</span>
                        <span class="score-value">${score.score3 !== null ? score.score3.toFixed(2) : 'Нет данных'}</span>
                    </div>
                    <div class="score-item final">
                        <span class="score-label">Итоговая оценка:</span>
                        <span class="score-value">${score.finalScore !== null ? score.finalScore.toFixed(2) : 'Нет данных'}</span>
                    </div>
                </div>
            `;
            
            scoreCards.appendChild(card);
        });
        
        // Инициализация lightzoom после добавления всех карточек
        $('.lightzoom').lightzoom({
            speed: 400,
            overlayOpacity: 0.5
        });
    } catch (error) {
        console.error('Ошибка при загрузке оценок:', error);
        showError('Ошибка при загрузке оценок');
    }
}

// Функция для загрузки лидеров
async function loadLeaders() {
    try {
        const nomination = leadersNomination.value;
        const limit = parseInt(leadersLimit.value);
        console.log('Загрузка лидеров для номинации:', nomination, 'с лимитом:', limit);
        
        // Фильтруем оценки из глобальных данных
        let filteredScores = appData.scores;
        
        if (nomination) {
            filteredScores = filteredScores.filter(score => score.nomination === nomination);
        }
        
        // Сортируем по итоговой оценке
        filteredScores = filteredScores.sort((a, b) => {
            if (a.finalScore === null) return 1;
            if (b.finalScore === null) return -1;
            return b.finalScore - a.finalScore;
        });
        
        // Ограничиваем количество лидеров
        const leaders = filteredScores.slice(0, limit);
        
        console.log('Лидеры:', leaders);
        
        // Очищаем контейнер
        leadersList.innerHTML = '';
        
        if (leaders.length === 0) {
            leadersList.innerHTML = '<div class="no-data">Нет данных для отображения</div>';
            return;
        }
        
        // Создаем список лидеров
        leaders.forEach((leader, index) => {
            const leaderItem = document.createElement('div');
            leaderItem.className = 'leader-item';
            
            // Создаем путь к изображению
            const imgPath = `../card/${leader.participant}.jpg`;
            
            leaderItem.innerHTML = `
                <div class="leader-rank">${index + 1}</div>
                <div class="leader-info">
                    <h3>${leader.nomination}</h3>
                    <p>Участник ${leader.participant} - ${leader.name}</p>
                </div>
                <div class="leader-image">
                    <a href="${imgPath}" class="lightzoom" data-lightzoom>
                        <img src="${imgPath}" alt="Участник ${leader.participant}" onerror="this.src='../card/no-image.jpg';">
                    </a>
                </div>
                <div class="leader-score">
                    <span class="score-value">${leader.finalScore !== null ? leader.finalScore.toFixed(2) : 'Нет данных'}</span>
                </div>
            `;
            
            leadersList.appendChild(leaderItem);
        });
        
        // Инициализация lightzoom после добавления всех лидеров
        $('.lightzoom').lightzoom({
            speed: 400,
            overlayOpacity: 0.5
        });
    } catch (error) {
        console.error('Ошибка при загрузке лидеров:', error);
        showError('Ошибка при загрузке лидеров');
    }
}

// Функция для загрузки участников
async function loadParticipants() {
    try {
        const nomination = participantsNomination.value;
        const searchText = participantsFilter.value.toLowerCase();
        console.log('Загрузка участников для номинации:', nomination, 'с поиском:', searchText);
        
        // Фильтруем участников из глобальных данных
        let filteredParticipants = appData.participants;
        
        if (nomination) {
            filteredParticipants = filteredParticipants.filter(p => p.nomination === nomination);
        }
        
        // Фильтруем по поисковому запросу
        if (searchText) {
            filteredParticipants = filteredParticipants.filter(p => 
                p.name.toLowerCase().includes(searchText) || 
                p.number.toLowerCase().includes(searchText)
            );
        }
        
        // Получаем оценки для сортировки участников
        const participantsWithScores = filteredParticipants.map(participant => {
            const score = appData.scores.find(s => 
                s.nomination === participant.nomination && 
                s.participant === participant.number
            );
            
            return {
                ...participant,
                finalScore: score ? score.finalScore : null
            };
        });
        
        // Сортируем по итоговой оценке
        participantsWithScores.sort((a, b) => {
            if (a.finalScore === null) return 1;
            if (b.finalScore === null) return -1;
            return b.finalScore - a.finalScore;
        });
        
        console.log('Отфильтрованные участники:', participantsWithScores);
        
        // Очищаем контейнер
        participantsList.innerHTML = '';
        
        if (participantsWithScores.length === 0) {
            participantsList.innerHTML = '<div class="no-data">Нет данных для отображения</div>';
            return;
        }
        
        // Создаем список участников
        participantsWithScores.forEach(participant => {
            const participantItem = document.createElement('div');
            participantItem.className = 'participant-item';
            
            // Создаем путь к изображению
            const imgPath = `../card/${participant.number}.jpg`;
            
            const finalScore = participant.finalScore !== null 
                ? participant.finalScore.toFixed(2) 
                : 'Нет оценки';
            
            participantItem.innerHTML = `
                <div class="participant-info">
                    <div class="participant-details">
                        <h3>${participant.nomination}</h3>
                        <p>Участник ${participant.number} - ${participant.name}</p>
                        <p class="participant-score">Итоговая оценка: ${finalScore}</p>
                    </div>
                    <div class="participant-image">
                        <a href="${imgPath}" class="lightzoom" data-lightzoom>
                            <img src="${imgPath}" alt="Участник ${participant.number}" onerror="this.src='../card/no-image.jpg';">
                        </a>
                    </div>
                </div>
            `;
            
            participantsList.appendChild(participantItem);
        });
        
        // Инициализация lightzoom после добавления всех участников
        $('.lightzoom').lightzoom({
            speed: 400,
            overlayOpacity: 0.5
        });
    } catch (error) {
        console.error('Ошибка при загрузке участников:', error);
        showError('Ошибка при загрузке участников');
    }
} 