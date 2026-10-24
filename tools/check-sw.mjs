// Prüft, ob alle App-Dateien im Service Worker eingetragen sind und die Versionen passen.
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = await readFile(join(root, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/^\s*'([^']+)',?$/gm)].map((m) => m[1]));
const swVersion = sw.match(/const VERSION = '([^']+)'/)[1];
const appVersion = (await readFile(join(root, 'js/version.js'), 'utf8')).match(/APP_VERSION = '([^']+)'/)[1];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(join(root, dir), { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}
const files = [...await walk('js'), ...await walk('css'), ...await walk('content'), ...await walk('assets/fonts'), ...await walk('assets/icons')]
  .map((f) => relative(root, join(root, f)))
  .filter((f) => !f.endsWith('.txt') && !f.endsWith('.DS_Store') && !f.endsWith('.svg'));

let errors = 0;
for (const f of files) if (!listed.has(f)) { console.error('Fehlt in sw.js ASSETS:', f); errors++; }
for (const f of listed) {
  if (f === './') continue;
  try { await readFile(join(root, f)); } catch { console.error('In sw.js eingetragen, aber nicht vorhanden:', f); errors++; }
}
if (swVersion !== appVersion) { console.error(`Version passt nicht: sw.js ${swVersion} ≠ js/version.js ${appVersion}`); errors++; }
console.log(errors ? `${errors} Problem(e)` : `Service Worker ok (${listed.size} Dateien, Version ${swVersion})`);
process.exit(errors ? 1 : 0);
