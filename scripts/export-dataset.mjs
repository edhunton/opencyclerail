// Pull the live operator catalogue and write data/bike-policy-sources.{json,csv}.
//   node scripts/export-dataset.mjs
import { writeFileSync } from 'node:fs';
const r = await fetch('https://opencyclerail.tech/api/journey?operators=1');
const { operators } = await r.json();
const cols = ['operator', 'country', 'trains', 'policy', 'conditions', 'cost', 'phone', 'email', 'website', 'url', 'lang', 'agrees', 'note', 'confirmed_on', 'last_checked'];
const rows = operators.map(o => Object.fromEntries(cols.map(c => [c, o[c] ?? null])));
writeFileSync('data/bike-policy-sources.json', JSON.stringify({ licence: 'ODbL-1.0', attribution: 'Open Cycle Rail contributors', as_of: new Date().toISOString().slice(0, 10), operators: rows }, null, 1) + '\n');
const esc = v => v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
writeFileSync('data/bike-policy-sources.csv', [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n') + '\n');
console.log(rows.length, 'operators written');
