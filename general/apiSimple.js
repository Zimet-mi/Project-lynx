/* Standalone copy of api.js (read-only mode uses only fetching, no saves) */
window.GOOGLE_SCRIPT_URLS = window.GOOGLE_SCRIPT_URLS || {
    getSheetId: 'https://script.google.com/macros/s/AKfycbyJybPhXtndgtRfWrTzVRft9hTY83Jj42KQOPOnebPUPqQrGZd6J09YtD7Vf8-SKGs/exec',
    saveData: 'https://script.google.com/macros/s/AKfycbyJybPhXtndgtRfWrTzVRft9hTY83Jj42KQOPOnebPUPqQrGZd6J09YtD7Vf8-SKGs/exec'
};
window.CACHE_CONFIG = window.CACHE_CONFIG || { generalExpiry: 420000, participantsExpiry: 120000 };

class GoogleSheetsApi {
    constructor() { this.sheetIdCache = null; this.timeout = 30000; }

    static columnLetterToIndex(column) {
        if (!column || typeof column !== 'string') return 0;
        const c = column.trim().toUpperCase();
        return c.charCodeAt(0) - 'A'.charCodeAt(0);
    }
    async getSheetId() {
        if (this.sheetIdCache) return this.sheetIdCache;
        if (window.VOLUNTEER_SHEET_ID) { this.sheetIdCache = window.VOLUNTEER_SHEET_ID; return this.sheetIdCache; }
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
    updateCachedCell(sheetName, rowNumber, columnLetter, value) {
        try {
            const range = RangeHelper.getSheetRange(sheetName);
            if (!range) return false;
            const cacheKey = `data_${sheetName}_${range}`;
            const timeKey = `time_${sheetName}_${range}`;
            const raw = localStorage.getItem(cacheKey);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data || !Array.isArray(data.values)) return false;
            const rowIdx = rowNumber - 1;
            if (rowIdx < 0) return false;
            const colIdx = GoogleSheetsApi.columnLetterToIndex(columnLetter);
            while (data.values.length <= rowIdx) data.values.push([]);
            const rowArr = Array.isArray(data.values[rowIdx]) ? data.values[rowIdx] : [];
            while (rowArr.length <= colIdx) rowArr.push('');
            rowArr[colIdx] = value == null ? '' : value;
            data.values[rowIdx] = rowArr;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(timeKey, Date.now().toString());
            return true;
        } catch { return false; }
    }
    async saveData(value, column, row, sheetName) {
        try {
            const params = new URLSearchParams({ column, row, value, sheet: sheetName });
            const response = await axios.get(`${GOOGLE_SCRIPT_URLS.saveData}?${params.toString()}`, { timeout: this.timeout });
            return response.status === 200;
        } catch { return false; }
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


