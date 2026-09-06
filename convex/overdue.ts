import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const getOverdueProjects = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    const billings = await ctx.db.query("projectBilling").collect();
    const overdue: any[] = [];

    for (const billing of billings) {
      if (billing.billingType !== "monthly") continue;
      if (!billing.startDate || !billing.monthsCount) continue;

      const start = new Date(billing.startDate);
      const startMonth = start.getMonth();
      const startYear = start.getFullYear();

      // Calculate which month we're in relative to start
      const monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      if (monthsElapsed < 0 || monthsElapsed >= billing.monthsCount) continue;

      // Check if there's a verified transaction for this month
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_project", (q) => q.eq("projectId", billing.projectId))
        .collect();

      const monthStart = new Date(currentYear, currentMonth, 1).getTime();
      const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

      const paidThisMonth = txs.some(
        (t) =>
          t.status === "verified" &&
          t.occurredAt >= monthStart &&
          t.occurredAt <= monthEnd
      );

      if (!paidThisMonth) {
        const project = await ctx.db.get(billing.projectId);
        const client = project?.clientId ? await ctx.db.get(project.clientId) : null;
        overdue.push({
          projectId: billing.projectId,
          projectName: project?.name ?? "Unknown",
          projectCode: project?.projectCode ?? "",
          clientName: client?.name ?? "Unknown",
          clientEmail: client?.email ?? "",
          amount: billing.amount,
          currency: billing.currency,
          month: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
          dueDate: monthEnd,
          payCode: project?.payCode ?? "",
        });
      }
    }

    return overdue;
  },
});

export const getRevenueForecast = query({
  args: { token: v.string(), months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const months = args.months ?? 6;
    const now = new Date();
    const forecast: { month: string; expected: number; received: number }[] = [];

    const billings = await ctx.db.query("projectBilling").collect();
    const allTxs = await ctx.db.query("transactions").collect();

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
      const monthStart = targetDate.getTime();
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

      let expected = 0;
      let received = 0;

      for (const billing of billings) {
        if (billing.billingType !== "monthly") continue;
        if (!billing.startDate || !billing.monthsCount) continue;

        const start = new Date(billing.startDate);
        const monthsElapsed = (targetDate.getFullYear() - start.getFullYear()) * 12 + (targetDate.getMonth() - start.getMonth());

        if (monthsElapsed >= 0 && monthsElapsed < billing.monthsCount) {
          expected += billing.amount;

          const paid = allTxs.some(
            (t) =>
              t.projectId === billing.projectId &&
              t.status === "verified" &&
              t.occurredAt >= monthStart &&
              t.occurredAt <= monthEnd
          );
          if (paid) received += billing.amount;
        }
      }

      forecast.push({ month: monthKey, expected, received });
    }

    return forecast;
  },
});
