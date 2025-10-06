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
    showAlert: (message) => {
		try {
			if (window.Telegram && window.Telegram.WebApp) {
				// Пробуем разные методы показа уведомлений
				if (window.Telegram.WebApp.showPopup) {
					window.Telegram.WebApp.showPopup({
						title: 'Уведомление',
						message: message,
						buttons: [{ type: 'ok' }]
					});
				} else if (window.Telegram.WebApp.showConfirm) {
					window.Telegram.WebApp.showConfirm(message, (ok) => {});
				} else {
					// Fallback - используем стандартный alert
					alert(message);
				}
			} else {
				alert(message);
			}
		} catch (error) {
			console.warn('Telegram WebApp alert failed:', error);
			alert(message); // Fallback
		}
	},

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

const telegramApi = {
    init: () => {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
                return true;
            }
            return false;
        } catch (error) {
            console.warn('Telegram WebApp init failed:', error);
            return false;
        }
    },
    
    hapticFeedback: (type, style = 'light') => {
        try {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                if (type === 'impact') {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
                } else if (type === 'selection') {
                    window.Telegram.WebApp.HapticFeedback.selectionChanged();
                }
            }
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    },
    
    showAlert: (message) => {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                // Пробуем разные доступные методы
                if (window.Telegram.WebApp.showPopup) {
                    window.Telegram.WebApp.showPopup({
                        title: 'Уведомление',
                        message: message,
                        buttons: [{ type: 'ok' }]
                    });
                } else if (window.Telegram.WebApp.showConfirm) {
                    window.Telegram.WebApp.showConfirm(message, () => {});
                } else if (window.Telegram.WebApp.alert) {
                    window.Telegram.WebApp.alert(message);
                } else {
                    alert(message);
                }
            } else {
                alert(message);
            }
        } catch (error) {
            console.warn('Telegram WebApp alert failed:', error);
            alert(message); // Fallback
        }
    }
};