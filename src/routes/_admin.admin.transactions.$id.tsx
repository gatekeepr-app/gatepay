import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/transactions/$id")({
  head: () => ({
    meta: [{ title: "Transaction — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: TransactionDetailPage,
});

type Tx = {
  id: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  occurred_at: string;
  method: string | null;
  notes: string | null;
  client_id: string | null;
  project_id: string | null;
  invoice_id: string | null;
  verified_at: string | null;
  verified_external_name: string | null;
  verified_external_user_id: string | null;
  verified_source: string | null;
  created_at: string;
};

function TransactionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("transactions").select("*").eq("id", id).maybeSingle();
      setTx((data as Tx) ?? null);
      setLoading(false);
    })();
  }, [id]);

  const remove = async () => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/admin/transactions" });
  };

  if (loading) {
    return <main className="px-6 py-10 md:px-10 text-sm text-muted-foreground">Loading…</main>;
  }
  if (!tx) {
    return (
      <main className="px-6 py-10 md:px-10">
        <p className="text-sm text-muted-foreground">Transaction not found.</p>
        <Link to="/admin/transactions" className="mt-4 inline-block text-sm hover:underline">
          ← Back
        </Link>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/transactions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to transactions
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">{formatMoney(tx.amount, tx.currency)}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{tx.transaction_ref}</p>
        </div>
        <button
          onClick={remove}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        <Field label="Date" value={new Date(tx.occurred_at).toLocaleString()} />
        <Field label="Method" value={tx.method || "—"} />
        <Field label="Client" value={tx.client_id ? <Link to="/admin/clients/$clientId" params={{ clientId: tx.client_id }} className="hover:underline">View client</Link> : "—"} />
        <Field label="Project" value={tx.project_id ? <Link to="/admin/projects/$projectId" params={{ projectId: tx.project_id }} className="hover:underline">View project</Link> : "—"} />
      </div>

      <section className="mt-8 max-w-3xl rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">External verification</h2>
        {tx.verified_at ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
            <Field label="Verified by" value={tx.verified_external_name || "—"} />
            <Field label="Source" value={tx.verified_source || "—"} />
            <Field label="Their user ID" value={tx.verified_external_user_id || "—"} />
            <Field label="Verified at" value={new Date(tx.verified_at).toLocaleString()} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Not yet verified by an external app. Share the transaction reference and they can call the verification API.
          </p>
        )}
      </section>

      {tx.notes && (
        <section className="mt-6 max-w-3xl rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm">{tx.notes}</p>
        </section>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
