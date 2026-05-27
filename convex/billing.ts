import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { calcBillingTotal } from "./lib/helpers";

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectBilling")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    projectId: v.id("projects"),
    billingType: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    monthsCount: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const total = calcBillingTotal(
      args.billingType as any,
      args.amount,
      args.monthsCount,
      args.startDate,
      args.endDate,
    );
    const existing = await ctx.db
      .query("projectBilling")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    const billing = {
      projectId: args.projectId,
      billingType: args.billingType as any,
      amount: args.amount,
      currency: args.currency ?? "BDT",
      monthsCount: args.monthsCount,
      startDate: args.startDate,
      endDate: args.endDate,
      totalCalculated: total,
      paymentTerms: args.paymentTerms,
      notes: args.notes,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, billing);
      return existing._id;
    }
    return await ctx.db.insert("projectBilling", billing);
  },
});
