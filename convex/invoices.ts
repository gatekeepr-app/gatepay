import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateInvoiceNumber, logAdminAction } from "./lib/helpers";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.query("invoices").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.get(args.id);
  },
});

export const getLineItems = query({
  args: { invoiceId: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
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
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const now = Date.now();
    const invoiceNumber = await generateInvoiceNumber(ctx);
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

    await logAdminAction(ctx, {
      action: "invoice.create",
      entityType: "invoices",
      entityId: invoiceId,
      details: `Created invoice ${invoiceNumber} (${args.currency} ${total})`,
      userId: admin._id,
      userEmail: admin.email,
    });

    return invoiceId;
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const { id, token: _, ...fields } = args;
    const invoice = await ctx.db.get(id);
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() } as any);
    await logAdminAction(ctx, {
      action: "invoice.update",
      entityType: "invoices",
      entityId: id,
      details: `Updated invoice ${invoice?.invoiceNumber ?? "unknown"}`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const invoice = await ctx.db.get(args.id);
    const items = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(args.id);
    await logAdminAction(ctx, {
      action: "invoice.remove",
      entityType: "invoices",
      entityId: args.id,
      details: `Removed invoice ${invoice?.invoiceNumber ?? "unknown"}`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});
