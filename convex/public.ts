import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { RESEND_API_KEY, sendEmail } from "./lib/email";
import { buildPaymentConfirmedEmail } from "./lib/paymentEmail";
import { buildSignedWebhookRequest } from "./lib/webhooks";
import { requireAdmin } from "./lib/auth";


export const submitTransaction = mutation({
  args: {
    transactionRef: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    method: v.optional(v.string()),
    businessName: v.optional(v.string()),
    externalUserId: v.optional(v.string()),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!key || key.revokedAt) throw new ConvexError({ code: "invalid_api_key" });

    const businessName = args.businessName ?? key.businessName;
    if (!businessName) throw new ConvexError({ code: "missing_business_name" });

    let resolvedProjectId: any;
    let resolvedClientId: any;
    if (key.projectId) {
      const project = await ctx.db.get(key.projectId);
      if (project) {
        resolvedProjectId = key.projectId;
        resolvedClientId = project.clientId;
      }
    }

    const now = Date.now();
    const id = await ctx.db.insert("transactions", {
      transactionRef: args.transactionRef.toLowerCase(),
      amount: args.amount,
      currency: args.currency ?? "BDT",
      occurredAt: args.occurredAt ?? now,
      method: args.method,
      projectId: resolvedProjectId,
      clientId: resolvedClientId,
      status: "pending",
      verifiedExternalName: businessName,
      verifiedExternalUserId: args.externalUserId,
      verifiedSource: args.source,
      notes: args.notes,
      idempotencyKey: args.idempotencyKey,
      createdBy: key.businessName ?? key.name,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(key._id, { lastUsedAt: now });

    return { id, transactionRef: args.transactionRef, status: "unverified" };
  },
});

export const verifyTransaction = mutation({
  args: {
    transactionRef: v.string(),
    businessName: v.string(),
    date: v.optional(v.number()),
    amount: v.optional(v.number()),
    externalUserId: v.optional(v.string()),
    source: v.optional(v.string()),
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!key || key.revokedAt) throw new ConvexError({ code: "invalid_api_key" });
    if (!key.businessName) throw new ConvexError({ code: "key_missing_business_name" });

    // Per-key scoping: only query transactions matching this key's business_name
    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_transaction_ref", (q) => q.eq("transactionRef", args.transactionRef.toLowerCase()))
      .first();

    if (!tx) return { verified: false, reason: "not_found" };
    if (tx.verifiedExternalName !== key.businessName) {
      return { verified: false, reason: "not_found" };
    }

    if (args.date) {
      const txDay = new Date(tx.occurredAt).toISOString().slice(0, 10);
      const inDay = new Date(args.date).toISOString().slice(0, 10);
      if (txDay !== inDay) return { verified: false, reason: "date_mismatch" };
    }

    if (args.amount != null && Math.abs(args.amount - tx.amount) > 0.001) {
      return { verified: false, reason: "amount_mismatch" };
    }

    let resolvedProjectId: any;
    let resolvedClientId: any;
    if (key.projectId) {
      const project = await ctx.db.get(key.projectId);
      if (project) {
        resolvedProjectId = key.projectId;
        resolvedClientId = project.clientId;
      }
    }

    await ctx.db.patch(tx._id, {
      verifiedExternalName: args.businessName,
      verifiedExternalUserId: args.externalUserId,
      verifiedSource: args.source,
      verifiedAt: Date.now(),
      ...(resolvedProjectId && !tx.projectId ? { projectId: resolvedProjectId } : {}),
      ...(resolvedClientId && !tx.clientId ? { clientId: resolvedClientId } : {}),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(key._id, { lastUsedAt: Date.now() });

    let projectCode: string | null = null;
    if (tx.projectId) {
      const project = await ctx.db.get(tx.projectId);
      if (project) {
        await ctx.db.patch(tx.projectId, {
          lastTransactionRef: tx.transactionRef,
          lastPaymentAt: tx.occurredAt,
          updatedAt: Date.now(),
        });
        projectCode = project.projectCode;
      }
    }

    return {
      verified: true,
      transaction: {
        ref: tx.transactionRef,
        amount: tx.amount,
        currency: tx.currency,
        occurredAt: tx.occurredAt,
        projectCode,
      },
    };
  },
});

export const reviewTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    note: v.string(),
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!key || key.revokedAt) throw new ConvexError({ code: "invalid_api_key" });
    if (!key.businessName) throw new ConvexError({ code: "key_missing_business_name" });

    const tx = await ctx.db.get(args.transactionId);
    if (!tx) return { reviewed: false, reason: "not_found" };
    if (tx.verifiedExternalName !== key.businessName) {
      return { reviewed: false, reason: "not_found" };
    }

    await ctx.db.patch(tx._id, {
      clientReviewAmount: args.amount,
      clientReviewNote: args.note,
      clientReviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(key._id, { lastUsedAt: Date.now() });

    return {
      reviewed: true,
      transaction: {
        ref: tx.transactionRef,
        amount: args.amount,
        note: args.note,
      },
    };
  },
});

export const triggerVerifyBatch = mutation({
  args: {
    ids: v.optional(v.array(v.id("transactions"))),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    let txs;
    if (args.ids && args.ids.length > 0) {
      txs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
      txs = txs.filter(Boolean);
    } else {
      txs = await ctx.db
        .query("transactions")
        .withIndex("by_verified_at", (q) => q.eq("verifiedAt", undefined))
        .collect();
    }

    if (txs.length === 0) return { total: 0, groups: [] };

    const validTxs = txs.filter((t): t is NonNullable<typeof t> => t != null);
    const byBiz = new Map<string, typeof validTxs>();
    for (const t of validTxs) {
      const key = (t.verifiedExternalName ?? "").trim().toLowerCase();
      if (!key) continue;
      if (!byBiz.has(key)) byBiz.set(key, []);
      byBiz.get(key)!.push(t);
    }

    const groups: any[] = [];

    for (const [, group] of byBiz) {
      const displayName = group[0].verifiedExternalName!;
      const groupIds = group.map((t) => t._id);

      const keyRow = await ctx.db
        .query("apiKeys")
        .withIndex("by_business_name", (q) => q.eq("businessName", displayName))
        .first();

      if (!keyRow || keyRow.revokedAt) {
        groups.push({
          businessName: displayName,
          callbackUrl: null,
          sent: group.length,
          verifiedIds: [],
          status: "skipped_no_key",
        });
        continue;
      }

      if (!keyRow.callbackUrl) {
        groups.push({
          businessName: displayName,
          callbackUrl: null,
          sent: group.length,
          verifiedIds: [],
          status: "skipped_no_callback",
        });
        continue;
      }

      if (!keyRow.callbackUrl.startsWith("https://")) {
        groups.push({
          businessName: displayName,
          callbackUrl: keyRow.callbackUrl,
          sent: group.length,
          verifiedIds: [],
          status: "failed",
          error: "callback_url must use HTTPS",
        });
        continue;
      }

      const { body, headers } = await buildSignedWebhookRequest({
        event: "verified",
        businessName: displayName,
        signingSecret: keyRow.signingSecret,
        transactions: group.map((t) => ({
          transactionRef: t.transactionRef,
          amount: t.amount,
          currency: t.currency,
          status: "verified" as const,
          occurredAt: new Date(t.occurredAt).toISOString(),
          method: t.method,
          externalUserId: t.verifiedExternalUserId,
          source: t.verifiedSource,
        })),
      });

      try {
        const res = await fetch(keyRow.callbackUrl, {
          method: "POST",
          headers,
          body,
        });

        if (res.ok) {
          const verifiedAt = Date.now();
          for (const id of groupIds) {
            await ctx.db.patch(id, {
              verifiedAt,
              verifiedSource: "callback",
              status: "verified",
              statusChangedAt: verifiedAt,
              statusChangedBy: "callback",
              updatedAt: verifiedAt,
            });
            await ctx.db.insert("statusHistory", {
              transactionId: id,
              fromStatus: "pending",
              toStatus: "verified",
              changedBy: "callback",
              changedAt: verifiedAt,
            });
          }

          if (RESEND_API_KEY) {
            for (const t of group) {
              if (t.clientId) {
                const client = await ctx.db.get(t.clientId);
                if (client?.email) {
                  const project = t.projectId ? await ctx.db.get(t.projectId) : null;
                  const period = t.notes?.match(/for (.+?) by/)?.[1] ?? "";
                  try {
                    const confirmation = buildPaymentConfirmedEmail({
                      transactionRef: t.transactionRef,
                      amount: t.amount,
                      currency: t.currency,
                      projectName: project?.name,
                      projectCode: project?.projectCode,
                      period,
                      transactionId: t._id,
                      verifiedAt,
                    });
                    await sendEmail([client.email], confirmation.subject, confirmation.html);
                  } catch {
                    // Email send failed silently — don't block verification
                  }
                }
              }
            }
          }

          groups.push({
            businessName: displayName,
            callbackUrl: keyRow.callbackUrl,
            sent: group.length,
            verifiedIds: groupIds,
            status: "delivered",
          });
        } else {
          groups.push({
            businessName: displayName,
            callbackUrl: keyRow.callbackUrl,
            sent: group.length,
            verifiedIds: [],
            status: "failed",
            httpStatus: res.status,
          });
        }
      } catch (e: any) {
        groups.push({
          businessName: displayName,
          callbackUrl: keyRow.callbackUrl,
          sent: group.length,
          verifiedIds: [],
          status: "failed",
          error: e?.message ?? "fetch_failed",
        });
      }
    }

    return { total: txs.length, groups };
  },
});

export const requestRefund = mutation({
  args: {
    transactionRef: v.string(),
    amount: v.number(),
    method: v.string(),
    receiverName: v.string(),
    receiverNumber: v.string(),
    notes: v.optional(v.string()),
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!key || key.revokedAt) throw new ConvexError({ code: "invalid_api_key" });
    if (!key.businessName) throw new ConvexError({ code: "key_missing_business_name" });

    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_transaction_ref", (q) => q.eq("transactionRef", args.transactionRef.toLowerCase()))
      .first();

    if (!tx) throw new ConvexError({ code: "transaction_not_found" });
    if (tx.verifiedExternalName !== key.businessName) {
      throw new ConvexError({ code: "transaction_not_found" });
    }
    if ((tx.status ?? "pending") !== "verified") {
      throw new ConvexError({ code: "transaction_not_verified" });
    }

    const now = Date.now();

    const refundId = await ctx.db.insert("refunds", {
      transactionId: tx._id,
      amount: args.amount,
      currency: tx.currency,
      method: args.method,
      status: "pending",
      initiatedBy: key.businessName ?? key.name,
      receiverName: args.receiverName,
      receiverNumber: args.receiverNumber,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("statusHistory", {
      transactionId: tx._id,
      fromStatus: tx.status ?? "verified",
      toStatus: "reimbursed",
      changedBy: key.businessName ?? key.name,
      changedAt: now,
      notes: `Refund requested via API: ${tx.currency} ${args.amount} via ${args.method} to ${args.receiverName} (${args.receiverNumber})${args.notes ? ` — ${args.notes}` : ""}`,
    });

    await ctx.db.patch(key._id, { lastUsedAt: now });

    return { refundId: refundId.toString(), ok: true };
  },
});
