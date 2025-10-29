/* Standalone copy of api.js (read-only mode uses only fetching, no saves) */
window.GOOGLE_SCRIPT_URLS = window.GOOGLE_SCRIPT_URLS || {
    getSheetId: 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec',
    saveData: 'https://script.google.com/macros/s/AKfycbxQ3MrknFLRGXb6J7YJcNEVe5IShT-AITtvSvZHHSwK1OPvs-4ikzDXeSWQ60czU5z1/exec'
};
window.CACHE_CONFIG = window.CACHE_CONFIG || { generalExpiry: 420000, participantsExpiry: 120000 };

class GoogleSheetsApi {
    constructor() { this.sheetIdCache = null; this.timeout = 30000; }
    async getSheetId() {
        if (this.sheetIdCache) return this.sheetIdCache;
        const fromSession = sessionStorage.getItem('SHEET_ID');
        if (fromSession) { this.sheetIdCache = fromSession; return this.sheetIdCache; }
        const res = await axios.get(GOOGLE_SCRIPT_URLS.getSheetId, { timeout: this.timeout });
        this.sheetIdCache = res.data; sessionStorage.setItem('SHEET_ID', this.sheetIdCache); return this.sheetIdCache;
    }
    getCachedData(sheetName, range) { const k = `data_${sheetName}_${range}`; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
    async fetchDataWithCache(sheetName, range, cacheExpiry = CACHE_CONFIG.generalExpiry) {
        const cacheKey = `data_${sheetName}_${range}`; const timeKey = `time_${sheetName}_${range}`;
        const cached = localStorage.getItem(cacheKey); const t = localStorage.getItem(timeKey);
        if (cached && t && Date.now() - parseInt(t) < cacheExpiry) return JSON.parse(cached);
        const sheetId = await this.getSheetId();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${API_KEY}`;
        const res = await axios.get(url, { timeout: this.timeout });
        localStorage.setItem(cacheKey, JSON.stringify(res.data)); localStorage.setItem(timeKey, Date.now().toString());
        return res.data;
    }
    async preloadAllData() {
        const promises = [];
        const loaded = new Set();
        (ALL_PARTICIPANTS_SHEETS || []).forEach(({ sheet }) => {
            if (!loaded.has(sheet)) { loaded.add(sheet); const range = RangeHelper.getSheetRange(sheet); if (range) promises.push(this.fetchDataWithCache(sheet, range, CACHE_CONFIG.generalExpiry)); }
        });
        await Promise.all(promises);
    }
}

const googleSheetsApi = new GoogleSheetsApi();
window.googleSheetsApi = googleSheetsApi;


