import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Update the current user's public key
 * Called when user generates a new keypair (first login or key rotation)
 */
export const updatePublicKey = mutation({
  args: {
    publicKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      publicKey: args.publicKey,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get a user's public key by their Convex user ID
 * Used when encrypting messages for them
 */
export const getPublicKey = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      userId: user._id,
      publicKey: user.publicKey ?? null,
    };
  },
});

/**
 * Get the current user's encryption status
 * Returns whether they have a public key registered
 */
export const getMyEncryptionStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    return {
      userId: user._id,
      hasPublicKey: !!user.publicKey,
      publicKey: user.publicKey ?? null,
    };
  },
});

/**
 * Get public keys for both users in a chat session
 * Used to establish E2EE for matched chats
 */
export const getChatEncryptionKeys = query({
  args: {
    chatSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (
      chatSession.user1Id !== currentUser._id &&
      chatSession.user2Id !== currentUser._id
    ) {
      throw new Error("Unauthorized");
    }

    // Get the other user
    const otherUserId =
      chatSession.user1Id === currentUser._id
        ? chatSession.user2Id
        : chatSession.user1Id;

    const otherUser = await ctx.db.get(otherUserId);

    return {
      currentUserId: currentUser._id,
      currentUserPublicKey: currentUser.publicKey ?? null,
      otherUserId,
      otherUserPublicKey: otherUser?.publicKey ?? null,
      // E2EE is only active if both users have public keys
      isE2EEReady:
        !!currentUser.publicKey && !!otherUser?.publicKey,
    };
  },
});
