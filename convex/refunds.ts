import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

// ─── Queries ──────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("refunds").order("desc").take(100);
  },
});

export const getByTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("refunds")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("refunds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ────────────────────────────────────────────

export const initiateRefund = mutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    method: v.string(),
    receiverName: v.optional(v.string()),
    receiverNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const tx = await ctx.db.get(args.transactionId);
    if (!tx) throw new Error("transaction_not_found");
    if ((tx.status ?? "pending") !== "verified") {
      throw new Error("Only verified transactions can be refunded");
    }

    const now = Date.now();

    const refundId = await ctx.db.insert("refunds", {
      transactionId: args.transactionId,
      amount: args.amount,
      currency: tx.currency,
      method: args.method,
      status: "pending",
      initiatedBy: args.token,
      receiverName: args.receiverName,
      receiverNumber: args.receiverNumber,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("statusHistory", {
      transactionId: args.transactionId,
      fromStatus: tx.status ?? "verified",
      toStatus: "reimbursed",
      changedBy: args.token,
      changedAt: now,
      notes: `Refund initiated: ${tx.currency} ${args.amount} via ${args.method}${args.receiverName ? ` to ${args.receiverName}` : ""}${args.receiverNumber ? ` (${args.receiverNumber})` : ""}${args.notes ? ` — ${args.notes}` : ""}`,
    });

    return { refundId, ok: true };
  },
});

export const updateRefundStatus = mutation({
  args: {
    id: v.id("refunds"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    gatewayRef: v.optional(v.string()),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const refund = await ctx.db.get(args.id);
    if (!refund) throw new Error("refund_not_found");

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: args.status,
      gatewayRef: args.gatewayRef,
      notes: args.notes,
      updatedAt: now,
    });

    // If refund completed, update transaction status
    if (args.status === "completed") {
      const tx = await ctx.db.get(refund.transactionId);
      if (tx) {
        await ctx.db.patch(refund.transactionId, {
          status: "reimbursed",
          statusChangedAt: now,
          statusChangedBy: args.token,
          reimbursedAt: now,
          reimbursedBy: args.token,
          reimbursementAmount: refund.amount,
          reimbursementRef: args.gatewayRef ?? refund.gatewayRef,
          reimbursementMethod: refund.method,
          updatedAt: now,
        });

        await ctx.db.insert("statusHistory", {
          transactionId: refund.transactionId,
          fromStatus: tx.status ?? "verified",
          toStatus: "reimbursed",
          changedBy: args.token,
          changedAt: now,
          notes: `Refund completed: ${args.gatewayRef ?? "manual"}`,
        });
      }
    }

    return { ok: true };
  },
});

export const cancelRefund = mutation({
  args: {
    id: v.id("refunds"),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const refund = await ctx.db.get(args.id);
    if (!refund) throw new Error("refund_not_found");
    if (refund.status === "completed") throw new Error("Cannot cancel completed refund");
    if (refund.status === "cancelled") throw new Error("Already cancelled");

    await ctx.db.patch(args.id, {
      status: "cancelled",
      notes: args.notes ?? "Cancelled by admin",
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});
