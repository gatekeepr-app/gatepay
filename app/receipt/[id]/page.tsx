"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { formatMoney } from "@/lib/admin/format";
import { Printer, Download } from "lucide-react";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tx = useQuery(api.transactions.getByIdPublic, { id: id as any });
  const [printing, setPrinting] = useState(false);

  if (!tx) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 print:bg-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {printing ? "Printing…" : "Print Receipt"}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm print:shadow-none print:border-0">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-semibold">Payment Receipt</h1>
              <p className="mt-1 text-sm text-muted-foreground">GatePay — Payment Verification</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Receipt</div>
              <div className="mt-1 font-mono text-sm font-semibold">{tx.transactionRef.toUpperCase()}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {tx.status?.toUpperCase() ?? "PENDING"}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Transaction Reference</div>
              <div className="mt-1 font-mono text-sm font-semibold">{tx.transactionRef}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount</div>
              <div className="mt-1 text-lg font-semibold">{formatMoney(tx.amount, tx.currency)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Payment Method</div>
              <div className="mt-1 text-sm">{tx.method ?? "N/A"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Date</div>
              <div className="mt-1 text-sm">{new Date(tx.occurredAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Verified At</div>
              <div className="mt-1 text-sm">{tx.verifiedAt ? new Date(tx.verifiedAt).toLocaleDateString() : "Pending"}</div>
            </div>
          </div>

          {tx.notes && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
              <div className="mt-1 text-sm">{tx.notes}</div>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            This receipt confirms that your payment has been recorded and verified by GatePay.
            <br />
            For questions, contact support with your transaction reference: <strong>{tx.transactionRef.toUpperCase()}</strong>
          </div>
        </div>
      </div>
    </main>
  );
}
