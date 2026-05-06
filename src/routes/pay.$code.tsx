import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/pay/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Pay ${params.code} — Gatekeepr` },
      { name: "description", content: "Securely complete your project payment." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PayPage,
});

type Project = { id: string; name: string; project_code: string };
type Billing = {
  billing_type: "monthly" | "yearly" | "per_project";
  amount: number;
  currency: string;
  months_count: number | null;
  start_date: string | null;
  end_date: string | null;
  total_calculated: number;
};
type Tx = { id: string; amount: number; occurred_at: string };

function monthsBetween(start: Date, now: Date) {
  const s = new Date(start.getFullYear(), start.getMonth(), 1);
  const n = new Date(now.getFullYear(), now.getMonth(), 1);
  if (n < s) return 0;
  return (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth()) + 1;
}

function monthLabel(start: Date, offset: number) {
  const d = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function computeDue(billing: Billing, txs: Tx[]) {
  const paid = txs.reduce((s, t) => s + Number(t.amount), 0);
  const amount = Number(billing.amount);
  const currency = billing.currency;

  if (billing.billing_type === "monthly") {
    const start = billing.start_date ? new Date(billing.start_date) : new Date();
    const totalMonths = billing.months_count ?? Infinity;
    const now = new Date();
    const elapsed = Math.min(monthsBetween(start, now), totalMonths);
    if (elapsed <= 0) {
      return { due: 0, period: monthLabel(start, 0), currency, amount, paidMonths: 0, expected: 0 };
    }
    const expectedToDate = amount * elapsed;
    const remaining = Math.max(0, expectedToDate - paid);
    const paidMonths = Math.min(elapsed, Math.floor(paid / amount));
    const dueMonthIndex = paidMonths; // 0-indexed: the next month to pay
    return {
      due: remaining > 0 ? amount : 0, // pay one month at a time
      period: monthLabel(start, dueMonthIndex),
      currency,
      amount,
      paidMonths,
      expected: expectedToDate,
      remainingTotal: remaining,
    };
  }

  // yearly or per_project: single bucket
  const total = Number(billing.total_calculated || amount);
  const remaining = Math.max(0, total - paid);
  return {
    due: remaining,
    period:
      billing.billing_type === "yearly"
        ? `Year ${new Date().getFullYear()}`
        : "Project balance",
    currency,
    amount: remaining,
    expected: total,
    remainingTotal: remaining,
  };
}

function PayPage() {
  const { code } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ payer_name: "", method: "bKash", transaction_ref: "", notes: "" });

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("projects")
        .select("id,name,project_code")
        .eq("pay_code", code.toUpperCase())
        .maybeSingle();
      if (!p) {
        setLoading(false);
        return;
      }
      setProject(p as Project);
      const [b, t] = await Promise.all([
        supabase.from("project_billing").select("*").eq("project_id", (p as Project).id).maybeSingle(),
        supabase.from("transactions").select("id,amount,occurred_at").eq("project_id", (p as Project).id),
      ]);
      setBilling((b.data as Billing | null) ?? null);
      setTxs(((t.data ?? []) as Tx[]));
      setLoading(false);
    })();
  }, [code]);

  const computed = useMemo(() => (billing ? computeDue(billing, txs) : null), [billing, txs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !computed || computed.due <= 0) return;
    if (!form.transaction_ref.trim()) return toast.error("Transaction reference is required");
    if (!form.payer_name.trim()) return toast.error("Your name is required");
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      transaction_ref: form.transaction_ref.trim(),
      amount: computed.due,
      currency: computed.currency,
      occurred_at: new Date().toISOString(),
      method: form.method || null,
      project_id: project.id,
      notes: `Submitted via /pay/${code} for ${computed.period} by ${form.payer_name}${form.notes ? ` — ${form.notes}` : ""}`,
      created_by: "00000000-0000-0000-0000-000000000000",
    } as never);
    setSubmitting(false);
    if (error) {
      toast.error(
        error.message.includes("transactions_ref_unique")
          ? "This reference has already been submitted."
          : "Could not submit. Please contact support.",
      );
      return;
    }
    setDone(true);
  };

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading…</main>;
  }

  if (!project) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Invalid payment link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The code <span className="font-mono">{code}</span> doesn't match any project.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure payment
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {project.project_code} · pay code {code.toUpperCase()}
          </div>

          {!billing ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <h2 className="text-lg font-semibold">No billing configured</h2>
              <p className="mt-1 text-sm text-muted-foreground">Please contact us for payment details.</p>
            </div>
          ) : done ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-foreground" />
              <h2 className="mt-3 text-lg font-semibold">Payment submitted</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We've recorded your payment. Our team will verify it shortly.
              </p>
            </div>
          ) : computed && computed.due <= 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-foreground" />
              <h2 className="mt-3 text-lg font-semibold">No payment due</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You're all caught up. Check back later when your next payment is due.
              </p>
            </div>
          ) : computed ? (
            <>
              <div className="mt-6 rounded-xl bg-muted p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</div>
                <div className="mt-1 text-3xl font-semibold">{formatMoney(computed.due, computed.currency)}</div>
                <p className="mt-2 text-sm text-muted-foreground">for {computed.period}</p>
                {billing.billing_type === "monthly" && computed.remainingTotal !== undefined && computed.remainingTotal > computed.due && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total outstanding across all months: {formatMoney(computed.remainingTotal, computed.currency)}
                  </p>
                )}
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send the amount via your preferred method, then submit your transaction reference below to confirm.
                </p>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Your name *</span>
                  <input
                    value={form.payer_name}
                    onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Payment method</span>
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                  >
                    <option>bKash</option>
                    <option>Nagad</option>
                    <option>Rocket</option>
                    <option>Bank transfer</option>
                    <option>Card</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Transaction reference *</span>
                  <input
                    value={form.transaction_ref}
                    onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })}
                    placeholder="e.g. 8FA2K9JX"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-foreground/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting…"
                    : `Confirm payment of ${formatMoney(computed.due, computed.currency)}`}
                </button>
              </form>
            </>
          ) : null}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Powered by Gatekeepr</p>
      </div>
    </main>
  );
}
