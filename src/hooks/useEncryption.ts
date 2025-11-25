/**
 * React hook for managing E2EE encryption
 *
 * Handles:
 * - Key generation and storage
 * - Public key upload to Convex
 * - Message encryption/decryption
 * - Shared secret derivation for conversations
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  getSharedSecret,
  clearSharedSecretCache,
} from "@/lib/encryption";
import {
  getKeys,
  storeKeys,
  hasKeys,
  deleteKeys,
} from "@/lib/keyStorage";

interface UseEncryptionOptions {
  chatSessionId?: Id<"chatSessions">;
}

interface EncryptionState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  hasLocalKeys: boolean;
  hasServerKey: boolean;
  // Note: isE2EEEnabled is now derived during render, not stored in state
}

export function useEncryption(options: UseEncryptionOptions = {}) {
  const { chatSessionId } = options;
  const { user, isLoaded: isUserLoaded } = useUser();

  const [state, setState] = useState<EncryptionState>({
    isReady: false,
    isLoading: true,
    error: null,
    hasLocalKeys: false,
    hasServerKey: false,
  });

  // Track if we've already initialized to prevent double-init
  const initializedRef = useRef(false);
  const initializingRef = useRef(false);

  // Convex queries/mutations
  const updatePublicKey = useMutation(api.encryption.updatePublicKey);
  const encryptionStatus = useQuery(api.encryption.getMyEncryptionStatus);
  const chatEncryptionKeys = useQuery(
    api.encryption.getChatEncryptionKeys,
    chatSessionId ? { chatSessionId } : "skip"
  );

  // Private key stored in memory after loading from IndexedDB
  const privateKeyRef = useRef<string | null>(null);

  /**
   * Initialize encryption for the current user
   * - Checks for existing keys in IndexedDB
   * - Generates new keys if needed
   * - Uploads public key to Convex if not already there
   */
  const initializeEncryption = useCallback(async () => {
    if (!user?.id || initializingRef.current) return;

    initializingRef.current = true;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Check for existing local keys
      const existingKeys = await getKeys(user.id);

      if (existingKeys) {
        // Keys exist locally
        privateKeyRef.current = existingKeys.privateKey;
        setState((prev) => ({ ...prev, hasLocalKeys: true }));

        // Check if public key matches what's on server
        if (encryptionStatus?.publicKey !== existingKeys.publicKey) {
          // Upload our public key if server doesn't have it or has a different one
          await updatePublicKey({ publicKey: existingKeys.publicKey });
        }

        setState((prev) => ({
          ...prev,
          isReady: true,
          isLoading: false,
          hasServerKey: true,
        }));
      } else {
        // No local keys - generate new ones
        const newKeyPair = await generateKeyPair();

        // Store in IndexedDB
        await storeKeys(user.id, newKeyPair.publicKey, newKeyPair.privateKey);
        privateKeyRef.current = newKeyPair.privateKey;

        // Upload public key to Convex
        await updatePublicKey({ publicKey: newKeyPair.publicKey });

        setState((prev) => ({
          ...prev,
          isReady: true,
          isLoading: false,
          hasLocalKeys: true,
          hasServerKey: true,
        }));
      }

      initializedRef.current = true;
    } catch (error) {
      console.error("Failed to initialize encryption:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to initialize encryption",
      }));
    } finally {
      initializingRef.current = false;
    }
  }, [user?.id, encryptionStatus?.publicKey, updatePublicKey]);

  // Initialize encryption when user is loaded
  // This effect IS appropriate - it syncs with external systems (IndexedDB, Convex)
  useEffect(() => {
    if (isUserLoaded && user?.id && encryptionStatus !== undefined && !initializedRef.current) {
      initializeEncryption();
    }
  }, [isUserLoaded, user?.id, encryptionStatus, initializeEncryption]);

  // ✅ GOOD: Derive isE2EEEnabled during render instead of storing in state
  // Per React docs: "If you can calculate something during render, you don't need an Effect"
  const isE2EEEnabled = chatEncryptionKeys?.isE2EEReady ?? false;

  /**
   * Encrypt a message for the current chat
   */
  const encrypt = useCallback(
    async (plaintext: string): Promise<{ ciphertext: string; nonce: string } | null> => {
      if (!chatEncryptionKeys?.isE2EEReady || !privateKeyRef.current) {
        return null;
      }

      if (!chatEncryptionKeys.otherUserPublicKey) {
        console.warn("Cannot encrypt: other user has no public key");
        return null;
      }

      try {
        const sharedSecret = await getSharedSecret(
          chatEncryptionKeys.currentUserId,
          chatEncryptionKeys.otherUserId,
          privateKeyRef.current,
          chatEncryptionKeys.otherUserPublicKey
        );

        return await encryptMessage(plaintext, sharedSecret);
      } catch (error) {
        console.error("Encryption failed:", error);
        return null;
      }
    },
    [chatEncryptionKeys]
  );

  /**
   * Decrypt a message from the current chat
   */
  const decrypt = useCallback(
    async (ciphertext: string, nonce: string): Promise<string | null> => {
      if (!privateKeyRef.current) {
        return null;
      }

      if (!chatEncryptionKeys?.isE2EEReady) {
        return null;
      }

      if (!chatEncryptionKeys.otherUserPublicKey) {
        return null;
      }

      try {
        const sharedSecret = await getSharedSecret(
          chatEncryptionKeys.currentUserId,
          chatEncryptionKeys.otherUserId,
          privateKeyRef.current,
          chatEncryptionKeys.otherUserPublicKey
        );

        return await decryptMessage(ciphertext, nonce, sharedSecret);
      } catch {
        return null;
      }
    },
    [chatEncryptionKeys, state.isReady]
  );

  /**
   * Clear encryption state (call on logout)
   */
  const clearEncryption = useCallback(async () => {
    privateKeyRef.current = null;
    clearSharedSecretCache();
    initializedRef.current = false;

    if (user?.id) {
      await deleteKeys(user.id);
    }

    setState({
      isReady: false,
      isLoading: false,
      error: null,
      hasLocalKeys: false,
      hasServerKey: false,
    });
  }, [user?.id]);

  return {
    ...state,
    isE2EEEnabled, // Derived during render, not from state
    encrypt,
    decrypt,
    clearEncryption,
    // Expose for components that need to check other user's key status
    otherUserHasKey: chatEncryptionKeys?.otherUserPublicKey != null,
  };
}
