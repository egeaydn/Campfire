/**
 * E2E Encryption Utilities using Web Crypto API
 * Client-side only - Private keys never leave the device
 */

// Encryption algorithm parameters
const ALGORITHM = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const AES_ALGORITHM = {
  name: "AES-GCM",
  length: 256,
};

/**
 * Generate RSA key pair for user
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(ALGORITHM, true, ["encrypt", "decrypt"]);
}

/**
 * Export public key to base64 string (for storage in DB)
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from base64 string
 */
export async function importPublicKey(publicKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyString);
  return await crypto.subtle.importKey(
    "spki",
    keyData,
    ALGORITHM,
    true,
    ["encrypt"]
  );
}

/**
 * Export private key to base64 string (for storage in IndexedDB)
 */
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import private key from base64 string
 */
export async function importPrivateKey(privateKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyString);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    ALGORITHM,
    true,
    ["decrypt"]
  );
}

/**
 * Encrypt message with public key (for DMs)
 */
export async function encryptMessage(
  message: string,
  publicKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM.name },
    publicKey,
    data
  );
  return arrayBufferToBase64(encrypted);
}

/**
 * Decrypt message with private key
 */
export async function decryptMessage(
  encryptedMessage: string,
  privateKey: CryptoKey
): Promise<string> {
  const data = base64ToArrayBuffer(encryptedMessage);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM.name },
    privateKey,
    data
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Generate symmetric key for group encryption
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(AES_ALGORITHM, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Export symmetric key
 */
export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

/**
 * Import symmetric key
 */
export async function importSymmetricKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await crypto.subtle.importKey("raw", keyData, AES_ALGORITHM, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypt message with symmetric key (for groups)
 */
export async function encryptWithSymmetricKey(
  message: string,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM.name, iv },
    key,
    data
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt message with symmetric key
 */
export async function decryptWithSymmetricKey(
  encryptedMessage: string,
  ivString: string,
  key: CryptoKey
): Promise<string> {
  const data = base64ToArrayBuffer(encryptedMessage);
  const iv = base64ToArrayBuffer(ivString);

  const decrypted = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM.name, iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt symmetric key with public key (for sharing group key)
 */
export async function encryptSymmetricKey(
  symmetricKey: CryptoKey,
  publicKey: CryptoKey
): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", symmetricKey);
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM.name },
    publicKey,
    exported
  );
  return arrayBufferToBase64(encrypted);
}

/**
 * Decrypt symmetric key with private key
 */
export async function decryptSymmetricKey(
  encryptedKey: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(encryptedKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM.name },
    privateKey,
    keyData
  );
  return await crypto.subtle.importKey("raw", decrypted, AES_ALGORITHM, true, [
    "encrypt",
    "decrypt",
  ]);
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * IndexedDB storage for private keys
 */
const DB_NAME = "campfire_encryption";
const DB_VERSION = 1;
const STORE_NAME = "keys";

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function savePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  const db = await openDB();
  const exported = await exportPrivateKey(privateKey);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(exported, userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      const privateKeyString = request.result;
      if (privateKeyString) {
        const privateKey = await importPrivateKey(privateKeyString);
        resolve(privateKey);
      } else {
        resolve(null);
      }
    };
  });
}

export async function deletePrivateKey(userId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
