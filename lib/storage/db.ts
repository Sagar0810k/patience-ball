// Minimal IndexedDB key/value adapter (one store).
const DB = 'patience-balls';
const STORE = 'state';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); res(req.result); };
    t.onerror = () => { db.close(); rej(t.error); };
    t.onabort = () => { db.close(); rej(t.error); };
  });
}

export const dbGet = <T>(key: string) => tx<T | undefined>('readonly', (s) => s.get(key));
export const dbPut = (key: string, value: unknown) => tx('readwrite', (s) => s.put(value, key));
export const dbDelete = (key: string) => tx('readwrite', (s) => s.delete(key));
