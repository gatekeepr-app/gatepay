import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { randomHex } from "./lib/crypto";
import { requireAdmin } from "./lib/auth";
import { logAdminAction } from "./lib/adminAuditLog";
import { escapeHtml } from "./lib/text";
import { inviteStatusValidator, roleValidator } from "./lib/validators";
import { sendEmail } from "./lib/email";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("invitations").order("desc").take(100);
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
    role: roleValidator,
    invitedBy: v.optional(v.id("users")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const token = randomHex(24);
    const now = Date.now();
    const email = args.email.toLowerCase();
    const id = await ctx.db.insert("invitations", {
      email,
      role: args.role,
      invitedBy: args.invitedBy,
      token,
      status: "pending",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    const inviteLink = `https://pay.darvizlabs.com/invite/${token}`;

    try {
      await sendEmail(
        email,
        `You're invited to join GatePay as ${args.role}`,
        `<p>You've been invited to join GatePay as <strong>${escapeHtml(args.role)}</strong>.</p>
<p>Click the link below to accept your invitation:</p>
<p><a href="${inviteLink}">${inviteLink}</a></p>
<p>This link expires in 7 days.</p>`,
      );
    } catch {
      // email send failure shouldn't block the invite
    }

    await logAdminAction(ctx, {
      action: "invitation.create",
      entityType: "invitations",
      entityId: id,
      details: `Invited ${email} as ${args.role}`,
      userId: admin._id,
      userEmail: admin.email,
    });

    return { id, token };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invitations"),
    status: inviteStatusValidator,
    acceptedAt: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const { id, token: _, ...fields } = args;
    await ctx.db.patch(id, fields);
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
