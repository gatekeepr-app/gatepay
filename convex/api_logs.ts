import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiLogs")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const log = mutation({
  args: {
    requestId: v.string(),
    method: v.string(),
    path: v.string(),
    statusCode: v.number(),
    durationMs: v.number(),
    apiKeyPrefix: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiLogs", args);
  },
});
