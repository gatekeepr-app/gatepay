import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logAdminAction } from "./lib/adminAuditLog";
import { invoiceStatusValidator } from "./lib/validators";
import { requireAdmin } from "./lib/auth";
import { reserveNextInvoiceReference } from "./lib/invoiceReference";
import { DEFAULT_INVOICE_LOGO_ALIGNMENT, DEFAULT_INVOICE_LOGO_WIDTH_MM } from "./lib/invoiceLayout";
import { randomHex } from "./lib/crypto";

type SharedInvoiceResult = {
  invoice: {
    invoiceNumber: string;
    issueDate: number;
    dueDate: number | null;
    status: "sent" | "overdue" | "paid";
    currency: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string;
  };
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  project: { name: string } | null;
  client: { name: string; businessName: string | null; email: string | null; phone: string | null } | null;
  brand: {
    brandName: string;
    businessName: string;
    address: string;
    email: string;
    phone: string;
    footer: string;
    invoiceFooterContent: string | null;
    invoiceLogoWidthMm: number;
    invoiceLogoAlignment: "left" | "center" | "right";
    logoUrl: string | null;
  };
};

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

export const getDocumentData = query({
  args: { id: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;

    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .order("asc")
      .take(500);
    const project = invoice.projectId ? await ctx.db.get(invoice.projectId) : null;
    const client = invoice.clientId ? await ctx.db.get(invoice.clientId) : null;
    const settings = await ctx.db
      .query("brandSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();

    return {
      invoice,
      lineItems,
      project,
      client,
      brand: {
        brandName: settings?.brandName ?? "GATEKEEPER",
        businessName: settings?.businessName ?? "GatePay",
        address: settings?.address ?? "",
        email: settings?.email ?? "",
        phone: settings?.phone ?? "",
        footer: settings?.footer ?? "",
        invoiceFooterContent: settings?.invoiceFooterContent ?? null,
        invoiceLogoWidthMm: settings?.invoiceLogoWidthMm ?? DEFAULT_INVOICE_LOGO_WIDTH_MM,
        invoiceLogoAlignment: settings?.invoiceLogoAlignment ?? DEFAULT_INVOICE_LOGO_ALIGNMENT,
        logoUrl: settings?.logoStorageId ? await ctx.storage.getUrl(settings.logoStorageId) : null,
      },
    };
  },
});

export const getSharedInvoice = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args): Promise<SharedInvoiceResult | null> => {
    if (!/^[a-f0-9]{64}$/.test(args.shareToken)) return null;
    const invoice = await ctx.db
      .query("invoices")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .unique();
    if (!invoice || (invoice.status !== "sent" && invoice.status !== "overdue" && invoice.status !== "paid")) return null;

    const [items, project, client, settings] = await Promise.all([
      ctx.db.query("invoiceLineItems").withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id)).take(500),
      invoice.projectId ? ctx.db.get(invoice.projectId) : Promise.resolve(null),
      invoice.clientId ? ctx.db.get(invoice.clientId) : Promise.resolve(null),
      ctx.db.query("brandSettings").withIndex("by_key", (q) => q.eq("key", "default")).unique(),
    ]);

    return {
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate ?? null,
        status: invoice.status,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        notes: invoice.notes ?? "",
      },
      lineItems: items.sort((a, b) => a.position - b.position).map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
      project: project ? { name: project.name } : null,
      client: client ? {
        name: client.name,
        businessName: client.businessName ?? null,
        email: client.email ?? null,
        phone: client.phone ?? null,
      } : null,
      brand: {
        brandName: settings?.brandName ?? "GATEKEEPER",
        businessName: settings?.businessName ?? "GatePay",
        address: settings?.address ?? "",
        email: settings?.email ?? "",
        phone: settings?.phone ?? "",
        footer: settings?.footer ?? "",
        invoiceFooterContent: settings?.invoiceFooterContent ?? null,
        invoiceLogoWidthMm: settings?.invoiceLogoWidthMm ?? DEFAULT_INVOICE_LOGO_WIDTH_MM,
        invoiceLogoAlignment: settings?.invoiceLogoAlignment ?? DEFAULT_INVOICE_LOGO_ALIGNMENT,
        logoUrl: settings?.logoStorageId ? await ctx.storage.getUrl(settings.logoStorageId) : null,
      },
    };
  },
});

export const createShareLink = mutation({
  args: { id: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    if (!["sent", "overdue", "paid"].includes(invoice.status)) {
      throw new Error("Generate the invoice before sharing it");
    }
    if (invoice.shareToken) return invoice.shareToken;

    const shareToken = randomHex(32);
    await ctx.db.patch(args.id, { shareToken, updatedAt: Date.now() });
    await logAdminAction(ctx, {
      action: "invoice.share_link.create",
      entityType: "invoices",
      entityId: args.id,
      details: `Created share link for invoice ${invoice.invoiceNumber}`,
      userId: admin._id,
      userEmail: admin.email,
    });
    return shareToken;
  },
});

export const revokeShareLink = mutation({
  args: { id: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    if (!invoice.shareToken) return null;
    await ctx.db.patch(args.id, { shareToken: undefined, updatedAt: Date.now() });
    await logAdminAction(ctx, {
      action: "invoice.share_link.revoke",
      entityType: "invoices",
      entityId: args.id,
      details: `Revoked share link for invoice ${invoice.invoiceNumber}`,
      userId: admin._id,
      userEmail: admin.email,
    });
    return null;
  },
});

// Public lookup used by the client-facing payment page. Only payment details
// needed to identify and pay an invoice/project are returned.
export const lookupPaymentCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    const indexedInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_invoice_number", (q) => q.eq("invoiceNumber", code))
      .first();
    // Older or manually entered references may not have been stored uppercase.
    // Keep the indexed exact lookup fast, then do a bounded case-insensitive
    // fallback so those existing production records remain searchable.
    const invoice = indexedInvoice ?? (await ctx.db.query("invoices").order("desc").take(500))
      .find((item) => item.invoiceNumber.trim().toUpperCase() === code) ?? null;

    if (invoice) {
      const lineItems = await ctx.db
        .query("invoiceLineItems")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
        .order("asc")
        .take(50);
      const project = invoice.projectId ? await ctx.db.get(invoice.projectId) : null;
      return {
        kind: "invoice" as const,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          total: invoice.total,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          payable: invoice.status === "sent" || invoice.status === "overdue",
        },
        project: project ? { name: project.name, projectCode: project.projectCode } : null,
        lineItems: lineItems.map(({ description, quantity, amount }) => ({ description, quantity, amount })),
      };
    }

    const project =
      (await ctx.db
        .query("projects")
        .withIndex("by_pay_code", (q) => q.eq("payCode", code))
        .first()) ??
      (await ctx.db
        .query("projects")
        .withIndex("by_project_code", (q) => q.eq("projectCode", code))
        .first());

    if (!project) return null;
    const billing = await ctx.db
      .query("projectBilling")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .first();

    return {
      kind: "project" as const,
      project: {
        id: project._id,
        name: project.name,
        projectCode: project.projectCode,
        payCode: project.payCode ?? null,
      },
      billing: billing
        ? {
            billingType: billing.billingType,
            amount: billing.amount,
            currency: billing.currency,
            monthsCount: billing.monthsCount,
            startDate: billing.startDate,
            totalCalculated: billing.totalCalculated,
          }
        : null,
    };
  },
});

export const submitPublicPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    transactionRef: v.string(),
    payerName: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || (invoice.status !== "sent" && invoice.status !== "overdue")) {
      throw new Error("invoice_not_payable");
    }

    const payerName = args.payerName.trim();
    const transactionRef = args.transactionRef.trim().toLowerCase();
    if (payerName.length === 0 || payerName.length > 100) throw new Error("invalid_payer_name");
    if (!/^[a-zA-Z0-9_-]{4,64}$/.test(transactionRef)) throw new Error("invalid_transaction_ref");
    const duplicate = await ctx.db
      .query("transactions")
      .withIndex("by_transaction_ref", (q) => q.eq("transactionRef", transactionRef))
      .first();
    if (duplicate) throw new Error("duplicate_ref");

    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      transactionRef,
      amount: invoice.total,
      currency: invoice.currency,
      occurredAt: now,
      method: "bKash",
      projectId: invoice.projectId,
      clientId: invoice.clientId,
      invoiceId: invoice._id,
      status: "pending",
      createdBy: `Invoice payment by ${payerName}`,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("statusHistory", {
      transactionId,
      fromStatus: "unsubmitted",
      toStatus: "pending",
      changedBy: "public invoice payment",
      changedAt: now,
      notes: `Payment submitted for ${invoice.invoiceNumber}; awaiting verification.`,
    });
    return { transactionId };
  },
});

export const create = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    issueDate: v.number(),
    invoiceNumber: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    status: v.optional(invoiceStatusValidator),
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
    const requestedReference = args.invoiceNumber?.trim();
    if (requestedReference && requestedReference.length > 100) {
      throw new Error("Invoice reference must be 100 characters or fewer");
    }
    let invoiceNumber = requestedReference;
    if (invoiceNumber) {
      const existing = await ctx.db
        .query("invoices")
        .withIndex("by_invoice_number", (q) => q.eq("invoiceNumber", invoiceNumber!))
        .first();
      if (existing) throw new Error("This invoice reference is already in use");
    } else {
      invoiceNumber = await reserveNextInvoiceReference(ctx, args.projectId, args.issueDate);
    }
    const taxAmount = args.subtotal * (args.taxRate / 100);
    const total = args.subtotal + taxAmount;

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      projectId: args.projectId,
      clientId: args.clientId,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      status: args.status ?? "draft",
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
    status: v.optional(invoiceStatusValidator),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const { id, token: _, ...fields } = args;
    const invoice = await ctx.db.get(id);
    await ctx.db.patch(id, { ...fields, ...(fields.status === "void" ? { shareToken: undefined } : {}), updatedAt: Date.now() });
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

export const updateDraft = mutation({
  args: {
    id: v.optional(v.id("invoices")),
    projectId: v.union(v.id("projects"), v.null()),
    clientId: v.union(v.id("clients"), v.null()),
    invoiceNumber: v.optional(v.string()),
    issueDate: v.number(),
    dueDate: v.union(v.number(), v.null()),
    currency: v.string(),
    subtotal: v.number(),
    taxRate: v.number(),
    notes: v.union(v.string(), v.null()),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const invoice = args.id ? await ctx.db.get(args.id) : null;
    if (args.id && !invoice) throw new Error("Invoice not found");
    if (invoice && invoice.status !== "draft") throw new Error("Only draft invoices can be edited");

    const requestedReference = args.invoiceNumber?.trim();
    const invoiceNumber = requestedReference || invoice?.invoiceNumber || await reserveNextInvoiceReference(ctx, args.projectId ?? undefined, args.issueDate);
    if (!invoiceNumber || invoiceNumber.length > 100) {
      throw new Error("Invoice reference must be between 1 and 100 characters");
    }
    if (invoiceNumber !== invoice?.invoiceNumber) {
      const duplicate = await ctx.db
        .query("invoices")
        .withIndex("by_invoice_number", (q) => q.eq("invoiceNumber", invoiceNumber))
        .first();
      if (duplicate) throw new Error("This invoice reference is already in use");
    }

    const previousItems = invoice ? await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .take(501) : [];
    if (previousItems.length > 500 || args.lineItems.length > 500) {
      throw new Error("An invoice can contain at most 500 line items");
    }
    for (const item of previousItems) await ctx.db.delete(item._id);

    const now = Date.now();
    const taxAmount = args.subtotal * args.taxRate / 100;
    const invoiceId = invoice?._id ?? await ctx.db.insert("invoices", {
      projectId: args.projectId ?? undefined,
      clientId: args.clientId ?? undefined,
      invoiceNumber,
      issueDate: args.issueDate,
      dueDate: args.dueDate ?? undefined,
      status: "draft",
      currency: args.currency,
      subtotal: args.subtotal,
      taxRate: args.taxRate,
      taxAmount,
      total: args.subtotal + taxAmount,
      notes: args.notes ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
    if (invoice) {
      await ctx.db.patch(invoiceId, {
        projectId: args.projectId ?? undefined,
        clientId: args.clientId ?? undefined,
        invoiceNumber,
        issueDate: args.issueDate,
        dueDate: args.dueDate ?? undefined,
        currency: args.currency,
        subtotal: args.subtotal,
        taxRate: args.taxRate,
        taxAmount,
        total: args.subtotal + taxAmount,
        notes: args.notes ?? undefined,
        updatedAt: now,
      });
    }

    for (let position = 0; position < args.lineItems.length; position += 1) {
      const item = args.lineItems[position];
      await ctx.db.insert("invoiceLineItems", {
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        position,
      });
    }

    await logAdminAction(ctx, {
      action: invoice ? "invoice.update_draft" : "invoice.autosave_draft",
      entityType: "invoices",
      entityId: invoiceId,
      details: `${invoice ? "Updated" : "Created autosaved"} draft invoice ${invoiceNumber}`,
      userId: admin._id,
      userEmail: admin.email,
    });
    return invoiceId;
  },
});

export const finalizeDraft = mutation({
  args: { id: v.id("invoices"), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be generated");
    await ctx.db.patch(args.id, { status: "sent", updatedAt: Date.now() });
    await logAdminAction(ctx, {
      action: "invoice.generate",
      entityType: "invoices",
      entityId: args.id,
      details: `Generated invoice ${invoice.invoiceNumber}`,
      userId: admin._id,
      userEmail: admin.email,
    });
  },
});

export const setInactive = mutation({
  args: { id: v.id("invoices"), inactive: v.boolean(), token: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Paid invoices cannot be marked inactive");
    if (args.inactive && invoice.status === "void") return;
    if (!args.inactive && invoice.status !== "void") throw new Error("Only inactive invoices can be reactivated");

    const status = args.inactive ? "void" : "draft";
    await ctx.db.patch(args.id, { status, ...(args.inactive ? { shareToken: undefined } : {}), updatedAt: Date.now() });
    await logAdminAction(ctx, {
      action: args.inactive ? "invoice.deactivate" : "invoice.reactivate",
      entityType: "invoices",
      entityId: args.id,
      details: `${args.inactive ? "Marked inactive" : "Reactivated"} invoice ${invoice.invoiceNumber}`,
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
