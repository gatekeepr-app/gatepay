import { NextRequest } from "next/server";
import { json, corsHeaders, SECURITY_HEADERS } from "@/lib/api/helpers";
import { transactionApiContracts } from "@/lib/api/contracts";

function transactionOperation(contract: (typeof transactionApiContracts)[keyof typeof transactionApiContracts]) {
  return {
    summary: contract.summary,
    description: contract.description,
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: contract.requestSchema } },
    },
    responses: contract.responses,
  };
}

const spec = {
  openapi: "3.1.0",
  info: { title: "GatePay Payment Verification API", version: "1.0.0" },
  servers: [{ url: "https://pay.darvizlabs.com" }],
  paths: {
    "/api/v1/public/transactions/submit": { post: transactionOperation(transactionApiContracts.submit) },
    "/api/v1/public/transactions/verify": { post: transactionOperation(transactionApiContracts.verify) },
    "/api/v1/public/transactions/review": { post: transactionOperation(transactionApiContracts.review) },
    "/api/v1/public/transactions/refund": { post: transactionOperation(transactionApiContracts.refund) },
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

export async function GET(request: NextRequest) {
  return json(spec, 200, undefined, request);
}
