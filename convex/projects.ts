import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateProjectCode, generatePayCode, logAdminAction } from "./lib/helpers";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("projects").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("projects"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.get(args.id);
  },
});

export const getByPayCode = query({
  args: { payCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_pay_code", (q) => q.eq("payCode", args.payCode))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    createdBy: v.optional(v.id("users")),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const now = Date.now();
    const projectCode = await generateProjectCode(ctx);
    const payCode = generatePayCode();
    const id = await ctx.db.insert("projects", {
      projectCode,
      name: args.name,
      description: args.description,
      clientId: args.clientId,
      createdBy: args.createdBy,
      status: (args.status as any) ?? "draft",
      tags: args.tags ?? [],
      payCode,
      createdAt: now,
      updatedAt: now,
    });
    await logAdminAction(ctx, {
      action: "project.create",
      entityType: "projects",
      entityId: id,
      details: `Created project "${args.name}" (${projectCode})`,
      userId: admin._id,
      userEmail: admin.email,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lastTransactionRef: v.optional(v.string()),
    lastPaymentAt: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const { id, token: _, ...fields } = args;
    const project = await ctx.db.get(id);
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() } as any);
    await logAdminAction(ctx, {
      action: "project.update",
      entityType: "projects",
      entityId: id,
      details: `Updated project "${project?.name ?? "unknown"}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("projects"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const project = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logAdminAction(ctx, {
      action: "project.remove",
      entityType: "projects",
      entityId: args.id,
      details: `Removed project "${project?.name ?? "unknown"}"`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});
