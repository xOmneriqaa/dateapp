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
 * Derive an encryption key from a passphrase using PBKDF2
 * This follows Signal's approach for key backup encryption
 */
async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000, // High iteration count for security
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data with AES-GCM using a derived key
 */
async function encryptWithPassphrase(
  data: string,
  passphrase: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(data)
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt data with AES-GCM using a derived key
 */
async function decryptWithPassphrase(
  encrypted: string,
  salt: string,
  iv: string,
  passphrase: string
): Promise<string> {
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

  const key = await deriveKeyFromPassphrase(passphrase, saltBytes);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encryptedBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Export keys as an encrypted backup
 * Uses PBKDF2 + AES-GCM for passphrase-based encryption (Signal-style)
 *
 * @param clerkId - User's Clerk ID
 * @param passphrase - User-provided passphrase for encryption (optional for legacy format)
 * @returns Encrypted backup JSON string or null if no keys exist
 */
export async function exportKeysAsBackup(
  clerkId: string,
  passphrase?: string
): Promise<string | null> {
  const keys = await getKeys(clerkId);
  if (!keys) return null;

  const keyData = {
    clerkId,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    exportedAt: new Date().toISOString(),
  };

  // If passphrase provided, encrypt the backup (recommended)
  if (passphrase && passphrase.length >= 6) {
    const { encrypted, salt, iv } = await encryptWithPassphrase(
      JSON.stringify(keyData),
      passphrase
    );

    return JSON.stringify({
      version: 2, // Version 2 = encrypted backup
      encrypted: true,
      data: encrypted,
      salt,
      iv,
    }, null, 2);
  }

  // Legacy unencrypted format (version 1)
  return JSON.stringify({
    version: 1,
    ...keyData,
  }, null, 2);
}

/**
 * Import keys from a backup file
 * Supports both encrypted (v2) and unencrypted (v1) backups
 *
 * @param clerkId - User's Clerk ID
 * @param backupJson - The backup JSON string
 * @param passphrase - Passphrase for encrypted backups (required for v2)
 * @returns Object with public key or null on failure
 */
export async function importKeysFromBackup(
  clerkId: string,
  backupJson: string,
  passphrase?: string
): Promise<{ publicKey: string } | null> {
  try {
    const backup = JSON.parse(backupJson);

    // Version 2: Encrypted backup
    if (backup.version === 2 && backup.encrypted) {
      if (!passphrase) {
        throw new Error("Passphrase required for encrypted backup");
      }

      try {
        const decrypted = await decryptWithPassphrase(
          backup.data,
          backup.salt,
          backup.iv,
          passphrase
        );
        const keyData = JSON.parse(decrypted);

        if (keyData.clerkId !== clerkId) {
          throw new Error("Backup is for a different user");
        }

        await storeKeys(clerkId, keyData.publicKey, keyData.privateKey);
        return { publicKey: keyData.publicKey };
      } catch {
        throw new Error("Invalid passphrase or corrupted backup");
      }
    }

    // Version 1: Unencrypted backup (legacy)
    if (backup.version === 1) {
      if (backup.clerkId !== clerkId) {
        throw new Error("Backup is for a different user");
      }

      await storeKeys(clerkId, backup.publicKey, backup.privateKey);
      return { publicKey: backup.publicKey };
    }

    throw new Error("Unsupported backup version");
  } catch (error) {
    console.error("Failed to import key backup:", error);
    throw error; // Re-throw to let UI handle the error message
  }
}
