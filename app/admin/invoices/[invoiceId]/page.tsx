"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CalendarDays, Check, Clock3, FileText, Layers, Pencil, Trash2 } from "lucide-react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge, type InvoiceStatus } from "@/components/admin/invoice-status-badge";
import { toast } from "sonner";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

const formatDate = (timestamp?: number) =>
  timestamp
    ? new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "long", year: "numeric" }).format(timestamp)
    : "Not set";

const toDateInput = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const fromDateInput = (value: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

function InvoiceLoadingState() {
  return (
    <main className="min-h-full bg-muted/30 px-4 py-8 sm:px-6 lg:px-10" aria-label="Loading invoice">
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3"><div className="h-3 w-24 rounded bg-muted" /><div className="h-9 w-64 max-w-full rounded bg-muted" /></div>
          <div className="h-10 w-48 rounded bg-muted" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4"><div className="h-44 rounded-lg bg-muted" /><div className="h-64 rounded-lg bg-muted" /></div>
          <div className="h-72 rounded-lg bg-muted" />
        </div>
      </div>
    </main>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const router = useRouter();
  const token = getStoredToken();
  const invoice = useQuery(api.invoices.getById, token ? { id: invoiceId as any, token } : "skip");
  const lineItems = useQuery(api.invoices.getLineItems, token ? { invoiceId: invoiceId as any, token } : "skip");
  const client = useQuery(
    api.clients.getById,
    token && invoice?.clientId ? { id: invoice.clientId, token } : "skip",
  );
  const project = useQuery(
    api.projects.getById,
    token && invoice?.projectId ? { id: invoice.projectId, token } : "skip",
  );
  const updateInvoice = useMutation(api.invoices.update);
  const deleteInvoice = useMutation(api.invoices.remove);
  const [deleting, setDeleting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [savingDueDate, setSavingDueDate] = useState(false);

  useEffect(() => {
    if (invoice) setDueDate(toDateInput(invoice.dueDate));
  }, [invoice?.dueDate]);

  if (invoice === null) {
    return (
      <main className="min-h-full bg-muted/30 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Button asChild variant="ghost" className="-ml-3 mb-6 text-muted-foreground">
            <Link href="/admin/invoices"><ArrowLeft aria-hidden="true" /> Invoices</Link>
          </Button>
          <section className="max-w-xl border-t border-border pt-8" aria-labelledby="missing-invoice-title">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
              <FileText aria-hidden="true" />
            </div>
            <h1 id="missing-invoice-title" className="text-xl font-semibold tracking-tight">Invoice not found</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">This invoice may have been deleted or the link may be out of date.</p>
            <Button asChild className="mt-5"><Link href="/admin/invoices">Return to invoices</Link></Button>
          </section>
        </div>
      </main>
    );
  }

  if (!invoice) return <InvoiceLoadingState />;

  const status = invoice.status as InvoiceStatus;
  const canMarkPaid = status === "sent" || status === "overdue";

  const markPaid = async () => {
    setMarkingPaid(true);
    try {
      await updateInvoice({ id: invoiceId as any, status: "paid", token: getStoredToken()! });
      toast.success("Invoice marked as paid");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not update invoice status");
    } finally {
      setMarkingPaid(false);
    }
  };

  const changeStatus = async (nextStatus: string) => {
    if (nextStatus === status) return;
    setUpdatingStatus(true);
    try {
      await updateInvoice({ id: invoiceId as any, status: nextStatus, token: getStoredToken()! });
      toast.success(`Invoice status changed to ${nextStatus}`);
    } catch (error: any) {
      toast.error(error?.message ?? "Could not update invoice status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveDueDate = async () => {
    const dueDateTimestamp = fromDateInput(dueDate);
    if (!dueDateTimestamp) return;
    setSavingDueDate(true);
    try {
      await updateInvoice({ id: invoiceId as any, dueDate: dueDateTimestamp, token: getStoredToken()! });
      toast.success("Invoice due date saved");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not save due date");
    } finally {
      setSavingDueDate(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteInvoice({ id: invoiceId as any, token: getStoredToken()! });
      toast.success("Invoice deleted");
      router.replace("/admin/invoices");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not delete invoice");
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-full bg-muted/30 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/invoices" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
            <ArrowLeft aria-hidden="true" /> Invoices
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-foreground">{invoice.invoiceNumber}</span>
        </nav>

        <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Invoice</p>
              <InvoiceStatusBadge status={status} />
            </div>
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{invoice.invoiceNumber}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {client ? (client.businessName || client.name) : "Client not linked"}
              {project?.name ? <><span className="mx-2 text-border">/</span>{project.name}</> : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={changeStatus} disabled={updatingStatus}>
              <SelectTrigger className="w-36" aria-label="Update invoice status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="void">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {status === "draft" && (
              <Button asChild variant="outline" className="active:scale-[0.98]">
                <Link href={`/admin/invoices/new?invoiceId=${invoiceId}`}><Pencil aria-hidden="true" /> Edit invoice</Link>
              </Button>
            )}
            {canMarkPaid && (
              <Button type="button" onClick={markPaid} disabled={markingPaid} className="active:scale-[0.98]">
                <Check aria-hidden="true" /> {markingPaid ? "Updating…" : "Mark as paid"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting} className="active:scale-[0.98]">
              <Trash2 aria-hidden="true" /> {deleting ? "Deleting…" : "Delete invoice"}
            </Button>
          </div>
        </header>

        <div className="grid items-start gap-8 pt-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)] lg:gap-10">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="invoice-parties-title" className="grid gap-6 border-b border-border pb-7 sm:grid-cols-2">
              <div>
                <h2 id="invoice-parties-title" className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Billed to</h2>
                {client ? (
                  <div className="space-y-1">
                    {invoice.clientId ? <Link href={`/admin/clients/${invoice.clientId}`} className="font-medium hover:underline">{client.businessName || client.name}</Link> : <p className="font-medium">{client.businessName || client.name}</p>}
                    {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                    {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{invoice.clientId ? client === undefined ? "Loading client details…" : "Client details are unavailable." : "No client is attached to this invoice."}</p>
                )}
              </div>
              <div>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Project</h2>
                {project ? (
                  <div className="space-y-1">
                    <Link href={`/admin/projects/${project._id}`} className="inline-flex items-center gap-2 font-medium hover:underline"><Layers aria-hidden="true" />{project.name}</Link>
                    <p className="text-sm text-muted-foreground">{project.projectCode}</p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">{invoice.projectId ? project === undefined ? "Loading project details…" : "Project details are unavailable." : "No project is attached to this invoice."}</p>}
              </div>
            </section>

            <section aria-labelledby="line-items-title">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 id="line-items-title" className="text-base font-semibold">Line items</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Charges included in this invoice</p>
                </div>
                <span className="text-xs text-muted-foreground">{lineItems?.length ?? 0} items</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-medium">Description</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Qty</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Unit price</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    {lineItems === undefined ? (
                      <tbody aria-label="Loading line items">
                        {[0, 1, 2].map((row) => <tr key={row} className="border-b border-border last:border-0"><td colSpan={4} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>)}
                      </tbody>
                    ) : lineItems.length > 0 ? (
                      <tbody className="divide-y divide-border">
                        {lineItems.map((item: any) => (
                          <tr key={item._id}>
                            <td className="max-w-[280px] px-4 py-4 font-medium">{item.description}</td>
                            <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">{item.quantity}</td>
                            <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">{formatMoney(item.unitPrice, invoice.currency)}</td>
                            <td className="px-4 py-4 text-right font-medium tabular-nums">{formatMoney(item.amount, invoice.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    ) : (
                      <tbody><tr><td colSpan={4} className="px-4 py-10 text-center">
                        <FileText aria-hidden="true" className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">No line items</p>
                        <p className="mt-1 text-xs text-muted-foreground">This invoice has no itemized charges.</p>
                      </td></tr></tbody>
                    )}
                  </table>
                </div>
              </div>
              {invoice.notes && (
                <div className="mt-6 border-l-2 border-border pl-4">
                  <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Notes</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{invoice.notes}</p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-card pb-4">
                <CardTitle className="text-sm">Payment summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(invoice.subtotal, invoice.currency)}</span></div>
                <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span><span className="tabular-nums">{formatMoney(invoice.taxAmount, invoice.currency)}</span></div>
                <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{status === "paid" ? "Payment recorded" : status === "void" ? "This invoice is void" : "Amount billed"}</p>
              </CardContent>
            </Card>

            <section className="space-y-4 border-t border-border pt-5" aria-labelledby="invoice-dates-title">
              <h2 id="invoice-dates-title" className="text-sm font-semibold">Invoice dates</h2>
              <div className="flex items-start gap-3 text-sm">
                <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div><p className="text-muted-foreground">Issue date</p><p className="mt-0.5 font-medium">{formatDate(invoice.issueDate)}</p></div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock3 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="w-full space-y-2">
                  <label htmlFor="invoice-due-date" className="text-muted-foreground">Due date</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input id="invoice-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="max-w-48" />
                    <Button type="button" size="sm" variant="outline" onClick={saveDueDate} disabled={savingDueDate || !dueDate || dueDate === toDateInput(invoice.dueDate)}>
                      {savingDueDate ? "Saving…" : invoice.dueDate ? "Update date" : "Add due date"}
                    </Button>
                  </div>
                </div>
              </div>
              {invoice.createdAt && <p className="border-t border-border pt-4 text-xs text-muted-foreground">Created {formatDate(invoice.createdAt)}</p>}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
