import type { DocumentVersion, SyncOperation } from "@/domains/learning/sync";

const DB_NAME = "academia-arcana-learning";
const DB_VERSION = 1;
const VERSIONS = "versions";
const QUEUE = "syncQueue";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VERSIONS)) {
        db.createObjectStore(VERSIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(QUEUE)) {
        db.createObjectStore(QUEUE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento offline."));
  });
}

async function put<T extends DocumentVersion | SyncOperation>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha no armazenamento local."));
  });
  db.close();
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise<T[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result as T[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error("Falha ao ler o armazenamento local."));
    };
  });
}

export const localSyncStore = {
  saveVersion(version: DocumentVersion) {
    return put(VERSIONS, version);
  },
  listVersions() {
    return getAll<DocumentVersion>(VERSIONS);
  },
  enqueue(operation: SyncOperation) {
    return put(QUEUE, operation);
  },
  listPendingOperations() {
    return getAll<SyncOperation>(QUEUE);
  },
};
