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
  transaction_ref: z.string().min(1).max(256),
  amount: z.number().positive(),
  method: z.string().min(1).max(40),
  receiver_name: z.string().min(1).max(256),
  receiver_number: z.string().min(1).max(64),
  notes: z.string().max(2000).optional(),
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
    const rl = await checkRateLimit(ipH, "refund", 20, 60000);
    if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

    if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

    const token = extractBearer(request);
    if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

    const tokenHash = hashKey(token);
    keyPrefix = token.slice(0, 8);

    const perKeyRl = await checkRateLimit(ipH, "key:refund", 50, 60000, tokenHash);
    if (perKeyRl.blocked) return respond(429, { error: perKeyRl.reason }, perKeyRl.reason);

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
    logApiCall({
      requestId,
      method: "POST",
      path: "/api/v1/public/transactions/refund",
      statusCode,
      durationMs: Date.now() - startTime,
      apiKeyPrefix: keyPrefix,
      ipHash: ipH,
      error: errorMsg,
    });
  }
}
