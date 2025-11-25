import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Join the dating queue
 * Finds a match if someone is waiting, or adds user to queue
 */
export const join = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error(
        "Account not found. Please sign out and sign in again so we can resync your profile."
      );
    }

    // Check if user already has an active SPEED DATING session - prevent accidental rejoining
    // Users with extended/matched chats can still look for new matches
    const existingSpeedDatingSession = await ctx.db
      .query("chatSessions")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("user1Id"), user._id),
            q.eq(q.field("user2Id"), user._id)
          ),
          q.eq(q.field("status"), "active"),
          q.eq(q.field("phase"), "speed_dating")
        )
      )
      .first();

    if (existingSpeedDatingSession) {
      throw new Error(
        "You are already in an active speed dating session. Please leave your current chat before finding a new match."
      );
    }

    // Look for someone in the queue (excluding current user)
    const waitingUsers = await ctx.db
      .query("users")
      .withIndex("by_queue", (q) => q.eq("isInQueue", true))
      .collect();

    // Filter users based on gender preferences (if set)
    const compatibleUsers = waitingUsers.filter((u) => {
      if (u._id === user._id) return false;

      // If either user hasn't set preferences, allow match
      if (!user.genderPreference || !u.genderPreference) return true;

      // Check if current user's preference matches other user's gender
      const userWantsOther =
        user.genderPreference === "both" ||
        (u.gender && user.genderPreference === u.gender);

      // Check if other user's preference matches current user's gender
      const otherWantsUser =
        u.genderPreference === "both" ||
        (user.gender && u.genderPreference === user.gender);

      return userWantsOther && otherWantsUser;
    });

    // Randomly select from compatible users to ensure fairness
    const matchedUser = compatibleUsers.length > 0
      ? compatibleUsers[Math.floor(Math.random() * compatibleUsers.length)]
      : undefined;

    if (matchedUser) {
      // CLAIM-FIRST PATTERN: Remove matched user from queue atomically
      // This prevents other users from matching with the same person
      await ctx.db.patch(matchedUser._id, { isInQueue: false });

      // VERIFY-SECOND: Double-check that matched user doesn't already have an active speed dating session
      // This handles race conditions where multiple users tried to match simultaneously
      const matchedUserSpeedDatingSession = await ctx.db
        .query("chatSessions")
        .filter((q) =>
          q.and(
            q.or(
              q.eq(q.field("user1Id"), matchedUser._id),
              q.eq(q.field("user2Id"), matchedUser._id)
            ),
            q.eq(q.field("status"), "active"),
            q.eq(q.field("phase"), "speed_dating")
          )
        )
        .first();

      if (matchedUserSpeedDatingSession) {
        // Matched user already in a session! Put current user in queue to try again
        await ctx.db.patch(user._id, { isInQueue: true });

        return {
          matched: false,
          chatSessionId: null,
        };
      }

      // Safe to create session - matched user is claimed and has no active session
      await ctx.db.patch(user._id, { isInQueue: false });

      const speedDatingEndsAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      const sessionId = await ctx.db.insert("chatSessions", {
        user1Id: user._id,
        user2Id: matchedUser._id,
        phase: "speed_dating",
        status: "active",
        startedAt: Date.now(),
        speedDatingEndsAt,
      });

      return {
        matched: true,
        chatSessionId: sessionId,
      };
    } else {
      // No match found, add to queue
      await ctx.db.patch(user._id, { isInQueue: true });

      return {
        matched: false,
        chatSessionId: null,
      };
    }
  },
});

/**
 * Leave the dating queue
 */
export const leave = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { isInQueue: false });

    return { success: true };
  },
});

/**
 * Get queue status (check if matched)
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // If user doesn't exist yet (not synced from Clerk), return default state
    if (!user) {
      return {
        userExists: false,
        inQueue: false,
        matched: false,
        chatSessionId: null,
      };
    }

    // Check if user has an active SPEED DATING session (not extended/matched chats)
    // Extended chats persist and should be accessed from Chats tab, not auto-redirect
    const activeSpeedDatingSession = await ctx.db
      .query("chatSessions")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("user1Id"), user._id),
            q.eq(q.field("user2Id"), user._id)
          ),
          q.eq(q.field("status"), "active"),
          q.eq(q.field("phase"), "speed_dating")
        )
      )
      .first();

    if (activeSpeedDatingSession) {
      return {
        userExists: true,
        inQueue: false,
        matched: true,
        chatSessionId: activeSpeedDatingSession._id,
      };
    }

    return {
      userExists: true,
      inQueue: user.isInQueue,
      matched: false,
      chatSessionId: null,
    };
  },
});
