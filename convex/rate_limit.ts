import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const checkRateLimit = mutation({
  args: {
    ipHash: v.string(),
    route: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const key = `${args.route}:${args.ipHash}`;
    const now = Date.now();
    const windowStart =
      Math.floor(now / args.windowMs) * args.windowMs;

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_ip_route_window", (q) =>
        q.eq("ipHash", args.ipHash).eq("route", args.route).eq("windowStart", windowStart),
      )
      .first();

    if (existing) {
      const newCount = existing.count + 1;
      await ctx.db.patch(existing._id, { count: newCount });
      return { blocked: newCount > args.limit };
    }

    await ctx.db.insert("rateLimits", {
      ipHash: args.ipHash,
      route: args.route,
      windowStart,
      count: 1,
      createdAt: now,
    });

    return { blocked: false };
  },
});
