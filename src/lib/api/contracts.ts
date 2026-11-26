import { z } from "zod";

export const transactionApiContracts = {
  submit: {
    schema: z.object({
      transaction_ref: z.string().min(1).max(256),
      amount: z.number(),
      currency: z.string().optional(),
      occurred_at: z.string().optional(),
      method: z.string().optional(),
      business_name: z.string().optional(),
      external_user_id: z.string().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
    }),
    summary: "Submit a transaction",
    description: "Creates an unverified transaction in GatePay.",
    requestSchema: {
      type: "object",
      required: ["transaction_ref", "amount"],
      properties: {
        transaction_ref: { type: "string", minLength: 1, maxLength: 256 },
        amount: { type: "number" },
        currency: { type: "string" },
        occurred_at: { type: "string" },
        method: { type: "string" },
        business_name: { type: "string" },
        external_user_id: { type: "string" },
        source: { type: "string" },
        notes: { type: "string" },
      },
    },
    responses: {
      "201": { description: "Transaction created" },
      "409": { description: "Duplicate transaction ref" },
      "401": { description: "Invalid or missing API key" },
    },
  },
  verify: {
    schema: z.object({
      transaction_ref: z.string().min(1).max(256),
      business_name: z.string().min(1).max(256),
      external_user_id: z.string().optional(),
      date: z.string().optional(),
      amount: z.number().optional(),
      source: z.string().optional(),
    }),
    summary: "Verify a transaction",
    description: "Checks if a payment matches a recorded transaction.",
    requestSchema: {
      type: "object",
      required: ["transaction_ref", "business_name"],
      properties: {
        transaction_ref: { type: "string", minLength: 1, maxLength: 256 },
        business_name: { type: "string", minLength: 1, maxLength: 256 },
        external_user_id: { type: "string" },
        date: { type: "string" },
        amount: { type: "number" },
        source: { type: "string" },
      },
    },
    responses: {
      "200": { description: "Verification result" },
      "401": { description: "Invalid or missing API key" },
    },
  },
  review: {
    schema: z.object({
      transaction_id: z.string().min(1),
      amount: z.number(),
      note: z.string().max(2000),
    }),
    summary: "Review a transaction",
    description: "Submits a client review (amount + note) against an existing transaction by its ID.",
    requestSchema: {
      type: "object",
      required: ["transaction_id", "amount", "note"],
      properties: {
        transaction_id: { type: "string", description: "Transaction ID returned by the submit endpoint" },
        amount: { type: "number", description: "Confirmed amount for the transaction" },
        note: { type: "string", maxLength: 2000, description: "Review note or feedback" },
      },
    },
    responses: {
      "200": { description: "Review result" },
      "401": { description: "Invalid or missing API key" },
    },
  },
  refund: {
    schema: z.object({
      transaction_ref: z.string().min(1).max(256),
      amount: z.number().positive(),
      method: z.string().min(1).max(40),
      receiver_name: z.string().min(1).max(256),
      receiver_number: z.string().min(1).max(64),
      notes: z.string().max(2000).optional(),
    }),
    summary: "Request a refund",
    description: "Requests a refund for a verified transaction.",
    requestSchema: {
      type: "object",
      required: ["transaction_ref", "amount", "method", "receiver_name", "receiver_number"],
      properties: {
        transaction_ref: { type: "string", minLength: 1, maxLength: 256 },
        amount: { type: "number", exclusiveMinimum: 0 },
        method: { type: "string", minLength: 1, maxLength: 40 },
        receiver_name: { type: "string", minLength: 1, maxLength: 256 },
        receiver_number: { type: "string", minLength: 1, maxLength: 64 },
        notes: { type: "string", maxLength: 2000 },
      },
    },
    responses: {
      "201": { description: "Refund request created" },
      "401": { description: "Invalid or missing API key" },
      "404": { description: "Transaction not found" },
      "409": { description: "Transaction is not eligible for refund" },
    },
  },
} as const;

export type ApiContractName = keyof typeof transactionApiContracts;
