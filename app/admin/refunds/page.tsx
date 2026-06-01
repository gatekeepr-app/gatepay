"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { formatMoney, formatDate } from "@/lib/admin/format";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function RefundsPage() {
  const token = getStoredToken();
  const refunds = useQuery(api.refunds.list, token ? { token } : "skip");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Refunds</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {refunds?.length ?? 0} refund record{refunds?.length !== 1 ? "s" : ""}
      </p>

      {!refunds ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : refunds.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No refunds yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {refunds.map((r: any) => (
            <div key={r._id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatMoney(r.amount, r.currency)}</span>
                    <span className="text-xs text-muted-foreground">via {r.method}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Tx:{" "}
                    <Link href={`/admin/transactions/${r.transactionId}`} className="font-mono text-primary hover:underline">
                      {r.transactionId}
                    </Link>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(new Date(r.createdAt))}
                    {r.receiverName && <> — To: {r.receiverName}{r.receiverNumber ? <> ({r.receiverNumber})</> : ""}</>}
                  </div>
                  {r.gatewayRef && <div className="mt-0.5 text-xs font-mono text-muted-foreground">Gateway ref: {r.gatewayRef}</div>}
                  {r.notes && <div className="mt-0.5 text-xs italic text-muted-foreground">{r.notes}</div>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
