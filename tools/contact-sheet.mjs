// Fasst die Test-Screenshots zu einer Übersicht zusammen: tests/screenshots/uebersicht.png
import { chromium } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('../tests/screenshots/', import.meta.url));
const files = (await readdir(dir)).filter((f) => /^\d\d-.*\.png$/.test(f)).sort();
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const list = only ? files.filter((f) => only.test(f)) : files;
const src = {};
for (const f of list) src[f] = 'data:image/png;base64,' + (await readFile(dir + f)).toString('base64');
const html = `<body style="margin:0;background:#ddd;font:14px sans-serif;display:flex;flex-wrap:wrap;gap:12px;padding:12px;width:1640px;align-items:flex-start">
${list.map((f) => `<figure style="margin:0;background:#fff;padding:6px;border-radius:8px"><img src="${src[f]}" style="width:${/quer/.test(f) ? 520 : /ipad/.test(f) ? 360 : 250}px;display:block"><figcaption>${f}</figcaption></figure>`).join('')}</body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1664, height: 800 } });
await p.setContent(html, { waitUntil: 'load' });
await p.screenshot({ path: dir + (process.argv[3] || 'uebersicht.png'), fullPage: true });
await b.close();
console.log('ok', list.length);
