// Einfacher Schlüssel-Wert-Speicher auf dem Gerät (IndexedDB).
// Fällt auf einen Speicher im Arbeitsspeicher zurück, falls IndexedDB nicht geht
// (z. B. in manchen privaten Browserfenstern) – dann ist nach dem Schließen alles weg.

const DB_NAME = 'lesehaus';
const STORE = 'kv';

let dbPromise = null;
const memory = new Map();
let useMemory = false;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch (e) {
      reject(e);
      return;
    }
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((e) => {
    console.warn('IndexedDB nicht verfügbar, nutze Arbeitsspeicher', e);
    useMemory = true;
    return null;
  });
  return dbPromise;
}

function tx(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const result = fn(store);
    t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export async function get(key) {
  await open();
  if (useMemory) return structuredClone(memory.get(key));
  return tx('readonly', (s) => s.get(key));
}

export async function set(key, value) {
  await open();
  if (useMemory) { memory.set(key, structuredClone(value)); return; }
  return tx('readwrite', (s) => { s.put(value, key); });
}

export async function del(key) {
  await open();
  if (useMemory) { memory.delete(key); return; }
  return tx('readwrite', (s) => { s.delete(key); });
}

/** Alle Einträge als Objekt { schlüssel: wert } – fürs Backup. */
export async function dump() {
  await open();
  if (useMemory) return Object.fromEntries([...memory].map(([k, v]) => [k, structuredClone(v)]));
  const db = await open();
  return new Promise((resolve, reject) => {
    const out = {};
    const t = db.transaction(STORE, 'readonly');
    const req = t.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) { out[c.key] = c.value; c.continue(); } else resolve(out);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Alles löschen und durch `entries` ersetzen – fürs Wiederherstellen. */
export async function replaceAll(entries) {
  await open();
  if (useMemory) {
    memory.clear();
    for (const [k, v] of Object.entries(entries)) memory.set(k, structuredClone(v));
    return;
  }
  return tx('readwrite', (s) => {
    s.clear();
    for (const [k, v] of Object.entries(entries)) s.put(v, k);
  });
}

export function isMemoryOnly() { return useMemory; }

/** Bittet den Browser, die Daten nicht automatisch zu löschen. */
export async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function isPersisted() {
  try { return (await navigator.storage?.persisted?.()) ?? null; } catch { return null; }
}
