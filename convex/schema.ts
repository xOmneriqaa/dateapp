import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for Dating App
 * Migrated from PostgreSQL + Drizzle schema
 */

export default defineSchema({
  // Users table (combines Better-auth user with dating app fields)
  users: defineTable({
    // Clerk will provide the user ID
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),

    // Dating app specific fields
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    genderPreference: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("both"))),
    bio: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    photoStorageIds: v.optional(v.array(v.id("_storage"))), // Track storage IDs for cleanup
    isInQueue: v.boolean(),

    // E2EE: Public key for encryption (private key stored client-side in IndexedDB)
    publicKey: v.optional(v.string()), // Base64 encoded X25519 public key

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_queue", ["isInQueue"]),

  // Chat sessions table
  chatSessions: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    phase: v.union(v.literal("speed_dating"), v.literal("extended")),
    status: v.union(v.literal("active"), v.literal("ended"), v.literal("waiting_reveal")),

    user1WantsContinue: v.optional(v.boolean()),
    user2WantsContinue: v.optional(v.boolean()),

    // Skip to profile reveal
    user1WantsSkip: v.optional(v.boolean()),
    user2WantsSkip: v.optional(v.boolean()),

    // Typing indicators
    user1Typing: v.optional(v.boolean()),
    user1LastTyping: v.optional(v.number()),
    user2Typing: v.optional(v.boolean()),
    user2LastTyping: v.optional(v.number()),

    startedAt: v.number(),
    speedDatingEndsAt: v.optional(v.number()), // 15 minutes from startedAt
    endedAt: v.optional(v.number()),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_status", ["status"])
    .index("by_users", ["user1Id", "user2Id"]),

  // Messages table
  messages: defineTable({
    chatSessionId: v.id("chatSessions"),
    senderId: v.id("users"),
    content: v.string(), // Plaintext for legacy/speed-dating, empty for encrypted
    messageType: v.optional(v.union(v.literal("text"), v.literal("image"))), // Default: text
    imageStorageId: v.optional(v.id("_storage")), // For image messages

    // E2EE fields (used in extended/matched chats)
    isEncrypted: v.optional(v.boolean()), // true = content is encrypted
    encryptedContent: v.optional(v.string()), // Base64 encoded ciphertext
    nonce: v.optional(v.string()), // Base64 encoded nonce for decryption

    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_chat_session", ["chatSessionId"])
    .index("by_chat_and_time", ["chatSessionId", "createdAt"]),

  // Matches table (mutual interest) - now represents persistent chats
  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    chatSessionId: v.id("chatSessions"),
    matchedAt: v.number(),
    // Persistent chat fields
    isActive: v.optional(v.boolean()), // false = connection was cut, undefined treated as true (legacy)
    lastMessageAt: v.optional(v.number()), // for sorting chats by recency
    // Track who cut the connection (for "user left" message)
    endedBy: v.optional(v.id("users")),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_users", ["user1Id", "user2Id"])
    .index("by_chat_session", ["chatSessionId"])
    .index("by_active", ["isActive"]),

  // Chat requests table (for reconnecting with matches)
  chatRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    matchId: v.id("matches"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user", ["toUserId"])
    .index("by_status", ["status"])
    .index("by_to_user_and_status", ["toUserId", "status"]),

  // Reports table for E2EE moderation
  // When a user reports a message, they include the decrypted content
  // This allows admin review while maintaining E2EE for normal messages
  reports: defineTable({
    reporterId: v.id("users"), // User who reported
    reportedUserId: v.id("users"), // User being reported
    messageId: v.optional(v.id("messages")), // The message being reported (if still exists)
    chatSessionId: v.id("chatSessions"), // The chat where this happened

    // Decrypted content provided by the reporter (since server can't decrypt E2EE messages)
    decryptedContent: v.string(), // The message content as decrypted by reporter
    reason: v.union(
      v.literal("harassment"),
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("threats"),
      v.literal("other")
    ),
    details: v.optional(v.string()), // Additional details from reporter

    // Admin review
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("actioned"), v.literal("dismissed")),
    reviewedBy: v.optional(v.string()), // Admin identifier
    reviewedAt: v.optional(v.number()),
    actionTaken: v.optional(v.string()), // What action was taken

    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
