// Инициализация Telegram WebApp (если доступен)
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
}

// Флаг для отслеживания инициализации модуля SpecialPrizes
let specialPrizesModuleReady = false;

// Добавляем слушатель события загрузки модуля SpecialPrizes
document.addEventListener('specialPrizesReady', (event) => {
    console.log('Получено событие specialPrizesReady, модуль загружен');
    specialPrizesModuleReady = true;
});

// Глобальные переменные для хранения данных
let appData = {
    nominations: [],
    participants: [],
    scores: []
};

// Глобальные переменные для DOM-элементов
let tabs, tabContents, nominationFilter, specialNominationFilter;
let participantsNomination, participantsFilter, scoreCards, scoresList;
let specialPrizesList, participantsList, isAdminHtml;

// Ждем загрузки DOM перед инициализацией
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM загружен, начинаем инициализацию...');
    
    // Получаем элементы DOM
    tabs = document.querySelectorAll('.tab');
    tabContents = document.querySelectorAll('.tab-content');
    
    // Получаем элементы формы, которые могут быть в любой из структур HTML
    nominationFilter = document.getElementById('nominationFilter');
    specialNominationFilter = document.getElementById('specialNominationFilter');
    participantsNomination = document.getElementById('participantsNomination') || document.getElementById('participantsBlock'); // Учитываем разные имена в разных HTML
    participantsFilter = document.getElementById('participantsFilter');
    
    // Получаем контейнеры для контента
    scoreCards = document.getElementById('scoreCards');
    scoresList = document.getElementById('scoresList');
    specialPrizesList = document.getElementById('specialPrizesList');
    participantsList = document.getElementById('participantsList');
    
    // Адаптивная логика для проверки структуры HTML
    isAdminHtml = !!document.getElementById('scoresTab');
    
    // Подробное логирование для отладки
    console.log('Проверка элементов:');
    console.log('tabs:', tabs.length > 0 ? 'найдены' : 'не найдены');
    console.log('tabContents:', tabContents.length > 0 ? 'найдены' : 'не найдены');
    console.log('Обнаружен тип HTML:', isAdminHtml ? 'admin.html' : 'index.html');
    console.log('nominationFilter:', nominationFilter ? 'найден' : 'не найден');
    console.log('specialNominationFilter:', specialNominationFilter ? 'найден' : 'не найден');
    console.log('participantsNomination/Block:', participantsNomination ? 'найден' : 'не найден');
    console.log('participantsFilter:', participantsFilter ? 'найден' : 'не найден');
    console.log('scoreCards:', scoreCards ? 'найден' : 'не найден');
    console.log('scoresList:', scoresList ? 'найден' : 'не найден');
    console.log('specialPrizesList:', specialPrizesList ? 'найден' : 'не найден');
    console.log('participantsList:', participantsList ? 'найден' : 'не найден');

    // Проверяем наличие всех необходимых элементов для текущей структуры HTML
    const missingElements = [];
    
    // Проверяем обязательные элементы, общие для обеих структур
    if (!nominationFilter) missingElements.push('nominationFilter');
    if (!specialNominationFilter) missingElements.push('specialNominationFilter');
    if (!participantsNomination) missingElements.push('participantsNomination/Block');
    
    // Проверяем элементы, специфичные для admin.html
    if (isAdminHtml) {
        if (!participantsFilter) missingElements.push('participantsFilter');
        if (!scoreCards) missingElements.push('scoreCards');
    } else { // index.html
        if (!scoresList) missingElements.push('scoresList');
    }
    
    // Общие для обеих структур
    if (!specialPrizesList) missingElements.push('specialPrizesList');
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

    specialNominationFilter.addEventListener('change', async () => {
        console.log('Выбран спецприз:', specialNominationFilter.value);
        await loadSpecialPrizes();
    });

    participantsNomination.addEventListener('change', () => {
        console.log('Выбрана номинация для участников:', participantsNomination.value);
        loadParticipants();
    });

    if (participantsFilter) {
        participantsFilter.addEventListener('input', () => {
            console.log('Поиск участников:', participantsFilter.value);
            loadParticipants();
        });
    }

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
        
        // Загружаем номинации спецпризов
        await loadSpecialNominations();
        
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
        const nominationSelects = [nominationFilter];
        
        if (participantsNomination) {
            nominationSelects.push(participantsNomination);
        }
        
        nominationSelects.forEach(select => {
            if (!select) return;
            
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
    console.log('Переключение на вкладку:', tabId);
    
    // Скрываем все вкладки с классом .tab-content (для admin.html)
    if (tabContents && tabContents.length > 0) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
    }
    
    // Для admin.html - используем класс .tab-content
    const selectedTabContent = document.getElementById(`${tabId}Tab`);
    if (selectedTabContent) {
        selectedTabContent.classList.add('active');
    }
    
    // Для index.html - используем ID без суффикса и класс .content
    const alternativeTabContent = document.getElementById(tabId);
    if (alternativeTabContent && alternativeTabContent.classList.contains('content')) {
        // Скрываем все вкладки в index.html
        const indexTabs = document.querySelectorAll('.content');
        indexTabs.forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Показываем выбранную вкладку
        alternativeTabContent.style.display = 'block';
    }
    
    // Обновляем активные кнопки
    if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    
    // Загружаем данные для выбранной вкладки
    loadTabData(tabId);
}

// Функция для загрузки данных вкладки
async function loadTabData(tabId) {
    console.log('Загрузка данных для вкладки:', tabId);
    
    switch (tabId) {
        case 'scores':
            await loadScores();
            break;
        case 'specialPrizes':
            await loadSpecialPrizes();
            break;
        case 'participants':
            await loadParticipants();
            break;
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
        
        // Определяем, какой контейнер использовать в зависимости от структуры HTML
        const container = scoreCards || scoresList;
        
        // Очищаем контейнер
        if (container) {
            container.innerHTML = '';
            
            // Если нет данных для отображения
            if (filteredScores.length === 0) {
                container.innerHTML = '<div class="no-data">Нет оценок для отображения</div>';
                return;
            }
            
            // Если это admin.html (используем scoreCards)
            if (scoreCards) {
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
                                <span class="score-label">${score.jury1.name}:</span>
                                <span class="score-value">${score.jury1.score !== null ? score.jury1.score.toFixed(2) : 'Нет данных'}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">${score.jury2.name}:</span>
                                <span class="score-value">${score.jury2.score !== null ? score.jury2.score.toFixed(2) : 'Нет данных'}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">${score.jury3.name}:</span>
                                <span class="score-value">${score.jury3.score !== null ? score.jury3.score.toFixed(2) : 'Нет данных'}</span>
                            </div>
                            <div class="score-item final">
                                <span class="score-label">Итоговая оценка:</span>
                                <span class="score-value">${score.finalScore !== null ? score.finalScore.toFixed(2) : 'Нет данных'}</span>
                            </div>
                        </div>
                    `;
                    
                    container.appendChild(card);
                });
                
                // Инициализация lightzoom после добавления всех карточек
                if (typeof $ !== 'undefined' && $.lightzoom) {
                    $('.lightzoom').lightzoom({
                        speed: 400,
                        overlayOpacity: 0.5
                    });
                }
            } else if (scoresList) { // Если это index.html (используем scoresList)
                // Создаем список для index.html
                filteredScores.forEach(score => {
                    const item = document.createElement('div');
                    item.className = 'score-item';
                    
                    item.innerHTML = `
                        <div class="score-header">
                            <strong>${score.nomination} - Участник ${score.participant}</strong>
                            <span class="score-value">${score.finalScore !== null ? score.finalScore.toFixed(2) : 'Нет оценки'}</span>
                        </div>
                    `;
                    
                    container.appendChild(item);
                });
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке оценок:', error);
        showError('Ошибка при загрузке оценок');
    }
}

// Функция для загрузки номинаций спецпризов
async function loadSpecialNominations() {
    try {
        // Проверяем готовность модуля
        if (!window.SpecialPrizes && !specialPrizesModuleReady) {
            console.log('Модуль SpecialPrizes не найден, создаем пустой модуль');
            // Создаем заглушку объекта, пока скрипт не загрузится
            window.SpecialPrizes = {
                getSpecialNominations: async () => {
                    console.log('Используется временный метод getSpecialNominations');
                    return [];
                },
                getSpecialPrizeWinners: async () => {
                    console.log('Используется временный метод getSpecialPrizeWinners');
                    return [];
                },
                getAllSpecialPrizeWinners: async () => {
                    console.log('Используется временный метод getAllSpecialPrizeWinners');
                    return [];
                }
            };
            
            // Ждем событие инициализации модуля
            console.log('Ожидание инициализации модуля SpecialPrizes...');
            
            // Ждем небольшую паузу, чтобы дать шанс подгрузиться скрипту
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Проверяем еще раз после паузы
            if (!specialPrizesModuleReady && !window.SpecialPrizes.isInitialized) {
                console.error('Модуль SpecialPrizes все еще не загружен после ожидания');
            } else {
                console.log('Модуль SpecialPrizes успешно инициализирован');
            }
        }
        
        // Получаем номинации спецпризов
        const nominations = await SpecialPrizes.getSpecialNominations();
        console.log('Загружены номинации спецпризов:', nominations);
        
        // Заполняем выпадающий список
        if (specialNominationFilter) {
            specialNominationFilter.innerHTML = '<option value="">Все спецпризы</option>';
            
            nominations.forEach(nomination => {
                const option = document.createElement('option');
                option.value = nomination;
                option.textContent = nomination;
                specialNominationFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке номинаций спецпризов:', error);
        showError('Ошибка при загрузке номинаций спецпризов');
    }
}

// Функция для загрузки данных спецпризов
async function loadSpecialPrizes() {
    try {
        // Получаем выбранную номинацию из фильтра
        const nomination = specialNominationFilter.value;
        console.log('Загрузка спецпризов для номинации:', nomination || 'все');
        
        // Проверяем готовность модуля
        if (!window.SpecialPrizes && !specialPrizesModuleReady) {
            console.log('Модуль SpecialPrizes не найден для loadSpecialPrizes, создаем пустой модуль');
            // Создаем заглушку объекта, пока скрипт не загрузится
            window.SpecialPrizes = {
                getSpecialNominations: async () => {
                    console.log('Используется временный метод getSpecialNominations');
                    return [];
                },
                getSpecialPrizeWinners: async () => {
                    console.log('Используется временный метод getSpecialPrizeWinners');
                    return [];
                },
                getAllSpecialPrizeWinners: async () => {
                    console.log('Используется временный метод getAllSpecialPrizeWinners');
                    return [];
                }
            };
            
            // Ждем событие инициализации модуля
            console.log('Ожидание инициализации модуля SpecialPrizes...');
            
            // Ждем небольшую паузу, чтобы дать шанс подгрузиться скрипту
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Проверяем еще раз после паузы
            if (!specialPrizesModuleReady && !window.SpecialPrizes.isInitialized) {
                specialPrizesList.innerHTML = '<div class="error">Модуль SpecialPrizes не загружен</div>';
                return;
            } else {
                console.log('Модуль SpecialPrizes успешно инициализирован');
            }
        }
        
        // Показываем статус загрузки
        specialPrizesList.innerHTML = '<div class="loading">Загрузка спецпризов...</div>';
        
        // Получаем данные из API
        let winners;
        if (nomination) {
            winners = await SpecialPrizes.getSpecialPrizeWinners(nomination);
        } else {
            winners = await SpecialPrizes.getAllSpecialPrizeWinners();
        }
        
        console.log('Получены победители спецпризов:', winners);
        
        // Очищаем контейнер
        specialPrizesList.innerHTML = '';
        
        // Проверяем, есть ли данные для отображения
        if (!winners || winners.length === 0) {
            specialPrizesList.innerHTML = '<div class="no-data">Нет данных о спецпризах</div>';
            return;
        }
        
        // Группируем победителей по номинациям
        const winnersByNomination = {};
        winners.forEach(winner => {
            if (!winnersByNomination[winner.nomination]) {
                winnersByNomination[winner.nomination] = [];
            }
            winnersByNomination[winner.nomination].push(winner);
        });
        
        // Создаем DOM-элементы для отображения данных
        Object.keys(winnersByNomination).forEach(nominationName => {
            const nominationWinners = winnersByNomination[nominationName];
            
            // Создаем контейнер для номинации
            const nominationContainer = document.createElement('div');
            nominationContainer.className = 'special-prize-category';
            
            // Дополнительный класс для выделения особых номинаций
            if (nominationName.toLowerCase().includes('гран-при')) {
                nominationContainer.classList.add('grand-prix');
            } else if (nominationName.toLowerCase().includes('пошив')) {
                nominationContainer.classList.add('best-sewing');
            }
            
            // Добавляем заголовок номинации
            const nominationHeader = document.createElement('h3');
            nominationHeader.className = 'special-prize-header';
            nominationHeader.textContent = nominationName;
            nominationContainer.appendChild(nominationHeader);
            
            // Добавляем победителей
            const winnersContainer = document.createElement('div');
            winnersContainer.className = 'special-prize-winners';
            
            nominationWinners.forEach((winner, index) => {
                const winnerItem = document.createElement('div');
                winnerItem.className = 'special-prize-winner';
                
                // Создаем путь к изображению
                const imgPath = `../card/${winner.participant}.jpg`;
                
                // Для admin.html - более красивый дизайн с изображениями
                if (isAdminHtml) {
                    // Создаем HTML для отображения оценок жюри
                    const juryMarksHtml = winner.juryMarks ? 
                        winner.juryMarks.map(jury => 
                            `<div class="jury-mark ${jury.hasVoted ? 'voted' : 'not-voted'}">
                                <span class="jury-name">${jury.juryName}:</span>
                                <span class="jury-vote">${jury.hasVoted ? (jury.mark || '✓') : '—'}</span>
                            </div>`
                        ).join('') : '';
                
                    winnerItem.innerHTML = `
                        <div class="winner-info">
                            <div class="winner-place">${winner.place || ''}</div>
                            <div class="winner-details">
                                <p>Участник ${winner.participant} - ${winner.name || ''}</p>
                                <p class="jury-marks">Отметок жюри: ${winner.marksCount || 0}</p>
                                <div class="jury-marks-details">
                                    ${juryMarksHtml}
                                </div>
                            </div>
                            <div class="winner-image">
                                <a href="${imgPath}" class="lightzoom" data-lightzoom>
                                    <img src="${imgPath}" alt="Участник ${winner.participant}" onerror="this.src='../card/no-image.jpg';">
                                </a>
                            </div>
                        </div>
                    `;
                } else {
                    // Формируем строку с именами проголосовавших жюри
                    const votedJuryText = winner.votedJury && winner.votedJury.length > 0 ? 
                        `(${winner.votedJury.join(', ')})` : '';
                        
                    // Для index.html - более простой дизайн
                    winnerItem.innerHTML = `
                        <div class="winner-header">
                            <span class="winner-place">${winner.place || ''}</span>
                            <strong>Участник ${winner.participant} ${winner.name ? '- ' + winner.name : ''}</strong>
                            <span class="jury-marks-count">Отметок: ${winner.marksCount || 0}</span>
                            <span class="jury-names">${votedJuryText}</span>
                        </div>
                    `;
                }
                
                winnersContainer.appendChild(winnerItem);
            });
            
            nominationContainer.appendChild(winnersContainer);
            specialPrizesList.appendChild(nominationContainer);
        });
        
        // Инициализация lightzoom, если есть jQuery и мы в admin.html
        if (isAdminHtml && typeof $ !== 'undefined' && $.lightzoom) {
            $('.lightzoom').lightzoom({
                speed: 400,
                overlayOpacity: 0.5
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке спецпризов:', error);
        specialPrizesList.innerHTML = `<div class="error">Ошибка при загрузке спецпризов: ${error.message}</div>`;
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