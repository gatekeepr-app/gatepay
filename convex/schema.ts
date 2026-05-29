import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth
  sessions: defineTable({
    token: v.string(),
    userId: v.id("users"),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  users: defineTable({
    email: v.string(),
    passwordHash: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("super_admin"), v.literal("member")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // CRM
  clients: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    businessName: v.optional(v.string()),
    brandName: v.optional(v.string()),
    phone: v.optional(v.string()),
    socialLinks: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_name", ["name"]),

  // Projects
  projects: defineTable({
    projectCode: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    createdBy: v.optional(v.id("users")),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused"), v.literal("completed")),
    tags: v.array(v.string()),
    payCode: v.optional(v.string()),
    lastTransactionRef: v.optional(v.string()),
    lastPaymentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project_code", ["projectCode"])
    .index("by_client", ["clientId"])
    .index("by_pay_code", ["payCode"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"]),

  projectAssignments: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    assignedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  // Billing
  projectBilling: defineTable({
    projectId: v.id("projects"),
    billingType: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("per_project")),
    amount: v.number(),
    currency: v.string(),
    monthsCount: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    totalCalculated: v.number(),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"]),

  // Invoices
  invoices: defineTable({
    invoiceNumber: v.string(),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    issueDate: v.number(),
    dueDate: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue"), v.literal("void")),
    currency: v.string(),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invoice_number", ["invoiceNumber"])
    .index("by_project", ["projectId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  invoiceLineItems: defineTable({
    invoiceId: v.id("invoices"),
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    amount: v.number(),
    position: v.number(),
  })
    .index("by_invoice", ["invoiceId"]),

  // Transactions
  transactions: defineTable({
    transactionRef: v.string(),
    amount: v.number(),
    currency: v.string(),
    occurredAt: v.number(),
    method: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    invoiceId: v.optional(v.id("invoices")),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("reimbursed"),
      v.literal("failed"),
    ),
    statusChangedAt: v.optional(v.number()),
    statusChangedBy: v.optional(v.string()),
    reimbursedAt: v.optional(v.number()),
    reimbursedBy: v.optional(v.string()),
    reimbursementAmount: v.optional(v.number()),
    reimbursementRef: v.optional(v.string()),
    reimbursementMethod: v.optional(v.string()),
    verifiedExternalName: v.optional(v.string()),
    verifiedExternalUserId: v.optional(v.string()),
    verifiedSource: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    clientReviewAmount: v.optional(v.number()),
    clientReviewNote: v.optional(v.string()),
    clientReviewedAt: v.optional(v.number()),
    idempotencyKey: v.optional(v.string()),
    idempotencyKeyResponse: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_transaction_ref", ["transactionRef"])
    .index("by_project", ["projectId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_verified_external_name", ["verifiedExternalName"])
    .index("by_verified_at", ["verifiedAt"])
    .index("by_occurred_at", ["occurredAt"]),

  // Transaction status history
  statusHistory: defineTable({
    transactionId: v.id("transactions"),
    fromStatus: v.string(),
    toStatus: v.string(),
    changedBy: v.string(),
    changedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_transaction", ["transactionId"])
    .index("by_changed_at", ["changedAt"]),

  // Leads
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    message: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }),

  // Invitations
  invitations: defineTable({
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("super_admin"), v.literal("member")),
    invitedBy: v.optional(v.id("users")),
    token: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked"), v.literal("expired")),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // API Keys
  apiKeys: defineTable({
    name: v.string(),
    keyPrefix: v.string(),
    keyHash: v.string(),
    keyToken: v.optional(v.string()),
    businessName: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    signingSecret: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_key_hash", ["keyHash"])
    .index("by_business_name", ["businessName"])
    .index("by_revoked", ["revokedAt"]),

  // Rate limits
  rateLimits: defineTable({
    ipHash: v.string(),
    route: v.string(),
    windowStart: v.number(),
    count: v.number(),
    createdAt: v.number(),
  })
    .index("by_ip_route_window", ["ipHash", "route", "windowStart"])
    .index("by_window_start", ["windowStart"]),

  // API request logs
  apiLogs: defineTable({
    requestId: v.string(),
    method: v.string(),
    path: v.string(),
    statusCode: v.number(),
    durationMs: v.number(),
    apiKeyPrefix: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_request_id", ["requestId"])
    .index("by_created_at", ["createdAt"])
    .index("by_api_key_prefix", ["apiKeyPrefix"]),
});
