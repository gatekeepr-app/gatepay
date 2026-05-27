import { v } from "convex/values";

export const projectCodeSequence = { value: 0 };
export const invoiceNumberSequence = { value: 0 };

export function generateProjectCode(): string {
  projectCodeSequence.value += 1;
  const n = projectCodeSequence.value;
  const year = new Date().getFullYear();
  return `GK-${year}-${String(n).padStart(4, "0")}`;
}

export function generateInvoiceNumber(): string {
  invoiceNumberSequence.value += 1;
  const n = invoiceNumberSequence.value;
  const year = new Date().getFullYear();
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
