const DATABASE = 'noctra-browser-library';
const STORE = 'tracks';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('Este navegador não oferece armazenamento local de músicas.'));
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir a biblioteca local.'));
  });
}

async function runTransaction(mode, callback) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    let result;
    try { result = callback(store); } catch (error) { database.close(); reject(error); return; }
    transaction.oncomplete = () => { database.close(); resolve(result?.result); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Falha ao salvar a biblioteca local.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error('A operação local foi cancelada.')); };
  });
}

export async function readStoredTracks() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Não foi possível ler a biblioteca local.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

export function storeTrack(track) {
  return runTransaction('readwrite', store => store.put(track));
}

export function deleteStoredTrack(id) {
  return runTransaction('readwrite', store => store.delete(id));
}
