import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Record user's decision to continue or end the chat
 */
export const makeDecision = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
    wantsToContinue: v.boolean(),
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

    // Determine which user this is
    const isUser1 = chatSession.user1Id === user._id;

    const decisionField: "user1WantsContinue" | "user2WantsContinue" = isUser1
      ? "user1WantsContinue"
      : "user2WantsContinue";

    // Immediate end if this user chooses "no"
    if (!args.wantsToContinue) {
      await endSession(ctx, chatSession, args.chatSessionId, {
        [decisionField]: false,
      });

      return {
        success: true,
        status: "ended" as const,
        phase: chatSession.phase,
        matchCreated: false,
        bothDecided: true,
      };
    }

    await ctx.db.patch(args.chatSessionId, {
      [decisionField]: true,
      status: "waiting_reveal",
    });

    // Get updated session
    const updatedSession = await ctx.db.get(args.chatSessionId);
    if (!updatedSession) throw new Error("Session not found");

    // Check if both users have decided
    const user1Decision = isUser1
      ? args.wantsToContinue
      : updatedSession.user1WantsContinue;
    const user2Decision = isUser1
      ? updatedSession.user2WantsContinue
      : args.wantsToContinue;

    let finalStatus: "waiting_reveal" | "active" | "ended" = "waiting_reveal";
    let phase: "speed_dating" | "extended" = chatSession.phase;
    let matchCreated = false;

    if (user1Decision !== undefined && user2Decision !== undefined) {
      if (user1Decision && user2Decision) {
        finalStatus = "active";
        phase = "extended";

        await ctx.db.insert("matches", {
          user1Id: chatSession.user1Id,
          user2Id: chatSession.user2Id,
          chatSessionId: args.chatSessionId,
          matchedAt: Date.now(),
          isActive: true, // Persistent chat - always active until someone cuts connection
        });

        matchCreated = true;

        await ctx.db.patch(args.chatSessionId, {
          status: "active",
          phase: "extended",
        });
      } else {
        await endSession(ctx, chatSession, args.chatSessionId);
        finalStatus = "ended";
      }
    }

    return {
      success: true,
      status: finalStatus,
      phase: phase,
      matchCreated,
      bothDecided: user1Decision !== undefined && user2Decision !== undefined,
    };
  },
});

async function endSession(
  ctx: MutationCtx,
  chatSession: Doc<"chatSessions">,
  chatSessionId: Id<"chatSessions">,
  extraPatch?: Record<string, unknown>,
) {
  await ctx.db.patch(chatSessionId, {
    status: "ended",
    endedAt: Date.now(),
    ...extraPatch,
  });

  await ctx.db.patch(chatSession.user1Id, { isInQueue: false });
  await ctx.db.patch(chatSession.user2Id, { isInQueue: false });

  const messages = await ctx.db
    .query("messages")
    .withIndex("by_chat_session", (q) => q.eq("chatSessionId", chatSessionId))
    .collect();

  for (const message of messages) {
    await ctx.db.delete(message._id);
  }
}

/**
 * Skip speed dating phase and move to profile reveal
 */
export const skipToReveal = mutation({
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

    // Only allow skip during speed_dating phase
    if (chatSession.phase !== "speed_dating") {
      throw new Error("Can only skip during speed dating phase");
    }

    // Determine which user this is
    const isUser1 = chatSession.user1Id === user._id;

    // Update the user's skip preference
    const updates: any = {};

    if (isUser1) {
      updates.user1WantsSkip = true;
    } else {
      updates.user2WantsSkip = true;
    }

    await ctx.db.patch(args.chatSessionId, updates);

    // Get updated session
    const updatedSession = await ctx.db.get(args.chatSessionId);
    if (!updatedSession) throw new Error("Session not found");

    // Check if both users want to skip
    const user1Skip = isUser1 ? true : updatedSession.user1WantsSkip;
    const user2Skip = isUser1 ? updatedSession.user2WantsSkip : true;

    let matchCreated = false;

    // If both users want to skip
    if (user1Skip && user2Skip) {
      // Create match record
      await ctx.db.insert("matches", {
        user1Id: chatSession.user1Id,
        user2Id: chatSession.user2Id,
        chatSessionId: args.chatSessionId,
        matchedAt: Date.now(),
        isActive: true, // Persistent chat - always active until someone cuts connection
      });

      matchCreated = true;

      // Update session to extended phase
      await ctx.db.patch(args.chatSessionId, {
        status: "active",
        phase: "extended",
      });
    }

    return {
      success: true,
      bothSkipped: user1Skip && user2Skip,
      matchCreated,
      skipCount: (user1Skip ? 1 : 0) + (user2Skip ? 1 : 0),
    };
  },
});

/**
 * Cancel/retract a decision while waiting for the other user
 * Allows users to change their mind before the other user decides
 */
export const cancelDecision = mutation({
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

    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Can only cancel while waiting for other user's decision
    if (chatSession.status !== "waiting_reveal") {
      throw new Error("Cannot cancel decision - chat is not in waiting state");
    }

    const isUser1 = chatSession.user1Id === user._id;
    const myDecisionField = isUser1 ? "user1WantsContinue" : "user2WantsContinue";
    const otherDecisionField = isUser1 ? "user2WantsContinue" : "user1WantsContinue";

    // Check that the OTHER user hasn't decided yet
    const otherDecision = chatSession[otherDecisionField];
    if (otherDecision !== undefined) {
      throw new Error("Cannot cancel - other user has already decided");
    }

    // Reset this user's decision
    await ctx.db.patch(args.chatSessionId, {
      [myDecisionField]: undefined,
      status: "active", // Go back to active state
    });

    return { success: true };
  },
});

/**
 * Handle decision timeout - ends chat if timer expires and decisions aren't made
 * Called by frontend when detecting timeout
 */
export const handleDecisionTimeout = mutation({
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

    if (chatSession.user1Id !== user._id && chatSession.user2Id !== user._id) {
      throw new Error("Unauthorized");
    }

    // Only handle timeout for waiting_reveal status
    if (chatSession.status !== "waiting_reveal") {
      return { success: false, reason: "Not in waiting state" };
    }

    // Check if both users have decided - if so, no timeout needed
    const user1Decided = chatSession.user1WantsContinue !== undefined;
    const user2Decided = chatSession.user2WantsContinue !== undefined;

    if (user1Decided && user2Decided) {
      return { success: false, reason: "Both users have decided" };
    }

    // Timeout - end the session
    await ctx.db.patch(args.chatSessionId, {
      status: "ended",
      endedAt: Date.now(),
    });

    // Remove users from queue
    await ctx.db.patch(chatSession.user1Id, { isInQueue: false });
    await ctx.db.patch(chatSession.user2Id, { isInQueue: false });

    // Delete messages for privacy
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_session", (q) => q.eq("chatSessionId", args.chatSessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return {
      success: true,
      timedOut: true,
      userWhoTimedOut: !user1Decided ? "user1" : "user2",
    };
  },
});
