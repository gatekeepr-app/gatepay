import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const Schema = z.object({
  transaction_ref: z.string().trim().min(1).max(120),
  amount: z.number().nonnegative(),
  currency: z.string().trim().min(1).max(8).optional(),
  occurred_at: z.string().trim().min(1).max(40).optional(),
  method: z.string().trim().max(40).optional(),
  business_name: z.string().trim().min(1).max(160).optional(),
  external_user_id: z.string().trim().max(160).optional(),
  source: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  cur.count += 1;
  return cur.count > limit;
}

function extractBearer(request: Request): string | null {
  const h = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function hashKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const Route = createFileRoute("/api/public/transactions/submit")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        if (rateLimited(ip)) return json({ error: "rate_limited" }, 429);

        const token = extractBearer(request);
        if (!token) return json({ error: "missing_api_key" }, 401);

        const tokenHash = hashKey(token);
        const { data: keyRow, error: keyErr } = await supabaseAdmin
          .from("api_keys")
          .select("id, revoked_at, created_by, business_name")
          .eq("key_hash", tokenHash)
          .maybeSingle();

        if (keyErr) return json({ error: "auth_lookup_error" }, 500);
        if (!keyRow || keyRow.revoked_at) return json({ error: "invalid_api_key" }, 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
          return json({ error: "invalid_body", issues: parsed.error.issues }, 400);
        }
        const input = parsed.data;

        const businessName = input.business_name ?? keyRow.business_name ?? null;
        if (!businessName) {
          return json(
            { error: "missing_business_name", detail: "Provide business_name in body or set one on the API key." },
            400,
          );
        }

        // Duplicate-ref check (case-insensitive)
        const { data: existing } = await supabaseAdmin
          .from("transactions")
          .select("id, transaction_ref, verified_at")
          .ilike("transaction_ref", input.transaction_ref)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin
            .from("api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", keyRow.id);
          return json(
            {
              error: "duplicate_ref",
              id: existing.id,
              transaction_ref: existing.transaction_ref,
              verified: !!existing.verified_at,
            },
            409,
          );
        }

        const occurredAt = input.occurred_at ? new Date(input.occurred_at) : new Date();
        if (isNaN(occurredAt.getTime())) {
          return json({ error: "invalid_occurred_at" }, 400);
        }

        const { data: inserted, error: insErr } = await supabaseAdmin
          .from("transactions")
          .insert({
            transaction_ref: input.transaction_ref,
            amount: input.amount,
            currency: input.currency ?? "BDT",
            occurred_at: occurredAt.toISOString(),
            method: input.method ?? null,
            notes: input.notes ?? null,
            created_by: keyRow.created_by,
            verified_external_name: businessName,
            verified_external_user_id: input.external_user_id ?? null,
            verified_source: input.source ?? null,
            // verified_at intentionally NULL — admin must trigger verify
          })
          .select("id, transaction_ref")
          .single();

        await supabaseAdmin
          .from("api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", keyRow.id);

        if (insErr || !inserted) {
          return json({ error: "insert_failed", detail: insErr?.message }, 500);
        }

        return json(
          {
            received: true,
            id: inserted.id,
            transaction_ref: inserted.transaction_ref,
            status: "unverified",
          },
          201,
        );
      },
    },
  },
});
