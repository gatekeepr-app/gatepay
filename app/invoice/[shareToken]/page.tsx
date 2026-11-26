"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { InvoiceDocumentPreview } from "@/components/admin/invoice-document-preview";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/admin/format";
import type { SharedInvoiceData } from "@/lib/shared-invoice";
import { ArrowDownToLine, CheckCircle2, CreditCard, FileText, LockKeyhole } from "lucide-react";

export default function SharedInvoicePage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const data = useQuery(api.invoices.getSharedInvoice, { shareToken }) as SharedInvoiceData | null | undefined;

  if (data === null) return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <section className="max-w-md text-center" aria-labelledby="invalid-share-title">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-border bg-card"><FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></div>
        <h1 id="invalid-share-title" className="mt-4 text-xl font-semibold">Invoice link unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This link may have expired or been revoked. Contact the sender for an updated invoice.</p>
      </section>
    </main>
  );
  if (!data) return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground" aria-busy="true">Loading invoice…</main>;

  const { invoice, lineItems, project, client, brand } = data;
  const clientName = client?.businessName || client?.name;
  const statusLabel = invoice.status === "paid" ? "Paid" : invoice.status === "overdue" ? "Overdue" : "Payment due";
  const statusStyle = invoice.status === "paid" ? "border-foreground/20 bg-muted text-foreground" : invoice.status === "overdue" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-background text-muted-foreground";

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <span className="text-sm font-semibold tracking-tight">{brand.brandName || "GatePay"}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Secure invoice</span>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.6fr)] xl:gap-8">
          <aside className="space-y-4 lg:sticky lg:top-6" aria-label="Payment details">
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{invoice.status === "paid" ? "Invoice total" : "Amount due"}</p>
              <p className="mt-3 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{formatMoney(invoice.total, invoice.currency, { style: "currency" })}</p>
              <span className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle}`}>{statusLabel}</span>
              <dl className="mt-6 space-y-4 border-t border-border pt-5 text-sm">
                <div><dt className="text-xs text-muted-foreground">Invoice ID</dt><dd className="mt-1 break-all font-medium">{invoice.invoiceNumber}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Issued</dt><dd className="mt-1 font-medium">{formatDate(invoice.issueDate, { locale: "en-BD", month: "long" })}</dd></div>
                {invoice.dueDate && <div><dt className="text-xs text-muted-foreground">Due date</dt><dd className="mt-1 font-medium">{formatDate(invoice.dueDate, { locale: "en-BD", month: "long" })}</dd></div>}
                {clientName && <div><dt className="text-xs text-muted-foreground">Billed to</dt><dd className="mt-1 font-medium">{clientName}</dd></div>}
              </dl>
              <Button type="button" disabled className="mt-6 w-full" aria-describedby="payment-coming-soon">
                {invoice.status === "paid" ? <CheckCircle2 aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
                {invoice.status === "paid" ? "Payment received" : "Pay now"}
              </Button>
              <p id="payment-coming-soon" className="mt-2 text-center text-xs leading-5 text-muted-foreground">
                {invoice.status === "paid" ? "This invoice has already been paid." : "Online payment will be available here soon."}
              </p>
            </section>
            <p className="px-1 text-xs leading-5 text-muted-foreground">Questions about this invoice? Contact {brand.businessName || "the billing team"}{brand.email ? <> at <a className="underline underline-offset-2" href={`mailto:${brand.email}`}>{brand.email}</a></> : " for assistance."}</p>
          </aside>
          <section className="min-w-0" aria-labelledby="shared-invoice-document-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div><h1 id="shared-invoice-document-title" className="text-base font-semibold">Invoice document</h1><p className="mt-1 text-sm text-muted-foreground">A copy of the invoice issued by {brand.businessName}.</p></div>
              <Button asChild variant="outline" size="sm"><Link href={`/invoice/${shareToken}/download`} target="_blank" rel="noreferrer"><ArrowDownToLine aria-hidden="true" /> Download PDF</Link></Button>
            </div>
            <InvoiceDocumentPreview
              issueDate={invoice.issueDate} dueDate={invoice.dueDate} referenceNumber={invoice.invoiceNumber}
              brandName={brand.brandName} businessName={brand.businessName} address={brand.address}
              email={brand.email} phone={brand.phone} footer={brand.footer}
              invoiceFooterContent={brand.invoiceFooterContent} invoiceLogoWidthMm={brand.invoiceLogoWidthMm}
              invoiceLogoAlignment={brand.invoiceLogoAlignment} logoUrl={brand.logoUrl}
              projectName={project?.name} clientName={client?.businessName || client?.name}
              clientEmail={client?.email ?? undefined} clientPhone={client?.phone ?? undefined}
              lineItems={lineItems} currency={invoice.currency} subtotal={invoice.subtotal}
              taxRate={invoice.taxRate} taxAmount={invoice.taxAmount} total={invoice.total} notes={invoice.notes}
            />
          </section>
        </div>
        <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">Powered by GatePay</footer>
      </div>
    </main>
  );
}
