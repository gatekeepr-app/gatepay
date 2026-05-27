import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { randomHex } from "./lib/crypto";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("invitations").order("desc").collect();
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    role: v.string(),
    invitedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const token = randomHex(24);
    const now = Date.now();
    const id = await ctx.db.insert("invitations", {
      email: args.email.toLowerCase(),
      role: args.role as any,
      invitedBy: args.invitedBy,
      token,
      status: "pending",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      createdAt: now,
    });
    return { id, token };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invitations"),
    status: v.string(),
    acceptedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields as any);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});
