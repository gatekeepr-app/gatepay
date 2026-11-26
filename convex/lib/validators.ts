import { v } from "convex/values";

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
