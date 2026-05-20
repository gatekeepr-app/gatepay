import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type GroupResult = {
  business_name: string;
  callback_url: string | null;
  sent: number;
  status: "delivered" | "skipped_no_callback" | "skipped_no_key" | "failed";
  http_status?: number;
  error?: string;
};

export const triggerVerifyBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{
    total: number;
    groups: GroupResult[];
  }> => {
    // Pull all inbound, not-yet-verified transactions
    const { data: txs, error } = await supabaseAdmin
      .from("transactions")
      .select("id, transaction_ref, amount, currency, occurred_at, method, verified_external_name, verified_external_user_id, verified_source")
      .is("verified_at", null)
      .not("verified_external_name", "is", null);

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

    for (const [lcKey, group] of byBiz.entries()) {
      const displayName = group[0].verified_external_name as string;

      // Find an active api_key with matching business_name (case-insensitive)
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
        results.push({
          business_name: displayName,
          callback_url: keyRow.callback_url,
          sent: group.length,
          status: res.ok ? "delivered" : "failed",
          http_status: res.status,
          error: res.ok ? undefined : `Callback returned ${res.status}`,
        });
      } catch (e: any) {
        results.push({
          business_name: displayName,
          callback_url: keyRow.callback_url,
          sent: group.length,
          status: "failed",
          error: e?.message ?? "fetch_failed",
        });
      }
    }

    return { total: txs.length, groups: results };
  });
