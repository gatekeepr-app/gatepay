"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const invoice = useQuery(api.invoices.getById, { id: invoiceId as any });
  const lineItems = useQuery(api.invoices.getLineItems, { invoiceId: invoiceId as any });
  const updateInvoice = useMutation(api.invoices.update);
  const deleteInvoice = useMutation(api.invoices.remove);

  if (!invoice) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const markPaid = async () => {
    await updateInvoice({ id: invoiceId as any, status: "paid" });
    toast.success("Marked as paid");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice?")) return;
    await deleteInvoice({ id: invoiceId as any });
    toast.success("Invoice deleted");
  };

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/invoices" className="text-sm text-primary hover:underline">← Back to invoices</Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
          <div className="text-sm text-muted-foreground">{invoice.status}</div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== "paid" && <button onClick={markPaid} className="rounded-full bg-foreground px-4 py-1 text-xs font-medium text-background hover:opacity-90">Mark paid</button>}
          <button onClick={handleDelete} className="rounded-full bg-destructive px-4 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90">Delete</button>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <div><span className="text-muted-foreground">Total:</span> {invoice.total} {invoice.currency}</div>
        <div><span className="text-muted-foreground">Tax:</span> {invoice.taxAmount} ({invoice.taxRate}%)</div>
      </div>
      {lineItems && lineItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium">Line items</h3>
          <div className="mt-2 space-y-1 text-sm">
            {lineItems.map((li) => (
              <div key={li._id} className="flex justify-between rounded border border-border bg-card p-2">
                <span>{li.description}</span>
                <span>{li.quantity} × {li.unitPrice} = {li.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
