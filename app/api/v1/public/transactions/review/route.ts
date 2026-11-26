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
  const apiRequest = createLoggedApiRequest(request, "/api/v1/public/transactions/review");
  const { requestId, ipHash } = apiRequest;
  const respond = apiRequest.respond;

  try {
    const rl = await checkRateLimit(ipHash, "review", 30, 60000);
    if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

    if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

    const token = extractBearer(request);
    if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

    const tokenHash = hashKey(token);
    apiRequest.setApiKeyPrefix(token.slice(0, 8));

    const requestBody = await readRequestJson(request);
    if (!requestBody.ok) return respond(requestBody.status, { error: requestBody.error }, requestBody.error);

    const parsed = transactionApiContracts.review.schema.safeParse(requestBody.body);
    if (!parsed.success) {
      return respond(400, { error: "invalid_body", issues: parsed.error.issues }, "invalid_body");
    }
    const input = parsed.data;

    const result = await convex.mutation(api.public.reviewTransaction, {
      keyHash: tokenHash,
      transactionId: input.transaction_id as any,
      amount: input.amount,
      note: input.note,
    });

    if (result.reviewed) {
      return respond(200, {
        reviewed: true,
        transaction: result.transaction,
      });
    }
    return respond(200, { reviewed: false, reason: result.reason });
  } catch (e: any) {
    const code = e?.data?.code;
    if (code === "invalid_api_key") return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
    if (code === "key_missing_business_name") return respond(400, { error: "key_missing_business_name" }, "key_missing_business_name");
    const msg = e?.message ?? "";
    if (msg.includes("invalid_api_key")) return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
    if (msg.includes("key_missing_business_name")) return respond(400, { error: "key_missing_business_name" }, "key_missing_business_name");
    return respond(500, { reviewed: false, reason: "review_error" }, msg);
  } finally {
    void apiRequest.finish();
  }
}
