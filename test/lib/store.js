'use strict';
(function(){ if(typeof window==='undefined') return; const subscribers=new Set(); const bySheet=new Map();
 function replaceAll(parts){ bySheet.clear(); parts.forEach(p=>{ if(!bySheet.has(p.sheet)) bySheet.set(p.sheet,[]); bySheet.get(p.sheet).push(p);}); subscribers.forEach(fn=>{try{fn();}catch{}}); }
 function mapRow(row,idx,sheet){ if(!row||!row[0]||!row[1]) return null; const id=row[0], name=row[1], dataRow=idx+2; return { id, name, img:`${id}.jpg`, row:dataRow, dataRow, sheet, raw:row, scores:{ C:row[2]||'', D:row[3]||'', E:row[4]||'', F:row[5]||'', comment:row[6]||'' } }; }
 async function initFromCache(){ const parts=[]; for(const {sheet} of (ALL_PARTICIPANTS_SHEETS||[])){ const range=RangeHelper.getSheetRange(sheet); if(!range) continue; let data=googleSheetsApi.getCachedData(sheet,range); if(!data){ try{ data=await googleSheetsApi.fetchDataWithCache(sheet,range,CACHE_CONFIG.generalExpiry);}catch{} } if(data&&data.values){ const rows=data.values.slice(1); rows.forEach((r,i)=>{ const p=mapRow(r,i,sheet); if(p) parts.push(p); }); } }
 replaceAll(parts); }
 function getAllParticipants(){ const res=[]; bySheet.forEach(l=>res.push(...l)); return res; }
 function getParticipantsForSection(section){ const range=(section==='One'?SECTION_RANGES.section1:section==='Two'?SECTION_RANGES.section2:SECTION_RANGES.section3)||[1,1000]; const sheet=SHEET_CONFIG.mainSheet; const list=bySheet.get(sheet)||[]; const [s,e]=range; return list.filter(p=>p.dataRow>=s&&p.dataRow<=e); }
 function subscribe(cb){ subscribers.add(cb); return ()=>subscribers.delete(cb); }
 window.AppStore={ initFromCache, getAllParticipants, getParticipantsForSection, subscribe };
})();


