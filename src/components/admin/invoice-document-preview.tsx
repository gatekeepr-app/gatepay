import Image from "next/image";
import { InvoiceFooterRenderer } from "@/components/admin/invoice-footer-renderer";
import { DEFAULT_INVOICE_LOGO_ALIGNMENT, DEFAULT_INVOICE_LOGO_WIDTH_MM, parseInvoiceFooterDocument, type InvoiceLogoAlignment } from "@/lib/invoice-layout";

type PreviewLineItem = { description: string; quantity: number; unitPrice: number };

type InvoiceDocumentPreviewProps = {
  issueDate: number;
  dueDate?: number | null;
  referenceNumber: string;
  brandName: string;
  businessName: string;
  address: string;
  email: string;
  phone: string;
  footer: string;
  invoiceFooterContent?: string | null;
  invoiceLogoWidthMm?: number;
  invoiceLogoAlignment?: InvoiceLogoAlignment;
  logoUrl: string | null;
  projectName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  lineItems: PreviewLineItem[];
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);

const ones = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function spellUnderThousand(value: number): string {
  const words: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  if (hundreds) words.push(`${ones[hundreds]} Hundred`);
  if (remainder >= 20) {
    words.push(`${tens[Math.floor(remainder / 10)]}${remainder % 10 ? ` ${ones[remainder % 10]}` : ""}`);
  } else if (remainder >= 10) {
    words.push(teens[remainder - 10]);
  } else if (remainder > 0 || (!hundreds && value === 0)) {
    words.push(ones[remainder]);
  }
  return words.join(" ");
}

function spellNumber(value: number): string {
  if (value === 0) return "Zero";
  if (value > 999_999_999_999) return formatAmount(value);
  const scales = ["", "Thousand", "Million", "Billion"];
  const groups: string[] = [];
  let remaining = Math.floor(value);
  let scale = 0;
  while (remaining > 0) {
    const group = remaining % 1000;
    if (group) groups.unshift(`${spellUnderThousand(group)}${scales[scale] ? ` ${scales[scale]}` : ""}`);
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }
  return groups.join(" ");
}

function amountInWords(amount: number, currency: string): string {
  const rounded = Math.round(Math.max(0, Number.isFinite(amount) ? amount : 0) * 100);
  const whole = Math.floor(rounded / 100);
  const fraction = rounded % 100;
  return `${spellNumber(whole)}${fraction ? ` and ${String(fraction).padStart(2, "0")}/100` : ""} ${currency} Only`;
}

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(timestamp);

export function InvoiceDocumentPreview({
  issueDate,
  dueDate,
  referenceNumber,
  brandName,
  businessName,
  address,
  email,
  phone,
  footer,
  invoiceFooterContent,
  invoiceLogoWidthMm = DEFAULT_INVOICE_LOGO_WIDTH_MM,
  invoiceLogoAlignment = DEFAULT_INVOICE_LOGO_ALIGNMENT,
  logoUrl,
  projectName,
  clientName,
  clientEmail,
  clientPhone,
  lineItems,
  currency,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
}: InvoiceDocumentPreviewProps) {
  const footerDocument = parseInvoiceFooterDocument(invoiceFooterContent, footer);
  const logoAlignment = invoiceLogoAlignment === "left" ? "justify-start" : invoiceLogoAlignment === "right" ? "justify-end" : "justify-center";
  return (
    <article className="mx-auto min-h-[720px] max-w-[760px] bg-white px-7 py-8 text-[11px] leading-[1.45] text-slate-950 shadow-lg sm:px-12 sm:py-12 lg:aspect-[210/297] lg:px-14 lg:py-14" aria-label="Invoice document preview">
      <div className="flex min-h-full flex-col">
        <div className={`flex pb-10 pt-2 ${logoAlignment}`}>
          {logoUrl ? (
            <Image src={logoUrl} alt={`${brandName} logo`} width={320} height={120} unoptimized style={{ width: `${invoiceLogoWidthMm}mm` }} className="h-auto max-h-16 max-w-full object-contain" />
          ) : (
            <div style={{ width: `${invoiceLogoWidthMm}mm` }} className="inline-flex items-baseline text-2xl font-black tracking-[-0.075em] text-blue-900 sm:text-[30px]">
              {brandName}{brandName === "GATEKEEPER" && <span className="ml-0.5 text-amber-400">↗</span>}
            </div>
          )}
        </div>

        <div className="mb-5 flex justify-end">
          <div className="w-60">
            <p className="mb-4 text-center text-sm font-bold tracking-wide">INVOICE</p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[11px]">
              <span>Date:</span><span className="text-right">{formatDate(issueDate)}</span>
              {dueDate && <><span>Due Date:</span><span className="text-right">{formatDate(dueDate)}</span></>}
              <span>Ref No.:</span><span className="text-right font-bold">{referenceNumber}</span>
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-5 text-[10px]">
          <div className="self-end">
            <p className="font-bold">{businessName}</p>
            {address && <p className="whitespace-pre-line text-slate-600">{address}</p>}
            {email && <p>{email}</p>}
            {phone && <p>{phone}</p>}
          </div>
          <div className="text-right">
            <div className="mb-1 bg-slate-200 px-2 py-1 text-right font-bold">Bill to:</div>
            <p className="font-bold">{clientName || (projectName ? "No client linked" : "Select a project")}</p>
            {clientEmail && <p>{clientEmail}</p>}
            {clientPhone && <p>{clientPhone}</p>}
            {projectName && <p className="mt-1 text-slate-600">Project: {projectName}</p>}
          </div>
        </div>

        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b border-t border-slate-950">
              <th className="w-8 py-2 pr-2 font-bold">Sl.</th>
              <th className="py-2 pr-2 font-bold">Item</th>
              <th className="w-12 px-2 py-2 text-center font-bold">Qty.</th>
              <th className="w-16 px-2 py-2 text-right font-bold">Unit</th>
              <th className="w-20 py-2 pl-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index} className="border-b border-slate-300 align-top">
                <td className="py-1.5 pr-2">{index + 1}</td>
                <td className="py-1.5 pr-2">
                  <span className="font-semibold">{item.description || "Item description"}</span>
                  {projectName && <span className="block text-slate-500">{projectName}</span>}
                </td>
                <td className="px-2 py-1.5 text-center">{item.quantity || "–"}</td>
                <td className="px-2 py-1.5 text-right">{formatAmount(item.unitPrice)}</td>
                <td className="py-1.5 pl-2 text-right font-semibold">{formatAmount(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-2 pr-2 text-right font-semibold">Subtotal</td>
              <td className="py-2 pl-2 text-right font-semibold">{formatAmount(subtotal)}</td>
            </tr>
            {taxRate > 0 && (
              <tr>
                <td colSpan={4} className="py-1 pr-2 text-right">Tax ({formatAmount(taxRate)}%)</td>
                <td className="py-1 pl-2 text-right">{formatAmount(taxAmount)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-950">
              <td colSpan={4} className="py-2 pr-2 text-right font-bold">Grand Total (Due)</td>
              <td className="py-2 pl-2 text-right font-bold underline decoration-1 underline-offset-2">{formatAmount(total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-7 space-y-5 text-[10px]">
          <p><span className="font-bold">Amount due:</span> {currency} {formatAmount(total)}</p>
          <p><span className="font-bold">In words:</span> {amountInWords(total, currency)}</p>
          {notes && <p className="whitespace-pre-wrap"><span className="font-bold">Notes:</span> {notes}</p>}
        </div>

        <div className="mt-auto pt-16 text-center text-[9px] text-blue-900">
          <div className="mb-1">{footerDocument.content?.length ? <InvoiceFooterRenderer document={footerDocument} /> : null}</div>
          <p className="font-bold tracking-wide">{brandName}</p>
          <p>{businessName}{email ? ` | ${email}` : ""}{phone ? ` | ${phone}` : ""}</p>
        </div>
      </div>
    </article>
  );
}
