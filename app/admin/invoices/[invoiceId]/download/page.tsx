"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { InvoiceDocumentPreview } from "@/components/admin/invoice-document-preview";

export default function InvoiceDownloadPage() {
  const params = useParams<{ invoiceId: string }>();
  const token = getStoredToken();
  const documentData = useQuery(
    api.invoices.getDocumentData,
    token && params.invoiceId ? { token, id: params.invoiceId as any } : "skip",
  );
  const didPrint = useRef(false);

  useEffect(() => {
    if (!documentData || didPrint.current) return;
    didPrint.current = true;
    const startPrint = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all(Array.from(document.images).map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      }));
      window.setTimeout(() => window.print(), 250);
    };
    void startPrint();
  }, [documentData]);

  if (documentData === null) return <main className="p-8 text-center text-sm text-muted-foreground">Invoice not found.</main>;
  if (!documentData) return <main className="p-8 text-center text-sm text-muted-foreground">Preparing invoice PDF…</main>;

  const { invoice, lineItems, project, client, brand } = documentData;

  return (
    <main className="invoice-print-page min-h-screen bg-white p-4">
      <div className="mx-auto w-fit">
        <InvoiceDocumentPreview
          issueDate={invoice.issueDate}
          dueDate={invoice.dueDate}
          referenceNumber={invoice.invoiceNumber}
          brandName={brand.brandName}
          businessName={brand.businessName}
          address={brand.address}
          email={brand.email}
          phone={brand.phone}
          footer={brand.footer}
          logoUrl={brand.logoUrl}
          projectName={project?.name}
          clientName={client?.businessName || client?.name}
          clientEmail={client?.email}
          clientPhone={client?.phone}
          lineItems={lineItems.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }))}
          currency={invoice.currency}
          subtotal={invoice.subtotal}
          taxRate={invoice.taxRate}
          taxAmount={invoice.taxAmount}
          total={invoice.total}
          notes={invoice.notes ?? ""}
        />
      </div>
      <style jsx global>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; background: #fff !important; }
          .invoice-print-page { min-height: 0 !important; padding: 0 !important; }
          .invoice-print-page article {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            padding: 14mm !important;
            box-shadow: none !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}
