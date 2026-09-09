const fs=require('node:fs');
const keys=JSON.parse(fs.readFileSync('scripts/i18n-source-keys.json','utf8'));
const text=fs.readFileSync('src/lib/i18n/messages.ts','utf8');
const rows=text.split('`')[1].trim().split('\n').map(line=>line.split('|'));
const normalized=new Set(rows.map(row=>row[0].trim().toLowerCase()));
const missing=keys.filter(key=>!normalized.has(key.trim().toLowerCase()));
if(missing.length || rows.some(row=>row.length!==3||row.some(value=>!value.trim())))throw new Error(JSON.stringify({missing}));
console.log(`${keys.length} extracted source strings covered; ${rows.length} complete translation entries.`);
