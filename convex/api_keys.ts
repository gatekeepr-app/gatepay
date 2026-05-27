import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sha256, randomToken } from "./lib/crypto";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const keys = await ctx.db.query("apiKeys").order("desc").collect();
    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      businessName: k.businessName,
      callbackUrl: k.callbackUrl,
      createdBy: k.createdBy,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
    }));
  },
});

export const getByKeyHash = query({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    businessName: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    signingSecret: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const token = `gk_${randomToken(32)}`;
    const prefix = token.slice(0, 8);
    const hash = await sha256(token);

    const id = await ctx.db.insert("apiKeys", {
      name: args.name,
      keyPrefix: prefix,
      keyHash: hash,
      keyToken: token,
      businessName: args.businessName,
      callbackUrl: args.callbackUrl,
      signingSecret: args.signingSecret,
      createdAt: Date.now(),
    });

    return { id, token };
  },
});

export const revoke = mutation({
  args: { id: v.id("apiKeys"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { revokedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("apiKeys"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.id);
  },
});
