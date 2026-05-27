import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateInvoiceNumber } from "./lib/helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("invoices").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getLineItems = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    issueDate: v.number(),
    dueDate: v.optional(v.number()),
    status: v.optional(v.string()),
    currency: v.optional(v.string()),
    subtotal: v.number(),
    taxRate: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const invoiceNumber = generateInvoiceNumber();
    const taxAmount = args.subtotal * (args.taxRate / 100);
    const total = args.subtotal + taxAmount;

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      projectId: args.projectId,
      clientId: args.clientId,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      status: (args.status as any) ?? "draft",
      currency: args.currency ?? "BDT",
      subtotal: args.subtotal,
      taxRate: args.taxRate,
      taxAmount,
      total,
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    for (let i = 0; i < args.lineItems.length; i++) {
      const li = args.lineItems[i];
      const amount = li.quantity * li.unitPrice;
      await ctx.db.insert("invoiceLineItems", {
        invoiceId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount,
        position: i,
      });
    }

    return invoiceId;
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() } as any);
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(args.id);
  },
});
