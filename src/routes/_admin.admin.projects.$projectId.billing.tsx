import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { CURRENCIES, formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/projects/$projectId/billing")({
  head: () => ({ meta: [{ title: "Billing — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: BillingPage,
});

type Form = {
  billing_type: "monthly" | "yearly" | "per_project";
  amount: number;
  currency: string;
  months_count: number;
  start_date: string;
  end_date: string;
  payment_terms: string;
  notes: string;
};

function compute(f: Form) {
  if (f.billing_type === "monthly") return f.amount * Math.max(1, f.months_count || 1);
  if (f.billing_type === "yearly") {
    if (f.start_date && f.end_date) {
      const ms = new Date(f.end_date).getTime() - new Date(f.start_date).getTime();
      return f.amount * Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24 * 365)));
    }
    return f.amount;
  }
  return f.amount;
}

function BillingPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({
    billing_type: "per_project", amount: 0, currency: "BDT",
    months_count: 1, start_date: "", end_date: "", payment_terms: "", notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("project_billing").select("*").eq("project_id", projectId).maybeSingle();
      if (data) {
        setForm({
          billing_type: data.billing_type as Form["billing_type"],
          amount: Number(data.amount),
          currency: data.currency,
          months_count: data.months_count ?? 1,
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
          payment_terms: data.payment_terms ?? "",
          notes: data.notes ?? "",
        });
      }
      setLoading(false);
    })();
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("project_billing").upsert({
      project_id: projectId,
      billing_type: form.billing_type,
      amount: form.amount,
      currency: form.currency,
      months_count: form.billing_type === "monthly" ? form.months_count : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      payment_terms: form.payment_terms || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Billing saved");
    navigate({ to: "/admin/projects/$projectId", params: { projectId } });
  };

  if (loading) return <main className="px-6 py-10">Loading…</main>;
  const total = compute(form);

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/projects/$projectId" params={{ projectId }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to project
      </Link>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Billing setup</h1>

      <div className="mt-8 max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Billing type *</span>
              <select value={form.billing_type} onChange={(e) => setForm({ ...form, billing_type: e.target.value as Form["billing_type"] })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="per_project">Per project</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                {form.billing_type === "per_project" ? "Project amount" : form.billing_type === "monthly" ? "Per month" : "Per year"}
              </span>
              <input type="number" min={0} step="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
            </label>
            {form.billing_type === "monthly" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Number of months</span>
                <input type="number" min={1} value={form.months_count}
                  onChange={(e) => setForm({ ...form, months_count: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
              </label>
            )}
            {form.billing_type !== "per_project" && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Start date</span>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">End date</span>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </label>
              </>
            )}
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Payment terms</span>
            <input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <div className="rounded-lg bg-muted p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
            <div className="mt-1 text-2xl font-semibold">{formatMoney(total, form.currency)}</div>
          </div>
        </section>

        <button onClick={save} disabled={saving}
          className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : "Save billing"}
        </button>
      </div>
    </main>
  );
}
