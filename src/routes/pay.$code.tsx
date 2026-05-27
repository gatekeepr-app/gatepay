import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";
import { payCodeSchema, paymentSubmissionSchema } from "@/lib/validation";

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

function computeDue(billing: any, txs: any[]) {
  const paid = txs.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const amount = Number(billing.amount);
  const currency = billing.currency;

  if (billing.billingType === "monthly") {
    const start = billing.startDate ? new Date(billing.startDate) : new Date();
    const totalMonths = billing.monthsCount ?? Infinity;
    const now = new Date();
    const elapsed = Math.min(monthsBetween(start, now), totalMonths);
    if (elapsed <= 0) {
      return { due: 0, period: monthLabel(start, 0), currency, amount, paidMonths: 0, expected: 0 };
    }
    const expectedToDate = amount * elapsed;
    const remaining = Math.max(0, expectedToDate - paid);
    const paidMonths = Math.min(elapsed, Math.floor(paid / amount));
    const dueMonthIndex = paidMonths;
    return {
      due: remaining > 0 ? amount : 0,
      period: monthLabel(start, dueMonthIndex),
      currency,
      amount,
      paidMonths,
      expected: expectedToDate,
      remainingTotal: remaining,
    };
  }

  const total = Number(billing.totalCalculated || amount);
  const remaining = Math.max(0, total - paid);
  return {
    due: remaining,
    period: billing.billingType === "yearly" ? `Year ${new Date().getFullYear()}` : "Project balance",
    currency,
    amount: remaining,
    expected: total,
    remainingTotal: remaining,
  };
}

function PayPage() {
  const { code } = Route.useParams();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ payer_name: "", method: "bKash", transaction_ref: "", notes: "" });

  const parsedCode = payCodeSchema.safeParse(code);
  const validCode = parsedCode.success ? parsedCode.data : null;

  const project = useQuery(api.projects.getByPayCode, validCode ? { payCode: validCode } : "skip");
  const billing = useQuery(
    api.billing.getByProject,
    project ? { projectId: project._id } : "skip",
  );
  const txs = useQuery(
    api.transactions.getByProject,
    project ? { projectId: project._id } : "skip",
  );

  const createTransaction = useMutation(api.transactions.create);

  const computed = useMemo(
    () => (billing && txs ? computeDue(billing, txs) : null),
    [billing, txs],
  );

  if (!validCode) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Invalid payment link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The code <span className="font-mono">{code}</span> is invalid.
          </p>
        </div>
      </main>
    );
  }

  if (!project && project !== undefined) {
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

  if (!project || !billing || !txs) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!computed || computed.due <= 0) return;
    const parsed = paymentSubmissionSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction({
        transactionRef: parsed.data.transaction_ref,
        amount: computed.due,
        currency: computed.currency,
        projectId: project._id,
        notes: `Submitted via /pay/${code.toUpperCase()} for ${computed.period} by ${parsed.data.payer_name}${parsed.data.notes ? ` — ${parsed.data.notes}` : ""}`,
        createdBy: "00000000-0000-0000-0000-000000000001",
      });
      setDone(true);
    } catch (err: any) {
      toast.error(
        err?.message?.includes("duplicate")
          ? "This reference has already been submitted."
          : "Could not submit. Please contact support.",
      );
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure payment
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {project.projectCode} · pay code {code.toUpperCase()}
          </div>

          {done ? (
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
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send the amount via your preferred method, then submit your transaction reference below.
                </p>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Your name *</span>
                  <input
                    value={form.payer_name}
                    maxLength={100}
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
                    maxLength={64}
                    pattern="[A-Za-z0-9_\-]+"
                    onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })}
                    placeholder="e.g. 8FA2K9JX"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-foreground/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</span>
                  <textarea
                    value={form.notes}
                    maxLength={500}
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
