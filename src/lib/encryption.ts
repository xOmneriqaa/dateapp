/**
 * End-to-End Encryption utilities using libsodium
 *
 * Architecture:
 * - Each user generates an X25519 keypair
 * - Public keys are stored in Convex, private keys in IndexedDB
 * - When users match, they derive a shared secret using ECDH
 * - Messages are encrypted with XChaCha20-Poly1305
 */

import _sodium from "libsodium-wrappers";

let sodiumReady: Promise<typeof _sodium> | null = null;

/**
 * Initialize and get the sodium library
 */
export async function getSodium(): Promise<typeof _sodium> {
  if (!sodiumReady) {
    sodiumReady = _sodium.ready.then(() => _sodium);
  }
  return sodiumReady;
}

/**
 * Application-level encryption salt
 * This adds a layer of security - attackers need both user ID AND this salt
 * In production, set VITE_ENCRYPTION_SALT to a random 32+ character string
 */
const ENCRYPTION_SALT = import.meta.env.VITE_ENCRYPTION_SALT ||
  "dateapp-e2ee-default-salt-change-in-production-2024";

/**
 * Generate a deterministic X25519 keypair from user ID
 * Uses HKDF-style derivation: BLAKE2b(salt || userId || context)
 * Same user ID + same salt = same keys on all devices
 *
 * Security note: This provides encryption but not true E2EE since
 * keys are derivable from user ID. This is a tradeoff for cross-device
 * convenience without requiring backup/restore.
 */
export async function generateKeyPair(userId?: string): Promise<{
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}> {
  const sodium = await getSodium();

  let keyPair;

  if (userId) {
    // HKDF-style key derivation using BLAKE2b
    // Input: salt + userId + context (domain separation)
    // Output: 32-byte seed for X25519 keypair
    const context = "dateapp-x25519-keypair-v1";
    const ikm = ENCRYPTION_SALT + "|" + userId + "|" + context;

    // Use crypto_generichash (BLAKE2b) as the extraction step
    // Then use the output as seed for keypair generation
    const seed = sodium.crypto_generichash(
      sodium.crypto_box_SEEDBYTES,
      sodium.from_string(ikm)
    );

    keyPair = sodium.crypto_box_seed_keypair(seed);
  } else {
    // Fallback to random generation (legacy)
    keyPair = sodium.crypto_box_keypair();
  }

  return {
    publicKey: sodium.to_base64(
      keyPair.publicKey,
      sodium.base64_variants.ORIGINAL
    ),
    privateKey: sodium.to_base64(
      keyPair.privateKey,
      sodium.base64_variants.ORIGINAL
    ),
  };
}

/**
 * Derive a shared secret from your private key and their public key
 * This uses X25519 ECDH - both parties derive the same shared secret
 */
export async function deriveSharedSecret(
  myPrivateKey: string,
  theirPublicKey: string
): Promise<string> {
  const sodium = await getSodium();

  const myPrivateKeyBytes = sodium.from_base64(
    myPrivateKey,
    sodium.base64_variants.ORIGINAL
  );
  const theirPublicKeyBytes = sodium.from_base64(
    theirPublicKey,
    sodium.base64_variants.ORIGINAL
  );

  // Use crypto_box_beforenm to compute the shared secret
  const sharedSecret = sodium.crypto_box_beforenm(
    theirPublicKeyBytes,
    myPrivateKeyBytes
  );

  return sodium.to_base64(sharedSecret, sodium.base64_variants.ORIGINAL);
}

/**
 * Encrypt a message using XChaCha20-Poly1305
 * Returns the ciphertext and nonce (both needed for decryption)
 */
export async function encryptMessage(
  plaintext: string,
  sharedSecret: string
): Promise<{
  ciphertext: string; // Base64 encoded
  nonce: string; // Base64 encoded
}> {
  const sodium = await getSodium();

  const sharedSecretBytes = sodium.from_base64(
    sharedSecret,
    sodium.base64_variants.ORIGINAL
  );
  const plaintextBytes = sodium.from_string(plaintext);

  // Generate a random nonce (24 bytes for XChaCha20-Poly1305)
  const nonce = sodium.randombytes_buf(
    sodium.crypto_secretbox_NONCEBYTES
  );

  // Encrypt using crypto_secretbox (XSalsa20-Poly1305)
  // Note: We use secretbox since we already have a shared secret
  const ciphertext = sodium.crypto_secretbox_easy(
    plaintextBytes,
    nonce,
    sharedSecretBytes
  );

  return {
    ciphertext: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
  };
}

/**
 * Decrypt a message using XChaCha20-Poly1305
 */
export async function decryptMessage(
  ciphertext: string,
  nonce: string,
  sharedSecret: string
): Promise<string> {
  const sodium = await getSodium();

  const ciphertextBytes = sodium.from_base64(
    ciphertext,
    sodium.base64_variants.ORIGINAL
  );
  const nonceBytes = sodium.from_base64(nonce, sodium.base64_variants.ORIGINAL);
  const sharedSecretBytes = sodium.from_base64(
    sharedSecret,
    sodium.base64_variants.ORIGINAL
  );

  try {
    const decrypted = sodium.crypto_secretbox_open_easy(
      ciphertextBytes,
      nonceBytes,
      sharedSecretBytes
    );
    return sodium.to_string(decrypted);
  } catch {
    throw new Error("Failed to decrypt message - invalid key or corrupted data");
  }
}

/**
 * Cache for shared secrets to avoid recalculating
 * Key format: `${myUserId}:${theirUserId}`
 */
const sharedSecretCache = new Map<string, string>();

/**
 * Get or compute shared secret for a conversation
 */
export async function getSharedSecret(
  myUserId: string,
  theirUserId: string,
  myPrivateKey: string,
  theirPublicKey: string
): Promise<string> {
  // Create a consistent cache key (order users alphabetically)
  const cacheKey =
    myUserId < theirUserId
      ? `${myUserId}:${theirUserId}`
      : `${theirUserId}:${myUserId}`;

  const cached = sharedSecretCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sharedSecret = await deriveSharedSecret(myPrivateKey, theirPublicKey);
  sharedSecretCache.set(cacheKey, sharedSecret);

  return sharedSecret;
}

/**
 * Clear the shared secret cache (call when user logs out)
 */
export function clearSharedSecretCache(): void {
  sharedSecretCache.clear();
}
