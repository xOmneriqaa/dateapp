import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get messages for a chat session (limited to prevent DoS)
 * Limits to 200 most recent messages - more than enough for a 15-minute chat
 */
export const list = query({
  args: {
    chatSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get chat session
    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get messages (limited to 200 for DoS protection)
    // Using .take() instead of .collect() prevents fetching unbounded results
    const rawMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) =>
        q.eq("chatSessionId", args.chatSessionId)
      )
      .order("asc") // Oldest first for display
      .take(200); // Limit to 200 messages max

    // Resolve image URLs for image messages
    const messages = await Promise.all(
      rawMessages.map(async (msg) => {
        if (msg.imageStorageId) {
          const imageUrl = await ctx.storage.getUrl(msg.imageStorageId);
          return { ...msg, imageUrl };
        }
        return { ...msg, imageUrl: null };
      })
    );

    // Get other user if in extended phase
    let otherUser = null;
    if (chatSession.phase === "extended") {
      const otherUserId =
        chatSession.user1Id === user._id
          ? chatSession.user2Id
          : chatSession.user1Id;
      otherUser = await ctx.db.get(otherUserId);
    }

    // Determine if other user is typing
    const isUser1 = chatSession.user1Id === user._id;
    const otherUserTyping = isUser1
      ? chatSession.user2Typing
      : chatSession.user1Typing;
    const otherUserLastTyping = isUser1
      ? chatSession.user2LastTyping
      : chatSession.user1LastTyping;

    // Check if typing status is stale (older than 5 seconds)
    const typingTimeout = 5000; // 5 seconds
    const isTypingActive = otherUserTyping &&
      otherUserLastTyping &&
      (Date.now() - otherUserLastTyping) < typingTimeout;

    // Calculate skip count for speed dating phase
    const skipCount = chatSession.phase === "speed_dating"
      ? (chatSession.user1WantsSkip ? 1 : 0) + (chatSession.user2WantsSkip ? 1 : 0)
      : 0;

    // Check if there's a match for this chat session
    const match = await ctx.db
      .query("matches")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .first();

    // Check if chat was "cut" by the other user (for kick-out detection)
    // Note: isActive is explicitly false (not undefined) when connection is cut
    let wasCutByOtherUser = false;
    if (match && match.isActive === false && match.endedBy) {
      wasCutByOtherUser = match.endedBy !== user._id;
    }

    return {
      messages,
      chatSession,
      otherUser,
      currentUserId: user._id, // Add current user's Convex ID for message ownership comparison
      otherUserIsTyping: isTypingActive || false,
      skipCount,
      matchId: match?._id ?? null,
      matchedAt: match?.matchedAt ?? null, // When the match was created (for profile card positioning)
      wasCutByOtherUser,
    };
  },
});

/**
 * Send a message in a chat session
 * Includes input validation and rate limiting
 * For speed-dating phase: stores plaintext (anonymous, deleted after)
 * For extended phase: expects encrypted content from client
 */
export const send = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
    content: v.string(),
    // E2EE fields (required for extended/matched chats)
    encryptedContent: v.optional(v.string()),
    nonce: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get chat session
    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Check if chat is still active
    if (chatSession.status !== "active") {
      throw new Error("Chat session is not active");
    }

    // Determine if this should be an encrypted message
    const isEncrypted = !!args.encryptedContent && !!args.nonce;

    // Validate based on encryption
    if (isEncrypted) {
      // For encrypted messages, we can't validate content length on server
      // Client is responsible for validation before encryption
      if (!args.encryptedContent || !args.nonce) {
        throw new Error("Encrypted message requires both ciphertext and nonce");
      }
    } else {
      // For plaintext messages (speed-dating), validate content
      const trimmedContent = args.content.trim();

      if (!trimmedContent) {
        throw new Error("Message cannot be empty");
      }

      if (trimmedContent.length > 2000) {
        throw new Error("Message too long (max 2000 characters)");
      }
    }

    // Rate limiting: Check if user sent more than 10 messages in last 10 seconds
    const now = Date.now();
    const tenSecondsAgo = now - 10000;

    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) =>
        q.eq("chatSessionId", args.chatSessionId)
      )
      .order("desc")
      .take(20);

    const userRecentMessages = recentMessages.filter(
      (m) => m.senderId === user._id && m.createdAt > tenSecondsAgo
    );

    if (userRecentMessages.length >= 10) {
      throw new Error(
        "You're sending messages too quickly. Please wait a moment."
      );
    }

    // Insert message
    const messageId = await ctx.db.insert("messages", {
      chatSessionId: args.chatSessionId,
      senderId: user._id,
      // For encrypted messages: store placeholder, actual content is encrypted
      content: isEncrypted ? "[encrypted]" : args.content.trim(),
      isEncrypted,
      encryptedContent: args.encryptedContent,
      nonce: args.nonce,
      createdAt: now,
    });

    // Clear typing indicator after sending message
    const isUser1 = chatSession.user1Id === user._id;
    if (isUser1) {
      await ctx.db.patch(args.chatSessionId, {
        user1Typing: false,
      });
    } else {
      await ctx.db.patch(args.chatSessionId, {
        user2Typing: false,
      });
    }

    // Update lastMessageAt on the match for proper chat ordering
    const match = await ctx.db
      .query("matches")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .first();

    if (match) {
      await ctx.db.patch(match._id, {
        lastMessageAt: now,
      });
    }

    const message = await ctx.db.get(messageId);
    return message;
  },
});

/**
 * Leave a chat session
 * - Speed dating phase: Ends the session and deletes messages (no match yet)
 * - Extended phase (matched): Does nothing - chat persists in Chats tab
 */
export const leaveChat = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // For extended/matched chats, just return - chat persists in Chats tab
    // User can use cutConnection from Chats page to permanently delete
    if (chatSession.phase === "extended") {
      return { success: true, persisted: true };
    }

    // For speed dating phase, end the session (no match was made)
    await ctx.db.patch(args.chatSessionId, {
      status: "ended",
      endedAt: Date.now(),
    });

    // Remove both users from queue to prevent immediate rematching
    await ctx.db.patch(chatSession.user1Id, { isInQueue: false });
    await ctx.db.patch(chatSession.user2Id, { isInQueue: false });

    // Delete all messages for privacy (speed dating is anonymous)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { success: true, persisted: false };
  },
});

/**
 * Set typing indicator for current user
 */
export const setTyping = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Check if chat is still active
    if (chatSession.status !== "active") {
      return { success: false };
    }

    // Determine which user fields to update
    const isUser1 = chatSession.user1Id === user._id;
    const now = Date.now();

    if (isUser1) {
      await ctx.db.patch(args.chatSessionId, {
        user1Typing: args.isTyping,
        user1LastTyping: now,
      });
    } else {
      await ctx.db.patch(args.chatSessionId, {
        user2Typing: args.isTyping,
        user2LastTyping: now,
      });
    }

    return { success: true };
  },
});

/**
 * Generate a short-lived upload URL for image uploads
 * Only available in extended (matched) chats
 */
export const generateUploadUrl = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Only allow image uploads in extended (matched) chats
    if (chatSession.phase !== "extended") {
      throw new Error("Image uploads are only available in matched chats");
    }

    // Check if chat is still active
    if (chatSession.status !== "active") {
      throw new Error("Chat session is not active");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Send an image message in a chat session
 * Only available in extended (matched) chats
 */
export const sendImage = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    // Verify user is part of this chat
    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Only allow image uploads in extended (matched) chats
    if (chatSession.phase !== "extended") {
      throw new Error("Image uploads are only available in matched chats");
    }

    // Check if chat is still active
    if (chatSession.status !== "active") {
      throw new Error("Chat session is not active");
    }

    const now = Date.now();

    // Rate limiting: Check if user sent more than 5 images in last minute
    const oneMinuteAgo = now - 60000;
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) =>
        q.eq("chatSessionId", args.chatSessionId)
      )
      .order("desc")
      .take(20);

    const userRecentImages = recentMessages.filter(
      (m) => m.senderId === user._id &&
             m.messageType === "image" &&
             m.createdAt > oneMinuteAgo
    );

    if (userRecentImages.length >= 5) {
      throw new Error("You're sending images too quickly. Please wait a moment.");
    }

    // Insert image message
    const messageId = await ctx.db.insert("messages", {
      chatSessionId: args.chatSessionId,
      senderId: user._id,
      content: "", // Empty for image-only messages
      messageType: "image",
      imageStorageId: args.storageId,
      createdAt: now,
    });

    // Clear typing indicator
    const isUser1 = chatSession.user1Id === user._id;
    if (isUser1) {
      await ctx.db.patch(args.chatSessionId, { user1Typing: false });
    } else {
      await ctx.db.patch(args.chatSessionId, { user2Typing: false });
    }

    // Update lastMessageAt on the match
    const match = await ctx.db
      .query("matches")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .first();

    if (match) {
      await ctx.db.patch(match._id, { lastMessageAt: now });
    }

    return await ctx.db.get(messageId);
  },
});
