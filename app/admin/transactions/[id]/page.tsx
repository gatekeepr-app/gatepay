"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, FileText, ExternalLink, RotateCcw } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { getStoredToken } from "@/integrations/convex/auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  reimbursed: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  verified: CheckCircle2,
  reimbursed: RotateCcw,
  failed: Clock,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tx = useQuery(api.transactions.getById, { id: id as any });
  const history = useQuery(api.transactions.getHistory, { transactionId: id as any });
  const invoice = useQuery(
    api.invoices.getById,
    tx?.invoiceId ? { id: tx.invoiceId } : "skip",
  );
  const project = useQuery(
    api.projects.getById,
    tx?.projectId ? { id: tx.projectId } : "skip",
  );
  const updateStatus = useMutation(api.transactions.updateStatus);
  const reimburse = useMutation(api.transactions.reimburse);
  const deleteTx = useMutation(api.transactions.remove);
  const refunds = useQuery(api.refunds.getByTransaction, { transactionId: id as any });
  const initiateRefund = useMutation(api.refunds.initiateRefund);
  const [reimbOpen, setReimbOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: 0, method: "bank_transfer", notes: "" });
  const [reimbForm, setReimbForm] = useState({ amount: 0, method: "bank_transfer", reimbursementRef: "", notes: "" });

  if (!tx) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        id: id as any,
        status: newStatus as any,
        token: getStoredToken() ?? "",
      });
      toast.success(`Status changed to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const handleReimburse = async () => {
    if (reimbForm.amount <= 0) { toast.error("Amount must be > 0"); return; }
    try {
      await reimburse({
        id: id as any,
        amount: reimbForm.amount,
        method: reimbForm.method,
        reimbursementRef: reimbForm.reimbursementRef || undefined,
        notes: reimbForm.notes || undefined,
        token: getStoredToken() ?? "",
      });
      toast.success("Payment reimbursed");
      setReimbOpen(false);
      setReimbForm({ amount: 0, method: "bank_transfer", reimbursementRef: "", notes: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    await deleteTx({ id: id as any });
    toast.success("Transaction deleted");
  };

  const handleInitiateRefund = async () => {
    if (refundForm.amount <= 0) { toast.error("Amount must be > 0"); return; }
    try {
      await initiateRefund({
        transactionId: id as any,
        amount: refundForm.amount,
        method: refundForm.method,
        notes: refundForm.notes || undefined,
        token: getStoredToken() ?? "",
      });
      toast.success("Refund initiated");
      setRefundOpen(false);
      setRefundForm({ amount: 0, method: "bank_transfer", notes: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initiate refund");
    }
  };

  const payerName = tx.notes?.match(/by (.+?)(?:\(|$)/)?.[1] ?? "—";
  const period = tx.notes?.match(/for (.+?) by/)?.[1] ?? "";
  const StatusIcon = STATUS_ICONS[tx.status ?? "pending"] ?? Clock;

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/transactions" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to transactions
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tx.transactionRef}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[tx.status ?? "pending"] ?? "bg-muted"}`}>
              <StatusIcon className="h-3 w-3" />
              {tx.status ?? "pending"}
            </span>
            {tx.method && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{tx.method}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="rounded-full bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90">Delete</button>
        </div>
      </div>

      {/* Amount */}
      <div className="mt-6 rounded-xl bg-muted p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount</div>
        <div className="mt-1 text-3xl font-semibold">{formatMoney(tx.amount, tx.currency)}</div>
      </div>

      {/* Status change */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["pending", "verified", "reimbursed", "failed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={(tx.status ?? "pending") === s || ((tx.status ?? "pending") === "reimbursed" && s !== "reimbursed")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                (tx.status ?? "pending") === s
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              } disabled:opacity-40`}
            >
              {s}
            </button>
          ))}
        </div>
        {(tx.status ?? "pending") === "verified" && (
          <button
            onClick={() => {
              setReimbForm({ ...reimbForm, amount: tx.amount });
              setReimbOpen(true);
            }}
            className="mt-3 rounded-full bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Reimburse this payment
          </button>
        )}
      </section>

      {/* Reimbursement form */}
      {reimbOpen && (
        <section className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-800 dark:bg-purple-950/30">
          <h2 className="text-sm font-semibold">Reimburse Payment</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Send the accumulated payment value back to the client.
          </p>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount *</span>
              <input
                type="number"
                value={reimbForm.amount}
                onChange={(e) => setReimbForm({ ...reimbForm, amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Method *</span>
              <select
                value={reimbForm.method}
                onChange={(e) => setReimbForm({ ...reimbForm, method: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">External reference</span>
              <input
                value={reimbForm.reimbursementRef}
                onChange={(e) => setReimbForm({ ...reimbForm, reimbursementRef: e.target.value })}
                placeholder="e.g. REF-98234"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
              <textarea
                value={reimbForm.notes}
                onChange={(e) => setReimbForm({ ...reimbForm, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <div className="flex gap-2">
              <button onClick={handleReimburse} className="rounded-full bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:opacity-90">
                Confirm Reimbursement
              </button>
              <button onClick={() => setReimbOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Reimbursement info */}
      {(tx.status ?? "pending") === "reimbursed" && (
        <section className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-800 dark:bg-purple-950/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">Reimbursement Details</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Reimbursed at">{formatDate(new Date(tx.reimbursedAt ?? tx.updatedAt))}</Field>
            <Field label="Amount">{tx.reimbursementAmount ? formatMoney(tx.reimbursementAmount, tx.currency) : "—"}</Field>
            <Field label="Method">{tx.reimbursementMethod ?? "—"}</Field>
            <Field label="Reference">{tx.reimbursementRef ?? "—"}</Field>
          </div>
        </section>
      )}

      {/* Receiving data */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment details</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Payer name">{payerName}</Field>
          <Field label="Payment method">{tx.method ?? "—"}</Field>
          {period && <Field label="Period">{period}</Field>}
          <Field label="Currency">{tx.currency}</Field>
        </div>
      </section>

      {/* Transaction info */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Transaction info</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Submitted">{formatDate(new Date(tx.createdAt))}</Field>
          <Field label="Occurred">{formatDate(new Date(tx.occurredAt))}</Field>
          <Field label="Last updated">{formatDate(new Date(tx.updatedAt))}</Field>
          <Field label="Created by">{tx.createdBy === "00000000-0000-0000-0000-000000000001" ? "Pay link" : tx.createdBy}</Field>
        </div>
        {tx.notes && (
          <div className="mt-4">
            <Field label="Notes">
              <span className="text-muted-foreground">{tx.notes}</span>
            </Field>
          </div>
        )}
      </section>

      {/* Linked records */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Linked records</h2>
        <div className="mt-4 space-y-2">
          {project ? (
            <Link href={`/admin/projects/${project._id}`} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{project.name} <span className="text-muted-foreground">({project.projectCode})</span></span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">No project linked</div>
          )}
          {invoice ? (
            <Link href={`/admin/invoices/${invoice._id}`} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{invoice.invoiceNumber} <span className="text-muted-foreground">({invoice.status})</span></span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">No invoice linked</div>
          )}
        </div>
      </section>

      {/* Refunds */}
      {(tx.status ?? "pending") === "verified" && (
        <section className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Refunds</h2>
            <button
              onClick={() => {
                setRefundForm({ ...refundForm, amount: tx.amount });
                setRefundOpen(true);
              }}
              className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Initiate Refund
            </button>
          </div>
          {refunds && refunds.length > 0 ? (
            <div className="mt-4 space-y-3">
              {refunds.map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">{formatMoney(r.amount, r.currency)} via {r.method}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(new Date(r.createdAt))} — {r.status}</div>
                    {r.gatewayRef && <div className="text-xs text-muted-foreground font-mono">{r.gatewayRef}</div>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "completed" ? "bg-green-100 text-green-700" :
                    r.status === "failed" ? "bg-red-100 text-red-700" :
                    r.status === "cancelled" ? "bg-gray-100 text-gray-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No refunds initiated.</p>
          )}
        </section>
      )}

      {/* Refund form */}
      {refundOpen && (
        <section className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/30">
          <h2 className="text-sm font-semibold">Initiate Refund</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Process a refund through the payment gateway (SSLCommerz).
          </p>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Refund amount *</span>
              <input
                type="number"
                value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Gateway</span>
              <select
                value={refundForm.method}
                onChange={(e) => setRefundForm({ ...refundForm, method: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
              <textarea
                value={refundForm.notes}
                onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <div className="flex gap-2">
              <button onClick={handleInitiateRefund} className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:opacity-90">
                Process Refund
              </button>
              <button onClick={() => setRefundOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Status history */}
      {history && history.length > 0 && (
        <section className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status History</h2>
          <div className="mt-4 space-y-3">
            {history.map((h) => (
              <div key={h._id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[h.fromStatus] ?? "bg-muted"}`}>
                      {h.fromStatus}
                    </span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[h.toStatus] ?? "bg-muted"}`}>
                      {h.toStatus}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(new Date(h.changedAt))} by {h.changedBy}
                  </div>
                  {h.notes && <div className="mt-0.5 text-xs text-muted-foreground">{h.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
