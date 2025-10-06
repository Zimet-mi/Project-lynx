// Telegram WebApp API интеграция

class TelegramApi {
    constructor() {
        this.tg = null;
        this.user = null;
        this.isInitialized = false;
    }

    // Инициализация Telegram WebApp
    init() {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.user = this.tg.initDataUnsafe?.user || null;
            this.isInitialized = true;
            
            console.log('Telegram WebApp инициализирован:', {
                user: this.user,
                version: this.tg.version,
                platform: this.tg.platform
            });

            // Настройка WebApp
            this.tg.ready();
            this.tg.expand();
            
            // Настройка кнопки "Назад"
            this.setupBackButton();
            
            return true;
        } else {
            console.warn('Telegram WebApp API недоступен');
            return false;
        }
    }

    // Настройка кнопки "Назад"
    setupBackButton() {
        if (!this.tg) return;

        this.tg.BackButton.show();
        this.tg.BackButton.onClick(() => {
            this.tg.close();
        });
    }

    // Скрыть кнопку "Назад"
    hideBackButton() {
        if (this.tg) {
            this.tg.BackButton.hide();
        }
    }

    // Показать кнопку "Назад"
    showBackButton() {
        if (this.tg) {
            this.tg.BackButton.show();
        }
    }

    // Закрыть WebApp
    close() {
        if (this.tg) {
            this.tg.close();
        }
    }

    // Получить информацию о пользователе
    getUser() {
        return this.user;
    }

    // Показать всплывающее окно
    showPopup(params) {
        if (this.tg) {
            this.tg.showPopup(params);
        }
    }

    // Показать предупреждение
    showAlert(message) {
        if (this.tg) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }

    // Показать подтверждение
    showConfirm(message, callback) {
        if (this.tg) {
            this.tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    }

    // Включить/выключить кнопку главного меню
    setMainButton(text, callback) {
        if (this.tg) {
            this.tg.MainButton.setText(text);
            this.tg.MainButton.onClick(callback);
            this.tg.MainButton.show();
        }
    }

    // Скрыть кнопку главного меню
    hideMainButton() {
        if (this.tg) {
            this.tg.MainButton.hide();
        }
    }

    // Отправить данные на сервер
    sendData(data) {
        if (this.tg) {
            this.tg.sendData(JSON.stringify(data));
        }
    }

    // Открыть ссылку
    openLink(url) {
        if (this.tg) {
            this.tg.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    }

    // Вибрация
    hapticFeedback(type = 'impact', style = 'medium') {
		if (this.tg && this.tg.HapticFeedback && this.tg.version && parseFloat(this.tg.version) > 6.0) {
			switch (type) {
				case 'impact':
					this.tg.HapticFeedback.impactOccurred(style);
					break;
				case 'notification':
					this.tg.HapticFeedback.notificationOccurred(style);
					break;
				case 'selection':
					this.tg.HapticFeedback.selectionChanged();
					break;
				default:
					this.tg.HapticFeedback.impactOccurred('medium');
			}
		}
		// Для версий 6.0 и ниже просто игнорируем вызов вибрации
	}

    // Получить тему
    getTheme() {
        return this.tg?.colorScheme || 'light';
    }

    // Получить параметры темы
    getThemeParams() {
        return this.tg?.themeParams || {};
    }

    // Проверить, является ли устройство мобильным
    isMobile() {
        return this.tg?.isMobile || false;
    }

    // Получить размеры экрана
    getViewport() {
        if (this.tg) {
            return {
                width: this.tg.viewportWidth,
                height: this.tg.viewportHeight,
                stableHeight: this.tg.viewportStableHeight
            };
        }
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            stableHeight: window.innerHeight
        };
    }
}

// Создаем единственный экземпляр
const telegramApi = new TelegramApi();
