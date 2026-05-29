import { v } from "convex/values";
import { query } from "./_generated/server";

export const getApiLogStats = query({
  args: { hours: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.hours ?? 24) * 60 * 60 * 1000;
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_created_at", (q) => q.gte("createdAt", cutoff))
      .take(500);

    const total = logs.length;
    const byRoute: Record<string, { count: number; errors: number; totalMs: number }> = {};
    const byKey: Record<string, { count: number; errors: number }> = {};
    let errors = 0;

    for (const log of logs) {
      const route = log.path;
      if (!byRoute[route]) byRoute[route] = { count: 0, errors: 0, totalMs: 0 };
      byRoute[route].count++;
      byRoute[route].totalMs += log.durationMs;
      if (log.statusCode >= 400) {
        byRoute[route].errors++;
        errors++;
      }
      if (log.apiKeyPrefix) {
        if (!byKey[log.apiKeyPrefix]) byKey[log.apiKeyPrefix] = { count: 0, errors: 0 };
        byKey[log.apiKeyPrefix].count++;
        if (log.statusCode >= 400) byKey[log.apiKeyPrefix].errors++;
      }
    }

    const routeStats = Object.entries(byRoute).map(([path, s]) => ({
      path,
      count: s.count,
      errors: s.errors,
      avgMs: Math.round(s.totalMs / s.count),
    }));

    const keyStats = Object.entries(byKey).map(([prefix, s]) => ({
      prefix,
      count: s.count,
      errors: s.errors,
    }));

    return { total, errors, routeStats, keyStats };
  },
});
