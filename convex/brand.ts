import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { getNextInvoiceReference as buildNextInvoiceReference } from "./lib/invoiceReference";

const defaults = {
  brandName: "GATEKEEPER",
  businessName: "GatePay",
  address: "",
  email: "",
  phone: "",
  footer: "",
  referencePrefix: "TLS",
  referenceMonthCodes: "JA,FE,MR,AP,MY,JN,JL,AU,SP,OC,NO,DE",
  referenceSeriesPrefix: "AA",
  referencePattern: "{prefix}-{yy}{month}{project}-{series}{index}",
  referenceSequenceScope: "project" as const,
};

export const getSettings = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const settings = await ctx.db
      .query("brandSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();
    return {
      ...defaults,
      ...settings,
      logoUrl: settings?.logoStorageId ? await ctx.storage.getUrl(settings.logoStorageId) : null,
    };
  },
});

export const getNextInvoiceReference = query({
  args: {
    token: v.string(),
    projectId: v.optional(v.id("projects")),
    issueDate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await buildNextInvoiceReference(ctx, args.projectId, args.issueDate);
  },
});

export const generateLogoUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveSettings = mutation({
  args: {
    token: v.string(),
    brandName: v.string(),
    businessName: v.string(),
    address: v.string(),
    email: v.string(),
    phone: v.string(),
    footer: v.string(),
    logoStorageId: v.union(v.id("_storage"), v.null()),
    referencePrefix: v.string(),
    referenceMonthCodes: v.string(),
    referenceSeriesPrefix: v.string(),
    referencePattern: v.string(),
    referenceSequenceScope: v.union(v.literal("global"), v.literal("project")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    if (args.brandName.trim().length > 80 || args.businessName.trim().length > 120) {
      throw new Error("Brand and business names must be 80 and 120 characters or fewer");
    }
    if (args.address.length > 500 || args.footer.length > 300) {
      throw new Error("Address or footer is too long");
    }
    const monthCodes = args.referenceMonthCodes.split(",").map((code) => code.trim());
    if (monthCodes.length !== 12 || monthCodes.some((code) => !/^[A-Za-z0-9]{1,4}$/.test(code))) {
      throw new Error("Enter 12 month codes, separated by commas");
    }
    const referencePattern = args.referencePattern.trim() || defaults.referencePattern;
    const tokens = [...referencePattern.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    const allowedTokens = new Set(["prefix", "yy", "month", "project", "series", "index"]);
    if (!tokens.includes("index") || referencePattern.length > 100 || tokens.some((token) => !allowedTokens.has(token))) {
      throw new Error("Reference pattern must include {index}, use supported tokens, and be 100 characters or fewer");
    }
    if (args.referencePrefix.trim() && !/^[A-Za-z0-9]+$/.test(args.referencePrefix.trim())) {
      throw new Error("Reference prefix can only contain letters and numbers");
    }
    if (args.referenceSeriesPrefix.trim() && !/^[A-Za-z0-9]+$/.test(args.referenceSeriesPrefix.trim())) {
      throw new Error("Sequence prefix can only contain letters and numbers");
    }

    const nextLogoId = args.logoStorageId ?? undefined;
    if (nextLogoId) {
      const metadata = await ctx.db.system.get("_storage", nextLogoId);
      if (!metadata || metadata.size > 2_000_000 || !["image/png", "image/jpeg", "image/webp"].includes(metadata.contentType ?? "")) {
        throw new Error("Logo must be a PNG, JPEG, or WebP image under 2 MB");
      }
    }

    const current = await ctx.db
      .query("brandSettings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();
    const fields = {
      brandName: args.brandName.trim() || defaults.brandName,
      businessName: args.businessName.trim() || defaults.businessName,
      address: args.address.trim(),
      email: args.email.trim(),
      phone: args.phone.trim(),
      footer: args.footer.trim(),
      referencePrefix: args.referencePrefix.trim() || defaults.referencePrefix,
      referenceMonthCodes: monthCodes.join(","),
      referenceSeriesPrefix: args.referenceSeriesPrefix.trim() || defaults.referenceSeriesPrefix,
      referencePattern,
      referenceSequenceScope: args.referenceSequenceScope,
      updatedAt: Date.now(),
    };

    if (current) {
      await ctx.db.patch(current._id, { ...fields, logoStorageId: nextLogoId });
      if (current.logoStorageId && current.logoStorageId !== nextLogoId) {
        await ctx.storage.delete(current.logoStorageId);
      }
    } else {
      await ctx.db.insert("brandSettings", { key: "default", ...fields, logoStorageId: nextLogoId });
    }
  },
});
