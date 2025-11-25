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
 * Generate a new X25519 keypair for key exchange
 */
export async function generateKeyPair(): Promise<{
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}> {
  const sodium = await getSodium();
  const keyPair = sodium.crypto_box_keypair();

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
