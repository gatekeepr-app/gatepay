import { NextRequest } from "next/server";
import { convex } from "@/integrations/convex/server";
import { api } from "@/../convex/_generated/api";
import { transactionApiContracts } from "@/lib/api/contracts";
import {
  createLoggedApiRequest, readRequestJson,
  extractBearer, hashKey,
  checkRateLimit, checkBodySize,
  corsHeaders, SECURITY_HEADERS,
} from "@/lib/api/helpers";

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: { ...corsHeaders(request), ...SECURITY_HEADERS } });
}

export async function POST(request: NextRequest) {
  const apiRequest = createLoggedApiRequest(request, "/api/v1/public/transactions/refund");
  const { requestId, ipHash } = apiRequest;
  const respond = apiRequest.respond;

  try {
    const rl = await checkRateLimit(ipHash, "refund", 20, 60000);
    if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

    if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

    const token = extractBearer(request);
    if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

    const tokenHash = hashKey(token);
    apiRequest.setApiKeyPrefix(token.slice(0, 8));

    const perKeyRl = await checkRateLimit(ipHash, "key:refund", 50, 60000, tokenHash);
    if (perKeyRl.blocked) return respond(429, { error: perKeyRl.reason }, perKeyRl.reason);

    const requestBody = await readRequestJson(request);
    if (!requestBody.ok) return respond(requestBody.status, { error: requestBody.error }, requestBody.error);

    const parsed = transactionApiContracts.refund.schema.safeParse(requestBody.body);
    if (!parsed.success) {
      return respond(400, { error: "invalid_body", issues: parsed.error.issues }, "invalid_body");
    }
    const input = parsed.data;

    const result = await convex.mutation(api.public.requestRefund, {
      keyHash: tokenHash,
      transactionRef: input.transaction_ref,
      amount: input.amount,
      method: input.method,
      receiverName: input.receiver_name,
      receiverNumber: input.receiver_number,
      notes: input.notes,
    });

    return respond(201, {
      refund_id: result.refundId,
      status: "pending",
      transaction_ref: input.transaction_ref,
      amount: input.amount,
      currency: "BDT",
      method: input.method,
      receiver_name: input.receiver_name,
      receiver_number: input.receiver_number,
    });
  } catch (e: any) {
    const code = e?.data?.code;
    if (code === "invalid_api_key") return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
    if (code === "key_missing_business_name") return respond(400, { error: "key_missing_business_name" }, "key_missing_business_name");
    if (code === "transaction_not_found") return respond(404, { error: "transaction_not_found" }, "transaction_not_found");
    if (code === "transaction_not_verified") return respond(409, { error: "transaction_not_verified" }, "transaction_not_verified");
    const msg = (e?.message ?? JSON.stringify(e)).slice(0, 500);
    if (msg.includes("invalid_api_key")) return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
    if (msg.includes("key_missing_business_name")) return respond(400, { error: "key_missing_business_name" }, "key_missing_business_name");
    if (msg.includes("transaction_not_found")) return respond(404, { error: "transaction_not_found" }, "transaction_not_found");
    if (msg.includes("transaction_not_verified")) return respond(409, { error: "transaction_not_verified" }, "transaction_not_verified");
    return respond(500, { error: "refund_failed" }, msg);
  } finally {
    void apiRequest.finish();
  }
}
