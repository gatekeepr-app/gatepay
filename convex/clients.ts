import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { logAdminAction } from "./lib/helpers";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("clients").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("clients"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    businessName: v.optional(v.string()),
    brandName: v.optional(v.string()),
    phone: v.optional(v.string()),
    socialLinks: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const now = Date.now();
    const id = await ctx.db.insert("clients", {
      name: args.name,
      email: args.email,
      businessName: args.businessName,
      brandName: args.brandName,
      phone: args.phone,
      socialLinks: args.socialLinks ?? "{}",
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    await logAdminAction(ctx, {
      action: "client.create",
      entityType: "clients",
      entityId: id,
      details: `Created client "${args.name}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    businessName: v.optional(v.string()),
    brandName: v.optional(v.string()),
    phone: v.optional(v.string()),
    socialLinks: v.optional(v.string()),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const { id, token: _, ...fields } = args;
    const client = await ctx.db.get(id);
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await logAdminAction(ctx, {
      action: "client.update",
      entityType: "clients",
      entityId: id,
      details: `Updated client "${client?.name ?? "unknown"}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("clients"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const client = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logAdminAction(ctx, {
      action: "client.remove",
      entityType: "clients",
      entityId: args.id,
      details: `Removed client "${client?.name ?? "unknown"}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});
