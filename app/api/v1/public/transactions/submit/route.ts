import { NextRequest } from "next/server";
import { convex } from "@/integrations/convex/server";
import { api } from "@/../convex/_generated/api";
import { transactionApiContracts } from "@/lib/api/contracts";
import {
  createLoggedApiRequest, readRequestJson,
  extractBearer, hashKey,
  extractIdempotencyKey, checkRateLimit,
  checkBodySize, corsHeaders, SECURITY_HEADERS,
} from "@/lib/api/helpers";

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: { ...corsHeaders(request), ...SECURITY_HEADERS } });
}

export async function POST(request: NextRequest) {
  const apiRequest = createLoggedApiRequest(request, "/api/v1/public/transactions/submit");
  const { requestId, ipHash } = apiRequest;
  const respond = apiRequest.respond;

  try {
    const rl = await checkRateLimit(ipHash, "submit", 60, 60000);
    if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

    if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

    const token = extractBearer(request);
    if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

    const tokenHash = hashKey(token);
    apiRequest.setApiKeyPrefix(token.slice(0, 8));

    const idempotencyKey = extractIdempotencyKey(request);

    const requestBody = await readRequestJson(request);
    if (!requestBody.ok) return respond(requestBody.status, { error: requestBody.error }, requestBody.error);

    const parsed = transactionApiContracts.submit.schema.safeParse(requestBody.body);
    if (!parsed.success) {
      return respond(400, { error: "invalid_body", issues: parsed.error.issues }, "invalid_body");
    }
    const input = parsed.data;

    const result = await convex.mutation(api.public.submitTransaction, {
      keyHash: tokenHash,
      transactionRef: input.transaction_ref,
      amount: input.amount,
      currency: input.currency,
      occurredAt: input.occurred_at ? new Date(input.occurred_at).getTime() : undefined,
      method: input.method,
      businessName: input.business_name,
      externalUserId: input.external_user_id,
      source: input.source,
      notes: input.notes,
      idempotencyKey: idempotencyKey ?? undefined,
    });

    if ((result as any).duplicate) {
      return respond(200, {
        received: true,
        id: (result as any).id,
        transaction_ref: input.transaction_ref,
        status: "already_exists",
        duplicate: true,
      });
    }

    return respond(201, {
      received: true,
      id: (result as any).id,
      transaction_ref: input.transaction_ref,
      status: "unverified",
    });
  } catch (e: any) {
    const code = e?.data?.code;
    if (code === "invalid_api_key") return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
    if (code === "missing_business_name") return respond(400, { error: "missing_business_name" }, "missing_business_name");
    if (code === "duplicate_ref") {
      return respond(409, { error: "duplicate_ref", transaction_ref: "" }, "duplicate_ref");
    }
    const msg = (e?.message ?? JSON.stringify(e)).slice(0, 500);
    if (msg.includes("invalid_api_key")) return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
    if (msg.includes("missing_business_name")) return respond(400, { error: "missing_business_name" }, "missing_business_name");
    if (msg.includes("duplicate_ref")) {
      return respond(409, { error: "duplicate_ref", transaction_ref: "" }, "duplicate_ref");
    }
    return respond(500, { error: "insert_failed" }, msg);
  } finally {
    void apiRequest.finish();
  }
}
