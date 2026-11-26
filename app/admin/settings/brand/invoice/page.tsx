"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAdminSession } from "@/components/admin/UserProvider";
import { InvoiceDocumentPreview } from "@/components/admin/invoice-document-preview";
import { InvoiceFooterEditor } from "@/components/admin/invoice-footer-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_INVOICE_LOGO_ALIGNMENT, DEFAULT_INVOICE_LOGO_WIDTH_MM, emptyInvoiceFooterDocument, parseInvoiceFooterDocument, type InvoiceFooterDocument, type InvoiceLogoAlignment } from "@/lib/invoice-layout";
import { toast } from "sonner";

export default function InvoiceSetupPage() {
  const { token } = useAdminSession();
  const settings = useQuery(api.brand.getSettings, token ? { token } : "skip");
  const saveLayout = useMutation(api.brand.saveInvoiceLayoutSettings);
  const [footer, setFooter] = useState<InvoiceFooterDocument>(emptyInvoiceFooterDocument);
  const [logoWidth, setLogoWidth] = useState(DEFAULT_INVOICE_LOGO_WIDTH_MM);
  const [logoAlignment, setLogoAlignment] = useState<InvoiceLogoAlignment>(DEFAULT_INVOICE_LOGO_ALIGNMENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setFooter(parseInvoiceFooterDocument(settings.invoiceFooterContent, settings.footer));
    setLogoWidth(settings.invoiceLogoWidthMm ?? DEFAULT_INVOICE_LOGO_WIDTH_MM);
    setLogoAlignment(settings.invoiceLogoAlignment ?? DEFAULT_INVOICE_LOGO_ALIGNMENT);
  }, [settings]);

  const handleSave = async () => {
    if (!token) return toast.error("Your session has expired. Sign in again.");
    setSaving(true);
    try {
      await saveLayout({ token, invoiceLogoWidthMm: logoWidth, invoiceLogoAlignment: logoAlignment, invoiceFooterContent: JSON.stringify(footer) });
      toast.success("Invoice layout saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save invoice layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6">
          <p className="text-sm text-muted-foreground">Admin / Settings / Brand settings</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Invoice setup</h1>
          <p className="mt-1 text-sm text-muted-foreground">Adjust the invoice logo and footer. The preview reflects the printable document.</p>
        </header>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <section className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="invoice-layout-heading">
            <div>
              <h2 id="invoice-layout-heading" className="font-semibold">Header logo</h2>
              <p className="mt-1 text-sm text-muted-foreground">Set its displayed width and horizontal alignment.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label htmlFor="invoice-logo-width">Logo width</Label><span className="text-sm tabular-nums text-muted-foreground">{logoWidth} mm</span></div>
              <input id="invoice-logo-width" type="range" min={20} max={80} step={1} value={logoWidth} onChange={(event) => setLogoWidth(Number(event.target.value))} className="w-full accent-foreground" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>20 mm</span><span>80 mm</span></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-logo-alignment">Logo alignment</Label>
              <Select value={logoAlignment} onValueChange={(value: InvoiceLogoAlignment) => setLogoAlignment(value)}>
                <SelectTrigger id="invoice-logo-alignment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div><Label>Footer content</Label><p className="mt-1 text-xs text-muted-foreground">Use text, emphasis, or lists. Formatting is rendered safely in the invoice.</p></div>
              <InvoiceFooterEditor content={footer} onChange={(document) => setFooter(document)} />
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" onClick={handleSave} disabled={saving || settings === undefined}>{saving ? "Saving…" : "Save invoice setup"}</Button>
            </div>
          </section>
          <section className="min-w-0" aria-label="Invoice layout preview">
            <div className="mb-3"><h2 className="font-semibold">Live preview</h2><p className="text-sm text-muted-foreground">A4 invoice sample</p></div>
            <InvoiceDocumentPreview
              issueDate={Date.now()} referenceNumber="TLS-26SP01-AA1"
              brandName={settings?.brandName ?? "GATEKEEPER"} businessName={settings?.businessName ?? "GatePay"}
              address={settings?.address ?? ""} email={settings?.email ?? ""} phone={settings?.phone ?? ""} footer=""
              invoiceFooterContent={JSON.stringify(footer)} invoiceLogoWidthMm={logoWidth} invoiceLogoAlignment={logoAlignment}
              logoUrl={settings?.logoUrl ?? null} projectName="Example project" clientName="Example client"
              clientEmail="client@example.com" clientPhone="" lineItems={[{ description: "Professional services", quantity: 1, unitPrice: 30000 }]}
              currency="BDT" subtotal={30000} taxRate={0} taxAmount={0} total={30000} notes=""
            />
          </section>
        </div>
      </div>
    </main>
  );
}
