"use client";

import { use, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";
import { payCodeSchema, paymentSubmissionSchema } from "@/lib/validation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import gatepayLogo from "@/assets/gatepay-logo.png";
import bkashPayment from "@/assets/bkash-payment.jpg";

const BKASH_NUMBER = "01790176253";

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

export default function PayCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submittedAmount, setSubmittedAmount] = useState<{ amount: number; currency: string } | null>(null);
  const [form, setForm] = useState({ payer_name: "", transaction_ref: "", notes: "" });
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const parsedCode = payCodeSchema.safeParse(code);
  const validCode = parsedCode.success ? parsedCode.data : null;

  const project = useQuery(api.projects.getByPayCode, validCode ? { payCode: validCode } : "skip");
  const billing = useQuery(
    api.billing.getByProject,
    project ? { projectId: project._id } : "skip",
  );
  const txs = useQuery(
    api.transactions.getByProjectPublic,
    project ? { projectId: project._id } : "skip",
  );

  const submitPay = useMutation(api.transactions.submitPayPayment);

  const computed = useMemo(
    () => (billing ? computeDue(billing, txs ?? []) : null),
    [billing, txs],
  );

  const monthOptions = useMemo(() => {
    if (!billing || billing.billingType !== "monthly") return [];
    const start = billing.startDate ? new Date(billing.startDate) : new Date();
    const totalMonths = billing.monthsCount;
    const paidMonths = computed?.paidMonths ?? 0;
    if (totalMonths === undefined) {
      const now = new Date();
      const elapsed = monthsBetween(start, now);
      return Array.from({ length: elapsed }, (_, i) => ({ index: i, label: monthLabel(start, i), paid: i < paidMonths }));
    }
    return Array.from({ length: totalMonths }, (_, i) => ({ index: i, label: monthLabel(start, i), paid: i < paidMonths }));
  }, [billing, computed]);

  const allMonthsPaid = monthOptions.length > 0 && monthOptions.every(m => m.paid);
  const showNoPaymentDue = computed && (
    billing?.billingType === "monthly" ? allMonthsPaid : computed.due <= 0
  );

  const activeMonth = selectedMonth !== null ? monthOptions[selectedMonth] ?? null : null;
  const fallbackMonth = monthOptions.find((m) => !m.paid) ?? monthOptions[0] ?? null;
  const resolvedMonth = activeMonth ?? fallbackMonth;
  const activePeriod = resolvedMonth?.label ?? computed?.period ?? "";
  const activeAmount = resolvedMonth !== null ? (billing?.amount ?? 0) : computed?.due ?? 0;

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
            The code <span className="font-mono">{code}</span> doesn&apos;t match any project.
          </p>
        </div>
      </main>
    );
  }

  if (!project || !txs) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!computed || showNoPaymentDue) return;
    if (activeAmount <= 0) return;
    const parsed = paymentSubmissionSchema.safeParse({ ...form, method: "bKash" });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }
    setSubmitting(true);
    try {
      await submitPay({
        transactionRef: parsed.data.transaction_ref,
        amount: activeAmount,
        currency: computed.currency,
        method: "bKash",
        projectId: project._id,
        clientId: project.clientId ?? undefined,
        periodLabel: activePeriod,
        payerName: parsed.data.payer_name,
        notes: parsed.data.notes,
        createdBy: "00000000-0000-0000-0000-000000000001",
      });
      setSubmittedRef(parsed.data.transaction_ref);
      setSubmittedAmount({ amount: activeAmount, currency: computed.currency });
      setDone(true);
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      toast.error(
        msg.includes("duplicate") || msg.includes("already been submitted")
          ? "This reference has already been submitted."
          : msg || "Could not submit. Please contact support.",
      );
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        {/* Left: bKash instructions with image */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Pay with bKash</h2>
          <div className="mt-4 overflow-hidden rounded-xl">
            <img src={bkashPayment.src} alt="bKash payment instructions" className="w-full object-contain" />
          </div>
          <div className="mt-4 rounded-lg bg-muted px-4 py-3 text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">bKash number</div>
            <div className="mt-1 font-mono text-lg font-semibold">{BKASH_NUMBER}</div>
          </div>
          <div className="mt-6">
            <div className="text-sm font-medium">Instructions to pay</div>
            <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>1. Open the bKash app</li>
              <li>2. Tap &quot;Make Payment&quot;</li>
              <li>3. Type the number: <span className="font-mono text-foreground">{BKASH_NUMBER}</span></li>
              <li>4. Complete the payment</li>
              <li>5. Copy the Transaction ID and submit it on the right</li>
            </ol>
          </div>
        </div>

        {/* Right: confirmation form */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <img src={gatepayLogo.src} alt="GatePay" className="h-[1.4rem] w-auto" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure payment
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {project.projectCode} · pay code {code.toUpperCase()}
          </div>

          {!billing ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <h2 className="text-lg font-semibold">No billing configured</h2>
              <p className="mt-1 text-sm text-muted-foreground">Please contact us for payment details.</p>
            </div>
          ) : done ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-border bg-background p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-foreground" />
                <h2 className="mt-3 text-lg font-semibold">Payment submitted</h2>
                {submittedAmount && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatMoney(submittedAmount.amount, submittedAmount.currency)} recorded for verification.
                  </p>
                )}
              </div>

              {submittedRef && (
                <div className="rounded-xl bg-muted p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Transaction ID</div>
                  <div className="mt-1 break-all font-mono text-sm font-semibold">{submittedRef}</div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(submittedRef);
                      toast.success("Transaction ID copied");
                    }}
                    className="mt-2 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    Copy
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="text-sm font-medium">What happens next</div>
                <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>1. Our team verifies your Transaction ID against bKash records.</li>
                  <li>2. You&apos;ll be notified once it&apos;s confirmed (usually within a few hours).</li>
                  <li>3. Keep your Transaction ID handy in case we need to follow up.</li>
                </ol>
              </div>
            </div>
          ) : showNoPaymentDue ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-foreground" />
              <h2 className="mt-3 text-lg font-semibold">No payment due</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re all caught up. Check back later when your next payment is due.
              </p>
            </div>
          ) : computed ? (
            <>
              <div className="mt-6 rounded-xl bg-muted p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</div>
                <div className="mt-1 text-3xl font-semibold">{formatMoney(activeAmount, computed.currency)}</div>
                <p className="mt-2 text-sm text-muted-foreground">for {activePeriod}</p>
                {billing.billingType === "monthly" && billing.monthsCount && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Project: {monthLabel(billing.startDate ? new Date(billing.startDate) : new Date(), 0)} – {monthLabel(billing.startDate ? new Date(billing.startDate) : new Date(), billing.monthsCount - 1)} · {billing.monthsCount} months · {formatMoney(Number(billing.amount) * billing.monthsCount, computed.currency)} total
                  </p>
                )}
              </div>

              {billing.billingType === "monthly" && monthOptions.length > 0 && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pay for month</label>
                  <Select
                    value={String(resolvedMonth.index)}
                    onValueChange={(v) => setSelectedMonth(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => (
                        <SelectItem key={m.index} value={String(m.index)} disabled={m.paid}>
                          {m.label}{m.paid ? " (Paid)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  After paying via bKash, submit your Transaction ID below to confirm.
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
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">bKash Transaction ID *</span>
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
                    : `Confirm payment of ${formatMoney(activeAmount, computed.currency)}`}
                </button>
              </form>
            </>
          ) : null}
          <p className="mt-4 text-center text-xs text-muted-foreground">Powered by GatePay</p>
        </div>
      </div>

      {/* Payment History */}
      {txs && txs.length > 0 && (
        <div className="mx-auto mt-8 max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your recent transactions for this project.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Reference</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.slice(0, 10).map((tx: any) => (
                    <tr key={tx._id} className="border-b border-border/50">
                      <td className="py-3 pr-4 text-muted-foreground">{new Date(tx.occurredAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4 font-mono text-xs font-medium">{tx.transactionRef}</td>
                      <td className="py-3 pr-4 font-medium">{formatMoney(tx.amount, tx.currency)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.status === "verified" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          tx.status === "reimbursed" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          tx.status === "failed" ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {tx.status === "verified" ? "Verified" :
                           tx.status === "reimbursed" ? "Reimbursed" :
                           tx.status === "failed" ? "Failed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
