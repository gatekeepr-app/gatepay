import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
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

// Handles the login page's sign-in-or-create flow in one transaction. Expected
// credential failures are returned as data so they don't appear as server errors.
export const authenticate = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (user) {
      if (!user.passwordHash || !(await verifyPassword(args.password, user.passwordHash))) {
        return { ok: false as const, reason: "invalid_credentials" as const };
      }
      return {
        ok: true as const,
        token: await createSession(ctx, user._id),
        created: false,
      };
    }

    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: await hashPassword(args.password),
      role: email === "product.gatekeepr@gmail.com" ? "super_admin" : "admin",
      createdAt: Date.now(),
    });
    return {
      ok: true as const,
      token: await createSession(ctx, userId),
      created: true,
    };
  },
});

// Operator-only recovery path. Run once from the Convex CLI, then remove it.
export const resetAdminPassword = internalMutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    if (args.password.length < 8 || args.password.length > 128) {
      throw new Error("Password must be between 8 and 128 characters");
    }

    const email = "product.gatekeepr@gmail.com";
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!user) throw new Error(`No account found for ${email}`);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(1001);
    if (sessions.length > 1000) {
      throw new Error("Too many active sessions to reset safely; remove sessions in batches first");
    }

    await ctx.db.patch(user._id, { passwordHash: await hashPassword(args.password) });
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    return { email, sessionsRevoked: sessions.length };
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
