import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { generateInvoiceNumber } from "./lib/helpers";
import { hmacSha256 } from "./lib/crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = "GatePay <pay@mail.darvizlabs.online>";

// ─── Queries ──────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transactions").order("desc").collect();
  },
});

export const getByStatus = query({
  args: { status: v.union(v.literal("pending"), v.literal("verified"), v.literal("reimbursed"), v.literal("failed")) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("transactions").order("desc").collect();
    return all.filter((t) => (t.status ?? "pending") === args.status);
  },
});

export const getById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const getByRef = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_transaction_ref", (q) => q.eq("transactionRef", args.ref.toLowerCase()))
      .first();
  },
});

export const getHistory = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("statusHistory")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .order("asc")
      .collect();
  },
});

export const getUnverified = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_verified_at", (q) => q.eq("verifiedAt", undefined))
      .collect();
  },
});

export const getStatusCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("transactions").collect();
    return {
      total: all.length,
      pending: all.filter((t) => (t.status ?? "pending") === "pending").length,
      verified: all.filter((t) => (t.status ?? "pending") === "verified").length,
      reimbursed: all.filter((t) => (t.status ?? "pending") === "reimbursed").length,
      failed: all.filter((t) => (t.status ?? "pending") === "failed").length,
    };
  },
});

// ─── Helper: fire callback to partner ─────────────────────

async function fireCallback(
  ctx: any,
  tx: any,
  event: "verified" | "reimbursed",
) {
  if (!tx.projectId) return;
  const project = await ctx.db.get(tx.projectId);
  if (!project?.clientId) return;

  const client = await ctx.db.get(project.clientId);
  const businessName = client?.businessName ?? client?.name;
  if (!businessName) return;

  const keyRow = await ctx.db
    .query("apiKeys")
    .withIndex("by_business_name", (q: any) => q.eq("businessName", businessName))
    .first();

  if (!keyRow || keyRow.revokedAt || !keyRow.callbackUrl) return;
  if (!keyRow.callbackUrl.startsWith("https://")) return;

  const txPayload: any = {
    transactionRef: tx.transactionRef,
    amount: tx.amount,
    currency: tx.currency,
    status: event,
    occurredAt: new Date(tx.occurredAt).toISOString(),
    method: tx.method,
    externalUserId: tx.verifiedExternalUserId,
    source: tx.verifiedSource,
  };

  if (event === "reimbursed") {
    txPayload.reimbursement_amount = tx.reimbursementAmount;
    txPayload.reimbursement_method = tx.reimbursementMethod;
    txPayload.reimbursement_ref = tx.reimbursementRef;
  }

  const payload = {
    event,
    businessName,
    sentAt: new Date().toISOString(),
    transactions: [txPayload],
  };
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "GatePay-Verify/1.0",
  };
  if (keyRow.signingSecret) {
    const sig = await hmacSha256(keyRow.signingSecret, body);
    headers["X-GatePay-Signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(keyRow.callbackUrl, { method: "POST", headers, body });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Helper: send status email ────────────────────────────

async function sendStatusEmail(
  ctx: any,
  tx: any,
  newStatus: string,
  oldStatus: string,
) {
  if (!RESEND_API_KEY) return;

  const project = tx.projectId ? await ctx.db.get(tx.projectId) : null;
  const client = tx.clientId ? await ctx.db.get(tx.clientId) : null;
  const period = tx.notes?.match(/for (.+?) by/)?.[1] ?? "";

  if (newStatus === "pending" && oldStatus === "failed") return; // re-open, no email

  if (newStatus === "pending" && oldStatus === "pending") {
    // New transaction — email admin
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      if (!admin.email) continue;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [admin.email],
            subject: `New Payment — ${tx.transactionRef}`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;">New Payment Received</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px 0;color:#888;">Transaction</td><td style="padding:8px 0;font-family:monospace;">${tx.transactionRef}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;">${tx.currency} ${tx.amount.toLocaleString()}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Method</td><td style="padding:8px 0;">${tx.method ?? "—"}</td></tr>
                ${project ? `<tr><td style="padding:8px 0;color:#888;">Project</td><td style="padding:8px 0;">${project.name}</td></tr>` : ""}
              </table>
              <p style="color:#888;font-size:12px;margin:24px 0 0;">GatePay — Payment Verification</p>
            </div>`,
          }),
        });
      } catch {}
    }
    return;
  }

  if (!client?.email) return;

  let subject = "";
  let body = "";

  if (newStatus === "verified") {
    subject = `Payment Confirmed — ${project?.name ?? "GatePay"}`;
    body = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="margin:0 0 16px;font-size:20px;">Payment Confirmed</h2>
      <p style="color:#555;margin:0 0 24px;">Your payment has been verified by our team.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;">Transaction ref</td><td style="padding:8px 0;font-family:monospace;">${tx.transactionRef}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;">${tx.currency} ${tx.amount.toLocaleString()}</td></tr>
        ${period ? `<tr><td style="padding:8px 0;color:#888;">Period</td><td style="padding:8px 0;">${period}</td></tr>` : ""}
        ${project ? `<tr><td style="padding:8px 0;color:#888;">Project</td><td style="padding:8px 0;">${project.name} (${project.projectCode})</td></tr>` : ""}
      </table>
      <p style="color:#888;font-size:12px;margin:24px 0 0;">GatePay — Payment Verification</p>
    </div>`;
  } else if (newStatus === "reimbursed") {
    subject = `Payment Reimbursed — ${project?.name ?? "GatePay"}`;
    body = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="margin:0 0 16px;font-size:20px;">Payment Reimbursed</h2>
      <p style="color:#555;margin:0 0 24px;">Your payment has been reimbursed.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;">Transaction ref</td><td style="padding:8px 0;font-family:monospace;">${tx.transactionRef}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Original amount</td><td style="padding:8px 0;">${tx.currency} ${tx.amount.toLocaleString()}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Reimbursed</td><td style="padding:8px 0;">${tx.currency} ${(tx.reimbursementAmount ?? tx.amount).toLocaleString()}</td></tr>
        ${tx.reimbursementMethod ? `<tr><td style="padding:8px 0;color:#888;">Method</td><td style="padding:8px 0;">${tx.reimbursementMethod}</td></tr>` : ""}
        ${tx.reimbursementRef ? `<tr><td style="padding:8px 0;color:#888;">Reference</td><td style="padding:8px 0;font-family:monospace;">${tx.reimbursementRef}</td></tr>` : ""}
      </table>
      <p style="color:#888;font-size:12px;margin:24px 0 0;">GatePay — Payment Verification</p>
    </div>`;
  } else if (newStatus === "failed") {
    subject = `Payment Failed — ${tx.transactionRef}`;
    body = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="margin:0 0 16px;font-size:20px;">Payment Failed</h2>
      <p style="color:#555;margin:0 0 24px;">A payment has been marked as failed.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;">Transaction</td><td style="padding:8px 0;font-family:monospace;">${tx.transactionRef}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;">${tx.currency} ${tx.amount.toLocaleString()}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin:24px 0 0;">GatePay — Payment Verification</p>
    </div>`;
  }

  if (!subject) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [client.email], subject, html: body }),
    });
  } catch {}
}

// ─── Mutations ────────────────────────────────────────────

export const submitPayPayment = mutation({
  args: {
    transactionRef: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    method: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    periodLabel: v.string(),
    payerName: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const invoiceNumber = generateInvoiceNumber();

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      projectId: args.projectId,
      clientId: args.clientId,
      issueDate: now,
      status: "draft",
      currency: args.currency ?? "BDT",
      subtotal: args.amount,
      taxRate: 0,
      taxAmount: 0,
      total: args.amount,
      notes: `Auto-generated from pay link — payment by ${args.payerName}${args.notes ? ` (${args.notes})` : ""}`,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("invoiceLineItems", {
      invoiceId,
      description: `Monthly retainer — ${args.periodLabel}`,
      quantity: 1,
      unitPrice: args.amount,
      amount: args.amount,
      position: 0,
    });

    const transactionId = await ctx.db.insert("transactions", {
      transactionRef: args.transactionRef.toLowerCase(),
      amount: args.amount,
      currency: args.currency ?? "BDT",
      occurredAt: now,
      method: args.method,
      clientId: args.clientId,
      projectId: args.projectId,
      invoiceId,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Log initial status
    await ctx.db.insert("statusHistory", {
      transactionId,
      fromStatus: "pending",
      toStatus: "pending",
      changedBy: args.createdBy,
      changedAt: now,
      notes: "Payment submitted via pay link",
    });

    // Send admin notification email
    const tx = await ctx.db.get(transactionId);
    if (tx) {
      await sendStatusEmail(ctx, tx, "pending", "pending");
    }

    return { transactionId, invoiceId, invoiceNumber };
  },
});

export const create = mutation({
  args: {
    transactionRef: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    method: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    invoiceId: v.optional(v.id("invoices")),
    verifiedExternalName: v.optional(v.string()),
    verifiedExternalUserId: v.optional(v.string()),
    verifiedSource: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("transactions", {
      transactionRef: args.transactionRef.toLowerCase(),
      amount: args.amount,
      currency: args.currency ?? "BDT",
      occurredAt: args.occurredAt ?? now,
      method: args.method,
      clientId: args.clientId,
      projectId: args.projectId,
      invoiceId: args.invoiceId,
      verifiedExternalName: args.verifiedExternalName,
      verifiedExternalUserId: args.verifiedExternalUserId,
      verifiedSource: args.verifiedSource,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("transactions"),
    status: v.union(
      v.literal("verified"),
      v.literal("reimbursed"),
      v.literal("failed"),
      v.literal("pending"),
    ),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("not_found");

    const now = Date.now();
    const oldStatus = tx.status ?? "pending";

    await ctx.db.patch(args.id, {
      status: args.status,
      statusChangedAt: now,
      statusChangedBy: args.token,
      ...(args.status === "verified" ? { verifiedAt: now } : {}),
      updatedAt: now,
    });

    await ctx.db.insert("statusHistory", {
      transactionId: args.id,
      fromStatus: oldStatus,
      toStatus: args.status,
      changedBy: args.token,
      changedAt: now,
      notes: args.notes,
    });

    if (args.status === "verified" || args.status === "reimbursed") {
      await fireCallback(ctx, tx, args.status as "verified" | "reimbursed");
    }

    await sendStatusEmail(ctx, tx, args.status, oldStatus);

    return { ok: true, from: oldStatus, to: args.status };
  },
});

export const reimburse = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.number(),
    method: v.string(),
    reimbursementRef: v.optional(v.string()),
    notes: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("not_found");
    if ((tx.status ?? "pending") === "reimbursed") throw new Error("already_reimbursed");

    const now = Date.now();
    const oldStatus = tx.status ?? "pending";

    await ctx.db.patch(args.id, {
      status: "reimbursed",
      statusChangedAt: now,
      statusChangedBy: args.token,
      reimbursedAt: now,
      reimbursedBy: args.token,
      reimbursementAmount: args.amount,
      reimbursementRef: args.reimbursementRef,
      reimbursementMethod: args.method,
      updatedAt: now,
    });

    await ctx.db.insert("statusHistory", {
      transactionId: args.id,
      fromStatus: oldStatus,
      toStatus: "reimbursed",
      changedBy: args.token,
      changedAt: now,
      notes: `Reimbursed ${tx.currency} ${args.amount} via ${args.method}${args.notes ? ` — ${args.notes}` : ""}`,
    });

    await fireCallback(ctx, tx, "reimbursed");
    await sendStatusEmail(ctx, tx, "reimbursed", oldStatus);

    return { ok: true };
  },
});

export const backfillStatus = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const txs = await ctx.db.query("transactions").collect();
    let count = 0;
    for (const tx of txs) {
      if ((tx as any).status) continue; // already has status
      const newStatus = tx.verifiedAt ? "verified" : "pending";
      await ctx.db.patch(tx._id, { status: newStatus as any });
      await ctx.db.insert("statusHistory", {
        transactionId: tx._id,
        fromStatus: "unknown",
        toStatus: newStatus,
        changedBy: "backfill",
        changedAt: Date.now(),
        notes: "Backfilled from V1 data",
      });
      count++;
    }
    return { backfilled: count };
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    verifiedExternalName: v.optional(v.string()),
    verifiedExternalUserId: v.optional(v.string()),
    verifiedSource: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const verifyByCallback = mutation({
  args: { ids: v.array(v.id("transactions")), source: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.ids) {
      await ctx.db.patch(id, {
        verifiedAt: now,
        verifiedSource: args.source ?? "callback",
        status: "verified",
        statusChangedAt: now,
        statusChangedBy: "callback",
        updatedAt: now,
      });
      await ctx.db.insert("statusHistory", {
        transactionId: id,
        fromStatus: "pending",
        toStatus: "verified",
        changedBy: "callback",
        changedAt: now,
        notes: "Verified via callback",
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
