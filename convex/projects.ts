import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateProjectCode, generatePayCode } from "./lib/helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() } as any);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
