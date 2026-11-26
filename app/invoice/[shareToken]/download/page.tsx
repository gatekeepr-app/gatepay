"use client";

import { useEffect, useRef } from "react";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { InvoiceDocumentPreview } from "@/components/admin/invoice-document-preview";
import type { SharedInvoiceData } from "@/lib/shared-invoice";

export default function SharedInvoiceDownloadPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const data = useQuery(api.invoices.getSharedInvoice, { shareToken }) as SharedInvoiceData | null | undefined;
  const didPrint = useRef(false);

  useEffect(() => {
    if (!data || didPrint.current) return;
    didPrint.current = true;
    const startPrint = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      })));
      window.setTimeout(() => window.print(), 250);
    };
    void startPrint();
  }, [data]);

  if (data === null) return <main className="p-8 text-center text-sm text-muted-foreground">Invoice link unavailable.</main>;
  if (!data) return <main className="p-8 text-center text-sm text-muted-foreground">Preparing invoice PDF…</main>;

  const { invoice, lineItems, project, client, brand } = data;
  return (
    <main className="invoice-print-page min-h-screen bg-white p-4">
      <div className="mx-auto w-fit">
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
      </div>
      <style jsx global>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; background: #fff !important; }
          .invoice-print-page { min-height: 0 !important; padding: 0 !important; }
          .invoice-print-page article {
            width: 210mm !important; height: 297mm !important; min-height: 297mm !important;
            max-width: none !important; aspect-ratio: auto !important; margin: 0 !important;
            padding: 14mm !important; box-shadow: none !important; print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}
