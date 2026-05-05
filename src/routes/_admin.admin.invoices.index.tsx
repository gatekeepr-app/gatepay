import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/admin/format";

export const Route = createFileRoute("/_admin/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InvoicesPage,
});

type Inv = {
  id: string; invoice_number: string; status: string; total: number;
  currency: string; issue_date: string; due_date: string | null;
  client: { name: string } | null;
  project: { name: string; project_code: string } | null;
};

function InvoicesPage() {
  const [items, setItems] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id,invoice_number,status,total,currency,issue_date,due_date,client:clients(name),project:projects(name,project_code)")
        .order("issue_date", { ascending: false });
      setItems((data ?? []) as unknown as Inv[]);
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-eyebrow text-foreground/50">Workspace</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Invoices</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loading ? "Loading…" : `${items.length} total`}</p>
        </div>
        <Link to="/admin/invoices/new" className="rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90">
          + New invoice
        </Link>
      </div>

      <div className="mt-6">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">{loading ? "Loading…" : "No invoices."}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to="/admin/invoices/$invoiceId" params={{ invoiceId: inv.id }} className="hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.project?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.client?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.issue_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{inv.status}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(inv.total, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
