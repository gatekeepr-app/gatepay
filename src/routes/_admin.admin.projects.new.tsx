import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { CURRENCIES, formatMoney } from "@/lib/admin/format";

export const Route = createFileRoute("/_admin/admin/projects/new")({
  validateSearch: (s: Record<string, unknown>) => ({ client: (s.client as string) || "" }),
  head: () => ({ meta: [{ title: "New project — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: NewProjectPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  client_id: z.string().uuid().nullable(),
  status: z.enum(["draft", "active", "paused", "completed"]),
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
  billing_type: z.enum(["monthly", "yearly", "per_project"]),
  amount: z.number().min(0),
  currency: z.string().min(1).max(8),
  months_count: z.number().int().min(1).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  payment_terms: z.string().max(200).optional(),
});

function computeTotal(billing_type: string, amount: number, months: number, start: string, end: string) {
  if (billing_type === "monthly") return amount * Math.max(1, months || 1);
  if (billing_type === "yearly") {
    if (start && end) {
      const ms = new Date(end).getTime() - new Date(start).getTime();
      const yrs = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24 * 365)));
      return amount * yrs;
    }
    return amount;
  }
  return amount;
}

function NewProjectPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    client_id: search.client || "",
    status: "draft" as "draft" | "active" | "paused" | "completed",
    tags: [] as string[],
    billing_type: "per_project" as "monthly" | "yearly" | "per_project",
    amount: 0,
    currency: "BDT",
    months_count: 1,
    start_date: "",
    end_date: "",
    payment_terms: "",
  });

  useEffect(() => {
    supabase.from("clients").select("id,name").order("name").then(({ data }) => {
      setClients((data ?? []) as { id: string; name: string }[]);
    });
  }, []);

  const total = computeTotal(form.billing_type, form.amount, form.months_count, form.start_date, form.end_date);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const submit = async () => {
    const parsed = schema.safeParse({
      ...form,
      client_id: form.client_id || null,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) { toast.error("Not signed in"); setSaving(false); return; }

    const { data: proj, error } = await supabase.from("projects").insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      client_id: parsed.data.client_id,
      status: parsed.data.status,
      tags: parsed.data.tags,
      created_by: uid,
    }).select("id").single();

    if (error || !proj) { toast.error(error?.message ?? "Failed"); setSaving(false); return; }

    const { error: bErr } = await supabase.from("project_billing").insert({
      project_id: proj.id,
      billing_type: parsed.data.billing_type,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      months_count: parsed.data.billing_type === "monthly" ? parsed.data.months_count : null,
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      payment_terms: parsed.data.payment_terms || null,
    });

    setSaving(false);
    if (bErr) { toast.error(bErr.message); return; }
    toast.success("Project created");
    navigate({ to: "/admin/projects/$projectId", params: { projectId: proj.id } });
  };

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to projects
      </Link>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">New project</h1>

      <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setStep(n)}
            className={`rounded-full px-3 py-1 ${step === n ? "bg-foreground text-background" : "bg-muted"}`}
          >
            {n}. {["Basics", "Client", "Billing", "Review"][n - 1]}
          </button>
        ))}
      </div>

      <div className="mt-8 max-w-2xl space-y-6">
        {step === 1 && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Project name *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })}
                    className="rounded-full bg-muted px-2 py-1 text-xs">
                    {t} ×
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag…"
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                <button onClick={addTag} type="button" className="rounded-lg border border-border px-3 text-sm">Add</button>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Client (optional)</span>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="">— None —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <p className="text-xs text-muted-foreground">
              Don't see them? <Link to="/admin/clients/new" className="underline">Add a client</Link> first.
            </p>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Billing type *</span>
                <select value={form.billing_type} onChange={(e) => setForm({ ...form, billing_type: e.target.value as typeof form.billing_type })}
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
              {form.billing_type === "yearly" && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Start date</span>
                    <input type="date" value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">End date</span>
                    <input type="date" value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  </label>
                </>
              )}
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Payment terms</span>
              <input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                placeholder="Net 30, 50% upfront, etc."
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
            </label>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Estimated total</div>
              <div className="mt-1 text-2xl font-semibold">{formatMoney(total, form.currency)}</div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <strong>{form.name || "—"}</strong></div>
            <div><span className="text-muted-foreground">Status:</span> {form.status}</div>
            <div><span className="text-muted-foreground">Client:</span> {clients.find(c => c.id === form.client_id)?.name ?? "—"}</div>
            <div><span className="text-muted-foreground">Tags:</span> {form.tags.join(", ") || "—"}</div>
            <div><span className="text-muted-foreground">Billing:</span> {form.billing_type} · {formatMoney(form.amount, form.currency)}</div>
            <div><span className="text-muted-foreground">Total:</span> <strong>{formatMoney(total, form.currency)}</strong></div>
          </section>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted disabled:opacity-40"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create project"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
