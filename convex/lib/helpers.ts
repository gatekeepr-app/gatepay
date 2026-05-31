import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";

export async function generateProjectCode(ctx: MutationCtx): Promise<string> {
  const year = new Date().getFullYear();
  const name = `projectCode-${year}`;
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  const n = (existing?.value ?? 0) + 1;
  if (existing) {
    await ctx.db.patch(existing._id, { value: n });
  } else {
    await ctx.db.insert("counters", { name, value: n });
  }
  return `GK-${year}-${String(n).padStart(4, "0")}`;
}

export async function generateInvoiceNumber(ctx: MutationCtx): Promise<string> {
  const year = new Date().getFullYear();
  const name = `invoiceNumber-${year}`;
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  const n = (existing?.value ?? 0) + 1;
  if (existing) {
    await ctx.db.patch(existing._id, { value: n });
  } else {
    await ctx.db.insert("counters", { name, value: n });
  }
  return `INV-${year}-${String(n).padStart(4, "0")}`;
}

export function generatePayCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function calcBillingTotal(
  billingType: "monthly" | "yearly" | "per_project",
  amount: number,
  monthsCount?: number | null,
  startDate?: number | null,
  endDate?: number | null,
): number {
  if (billingType === "monthly") {
    return amount * (monthsCount ?? 1);
  }
  if (billingType === "yearly") {
    if (startDate && endDate) {
      const yrs = Math.max(1, Math.ceil((endDate - startDate) / (365 * 24 * 60 * 60 * 1000)));
      return amount * yrs;
    }
    return amount;
  }
  return amount;
}

export const roleValidator = v.union(
  v.literal("admin"),
  v.literal("user"),
  v.literal("super_admin"),
  v.literal("member"),
);

export const projectStatusValidator = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("paused"),
  v.literal("completed"),
);

export const invoiceStatusValidator = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("paid"),
  v.literal("overdue"),
  v.literal("void"),
);

export const billingTypeValidator = v.union(
  v.literal("monthly"),
  v.literal("yearly"),
  v.literal("per_project"),
);

export const inviteStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("revoked"),
  v.literal("expired"),
);

export function sanitizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function logAdminAction(
  ctx: MutationCtx,
  params: {
    action: string;
    entityType?: string;
    entityId?: string;
    details?: string;
    userId?: string;
    userEmail?: string;
  },
) {
  await ctx.db.insert("adminLogs", {
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    userId: params.userId,
    userEmail: params.userEmail,
    createdAt: Date.now(),
  });
}
