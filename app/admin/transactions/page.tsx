"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStoredToken } from "@/integrations/convex/auth";

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.list);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const triggerVerify = useMutation(api.public.triggerVerifyBatch);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleVerify = async () => {
    if (selected.size === 0) return;
    try {
      const result = await triggerVerify({ ids: Array.from(selected) as any, token: getStoredToken() ?? "" });
      toast.success(`Verified ${result.groups.filter((g: any) => g.status === "delivered").length} groups`);
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err?.message ?? "Verification failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <Button onClick={handleVerify} disabled={selected.size === 0}>Verify selected</Button>
          <Link href="/admin/transactions/new">
            <Button><Plus className="mr-2 h-4 w-4" />New</Button>
          </Link>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3">TrxID</th>
              <th className="px-4 py-3">Date-Time</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="w-28 px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((tx) => (
              <Link
                key={tx._id}
                href={`/admin/transactions/${tx._id}`}
                className="contents"
              >
                <tr className="border-b border-border hover:bg-muted/50 cursor-pointer">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(tx._id)} onChange={() => toggle(tx._id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{tx.transactionRef}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(tx.occurredAt ?? tx._creationTime).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">{tx.verifiedExternalName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{tx.amount.toLocaleString()} {tx.currency}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.verifiedAt
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {tx.verifiedAt ? "Verified" : "Unverified"}
                    </span>
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
