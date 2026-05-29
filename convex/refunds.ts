import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin } from "./lib/auth";

const SSLCOMMERZ_URL = process.env.SSLCOMMERZ_URL || "https://sandbox.sslcommerz.com";
const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || "";
const SSLCOMMERZ_STORE_PASS = process.env.SSLCOMMERZ_STORE_PASS || "";

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
      notes: `Refund initiated: ${tx.currency} ${args.amount} via ${args.method}${args.notes ? ` — ${args.notes}` : ""}`,
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
    gatewayResponse: v.optional(v.string()),
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
      gatewayResponse: args.gatewayResponse,
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
          notes: `Refund completed: ${args.gatewayRef ?? "no gateway ref"}`,
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

// ─── SSLCommerz Gateway Integration ───────────────────────

export const processGatewayRefund = action({
  args: {
    refundId: v.id("refunds"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; gatewayRef?: string; error?: string }> => {
    // Use public queries to read data
    const refund = await ctx.runQuery(api.refunds.getById, { id: args.refundId });
    if (!refund) throw new Error("refund_not_found");

    const tx = await ctx.runQuery(api.transactions.getById, { id: refund.transactionId });
    if (!tx) throw new Error("transaction_not_found");

    // Sandbox mode — simulate success
    if (!SSLCOMMERZ_STORE_ID) {
      const gatewayRef = `REFUND-${Date.now()}`;
      await ctx.runMutation(api.refunds.updateRefundStatus, {
        id: args.refundId,
        status: "completed",
        gatewayRef,
        gatewayResponse: JSON.stringify({
          status: "success",
          message: "Refund processed (sandbox)",
          refund_id: gatewayRef,
        }),
        token: "system",
      });
      return { success: true, gatewayRef };
    }

    // Production: call SSLCommerz refund API
    try {
      const response: any = await fetch(`${SSLCOMMERZ_URL}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          store_id: SSLCOMMERZ_STORE_ID,
          store_pass: SSLCOMMERZ_STORE_PASS,
          refund_amount: String(refund.amount),
          transaction_id: tx.transactionRef,
          refund_remarks: refund.notes ?? "Refund via GatePay",
        }).toString(),
      });

      const data: any = await response.json();

      if (data.status === "success") {
        await ctx.runMutation(api.refunds.updateRefundStatus, {
          id: args.refundId,
          status: "completed",
          gatewayRef: data.refund_id,
          gatewayResponse: JSON.stringify(data),
          token: "system",
        });
        return { success: true, gatewayRef: data.refund_id };
      } else {
        await ctx.runMutation(api.refunds.updateRefundStatus, {
          id: args.refundId,
          status: "failed",
          gatewayResponse: JSON.stringify(data),
          notes: data.message ?? "Gateway refund failed",
          token: "system",
        });
        return { success: false, error: data.message };
      }
    } catch (err: any) {
      await ctx.runMutation(api.refunds.updateRefundStatus, {
        id: args.refundId,
        status: "failed",
        gatewayResponse: err.message,
        token: "system",
      });
      return { success: false, error: err.message };
    }
  },
});
