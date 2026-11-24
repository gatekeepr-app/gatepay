"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { ArrowRight, BadgeCheck, FileText, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/admin/format";
import { paymentSubmissionSchema } from "@/lib/validation";

const BKASH_NUMBER = "01790176253";

function monthsBetween(start: Date, now: Date) {
  const s = new Date(start.getFullYear(), start.getMonth(), 1);
  const n = new Date(now.getFullYear(), now.getMonth(), 1);
  if (n < s) return 0;
  return (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth()) + 1;
}

function monthLabel(start: Date, offset: number) {
  return new Date(start.getFullYear(), start.getMonth() + offset, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function PaymentPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const result = useQuery(
    api.invoices.lookupPaymentCode,
    lookupCode ? { code: lookupCode } : "skip",
  );
  const project = result?.kind === "project" ? result.project : null;
  const projectTransactions = useQuery(
    api.transactions.getByProjectPublic,
    project ? { projectId: project.id } : "skip",
  );
  const submitInvoicePayment = useMutation(api.invoices.submitPublicPayment);

  const projectDue = useMemo(() => {
    if (result?.kind !== "project" || !result.billing) return null;
    const billing = result.billing;
    const paid = (projectTransactions ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0);
    if (billing.billingType === "monthly") {
      const start = billing.startDate ? new Date(billing.startDate) : new Date();
      const elapsed = Math.min(monthsBetween(start, new Date()), billing.monthsCount ?? Infinity);
      const expected = billing.amount * elapsed;
      const remaining = Math.max(0, expected - paid);
      const paidMonths = Math.min(elapsed, Math.floor(paid / billing.amount));
      return {
        amount: remaining > 0 ? billing.amount : 0,
        currency: billing.currency,
        period: monthLabel(start, paidMonths),
      };
    }
    return {
      amount: Math.max(0, billing.totalCalculated - paid),
      currency: billing.currency,
      period: billing.billingType === "yearly" ? `Year ${new Date().getFullYear()}` : "Project balance",
    };
  }, [result, projectTransactions]);

  const lookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = input.trim().toUpperCase();
    if (!code) return;
    setShowPayment(false);
    setSubmitted(false);
    setPayerName("");
    setTransactionRef("");
    setLookupCode(code);
  };

  const payInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (result?.kind !== "invoice") return;
    const parsed = paymentSubmissionSchema.safeParse({
      payer_name: payerName,
      transaction_ref: transactionRef,
      method: "bKash",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your payment details.");
      return;
    }

    setSubmitting(true);
    try {
      await submitInvoicePayment({
        invoiceId: result.invoice.id as Id<"invoices">,
        transactionRef: parsed.data.transaction_ref,
        payerName: parsed.data.payer_name,
      });
      setSubmitted(true);
      toast.success("Payment submitted for verification");
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
      toast.error(message.includes("duplicate_ref") ? "That bKash transaction ID has already been submitted." : "Could not submit this payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const invoicePayable = result?.kind === "invoice" && (result.invoice.status === "sent" || result.invoice.status === "overdue");
  const canPayProject = result?.kind === "project" && !!result.project.payCode && !!projectDue && projectDue.amount > 0;

  return (
    <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 text-[#171717] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold tracking-tight">GatePay</a>
          <div className="flex items-center gap-2 text-xs font-medium text-[#666]">
            <LockKeyhole className="h-3.5 w-3.5" /> Secure checkout
          </div>
        </header>

        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#797970]">Client payment portal</p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">A clear way to settle up.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6d6d67] sm:text-base">
            Enter the employee, project, or invoice code to see the amount due and payment instructions.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-2xl border border-[#e5e5e0] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2f2ef]"><Search className="h-4 w-4" /></div>
              <div>
                <h2 className="text-base font-semibold">Find your payment</h2>
                <p className="text-xs text-[#777]">Use the invoice reference or project code</p>
              </div>
            </div>
            <form onSubmit={lookup} className="mt-7">
              <label htmlFor="payment-code" className="mb-2 block text-xs font-medium text-[#555]">Invoice or project code</label>
              <div className="flex gap-2">
                <input
                  id="payment-code"
                  value={input}
                  onChange={(event) => setInput(event.target.value.toUpperCase())}
                  placeholder="e.g. TLS-26SP03-AA1"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-[#deded8] bg-white px-3.5 py-3 font-mono text-sm uppercase outline-none transition focus:border-[#20201c] focus:ring-2 focus:ring-[#20201c]/10"
                />
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#1d1d1a] px-4 text-sm font-medium text-white transition hover:bg-[#373732] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1a] focus-visible:ring-offset-2">
                  Find <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-[#85857d]">Invoice references and project codes are both accepted.</p>
            </form>

            <div className="mt-8 border-t border-[#ededeb] pt-6">
              <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-[#4f725f]" /> Payment you can track</div>
              <p className="mt-2 text-xs leading-5 text-[#777]">Your bKash reference is attached to this invoice and sent for verification.</p>
            </div>
          </section>

          <section aria-live="polite" className="min-h-[340px] rounded-2xl border border-[#e5e5e0] bg-white p-6 sm:p-8">
            {!lookupCode ? (
              <div className="grid min-h-[280px] place-items-center text-center">
                <div className="max-w-xs">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f3f3f0]"><FileText className="h-5 w-5 text-[#666]" /></div>
                  <h2 className="mt-4 text-base font-semibold">Your payment details will appear here</h2>
                  <p className="mt-2 text-sm leading-6 text-[#777]">Enter a code to view the invoice, amount due, and bKash payment options.</p>
                </div>
              </div>
            ) : result === undefined ? (
              <div className="grid min-h-[280px] place-items-center text-sm text-[#777]" role="status">Looking up your code…</div>
            ) : result === null ? (
              <div className="grid min-h-[280px] place-items-center text-center">
                <div><h2 className="text-base font-semibold">We couldn&apos;t find that code</h2><p className="mt-2 text-sm text-[#777]">Check the code on your invoice and try again.</p></div>
              </div>
            ) : result.kind === "project" ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-medium uppercase tracking-wider text-[#7a7a72]">Project payment</p><h2 className="mt-2 text-xl font-semibold">{result.project.name}</h2><p className="mt-1 font-mono text-xs text-[#777]">{result.project.projectCode}</p></div>
                  <span className="rounded-full bg-[#f2f2ef] px-3 py-1 text-[11px] font-medium text-[#666]">{result.billing?.billingType ?? "No billing"}</span>
                </div>
                {!result.billing ? (
                  <div className="mt-8 rounded-xl bg-[#f7f7f5] p-5 text-sm text-[#666]">There is no active payment setup for this code. Please contact the project owner.</div>
                ) : !projectTransactions ? (
                  <div className="mt-8 h-24 animate-pulse rounded-xl bg-[#f3f3f0]" aria-label="Loading amount due" />
                ) : projectDue && projectDue.amount > 0 ? (
                  <>
                    <div className="mt-8 border-y border-[#ededeb] py-6"><p className="text-xs text-[#777]">Amount due · {projectDue.period}</p><p className="mt-1 text-4xl font-semibold tracking-tight">{formatMoney(projectDue.amount, projectDue.currency)}</p></div>
                    <button type="button" disabled={!canPayProject} onClick={() => result.project.payCode && router.push(`/pay/${result.project.payCode}`)} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d91f62] text-sm font-semibold text-white transition hover:bg-[#bd1b55] disabled:cursor-not-allowed disabled:opacity-50">
                      Continue to bKash <ArrowRight className="h-4 w-4" />
                    </button>
                    {!result.project.payCode && <p className="mt-2 text-center text-xs text-[#777]">Contact the project owner to get a payment link.</p>}
                  </>
                ) : (
                  <div className="mt-8 rounded-xl bg-[#f7f7f5] p-5 text-center"><BadgeCheck className="mx-auto h-6 w-6 text-[#4f725f]" /><h3 className="mt-2 font-medium">No payment due</h3><p className="mt-1 text-sm text-[#777]">This project is up to date.</p></div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-medium uppercase tracking-wider text-[#7a7a72]">Invoice payment</p><h2 className="mt-2 text-xl font-semibold">{result.invoice.invoiceNumber}</h2>{result.project && <p className="mt-1 text-sm text-[#777]">{result.project.name}</p>}</div>
                  <span className="rounded-full bg-[#f2f2ef] px-3 py-1 text-[11px] font-medium capitalize text-[#666]">{result.invoice.status}</span>
                </div>
                {invoicePayable && <div className="mt-6 space-y-3 border-b border-[#ededeb] pb-5">
                  {result.lineItems.map((item, index) => <div key={`${item.description}-${index}`} className="flex justify-between gap-4 text-sm"><span className="text-[#666]">{item.description}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span><span className="font-medium">{formatMoney(item.amount, result.invoice.currency)}</span></div>)}
                </div>}
                {invoicePayable && <div className="flex items-baseline justify-between py-5"><span className="text-sm text-[#666]">Total due</span><span className="text-3xl font-semibold tracking-tight">{formatMoney(result.invoice.total, result.invoice.currency)}</span></div>}
                {submitted ? (
                  <div className="rounded-xl bg-[#f1f5f2] p-5 text-sm"><div className="flex items-center gap-2 font-semibold"><BadgeCheck className="h-4 w-4 text-[#4f725f]" /> Payment received</div><p className="mt-1 text-[#666]">Your bKash transaction ID has been submitted for verification.</p></div>
                ) : !invoicePayable ? (
                  <div className="rounded-xl bg-[#f7f7f5] p-5 text-sm text-[#666]">{result.invoice.status === "paid" ? "This invoice has already been paid." : result.invoice.status === "void" ? "This invoice is inactive and cannot accept payments." : "This invoice is still a draft and is not accepting payments."}</div>
                ) : !showPayment ? (
                  <button type="button" onClick={() => setShowPayment(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d91f62] text-sm font-semibold text-white transition hover:bg-[#bd1b55]">Pay with bKash <ArrowRight className="h-4 w-4" /></button>
                ) : (
                  <form onSubmit={payInvoice} className="rounded-xl bg-[#f7f7f5] p-4 sm:p-5">
                    <p className="text-sm font-semibold">Send payment to bKash</p>
                    <p className="mt-1 text-xs leading-5 text-[#666]">Make a payment of <strong>{formatMoney(result.invoice.total, result.invoice.currency)}</strong> to <span className="font-mono font-semibold">{BKASH_NUMBER}</span>, then enter the transaction ID below.</p>
                    <label className="mt-4 block text-xs font-medium">Your name<input value={payerName} onChange={(event) => setPayerName(event.target.value)} required maxLength={100} className="mt-1.5 h-10 w-full rounded-lg border border-[#deded8] bg-white px-3 text-sm outline-none focus:border-[#20201c]" /></label>
                    <label className="mt-3 block text-xs font-medium">bKash transaction ID<input value={transactionRef} onChange={(event) => setTransactionRef(event.target.value)} required maxLength={64} className="mt-1.5 h-10 w-full rounded-lg border border-[#deded8] bg-white px-3 font-mono text-sm outline-none focus:border-[#20201c]" /></label>
                    <button type="submit" disabled={submitting} className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-[#1d1d1a] text-sm font-medium text-white hover:bg-[#373732] disabled:opacity-60">{submitting ? "Submitting…" : "I’ve completed the payment"}</button>
                  </form>
                )}
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#85857d]"><LockKeyhole className="h-3 w-3" /> Transaction is recorded as pending until verified</p>
              </div>
            )}
          </section>
        </div>
        <footer className="mt-8 text-center text-xs text-[#85857d]">Payments secured and tracked by GatePay</footer>
      </div>
    </main>
  );
}
