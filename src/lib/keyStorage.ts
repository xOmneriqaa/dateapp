/**
 * IndexedDB storage for E2EE private keys
 *
 * Private keys are stored locally and never sent to the server.
 * The database is per-origin, so keys are isolated to this app.
 */

const DB_NAME = "dateapp-e2ee";
const DB_VERSION = 1;
const STORE_NAME = "keys";

interface StoredKeyData {
  clerkId: string; // User identifier
  privateKey: string; // Base64 encoded private key
  publicKey: string; // Base64 encoded public key (for verification)
  createdAt: number;
}

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open encryption key database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "clerkId" });
      }
    };
  });
}

/**
 * Store a user's encryption keys in IndexedDB
 */
export async function storeKeys(
  clerkId: string,
  publicKey: string,
  privateKey: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const data: StoredKeyData = {
      clerkId,
      privateKey,
      publicKey,
      createdAt: Date.now(),
    };

    const request = store.put(data);

    request.onerror = () => {
      reject(new Error("Failed to store encryption keys"));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Retrieve a user's encryption keys from IndexedDB
 */
export async function getKeys(
  clerkId: string
): Promise<{ publicKey: string; privateKey: string } | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(clerkId);

    request.onerror = () => {
      reject(new Error("Failed to retrieve encryption keys"));
    };

    request.onsuccess = () => {
      const data = request.result as StoredKeyData | undefined;
      if (data) {
        resolve({
          publicKey: data.publicKey,
          privateKey: data.privateKey,
        });
      } else {
        resolve(null);
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Check if keys exist for a user
 */
export async function hasKeys(clerkId: string): Promise<boolean> {
  const keys = await getKeys(clerkId);
  return keys !== null;
}

/**
 * Delete a user's encryption keys (for logout or account deletion)
 */
export async function deleteKeys(clerkId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(clerkId);

    request.onerror = () => {
      reject(new Error("Failed to delete encryption keys"));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Export keys as a downloadable backup
 * Users should keep this safe - if they lose it, they can't read old messages
 */
export async function exportKeysAsBackup(
  clerkId: string
): Promise<string | null> {
  const keys = await getKeys(clerkId);
  if (!keys) return null;

  const backup = {
    version: 1,
    clerkId,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Import keys from a backup file
 */
export async function importKeysFromBackup(
  clerkId: string,
  backupJson: string
): Promise<{ publicKey: string } | null> {
  try {
    const backup = JSON.parse(backupJson);

    if (backup.version !== 1) {
      throw new Error("Unsupported backup version");
    }

    if (backup.clerkId !== clerkId) {
      throw new Error("Backup is for a different user");
    }

    await storeKeys(clerkId, backup.publicKey, backup.privateKey);

    return { publicKey: backup.publicKey };
  } catch (error) {
    console.error("Failed to import key backup:", error);
    return null;
  }
}
