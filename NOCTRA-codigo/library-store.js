const DATABASE = 'noctra-browser-library';
const VERSION = 3;
const TRACKS = 'tracks';
const MIXTAPES = 'mixtapes';
const TURNTABLE = 'turntable';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('Este navegador não oferece armazenamento local de músicas.'));
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(TRACKS)) request.result.createObjectStore(TRACKS, { keyPath: 'id' });
      if (!request.result.objectStoreNames.contains(MIXTAPES)) request.result.createObjectStore(MIXTAPES, { keyPath: 'id' });
      if (!request.result.objectStoreNames.contains(TURNTABLE)) request.result.createObjectStore(TURNTABLE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir a biblioteca local.'));
    request.onblocked = () => reject(new Error('Feche outras abas do NOCTRA para atualizar o armazenamento local.'));
  });
}

async function runTransaction(storeName, mode, callback) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try { result = callback(store); } catch (error) { database.close(); reject(error); return; }
    transaction.oncomplete = () => { database.close(); resolve(result?.result); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Falha ao salvar no armazenamento local.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error('A operação local foi cancelada.')); };
  });
}

export async function readStoredTracks(profileId = 'nightcore') {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TRACKS, 'readonly');
    const request = transaction.objectStore(TRACKS).getAll();
    request.onsuccess = () => resolve((request.result || []).filter(track => (track.profileId || 'nightcore') === profileId));
    request.onerror = () => reject(request.error || new Error('Não foi possível ler a biblioteca local.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

export function storeTrack(track, profileId = 'nightcore') {
  return runTransaction(TRACKS, 'readwrite', store => store.put({ ...track, profileId }));
}

export function deleteStoredTrack(id) {
  return runTransaction(TRACKS, 'readwrite', store => store.delete(id));
}

export async function readMixtapes(profileId = 'nightcore') {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(MIXTAPES, 'readonly');
    const request = transaction.objectStore(MIXTAPES).getAll();
    request.onsuccess = () => resolve((request.result || []).filter(mix => mix.profileId === profileId));
    request.onerror = () => reject(request.error || new Error('Não foi possível ler os CDs virtuais.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

export function saveMixtape(mixtape, profileId = 'nightcore') {
  return runTransaction(MIXTAPES, 'readwrite', store => store.put({ ...mixtape, profileId }));
}

export function deleteMixtape(id) {
  return runTransaction(MIXTAPES, 'readwrite', store => store.delete(id));
}

export async function readTurntable(profileId = 'nightcore') {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TURNTABLE, 'readonly');
    const request = transaction.objectStore(TURNTABLE).get(`profile:${profileId}`);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error || new Error('Não foi possível ler a aparência do toca-discos.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

export function saveTurntable(data, profileId = 'nightcore') {
  return runTransaction(TURNTABLE, 'readwrite', store => store.put({ id: `profile:${profileId}`, profileId, data }));
}
