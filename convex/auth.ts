import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { randomHex, pbkdf2Hash, verifyPbkdf2 } from "./lib/crypto";

async function hashPassword(password: string): Promise<string> {
  const { hash, salt } = await pbkdf2Hash(password);
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return verifyPbkdf2(password, stored);
}

async function createSession(ctx: any, userId: string): Promise<string> {
  const token = randomHex(32);
  await ctx.db.insert("sessions", {
    token,
    userId: userId as Id<"users">,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  });
  return token;
}

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (existing) throw new Error("User already exists");

    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash: await hashPassword(args.password),
      name: args.name,
      role: args.email === "product.gatekeepr@gmail.com" ? "super_admin" : "admin",
      createdAt: Date.now(),
    });

    const token = await createSession(ctx, userId);
    return { userId, token };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (!user || !user.passwordHash) throw new Error("Invalid credentials");
    if (!(await verifyPassword(args.password, user.passwordHash))) throw new Error("Invalid credentials");

    const token = await createSession(ctx, user._id);
    return { userId: user._id, token, role: user.role };
  },
});

export const getMe = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      if (session) await ctx.db.delete(session._id);
      throw new Error("Invalid session");
    }
    const user = await ctx.db.get(session.userId);
    if (!user) throw new Error("User not found");
    const { _id, email, name, role } = user;
    return { _id, email, name, role };
  },
});
