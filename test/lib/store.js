'use strict';

(function() {
    if (typeof window === 'undefined') return;

    const subscribers = new Set();
    const readySubscribers = new Set();

    // Нормализованные данные: ключ -> sheet:row
    const byKey = new Map();
    // Группы по листам
    const bySheet = new Map();

    function keyOf(sheet, row) { return `${sheet}:${row}`; }

    function notifyChanged() {
        subscribers.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    }

    function notifyReady() {
        readySubscribers.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    }

    function replaceAllParticipants(participantsArray) {
        byKey.clear();
        bySheet.clear();
        participantsArray.forEach(p => {
            const k = keyOf(p.sheet, p.dataRow);
            byKey.set(k, p);
            if (!bySheet.has(p.sheet)) bySheet.set(p.sheet, []);
            bySheet.get(p.sheet).push(p);
        });
        notifyChanged();
    }

    function upsertParticipantPatch({ sheet, row, column, value }) {
        const k = keyOf(sheet, row);
        const p = byKey.get(k);
        if (!p) return;
        const next = { ...p, scores: { ...p.scores }, checkboxes: { ...p.checkboxes } };
        if (column === 'C' || column === 'D' || column === 'E' || column === 'F') {
            next.scores[column] = value || '';
        } else if (column === 'G') {
            next.scores.comment = value || '';
        } else {
            const colCode = column && column.charCodeAt && column.charCodeAt(0);
            if (colCode && colCode >= 'I'.charCodeAt(0) && colCode <= 'N'.charCodeAt(0)) {
                const activePrizes = (typeof getActiveSpecialPrizes === 'function') ? getActiveSpecialPrizes() : [];
                const checkboxes = { ...next.checkboxes };
                activePrizes.forEach((prize, idx) => {
                    if (prize.column === column) {
                        checkboxes[idx] = !!(value && value.toString().trim() !== '');
                    }
                });
                next.checkboxes = checkboxes;
            }
        }
        byKey.set(k, next);
        const list = bySheet.get(sheet) || [];
        const idx = list.findIndex(x => x.dataRow === row);
        if (idx >= 0) {
            const updated = list.slice();
            updated[idx] = next;
            bySheet.set(sheet, updated);
        }
        notifyChanged();
    }

    function mapRowToParticipant(row, idx, sheet) {
        // Пропускаем пустые строки: нужен и номер (A), и имя (B)
        if (!row || !row[0] || !row[1]) return null;
        const id = row[0];
        const name = row[1];
        const dataRow = idx + 2;
        return {
            id,
            name,
            img: `${id}.jpg`,
            row: dataRow,
            dataRow,
            sheet,
            raw: row,
            scores: {
                C: row[2] || '',
                D: row[3] || '',
                E: row[4] || '',
                F: row[5] || '',
                comment: row[6] || ''
            },
            checkboxes: (typeof getActiveSpecialPrizes === 'function' ? getActiveSpecialPrizes() : []).reduce((acc, prize, index) => {
                const colIndex = prize.column.charCodeAt(0) - 'A'.charCodeAt(0);
                acc[index] = row[colIndex] ? row[colIndex].toString().trim() !== '' : false;
                return acc;
            }, {})
        };
    }

    async function initFromCache() {
        try {
            const participants = [];
            for (const { sheet } of (window.ALL_PARTICIPANTS_SHEETS || [])) {
                const range = RangeHelper.getSheetRange(sheet);
                if (!range) continue;
                const cached = googleSheetsApi.getCachedData(sheet, range);
                if (cached && cached.values) {
                    const rows = cached.values.slice(1);
                    rows.forEach((row, idx) => {
                        const p = mapRowToParticipant(row, idx, sheet);
                        if (p) participants.push(p);
                    });
                }
            }
            replaceAllParticipants(participants);
            notifyReady();
        } catch (e) {
            console.warn('AppStore initFromCache error:', e);
            notifyReady();
        }
    }

    function getAllParticipants() {
        const result = [];
        bySheet.forEach(list => result.push(...list));
        return result;
    }

    function getParticipantsForSection(sectionId) {
        // Секция опирается на SECTION_RANGES и mainSheet
        const range = (function(section){
            switch (section) {
                case 'One': return SECTION_RANGES.section1;
                case 'Two': return SECTION_RANGES.section2;
                case 'Three': return SECTION_RANGES.section3;
                default: return [1, 1000];
            }
        })(sectionId);
        const sheet = SHEET_CONFIG.mainSheet;
        const list = bySheet.get(sheet) || [];
        const [start, end] = range;
        return list.filter(p => p.dataRow >= start && p.dataRow <= end);
    }

    function subscribe(callback) {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    }

    function onReady(callback) {
        readySubscribers.add(callback);
        return () => readySubscribers.delete(callback);
    }

    // Авто-синхронизация из событий ячеек
    if (window.AppEvents && typeof AppEvents.on === 'function') {
        AppEvents.on('cellChanged', ({ sheet, row, column, value }) => {
            upsertParticipantPatch({ sheet, row, column, value });
        });
    }

    window.AppStore = {
        initFromCache,
        subscribe,
        onReady,
        getAllParticipants,
        getParticipantsForSection
    };
})();


