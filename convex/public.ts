import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hmacSha256 } from "./lib/crypto";
import { requireAdmin } from "./lib/auth";

// POST /api/public/transactions/submit
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

    if (!key || key.revokedAt) throw new Error("invalid_api_key");

    const businessName = args.businessName ?? key.businessName;
    if (!businessName) throw new Error("missing_business_name");

    // Idempotency check
    if (args.idempotencyKey) {
      const existingIdempotent = await ctx.db
        .query("transactions")
        .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
        .first();
      if (existingIdempotent) {
        return {
          id: existingIdempotent._id,
          transactionRef: existingIdempotent.transactionRef,
          status: "duplicate",
          duplicate: true,
        };
      }
    }

    // Duplicate ref check
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_transaction_ref", (q) => q.eq("transactionRef", args.transactionRef.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("duplicate_ref");
    }

    const now = Date.now();
    const id = await ctx.db.insert("transactions", {
      transactionRef: args.transactionRef.toLowerCase(),
      amount: args.amount,
      currency: args.currency ?? "BDT",
      occurredAt: args.occurredAt ?? now,
      method: args.method,
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

// POST /api/public/transactions/verify
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

    if (!key || key.revokedAt) throw new Error("invalid_api_key");
    if (!key.businessName) throw new Error("key_missing_business_name");

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

    await ctx.db.patch(tx._id, {
      verifiedExternalName: args.businessName,
      verifiedExternalUserId: args.externalUserId,
      verifiedSource: args.source,
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(key._id, { lastUsedAt: Date.now() });

    // Update project if linked
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

// POST /api/v1/public/transactions/review
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

    if (!key || key.revokedAt) throw new Error("invalid_api_key");
    if (!key.businessName) throw new Error("key_missing_business_name");

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

// Trigger verify batch (admin function)
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

      const payload = {
        businessName: displayName,
        sentAt: new Date().toISOString(),
        transactions: group.map((t) => ({
          transactionRef: t.transactionRef,
          amount: t.amount,
          currency: t.currency,
          occurredAt: new Date(t.occurredAt).toISOString(),
          method: t.method,
          externalUserId: t.verifiedExternalUserId,
          source: t.verifiedSource,
        })),
      };
      const body = JSON.stringify(payload);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Gatekeepr-Verify/1.0",
      };
      if (keyRow.signingSecret) {
        const sig = await hmacSha256(keyRow.signingSecret, body);
        headers["X-Gatekeepr-Signature"] = `sha256=${sig}`;
      }

      try {
        const res = await fetch(keyRow.callbackUrl, {
          method: "POST",
          headers,
          body,
        });

        if (res.ok) {
          const verifiedAt = Date.now();
          for (const id of groupIds) {
            await ctx.db.patch(id, { verifiedAt, verifiedSource: "callback", updatedAt: verifiedAt });
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
