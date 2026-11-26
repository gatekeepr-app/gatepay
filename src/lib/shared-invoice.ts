import type { InvoiceLogoAlignment } from "@/lib/invoice-layout";

export type SharedInvoiceData = {
  invoice: {
    invoiceNumber: string;
    issueDate: number;
    dueDate: number | null;
    status: "sent" | "overdue" | "paid";
    currency: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string;
  };
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  project: { name: string } | null;
  client: { name: string; businessName: string | null; email: string | null; phone: string | null } | null;
  brand: {
    brandName: string;
    businessName: string;
    address: string;
    email: string;
    phone: string;
    footer: string;
    invoiceFooterContent: string | null;
    invoiceLogoWidthMm: number;
    invoiceLogoAlignment: InvoiceLogoAlignment;
    logoUrl: string | null;
  };
};
