import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Report a message for moderation
 * The reporter provides the decrypted content since the server can't decrypt E2EE messages
 */
export const reportMessage = mutation({
  args: {
    messageId: v.id("messages"),
    chatSessionId: v.id("chatSessions"),
    decryptedContent: v.string(), // The message as decrypted by the reporter
    reason: v.union(
      v.literal("harassment"),
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("threats"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const reporter = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!reporter) throw new Error("User not found");

    // Get the message to find who sent it
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Can't report your own messages
    if (message.senderId === reporter._id) {
      throw new Error("Cannot report your own messages");
    }

    // Verify reporter is part of this chat
    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) throw new Error("Chat session not found");

    if (chatSession.user1Id !== reporter._id && chatSession.user2Id !== reporter._id) {
      throw new Error("Unauthorized - you are not part of this chat");
    }

    // Create the report
    const reportId = await ctx.db.insert("reports", {
      reporterId: reporter._id,
      reportedUserId: message.senderId,
      messageId: args.messageId,
      chatSessionId: args.chatSessionId,
      decryptedContent: args.decryptedContent,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { reportId, success: true };
  },
});

/**
 * Get pending reports (admin only)
 * In production, you'd want proper admin authentication
 */
export const getPendingReports = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // In production, check for admin role here
    // For now, return reports for any authenticated user (you'd restrict this)

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(50);

    // Enrich with user info
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        const reportedUser = await ctx.db.get(report.reportedUserId);

        return {
          ...report,
          reporterName: reporter?.name ?? "Unknown",
          reportedUserName: reportedUser?.name ?? "Unknown",
        };
      })
    );

    return enrichedReports;
  },
});

/**
 * Update report status (admin action)
 */
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("reviewed"), v.literal("actioned"), v.literal("dismissed")),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // In production, verify admin role here

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
      actionTaken: args.actionTaken,
    });

    return { success: true };
  },
});
