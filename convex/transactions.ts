import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { generateInvoiceNumber } from "./lib/helpers";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = "Gatekeepr <noreply@darvizlabs.com>";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transactions").order("desc").collect();
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
    const taxAmount = 0;
    const total = args.amount;

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      projectId: args.projectId,
      clientId: args.clientId,
      issueDate: now,
      status: "draft",
      currency: args.currency ?? "BDT",
      subtotal: args.amount,
      taxRate: 0,
      taxAmount,
      total,
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
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

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
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return id;
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
        updatedAt: now,
      });
    }
  },
});

export const getUnverified = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_verified_at", (q => q.eq("verifiedAt", undefined)))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
