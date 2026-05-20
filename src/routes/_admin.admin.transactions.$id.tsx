import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, Pencil, X } from "lucide-react";
import { formatMoney, CURRENCIES } from "@/lib/admin/format";
import { toast } from "sonner";
import { z } from "zod";

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

const schema = z.object({
  transaction_ref: z.string().trim().min(1, "Reference required").max(120),
  amount: z.coerce.number().positive("Amount must be > 0"),
  currency: z.string().min(3).max(3),
  occurred_at: z.string().min(1, "Date required"),
  method: z.string().trim().max(40).optional(),
  client_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/30";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function TransactionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; project_code: string }[]>([]);
  const [form, setForm] = useState({
    transaction_ref: "",
    amount: "",
    currency: "BDT",
    occurred_at: "",
    method: "",
    client_id: "",
    project_id: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("transactions").select("*").eq("id", id).maybeSingle();
      setTx((data as Tx) ?? null);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("clients").select("id,name").order("name"),
        supabase.from("projects").select("id,name,project_code").order("created_at", { ascending: false }),
      ]);
      setClients((c ?? []) as any);
      setProjects((p ?? []) as any);
    })();
  }, [editing]);

  const startEdit = () => {
    if (!tx) return;
    setForm({
      transaction_ref: tx.transaction_ref,
      amount: String(tx.amount),
      currency: tx.currency,
      occurred_at: toLocalInput(tx.occurred_at),
      method: tx.method ?? "",
      client_id: tx.client_id ?? "",
      project_id: tx.project_id ?? "",
      notes: tx.notes ?? "",
    });
    setEditing(true);
  };

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("transactions")
      .update({
        transaction_ref: parsed.data.transaction_ref,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        occurred_at: new Date(parsed.data.occurred_at).toISOString(),
        method: parsed.data.method || null,
        client_id: parsed.data.client_id || null,
        project_id: parsed.data.project_id || null,
        notes: parsed.data.notes || null,
      })
      .eq("id", id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("transactions_ref_unique") ? "Reference already exists" : error.message);
      return;
    }
    setTx(data as Tx);
    setEditing(false);
    toast.success("Saved");
  };

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
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          )}
          <button
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-8 max-w-2xl space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Transaction reference *</span>
                <input className={inputCls + " font-mono"} value={form.transaction_ref} onChange={update("transaction_ref")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount *</span>
                <input type="number" step="0.01" min="0" className={inputCls} value={form.amount} onChange={update("amount")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
                <select className={inputCls} value={form.currency} onChange={update("currency")}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Date & time *</span>
                <input type="datetime-local" className={inputCls} value={form.occurred_at} onChange={update("occurred_at")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Method</span>
                <input className={inputCls} value={form.method} onChange={update("method")} placeholder="bKash, bank, card…" />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Link (optional)</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Client</span>
                <select className={inputCls} value={form.client_id} onChange={update("client_id")}>
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Project</span>
                <select className={inputCls} value={form.project_id} onChange={update("project_id")}>
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
            <textarea
              value={form.notes}
              onChange={update("notes")}
              rows={3}
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
            />
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
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
        </>
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
