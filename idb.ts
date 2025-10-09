import { GenerationResult } from './types';

const DB_NAME = 'GeniusDesignDB';
const STORE_NAME = 'results';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(new Error('Failed to open IndexedDB.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};

export const initDB = async (): Promise<boolean> => {
    try {
        await getDb();
        return true;
    } catch {
        return false;
    }
}

export const addResult = async (result: GenerationResult): Promise<string> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(result);
        
        request.onsuccess = () => resolve(result.id);
        request.onerror = () => {
            console.error('Error adding result to DB:', request.error);
            reject(request.error);
        };
    });
};

export const getResult = async (id: string): Promise<GenerationResult | null> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            return resolve(null);
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
            console.error('Error getting result from DB:', request.error);
            reject(request.error);
        };
    });
};
