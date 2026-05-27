import { createFileRoute } from "@tanstack/react-router";
import { SECURITY_HEADERS } from "@/lib/api/helpers";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Gatekeepr Payment Verification API",
    version: "1.0.0",
    description:
      "Verify and submit payment transactions. Partners use this API to check if a payment recorded in Gatekeepr matches what their end user claims, and to stamp transactions with the verifier's identity.",
    contact: { email: "product.gatekeepr@gmail.com" },
  },
  servers: [
    { url: "https://gatekeepr-foundations-build.lovable.app", description: "Production" },
    { url: "http://localhost:4321", description: "Local development" },
  ],
  paths: {
    "/api/v1/public/transactions/submit": {
      post: {
        summary: "Submit a transaction",
        description: "Create an unverified transaction record. Duplicate refs return 409. Use Idempotency-Key header for safe retries.",
        operationId: "submitTransaction",
        tags: ["Transactions"],
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string", maxLength: 64 },
            description: "Unique key for idempotent submission. Repeat the same key within 24h to get the existing result instead of creating a duplicate.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transaction_ref", "amount"],
                properties: {
                  transaction_ref: { type: "string", minLength: 1, maxLength: 120, description: "Partner-internal transaction ID" },
                  amount: { type: "number", minimum: 0, description: "Transaction amount" },
                  currency: { type: "string", maxLength: 8, description: "Currency code (default: BDT)" },
                  occurred_at: { type: "string", format: "date-time", description: "ISO date when payment occurred" },
                  method: { type: "string", maxLength: 40, description: "Payment method label" },
                  business_name: { type: "string", maxLength: 160, description: "Override business name for this transaction" },
                  external_user_id: { type: "string", maxLength: 160, description: "Caller's internal user ID" },
                  source: { type: "string", maxLength: 160, description: "Free-form audit label" },
                  notes: { type: "string", maxLength: 2000, description: "Private notes" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Transaction created" },
          "200": { description: "Idempotent duplicate — already exists" },
          "400": { description: "Invalid body" },
          "401": { description: "Missing or invalid API key" },
          "409": { description: "Duplicate transaction_ref" },
          "413": { description: "Body too large" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/api/v1/public/transactions/verify": {
      post: {
        summary: "Verify a transaction",
        description: "Check if a transaction exists and matches optional date/amount criteria. The caller's business_name is stamped on the transaction on success.",
        operationId: "verifyTransaction",
        tags: ["Transactions"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transaction_ref", "business_name"],
                properties: {
                  transaction_ref: { type: "string", minLength: 1, maxLength: 120 },
                  business_name: { type: "string", minLength: 1, maxLength: 160 },
                  date: { type: "string", format: "date", description: "Must match the transaction's UTC day" },
                  amount: { type: "number", minimum: 0, description: "Must match exact recorded amount" },
                  external_user_id: { type: "string", maxLength: 160 },
                  source: { type: "string", maxLength: 160 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Verification result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    verified: { type: "boolean" },
                    transaction: {
                      type: "object",
                      properties: {
                        ref: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string" },
                        occurred_at: { type: "number" },
                        project_code: { type: "string", nullable: true },
                      },
                    },
                    reason: { type: "string", description: "Present only when verified is false" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid body or key missing business_name" },
          "401": { description: "Missing or invalid API key" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/api/v1/public/health": {
      get: {
        summary: "Health check",
        operationId: "health",
        tags: ["System"],
        responses: {
          "200": { description: "Service healthy" },
          "503": { description: "Service degraded" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Gatekeepr API key (gk_...)",
      },
    },
  },
  security: [{ BearerAuth: [] }],
};

export const Route = createFileRoute("/api/v1/public/openapi")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        return new Response(JSON.stringify(spec, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin || "https://gatekeepr-foundations-build.lovable.app",
            "Vary": "Origin",
            "Cache-Control": "public, max-age=300",
            ...SECURITY_HEADERS,
          },
        });
      },
    },
  },
});
