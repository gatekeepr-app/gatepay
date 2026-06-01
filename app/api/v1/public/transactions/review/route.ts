import { NextRequest } from "next/server";
import { z } from "zod";
import { convex } from "@/integrations/convex/server";
import { api } from "@/../convex/_generated/api";
import {
  json, generateRequestId,
  hashIp, getClientIp, extractBearer, hashKey,
  checkRateLimit, checkBodySize,
  logApiCall, corsHeaders, SECURITY_HEADERS,
} from "@/lib/api/helpers";

const Schema = z.object({
  transaction_id: z.string().min(1),
  amount: z.number(),
  note: z.string().max(2000),
});

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: { ...corsHeaders(request), ...SECURITY_HEADERS } });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ip = getClientIp(request);
  const ipH = hashIp(ip);

  let statusCode = 200;
  let errorMsg: string | undefined;
  let keyPrefix: string | undefined;

  const respond = (status: number, body: unknown, err?: string) => {
    statusCode = status;
    errorMsg = err;
    return json(body, status, { "x-request-id": requestId });
  };

  try {
    const rl = await checkRateLimit(ipH, "review", 30, 60000);
    if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

    if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

    const token = extractBearer(request);
    if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

    const tokenHash = hashKey(token);
    keyPrefix = token.slice(0, 8);

    let body: unknown;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > 10_240) {
        return respond(413, { error: "body_too_large" }, "body_too_large");
      }
      body = JSON.parse(text);
    } catch {
      return respond(400, { error: "invalid_json" }, "invalid_json");
    }

    const parsed = Schema.safeParse(body);
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
    logApiCall({
      requestId,
      method: "POST",
      path: "/api/v1/public/transactions/review",
      statusCode,
      durationMs: Date.now() - startTime,
      apiKeyPrefix: keyPrefix,
      ipHash: ipH,
      error: errorMsg,
    });
  }
}
