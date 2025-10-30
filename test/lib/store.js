'use strict';
(function(){ if(typeof window==='undefined') return; const subscribers=new Set(); const bySheet=new Map();
 function notify(){ subscribers.forEach(fn=>{try{fn();}catch{}}); }
 function replaceAll(parts){ bySheet.clear(); parts.forEach(p=>{ if(!bySheet.has(p.sheet)) bySheet.set(p.sheet,[]); bySheet.get(p.sheet).push(p);}); notify(); }
 function mapRow(row,idx,sheet){ if(!row||!row[0]||!row[1]) return null; const id=row[0], name=row[1], dataRow=idx+2; const comment=(row[2]||''); return { id, name, img:`${id}.jpg`, row:dataRow, dataRow, sheet, raw:row, comment }; }
 async function loadAll(cacheExpiry){ const parts=[]; for(const {sheet} of (ALL_PARTICIPANTS_SHEETS||[])){ const range=RangeHelper.getSheetRange(sheet); if(!range) continue; let data=googleSheetsApi.getCachedData(sheet,range); if(!data||cacheExpiry===0){ try{ data=await googleSheetsApi.fetchDataWithCache(sheet,range,cacheExpiry===0?0:CACHE_CONFIG.generalExpiry);}catch{} }
  if(data&&data.values){ const rows=data.values.slice(1); rows.forEach((r,i)=>{ const p=mapRow(r,i,sheet); if(p) parts.push(p); }); } }
 return parts; }
 async function initFromCache(){ const parts=await loadAll(CACHE_CONFIG.generalExpiry); replaceAll(parts); }
 async function refreshFromNetwork(){ const parts=await loadAll(0); replaceAll(parts); }
 function updateParticipantComment(sheet,rowNumber,value){ const list=bySheet.get(sheet); if(!list) return; const idx=list.findIndex(p=>p.dataRow===rowNumber); if(idx>=0){ list[idx]={ ...list[idx], comment:value }; notify(); } }
 function getAllParticipants(){ const res=[]; bySheet.forEach(l=>res.push(...l)); return res; }
 function getParticipantsForSection(section){ const range=(section==='One'?SECTION_RANGES.section1:section==='Two'?SECTION_RANGES.section2:SECTION_RANGES.section3)||[1,1000]; const sheet=SHEET_CONFIG.mainSheet; const list=bySheet.get(sheet)||[]; const [s,e]=range; return list.filter(p=>p.dataRow>=s&&p.dataRow<=e); }
 function subscribe(cb){ subscribers.add(cb); return ()=>subscribers.delete(cb); }
 window.AppStore={ initFromCache, refreshFromNetwork, updateParticipantComment, getAllParticipants, getParticipantsForSection, subscribe };
})();


