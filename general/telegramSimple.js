/* Standalone copy of telegram.js (subset) */
class TelegramApi {
    constructor() { this.tg = null; this.isInitialized = false; }
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp; this.isInitialized = true; this.tg.ready(); this.tg.expand(); return true;
        }
        return false;
    }
    isMobile() { return this.tg?.isMobile || false; }
    openLink(url) { if (this.tg) this.tg.openLink(url); else window.open(url, '_blank'); }
}
const telegramApi = new TelegramApi();
window.telegramApi = telegramApi;


