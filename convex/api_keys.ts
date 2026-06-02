import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { sha256, randomToken } from "./lib/crypto";
import { requireAdmin } from "./lib/auth";
import { logAdminAction } from "./lib/helpers";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const keys = await ctx.db.query("apiKeys").order("desc").take(100);
    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      businessName: k.businessName,
      callbackUrl: k.callbackUrl,
      projectId: k.projectId,
      createdBy: k.createdBy,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
    }));
  },
});

export const revealKey = query({
  args: { id: v.id("apiKeys"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const key = await ctx.db.get(args.id);
    if (!key) throw new Error("not_found");
    if (!key.signingSecret) throw new Error("Key has no signing secret");
    return { keyToken: key.keyToken!, signingSecret: key.signingSecret };
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
    projectId: v.optional(v.id("projects")),
    createdBy: v.optional(v.id("users")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const apiToken = `gk_${randomToken(32)}`;
    const prefix = apiToken.slice(0, 8);
    const hash = await sha256(apiToken);
    const signingSecret = randomToken(32);

    const id = await ctx.db.insert("apiKeys", {
      name: args.name,
      keyPrefix: prefix,
      keyHash: hash,
      keyToken: apiToken,
      businessName: args.businessName,
      callbackUrl: args.callbackUrl,
      projectId: args.projectId,
      signingSecret,
      createdAt: Date.now(),
    });

    await logAdminAction(ctx, {
      action: "api_key.create",
      entityType: "apiKeys",
      entityId: id,
      details: `Created API key "${args.name}"`,
      userId: admin._id,
      userEmail: admin.email,
    });

    return { id, token: apiToken, signingSecret };
  },
});

export const update = mutation({
  args: {
    id: v.id("apiKeys"),
    name: v.optional(v.string()),
    businessName: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const { id, token: _, ...fields } = args;
    const key = await ctx.db.get(id);
    if (!key) throw new Error("not_found");

    const patch: Record<string, any> = {};
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.businessName !== undefined) patch.businessName = fields.businessName;
    if (fields.callbackUrl !== undefined) patch.callbackUrl = fields.callbackUrl;
    if (fields.projectId !== undefined) patch.projectId = fields.projectId;

    await ctx.db.patch(id, patch);

    await logAdminAction(ctx, {
      action: "api_key.update",
      entityType: "apiKeys",
      entityId: id,
      details: `Updated API key "${key.name}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});

export const revoke = mutation({
  args: { id: v.id("apiKeys"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const key = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { revokedAt: Date.now() });
    await logAdminAction(ctx, {
      action: "api_key.revoke",
      entityType: "apiKeys",
      entityId: args.id,
      details: `Revoked API key "${key?.name ?? "unknown"}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("apiKeys"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.id);
  },
});
