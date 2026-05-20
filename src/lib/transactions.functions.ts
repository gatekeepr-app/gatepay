import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type GroupResult = {
  business_name: string;
  callback_url: string | null;
  sent: number;
  verified_ids: string[];
  status: "delivered" | "skipped_no_callback" | "skipped_no_key" | "failed";
  http_status?: number;
  response_body?: string;
  error?: string;
};

export const triggerVerifyBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids?: string[] } | undefined) =>
    z
      .object({ ids: z.array(z.string().uuid()).max(500).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{
    total: number;
    groups: GroupResult[];
  }> => {
    let q = supabaseAdmin
      .from("transactions")
      .select(
        "id, transaction_ref, amount, currency, occurred_at, method, verified_external_name, verified_external_user_id, verified_source",
      )
      .is("verified_at", null)
      .not("verified_external_name", "is", null);

    if (data.ids && data.ids.length > 0) {
      q = q.in("id", data.ids);
    }

    const { data: txs, error } = await q;

    if (error) throw new Error(error.message);
    if (!txs || txs.length === 0) return { total: 0, groups: [] };

    // Group by business_name (case-insensitive)
    const byBiz = new Map<string, typeof txs>();
    for (const t of txs) {
      const key = (t.verified_external_name ?? "").trim();
      if (!key) continue;
      const k = key.toLowerCase();
      if (!byBiz.has(k)) byBiz.set(k, []);
      byBiz.get(k)!.push(t);
    }

    const results: GroupResult[] = [];

    for (const [, group] of byBiz.entries()) {
      const displayName = group[0].verified_external_name as string;
      const groupIds = group.map((t) => t.id);

      const { data: keyRow } = await supabaseAdmin
        .from("api_keys")
        .select("id, callback_url, signing_secret")
        .ilike("business_name", displayName)
        .is("revoked_at", null)
        .limit(1)
        .maybeSingle();

      if (!keyRow) {
        results.push({
          business_name: displayName,
          callback_url: null,
          sent: group.length,
          verified_ids: [],
          status: "skipped_no_key",
          error: `No active API key found with business_name "${displayName}".`,
        });
        continue;
      }

      if (!keyRow.callback_url) {
        results.push({
          business_name: displayName,
          callback_url: null,
          sent: group.length,
          verified_ids: [],
          status: "skipped_no_callback",
          error: "API key has no callback_url configured.",
        });
        continue;
      }

      const payload = {
        business_name: displayName,
        sent_at: new Date().toISOString(),
        transactions: group.map((t) => ({
          transaction_ref: t.transaction_ref,
          amount: Number(t.amount),
          currency: t.currency,
          occurred_at: t.occurred_at,
          method: t.method,
          external_user_id: t.verified_external_user_id,
          source: t.verified_source,
        })),
      };
      const body = JSON.stringify(payload);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Gatekeepr-Verify/1.0",
      };
      if (keyRow.signing_secret) {
        const sig = createHmac("sha256", keyRow.signing_secret).update(body).digest("hex");
        headers["X-Gatekeepr-Signature"] = `sha256=${sig}`;
      }

      try {
        const res = await fetch(keyRow.callback_url, {
          method: "POST",
          headers,
          body,
        });
        const respText = await res.text().catch(() => "");
        const snippet = respText.length > 500 ? respText.slice(0, 500) + "…" : respText;

        if (res.ok) {
          // Mark these as verified
          const verifiedAt = new Date().toISOString();
          const { error: updErr } = await supabaseAdmin
            .from("transactions")
            .update({ verified_at: verifiedAt, verified_source: "callback" })
            .in("id", groupIds);

          if (updErr) {
            results.push({
              business_name: displayName,
              callback_url: keyRow.callback_url,
              sent: group.length,
              verified_ids: [],
              status: "failed",
              http_status: res.status,
              response_body: snippet,
              error: `Callback ok but DB update failed: ${updErr.message}`,
            });
          } else {
            results.push({
              business_name: displayName,
              callback_url: keyRow.callback_url,
              sent: group.length,
              verified_ids: groupIds,
              status: "delivered",
              http_status: res.status,
              response_body: snippet,
            });
          }
        } else {
          results.push({
            business_name: displayName,
            callback_url: keyRow.callback_url,
            sent: group.length,
            verified_ids: [],
            status: "failed",
            http_status: res.status,
            response_body: snippet,
            error: `Callback returned ${res.status}`,
          });
        }
      } catch (e: any) {
        results.push({
          business_name: displayName,
          callback_url: keyRow.callback_url,
          sent: group.length,
          verified_ids: [],
          status: "failed",
          error: e?.message ?? "fetch_failed",
        });
      }
    }

    return { total: txs.length, groups: results };
  });
