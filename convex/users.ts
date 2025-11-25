import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get current user's profile
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * Create or update user from Clerk webhook
 * This is called internally when a user signs up via Clerk
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        image: args.imageUrl,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        image: args.imageUrl,
        emailVerified: true, // Clerk handles verification
        isInQueue: false,
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }
  },
});

/**
 * Delete user from Convex (called from Clerk webhook)
 * Cascades deletion to all related data
 */
export const deleteFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[deleteFromClerk] Looking for user with clerkId: ${args.clerkId}`);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.log(`[deleteFromClerk] ⚠️  User ${args.clerkId} not found in database, nothing to delete`);
      return;
    }

    console.log(`[deleteFromClerk] Found user: ${user.name} (${user._id}), cleaning up related data...`);

    // 0. Delete user's photos from storage
    if (user.photoStorageIds && user.photoStorageIds.length > 0) {
      for (const storageId of user.photoStorageIds) {
        try {
          await ctx.storage.delete(storageId);
        } catch (error) {
          console.log(`[deleteFromClerk] Failed to delete photo ${storageId}:`, error);
        }
      }
      console.log(`[deleteFromClerk] Deleted ${user.photoStorageIds.length} photos from storage`);
    }

    // 1. Delete all messages sent by this user
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("senderId"), user._id))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    console.log(`[deleteFromClerk] Deleted ${messages.length} messages`);

    // 2. Delete all matches involving this user
    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", user._id))
      .collect();
    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", user._id))
      .collect();
    const allMatches = [...matchesAsUser1, ...matchesAsUser2];
    for (const match of allMatches) {
      await ctx.db.delete(match._id);
    }
    console.log(`[deleteFromClerk] Deleted ${allMatches.length} matches`);

    // 3. Delete all chat sessions involving this user
    const sessionsAsUser1 = await ctx.db
      .query("chatSessions")
      .withIndex("by_user1", (q) => q.eq("user1Id", user._id))
      .collect();
    const sessionsAsUser2 = await ctx.db
      .query("chatSessions")
      .withIndex("by_user2", (q) => q.eq("user2Id", user._id))
      .collect();
    const allSessions = [...sessionsAsUser1, ...sessionsAsUser2];
    for (const session of allSessions) {
      await ctx.db.delete(session._id);
    }
    console.log(`[deleteFromClerk] Deleted ${allSessions.length} chat sessions`);

    // 4. Delete all chat requests involving this user
    const requestsFrom = await ctx.db
      .query("chatRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", user._id))
      .collect();
    const requestsTo = await ctx.db
      .query("chatRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", user._id))
      .collect();
    const allRequests = [...requestsFrom, ...requestsTo];
    for (const request of allRequests) {
      await ctx.db.delete(request._id);
    }
    console.log(`[deleteFromClerk] Deleted ${allRequests.length} chat requests`);

    // 5. Finally, delete the user
    await ctx.db.delete(user._id);

    console.log(`[deleteFromClerk] ✅ Successfully deleted user ${args.clerkId} and all related data from Convex`);
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    genderPreference: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("both"))),
    bio: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
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
      ...args,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
