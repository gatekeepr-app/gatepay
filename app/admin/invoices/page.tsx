"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoicesPage() {
  const token = getStoredToken();
  const invoices = useQuery(api.invoices.list, token ? { token } : "skip");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/admin/invoices/new">
          <Button><Plus className="mr-2 h-4 w-4" />New invoice</Button>
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {invoices?.map((inv: any) => (
          <Link
            key={inv._id}
            href={`/admin/invoices/${inv._id}`}
            className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50"
          >
            <div className="font-medium">{inv.invoiceNumber}</div>
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
              <span className={`rounded px-1.5 py-0.5 ${inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-muted"}`}>{inv.status}</span>
              <span>{inv.total} {inv.currency}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
