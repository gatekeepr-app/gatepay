import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { logAdminAction, roleValidator } from "./lib/helpers";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const users = await ctx.db.query("users").take(100);
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    }));
  },
});

export const getByEmail = query({
  args: { email: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

export const create = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash: args.passwordHash,
      name: args.name,
      role: args.role as any,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const updateRole = mutation({
  args: { userId: v.id("users"), role: roleValidator, token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const remove = mutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const user = await ctx.db.get(args.userId);
    const email = user?.email ?? "unknown";
    await ctx.db.delete(args.userId);
    await logAdminAction(ctx, {
      action: "user.remove",
      entityType: "users",
      entityId: args.userId,
      details: `Removed user ${email}`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});
