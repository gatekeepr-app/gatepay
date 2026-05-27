import { createFileRoute } from "@tanstack/react-router";
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
  business_name: z.string().min(1).max(256),
  external_user_id: z.string().optional(),
  date: z.string().optional(),
  amount: z.number().optional(),
  source: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/public/transactions/verify")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: { ...corsHeaders(request), ...SECURITY_HEADERS } }),

      POST: async ({ request }) => {
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
          const rl = await checkRateLimit(ipH, "verify", 30, 60000);
          if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

          if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

          const token = extractBearer(request);
          if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

          const tokenHash = hashKey(token);
          keyPrefix = token.slice(0, 8);

          const perKeyRl = await checkRateLimit(ipH, "key:verify", 100, 60000, tokenHash);
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

          const result = await convex.mutation(api.public.verifyTransaction, {
            keyHash: tokenHash,
            transactionRef: input.transaction_ref,
            businessName: input.business_name,
            date: input.date ? new Date(input.date).getTime() : undefined,
            amount: input.amount,
            externalUserId: input.external_user_id,
            source: input.source,
          });

          if (result.verified) {
            return respond(200, {
              verified: true,
              transaction: result.transaction,
            });
          }
          return respond(200, { verified: false, reason: result.reason });
        } catch (e: any) {
          const msg = e?.message ?? "";
          if (msg.includes("invalid_api_key")) return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
          if (msg.includes("key_missing_business_name")) return respond(400, { error: "key_missing_business_name" }, "key_missing_business_name");
          return respond(500, { verified: false, reason: "lookup_error" }, msg);
        } finally {
          logApiCall({
            requestId,
            method: "POST",
            path: "/api/v1/public/transactions/verify",
            statusCode,
            durationMs: Date.now() - startTime,
            apiKeyPrefix: keyPrefix,
            ipHash: ipH,
            error: errorMsg,
          });
        }
      },
    },
  },
});
