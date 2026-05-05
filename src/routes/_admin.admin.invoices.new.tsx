import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { CURRENCIES, formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/invoices/new")({
  validateSearch: (s: Record<string, unknown>) => ({ project: (s.project as string) || "" }),
  head: () => ({ meta: [{ title: "New invoice — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: NewInvoicePage,
});

type Line = { description: string; quantity: number; unit_price: number };

function NewInvoicePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<{ id: string; name: string; project_code: string; client_id: string | null }[]>([]);
  const [projectId, setProjectId] = useState(search.project || "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("projects").select("id,name,project_code,client_id").order("created_at", { ascending: false }).then(({ data }) => {
      setProjects((data ?? []) as typeof projects);
    });
  }, []);

  // Prefill from project billing when project changes
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const [{ data: b }, { data: p }] = await Promise.all([
        supabase.from("project_billing").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("projects").select("name,project_code").eq("id", projectId).maybeSingle(),
      ]);
      if (b) {
        setCurrency(b.currency);
        const desc =
          b.billing_type === "monthly"
            ? `${p?.name ?? "Project"} — Monthly retainer × ${b.months_count ?? 1}`
            : b.billing_type === "yearly"
            ? `${p?.name ?? "Project"} — Yearly engagement`
            : `${p?.name ?? "Project"} — Project fee`;
        const qty = b.billing_type === "monthly" ? (b.months_count ?? 1) : 1;
        setLines([{ description: desc, quantity: qty, unit_price: Number(b.amount) }]);
      }
    })();
  }, [projectId]);

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    if (!projectId) return toast.error("Pick a project");
    if (lines.length === 0 || lines.some((l) => !l.description.trim())) return toast.error("Add at least one line item");

    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) { toast.error("Not signed in"); setSaving(false); return; }

    const project = projects.find((p) => p.id === projectId);

    const { data: inv, error } = await supabase.from("invoices").insert({
      project_id: projectId,
      client_id: project?.client_id ?? null,
      issue_date: issueDate,
      due_date: dueDate || null,
      status: "draft",
      currency,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: notes || null,
      created_by: uid,
    }).select("id").single();

    if (error || !inv) { toast.error(error?.message ?? "Failed"); setSaving(false); return; }

    const { error: lErr } = await supabase.from("invoice_line_items").insert(
      lines.map((l, idx) => ({
        invoice_id: inv.id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        amount: l.quantity * l.unit_price,
        position: idx,
      }))
    );
    setSaving(false);
    if (lErr) return toast.error(lErr.message);
    toast.success("Invoice created");
    navigate({ to: "/admin/invoices/$invoiceId", params: { invoiceId: inv.id } });
  };

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/invoices" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to invoices
      </Link>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">New invoice</h1>

      <div className="mt-8 max-w-3xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Project *</span>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="">— Select —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Issue date</span>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Due date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Line items</h2>
          <div className="mt-4 space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr,90px,120px,120px,40px]">
                <input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })}
                  placeholder="Description"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                <input type="number" min={0} step="0.01" value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                <input type="number" min={0} step="0.01" value={l.unit_price} onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                <div className="rounded-lg bg-muted px-3 py-2 text-sm tabular-nums text-right">
                  {formatMoney(l.quantity * l.unit_price, currency)}
                </div>
                <button type="button" onClick={() => setLines((c) => c.filter((_, x) => x !== i))}
                  className="rounded-lg border border-border p-2 hover:bg-muted">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines((c) => [...c, { description: "", quantity: 1, unit_price: 0 }])}
            className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Plus className="h-3 w-3" /> Add line
          </button>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Tax rate (%)</span>
              <input type="number" min={0} max={100} step="0.01" value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 space-y-1 text-right text-sm">
            <div>Subtotal: <span className="tabular-nums">{formatMoney(subtotal, currency)}</span></div>
            <div>Tax: <span className="tabular-nums">{formatMoney(taxAmount, currency)}</span></div>
            <div className="text-xl font-semibold">Total: <span className="tabular-nums">{formatMoney(total, currency)}</span></div>
          </div>
        </section>

        <button onClick={submit} disabled={saving}
          className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50">
          {saving ? "Creating…" : "Create invoice"}
        </button>
      </div>
    </main>
  );
}
