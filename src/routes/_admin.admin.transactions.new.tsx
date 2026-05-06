import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { CURRENCIES } from "@/lib/admin/format";

export const Route = createFileRoute("/_admin/admin/transactions/new")({
  head: () => ({
    meta: [{ title: "New transaction — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: NewTransactionPage,
});

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

type FormState = {
  transaction_ref: string;
  amount: string;
  currency: string;
  occurred_at: string; // datetime-local
  method: string;
  client_id: string;
  project_id: string;
  notes: string;
};

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/30";

function NewTransactionPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    transaction_ref: "",
    amount: "",
    currency: "BDT",
    occurred_at: nowLocal(),
    method: "",
    client_id: "",
    project_id: "",
    notes: "",
  });
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; project_code: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("clients").select("id,name").order("name"),
        supabase.from("projects").select("id,name,project_code").order("created_at", { ascending: false }),
      ]);
      setClients((c ?? []) as any);
      setProjects((p ?? []) as any);
    })();
  }, []);

  const update =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      toast.error("Not signed in");
      setSaving(false);
      return;
    }
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        transaction_ref: parsed.data.transaction_ref,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        occurred_at: new Date(parsed.data.occurred_at).toISOString(),
        method: parsed.data.method || null,
        client_id: parsed.data.client_id || null,
        project_id: parsed.data.project_id || null,
        notes: parsed.data.notes || null,
        created_by: uid,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("transactions_ref_unique") ? "Reference already exists" : error.message);
      return;
    }
    toast.success("Transaction saved");
    navigate({ to: "/admin/transactions/$id", params: { id: data.id } });
  };

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/transactions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to transactions
      </Link>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">New transaction</h1>
      <p className="mt-2 text-sm text-muted-foreground">Record an incoming payment.</p>

      <form onSubmit={submit} className="mt-8 max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Transaction reference *</span>
              <input
                className={inputCls + " font-mono"}
                value={form.transaction_ref}
                onChange={update("transaction_ref")}
                placeholder="e.g. 8FA2K9JX"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount received *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={form.amount}
                onChange={update("amount")}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
              <select className={inputCls} value={form.currency} onChange={update("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Date & time *</span>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.occurred_at}
                onChange={update("occurred_at")}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Method</span>
              <input
                className={inputCls}
                value={form.method}
                onChange={update("method")}
                placeholder="bKash, bank, card…"
              />
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
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Project</span>
              <select className={inputCls} value={form.project_id} onChange={update("project_id")}>
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} · {p.name}
                  </option>
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
            {saving ? "Saving…" : "Save transaction"}
          </button>
          <Link to="/admin/transactions" className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
