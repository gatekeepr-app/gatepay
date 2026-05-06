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
  date: z.string().trim().min(1).max(40).optional(),
  amount: z.number().nonnegative().optional(),
  business_name: z.string().trim().min(1).max(160),
  external_user_id: z.string().trim().max(160).optional(),
  source: z.string().trim().max(160).optional(),
});

const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string, limit = 30, windowMs = 60_000) {
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

export const Route = createFileRoute("/api/public/transactions/verify")({
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
        if (!token) {
          return json({ error: "missing_api_key" }, 401);
        }

        const tokenHash = hashKey(token);
        const { data: keyRow, error: keyErr } = await supabaseAdmin
          .from("api_keys")
          .select("id, revoked_at")
          .eq("key_hash", tokenHash)
          .maybeSingle();

        if (keyErr) return json({ error: "auth_lookup_error" }, 500);
        if (!keyRow || keyRow.revoked_at) {
          return json({ error: "invalid_api_key" }, 401);
        }

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

        const { data: tx, error } = await supabaseAdmin
          .from("transactions")
          .select("id,transaction_ref,amount,currency,occurred_at,project_id")
          .ilike("transaction_ref", input.transaction_ref)
          .maybeSingle();

        // Stamp last_used regardless of match outcome (key was valid).
        await supabaseAdmin
          .from("api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", keyRow.id);

        if (error) return json({ verified: false, reason: "lookup_error" }, 500);
        if (!tx) return json({ verified: false, reason: "not_found" });

        if (input.date) {
          const provided = new Date(input.date);
          if (isNaN(provided.getTime())) {
            return json({ verified: false, reason: "invalid_date" });
          }
          const txDay = new Date(tx.occurred_at).toISOString().slice(0, 10);
          const inDay = provided.toISOString().slice(0, 10);
          if (txDay !== inDay) {
            return json({ verified: false, reason: "date_mismatch" });
          }
        }

        if (input.amount != null && Number(input.amount) !== Number(tx.amount)) {
          return json({ verified: false, reason: "amount_mismatch" });
        }

        await supabaseAdmin
          .from("transactions")
          .update({
            verified_external_name: input.business_name,
            verified_external_user_id: input.external_user_id ?? null,
            verified_source: input.source ?? null,
            verified_at: new Date().toISOString(),
          })
          .eq("id", tx.id);

        let projectCode: string | null = null;
        if (tx.project_id) {
          await supabaseAdmin
            .from("projects")
            .update({
              last_transaction_ref: tx.transaction_ref,
              last_payment_at: tx.occurred_at,
            })
            .eq("id", tx.project_id);
          const { data: proj } = await supabaseAdmin
            .from("projects")
            .select("project_code")
            .eq("id", tx.project_id)
            .maybeSingle();
          projectCode = proj?.project_code ?? null;
        }

        return json({
          verified: true,
          transaction: {
            ref: tx.transaction_ref,
            amount: Number(tx.amount),
            currency: tx.currency,
            occurred_at: tx.occurred_at,
            project_code: projectCode,
          },
        });
      },
    },
  },
});
