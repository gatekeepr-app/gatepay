"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { Download, FileText, Plus } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/admin/invoice-status-badge";
import { Button } from "@/components/ui/button";

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(timestamp);

export default function InvoicesPage() {
  const token = getStoredToken();
  const invoices = useQuery(api.invoices.list, token ? { token } : "skip");

  return (
    <main className="page-enter min-h-full bg-muted/30 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Billing</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Invoices</h1>
            <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">Review invoice status, billing details, and amounts due.</p>
          </div>
          <Button asChild className="active:scale-[0.98]">
            <Link href="/admin/invoices/new"><Plus aria-hidden="true" /> New invoice</Link>
          </Button>
        </header>

        <section className="pt-7" aria-labelledby="invoice-list-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="invoice-list-title" className="text-sm font-semibold">Recent invoices</h2>
            {invoices && <span className="text-xs text-muted-foreground">{invoices.length} invoices</span>}
          </div>

          {invoices === undefined ? (
            <div className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Loading invoices">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex items-center gap-4 border-b border-border px-4 py-5 last:border-0 sm:px-5">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2"><div className="h-4 w-36 animate-pulse rounded bg-muted" /><div className="h-3 w-24 animate-pulse rounded bg-muted" /></div>
                  <div className="hidden h-5 w-20 animate-pulse rounded bg-muted sm:block" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-5 py-14 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
                <FileText aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">No invoices yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Create an invoice to record charges and share a payment request with a client.</p>
              <Button asChild className="mt-5 active:scale-[0.98]"><Link href="/admin/invoices/new"><Plus aria-hidden="true" /> Create invoice</Link></Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="divide-y divide-border">
                {invoices.map((invoice: any) => (
                  <article key={invoice._id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto_auto_40px] sm:px-5">
                    <Link href={`/admin/invoices/${invoice._id}`} className="group col-start-1 row-start-1 flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-auto sm:row-auto">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                        <FileText aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:underline">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Issued {formatDate(invoice.issueDate)}</p>
                      </div>
                    </Link>
                    <div className="col-start-1 row-start-2 justify-self-start sm:col-start-auto sm:row-start-auto sm:justify-self-end"><InvoiceStatusBadge status={invoice.status} /></div>
                    <p className="col-start-2 row-start-1 text-right text-sm font-medium tabular-nums sm:col-start-auto sm:row-start-auto">{formatMoney(invoice.total, invoice.currency)}</p>
                    <Button asChild variant="ghost" size="icon" className="col-start-2 row-start-2 justify-self-end sm:col-start-auto sm:row-start-auto" aria-label={`Download PDF for invoice ${invoice.invoiceNumber}`} title="Download invoice PDF">
                      <Link href={`/admin/invoices/${invoice._id}/download`} target="_blank" rel="noreferrer">
                        <Download aria-hidden="true" />
                      </Link>
                    </Button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
