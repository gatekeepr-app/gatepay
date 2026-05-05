import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Printer, Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/invoices/$invoiceId")({
  head: () => ({ meta: [{ title: "Invoice — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InvoiceDetailPage,
});

type Inv = {
  id: string; invoice_number: string; status: string;
  issue_date: string; due_date: string | null;
  currency: string; subtotal: number; tax_rate: number; tax_amount: number; total: number;
  notes: string | null;
  client: { name: string; email: string | null; business_name: string | null } | null;
  project: { name: string; project_code: string } | null;
};
type LineItem = { id: string; description: string; quantity: number; unit_price: number; amount: number };

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Inv | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [i, l] = await Promise.all([
      supabase.from("invoices").select("*,client:clients(name,email,business_name),project:projects(name,project_code)").eq("id", invoiceId).maybeSingle(),
      supabase.from("invoice_line_items").select("*").eq("invoice_id", invoiceId).order("position"),
    ]);
    setInv(i.data as unknown as Inv | null);
    setLines((l.data ?? []) as LineItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [invoiceId]);

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", invoiceId);
    if (error) return toast.error(error.message);
    setInv((v) => v ? { ...v, status } : v);
    toast.success("Updated");
  };

  const remove = async () => {
    if (!confirm("Delete this invoice?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/admin/invoices" });
  };

  if (loading) return <main className="px-6 py-10">Loading…</main>;
  if (!inv) return <main className="px-6 py-10">Not found.</main>;

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="print:hidden">
        <Link to="/admin/invoices" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to invoices
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{inv.status}</span>
            {["draft","sent","paid","overdue","void"].filter(s => s !== inv.status).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                Mark {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </button>
            <button onClick={remove} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-destructive hover:bg-muted">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto mt-8 max-w-3xl rounded-xl border border-border bg-card p-10 print:mt-0 print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Gatekeepr</div>
            <div className="mt-1 text-xs text-muted-foreground">A company for your success</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</div>
            <div className="font-mono text-lg">{inv.invoice_number}</div>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</div>
            <div className="mt-1 font-medium">{inv.client?.name ?? "—"}</div>
            {inv.client?.business_name && <div className="text-muted-foreground">{inv.client.business_name}</div>}
            {inv.client?.email && <div className="text-muted-foreground">{inv.client.email}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Project</div>
            <div className="mt-1">{inv.project?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{inv.project?.project_code}</div>
            <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Dates</div>
            <div>Issued {formatDate(inv.issue_date)}</div>
            <div>Due {formatDate(inv.due_date)}</div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-border/60">
                <td className="py-3">{l.description}</td>
                <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatMoney(l.unit_price, inv.currency)}</td>
                <td className="py-3 text-right tabular-nums">{formatMoney(l.amount, inv.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(inv.subtotal, inv.currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax ({inv.tax_rate}%)</span><span className="tabular-nums">{formatMoney(inv.tax_amount, inv.currency)}</span></div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-semibold">
            <span>Total</span><span className="tabular-nums">{formatMoney(inv.total, inv.currency)}</span>
          </div>
        </div>

        {inv.notes && (
          <div className="mt-8 rounded-lg bg-muted p-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
            <p className="mt-1 whitespace-pre-wrap">{inv.notes}</p>
          </div>
        )}
      </article>
    </main>
  );
}
