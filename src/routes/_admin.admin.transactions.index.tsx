import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, CheckCircle2, Circle, ShieldCheck, Loader2 } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { triggerVerifyBatch } from "@/lib/transactions.functions";

export const Route = createFileRoute("/_admin/admin/transactions/")({
  head: () => ({
    meta: [{ title: "Transactions — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: TransactionsPage,
});

type Tx = {
  id: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  occurred_at: string;
  method: string | null;
  verified_at: string | null;
  verified_external_name: string | null;
  client_id: string | null;
  project_id: string | null;
};

function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [verifying, setVerifying] = useState(false);
  const verifyFn = useServerFn(triggerVerifyBatch);

  const load = async () => {
    const { data } = await supabase
      .from("transactions")
      .select(
        "id,transaction_ref,amount,currency,occurred_at,method,verified_at,verified_external_name,client_id,project_id",
      )
      .order("occurred_at", { ascending: false });
    setRows((data ?? []) as Tx[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const unverifiedInboundIds = rows
    .filter((t) => !t.verified_at && t.verified_external_name)
    .map((t) => t.id);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runVerify = async () => {
    const ids = Array.from(selected).filter((id) => unverifiedInboundIds.includes(id));
    if (ids.length === 0) {
      toast.info("Select at least one unverified inbound transaction");
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyFn({ data: { ids } });
      if (res.total === 0) {
        toast.info("Nothing to verify");
      } else {
        for (const g of res.groups) {
          if (g.status === "delivered") {
            toast.success(
              `${g.business_name}: delivered ${g.sent} (HTTP ${g.http_status}) → marked verified`,
            );
          } else if (g.status === "failed") {
            toast.error(
              `${g.business_name}: ${g.error ?? "failed"}${
                g.response_body ? ` — ${g.response_body}` : ""
              }`,
              { duration: 10000 },
            );
          } else {
            toast.warning(`${g.business_name}: ${g.error ?? g.status}`);
          }
        }
      }
      setSelected(new Set());
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Verify failed");
    } finally {
      setVerifying(false);
    }
  };

  const filtered = rows.filter((t) => {
    const s = q.toLowerCase();
    const matchQ =
      !s ||
      t.transaction_ref.toLowerCase().includes(s) ||
      (t.method ?? "").toLowerCase().includes(s) ||
      (t.verified_external_name ?? "").toLowerCase().includes(s);
    const matchF =
      filter === "all" ||
      (filter === "verified" && t.verified_at) ||
      (filter === "unverified" && !t.verified_at);
    return matchQ && matchF;
  });

  const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-foreground/50">Workspace</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Transactions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} shown · ${formatMoney(total)} total`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={runVerify}
            disabled={verifying || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            title={
              selected.size === 0
                ? "Select unverified inbound transactions first"
                : `Send ${selected.size} selected transaction(s) to their callback URLs`
            }
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Trigger verify
            {selected.size > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-xs">
                {selected.size}
              </span>
            )}
          </button>
          <Link
            to="/admin/transactions/new"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New transaction
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference, method, verifier…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/30"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-card p-1 text-xs">
          {(["all", "verified", "unverified"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
                filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {loading ? "Loading…" : "No transactions yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Verified by</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const inboundPending = !t.verified_at && t.verified_external_name;
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.occurred_at)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to="/admin/transactions/$id" params={{ id: t.id }} className="hover:underline">
                        {t.transaction_ref}
                      </Link>
                      {inboundPending && (
                        <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(t.amount, t.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.method || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.verified_external_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (t.verified_at) {
                            if (!confirm("Mark this transaction as unverified?")) return;
                            const { error } = await supabase
                              .from("transactions")
                              .update({ verified_at: null, verified_source: null })
                              .eq("id", t.id);
                            if (error) return toast.error(error.message);
                            toast.success("Marked unverified");
                          } else {
                            const { error } = await supabase
                              .from("transactions")
                              .update({
                                verified_at: new Date().toISOString(),
                                verified_source: t.verified_external_name ? "manual_override" : "manual",
                              })
                              .eq("id", t.id);
                            if (error) return toast.error(error.message);
                            toast.success("Marked verified");
                          }
                          await load();
                        }}
                        title={t.verified_at ? "Click to mark unverified" : "Click to mark verified"}
                        className="rounded-full p-1 transition-colors hover:bg-muted"
                      >
                        {t.verified_at ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-emerald-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
