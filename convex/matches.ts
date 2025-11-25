import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get current user's active chats (persistent matches)
 * Now sorted by lastMessageAt for WhatsApp-style ordering
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get ACTIVE matches where user is involved (limited for performance)
    // isActive: true or undefined (legacy matches without the field are considered active)
    const limit = args.limit ?? 50;
    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("user1Id"), user._id),
            q.eq(q.field("user2Id"), user._id)
          ),
          q.neq(q.field("isActive"), false) // true or undefined = active
        )
      )
      .order("desc")
      .take(limit);

    // Sort by lastMessageAt (most recent first), then by matchedAt
    const sortedMatches = [...matches].sort((a, b) => {
      const aTime = a.lastMessageAt ?? a.matchedAt;
      const bTime = b.lastMessageAt ?? b.matchedAt;
      return bTime - aTime;
    });

    // Get match details with other user's profile and last message preview
    const matchesWithProfiles = await Promise.all(
      sortedMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === user._id ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherUserId);

        // Get chat session status
        const chatSession = await ctx.db.get(match.chatSessionId);

        // Get last message for preview
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_chat_and_time", (q) =>
            q.eq("chatSessionId", match.chatSessionId)
          )
          .order("desc")
          .first();

        return {
          _id: match._id,
          matchedAt: match.matchedAt,
          lastMessageAt: match.lastMessageAt,
          chatSessionId: match.chatSessionId,
          chatSessionStatus: chatSession?.status ?? "ended",
          lastMessage: lastMessage
            ? {
                content: lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? "..." : ""),
                createdAt: lastMessage.createdAt,
                isFromMe: lastMessage.senderId === user._id,
                // E2EE fields for client-side decryption
                isEncrypted: lastMessage.isEncrypted ?? false,
                encryptedContent: lastMessage.encryptedContent,
                nonce: lastMessage.nonce,
              }
            : null,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                age: otherUser.age,
                gender: otherUser.gender,
                bio: otherUser.bio,
                photos: otherUser.photos,
                // Include public key for E2EE decryption
                publicKey: otherUser.publicKey,
              }
            : null,
          // Current user ID for shared secret derivation
          currentUserId: user._id,
        };
      })
    );

    return matchesWithProfiles.filter((m) => m.otherUser !== null);
  },
});

/**
 * Cut connection with a match - ends the chat for both users
 * The other user will be kicked out and see "User left" message
 */
export const cutConnection = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized to end this chat");
    }

    // Mark match as inactive and record who ended it
    await ctx.db.patch(args.matchId, {
      isActive: false,
      endedBy: user._id,
    });

    // End the chat session
    const chatSession = await ctx.db.get(match.chatSessionId);
    if (chatSession && chatSession.status === "active") {
      await ctx.db.patch(match.chatSessionId, {
        status: "ended",
        endedAt: Date.now(),
      });
    }

    // Delete all messages for privacy
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_session", (q) =>
        q.eq("chatSessionId", match.chatSessionId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Clean up any pending chat requests
    const relatedRequests = await ctx.db
      .query("chatRequests")
      .filter((q) => q.eq(q.field("matchId"), args.matchId))
      .collect();

    await Promise.all(relatedRequests.map((req) => ctx.db.delete(req._id)));

    return { success: true };
  },
});

/**
 * Legacy remove function - redirects to cutConnection
 * @deprecated Use cutConnection instead
 */
export const remove = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized to delete this match");
    }

    // Mark as inactive instead of deleting (soft delete)
    await ctx.db.patch(args.matchId, {
      isActive: false,
      endedBy: user._id,
    });

    // End chat session
    const chatSession = await ctx.db.get(match.chatSessionId);
    if (chatSession && chatSession.status === "active") {
      await ctx.db.patch(match.chatSessionId, {
        status: "ended",
        endedAt: Date.now(),
      });
    }

    // Delete messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_session", (q) =>
        q.eq("chatSessionId", match.chatSessionId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Clean up chat requests
    const relatedRequests = await ctx.db
      .query("chatRequests")
      .filter((q) => q.eq(q.field("matchId"), args.matchId))
      .collect();

    await Promise.all(relatedRequests.map((req) => ctx.db.delete(req._id)));

    return { success: true };
  },
});

/**
 * Check if current user was kicked from a chat (other user cut connection)
 * Used to show "User left" message on dashboard
 */
export const checkKickedStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    // Find recently ended matches where the OTHER user ended it
    const recentlyEndedMatches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("user1Id"), user._id),
            q.eq(q.field("user2Id"), user._id)
          ),
          q.eq(q.field("isActive"), false),
          // endedBy exists and is NOT the current user
          q.neq(q.field("endedBy"), user._id)
        )
      )
      .order("desc")
      .take(1);

    // Return info about the most recent kick
    if (recentlyEndedMatches.length > 0) {
      const match = recentlyEndedMatches[0];
      // Only consider it if endedBy is set and is the other user
      if (match.endedBy && match.endedBy !== user._id) {
        return {
          wasKicked: true,
          matchId: match._id,
        };
      }
    }

    return { wasKicked: false };
  },
});

/**
 * Clear kicked status after user has seen the message
 */
export const clearKickedStatus = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const match = await ctx.db.get(args.matchId);
    if (!match) return { success: true };

    // Verify user is part of this match
    if (match.user1Id !== user._id && match.user2Id !== user._id) {
      throw new Error("Not authorized");
    }

    // Clear the endedBy field so they won't see the message again
    await ctx.db.patch(args.matchId, {
      endedBy: undefined,
    });

    return { success: true };
  },
});
