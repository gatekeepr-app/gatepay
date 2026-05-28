"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { ArrowLeft, Copy, CheckCircle2, Clock, FileText, ExternalLink } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { getStoredToken } from "@/integrations/convex/auth";

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
  const invoice = useQuery(
    api.invoices.getById,
    tx?.invoiceId ? { id: tx.invoiceId } : "skip",
  );
  const project = useQuery(
    api.projects.getById,
    tx?.projectId ? { id: tx.projectId } : "skip",
  );
  const deleteTx = useMutation(api.transactions.remove);
  const triggerVerify = useMutation(api.public.triggerVerifyBatch);
  const [verifying, setVerifying] = useState(false);

  if (!tx) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return;
    await deleteTx({ id: id as any });
    toast.success("Transaction deleted");
  };

  const handleTriggerVerify = async () => {
    setVerifying(true);
    try {
      const result = await triggerVerify({ ids: [id as any], token: getStoredToken() ?? "" });
      if (result.groups?.[0]?.status === "delivered") {
        toast.success("Verified via callback");
      } else {
        toast.info(`Result: ${result.groups?.[0]?.status ?? "no_callback"}`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Verify failed");
    }
    setVerifying(false);
  };

  const payerName = tx.notes?.match(/by (.+?)(?:\(|$)/)?.[1] ?? "—";
  const period = tx.notes?.match(/for (.+?) by/)?.[1] ?? "—";
  const isVerified = !!tx.verifiedAt;

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/transactions" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to transactions
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tx.transactionRef}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {isVerified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {isVerified ? "Verified" : "Pending"}
            </span>
            {tx.method && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{tx.method}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isVerified && (
            <button onClick={handleTriggerVerify} disabled={verifying} className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {verifying ? "Verifying…" : "Verify"}
            </button>
          )}
          <button onClick={handleDelete} className="rounded-full bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90">Delete</button>
        </div>
      </div>

      {/* Amount */}
      <div className="mt-6 rounded-xl bg-muted p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount</div>
        <div className="mt-1 text-3xl font-semibold">{formatMoney(tx.amount, tx.currency)}</div>
      </div>

      {/* Receiving data */}
      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment details</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Payer name">{payerName}</Field>
          <Field label="Payment method">{tx.method ?? "—"}</Field>
          <Field label="Period">{period}</Field>
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

      {/* Verification */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Verification</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Status">
            {isVerified ? (
              <span className="text-green-600 font-medium">Verified</span>
            ) : (
              <span className="text-yellow-600 font-medium">Unverified</span>
            )}
          </Field>
          {tx.verifiedAt && <Field label="Verified at">{formatDate(new Date(tx.verifiedAt))}</Field>}
          {tx.verifiedExternalName && <Field label="Verified by">{tx.verifiedExternalName}</Field>}
          {tx.verifiedSource && <Field label="Source">{tx.verifiedSource}</Field>}
          {tx.idempotencyKey && (
            <Field label="Idempotency key">
              <span className="font-mono text-xs">{tx.idempotencyKey}</span>
            </Field>
          )}
        </div>
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
    </div>
  );
}
