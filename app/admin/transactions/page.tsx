"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getStoredToken } from "@/integrations/convex/auth";
import { formatMoney, formatDate } from "@/lib/admin/format";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "reimbursed", label: "Reimbursed" },
  { key: "failed", label: "Failed" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  reimbursed: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.list);
  const counts = useQuery(api.transactions.getStatusCounts);
  const updateStatus = useMutation(api.transactions.updateStatus);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState<string>("");

  const filtered = transactions?.filter(
    (t) => activeTab === "all" || t.status === activeTab,
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (!filtered) return;
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t._id)));
    }
  };

  const handleBatchStatus = async () => {
    if (selected.size === 0 || !batchStatus) return;
    const token = getStoredToken() ?? "";
    let success = 0;
    for (const id of selected) {
      try {
        await updateStatus({
          id: id as any,
          status: batchStatus as any,
          token,
        });
        success++;
      } catch {}
    }
    toast.success(`Updated ${success} transactions to ${batchStatus}`);
    setSelected(new Set());
    setBatchStatus("");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Link
          href="/admin/transactions/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="mr-2 inline h-4 w-4" />New transaction
        </Link>
      </div>

      {/* Status tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
            {counts && tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                {counts[tab.key as keyof typeof counts] ?? 0}
              </span>
            )}
            {tab.key === "all" && counts && (
              <span className="ml-1.5 text-xs opacity-70">{counts.total}</span>
            )}
          </button>
        ))}
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <select
            value={batchStatus}
            onChange={(e) => setBatchStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Set status…</option>
            <option value="verified">Verified</option>
            <option value="reimbursed">Reimbursed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={handleBatchStatus}
            disabled={!batchStatus}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* Transaction list */}
      <div className="mt-4 space-y-2">
        {filtered?.map((tx) => (
          <Link
            key={tx._id}
            href={`/admin/transactions/${tx._id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(tx._id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(tx._id)}
                className="h-4 w-4 rounded border-border"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{tx.transactionRef}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[tx.status] ?? "bg-muted"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {tx.method ?? "—"} &middot; {formatDate(new Date(tx.createdAt))}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium">
              {formatMoney(tx.amount, tx.currency)}
            </div>
          </Link>
        ))}
        {filtered && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {activeTab !== "all" ? activeTab : ""} transactions.
          </p>
        )}
      </div>
    </div>
  );
}
