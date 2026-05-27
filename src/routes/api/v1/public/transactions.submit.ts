import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { convex } from "@/integrations/convex/server";
import { api } from "@/../convex/_generated/api";
import {
  json, jsonOk, jsonError, generateRequestId,
  hashIp, getClientIp, extractBearer, hashKey,
  extractIdempotencyKey, checkRateLimit,
  checkBodySize, logApiCall, corsHeaders, SECURITY_HEADERS,
} from "@/lib/api/helpers";

const Schema = z.object({
  transaction_ref: z.string().min(1).max(256),
  amount: z.number(),
  currency: z.string().optional(),
  occurred_at: z.string().optional(),
  method: z.string().optional(),
  business_name: z.string().optional(),
  external_user_id: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/public/transactions/submit")({
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
          const rl = await checkRateLimit(ipH, "submit", 60, 60000);
          if (rl.blocked) return respond(429, { error: rl.reason }, rl.reason);

          if (!checkBodySize(request)) return respond(413, { error: "body_too_large" }, "body_too_large");

          const token = extractBearer(request);
          if (!token) return respond(401, { error: "missing_api_key" }, "missing_api_key");

          const tokenHash = hashKey(token);
          keyPrefix = token.slice(0, 8);

          const idempotencyKey = extractIdempotencyKey(request);

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
          const msg = e?.message ?? "";
          if (msg.includes("invalid_api_key")) return respond(401, { error: "invalid_api_key" }, "invalid_api_key");
          if (msg.includes("missing_business_name")) return respond(400, { error: "missing_business_name" }, "missing_business_name");
          if (msg.includes("duplicate_ref")) {
            return respond(409, { error: "duplicate_ref", transaction_ref: "" }, "duplicate_ref");
          }
          return respond(500, { error: "insert_failed" }, msg);
        } finally {
          logApiCall({
            requestId,
            method: "POST",
            path: "/api/v1/public/transactions/submit",
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
