import { NextRequest } from "next/server";
import { json, corsHeaders, SECURITY_HEADERS } from "@/lib/api/helpers";

const spec = {
  openapi: "3.1.0",
  info: { title: "Gatekeepr Payment Verification API", version: "1.0.0" },
  servers: [{ url: "https://pay.darvizlabs.com" }],
  paths: {
    "/api/v1/public/transactions/submit": {
      post: {
        summary: "Submit a transaction",
        description: "Creates an unverified transaction in Gatekeepr.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transaction_ref", "amount"],
                properties: {
                  transaction_ref: { type: "string", maxLength: 120 },
                  amount: { type: "number" },
                  currency: { type: "string", maxLength: 8 },
                  occurred_at: { type: "string", format: "date-time" },
                  method: { type: "string", maxLength: 40 },
                  business_name: { type: "string", maxLength: 160 },
                  external_user_id: { type: "string" },
                  source: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Transaction created" },
          "409": { description: "Duplicate transaction ref" },
          "401": { description: "Invalid or missing API key" },
        },
      },
    },
    "/api/v1/public/transactions/verify": {
      post: {
        summary: "Verify a transaction",
        description: "Checks if a payment matches a recorded transaction.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transaction_ref", "business_name"],
                properties: {
                  transaction_ref: { type: "string" },
                  business_name: { type: "string" },
                  external_user_id: { type: "string" },
                  date: { type: "string", format: "date" },
                  amount: { type: "number" },
                  source: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Verification result" },
          "401": { description: "Invalid or missing API key" },
        },
      },
    },
    "/api/v1/public/transactions/review": {
      post: {
        summary: "Review a transaction",
        description: "Submits a client review (amount + note) against an existing transaction by its ID.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transaction_id", "amount", "note"],
                properties: {
                  transaction_id: { type: "string", description: "Transaction ID returned by the submit endpoint" },
                  amount: { type: "number", description: "Confirmed amount for the transaction" },
                  note: { type: "string", maxLength: 2000, description: "Review note or feedback" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Review result" },
          "401": { description: "Invalid or missing API key" },
        },
      },
    },
    "/api/v1/public/health": {
      get: { summary: "Health check", responses: { "200": { description: "OK" } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "API Key" },
    },
  },
};

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: { ...corsHeaders(request), ...SECURITY_HEADERS } });
}

export async function GET() {
  return json(spec);
}
