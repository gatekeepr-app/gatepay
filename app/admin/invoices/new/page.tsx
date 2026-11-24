"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceDocumentPreview } from "@/components/admin/invoice-document-preview";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type LineItem = { description: string; quantity: number; unitPrice: number };
const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
const toDateInput = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const fromDateInput = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editInvoiceId = searchParams.get("invoiceId");
  const token = getStoredToken();
  const projects = useQuery(api.projects.list, token ? { token } : "skip");
  const clients = useQuery(api.clients.list, token ? { token } : "skip");
  const brand = useQuery(api.brand.getSettings, token ? { token } : "skip");
  const updateDraft = useMutation(api.invoices.updateDraft);
  const finalizeDraft = useMutation(api.invoices.finalizeDraft);
  const editInvoice = useQuery(api.invoices.getById, token && editInvoiceId ? { token, id: editInvoiceId as any } : "skip");
  const editLineItems = useQuery(api.invoices.getLineItems, token && editInvoiceId ? { token, invoiceId: editInvoiceId as any } : "skip");
  const [projectId, setProjectId] = useState("");
  const [issueDate, setIssueDate] = useState(() => Date.now());
  const [dueDate, setDueDate] = useState("");
  const referenceSuggestion = useQuery(
    api.brand.getNextInvoiceReference,
    token && !editInvoiceId ? { token, projectId: projectId ? (projectId as any) : undefined, issueDate } : "skip",
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [referenceEdited, setReferenceEdited] = useState(false);
  const [currency, setCurrency] = useState("BDT");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [editHydrated, setEditHydrated] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(editInvoiceId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlight = useRef(false);
  const changeVersion = useRef(0);

  const markDirty = () => {
    changeVersion.current += 1;
    setHasUnsavedChanges(true);
    setAutosaveStatus("unsaved");
  };

  useEffect(() => {
    if (!editInvoiceId || !editInvoice || !editLineItems || editHydrated) return;
    setProjectId(editInvoice.projectId ?? "");
    setIssueDate(editInvoice.issueDate);
    setDueDate(toDateInput(editInvoice.dueDate));
    setInvoiceNumber(editInvoice.invoiceNumber);
    setReferenceEdited(true);
    setCurrency(editInvoice.currency);
    setTaxRate(editInvoice.taxRate);
    setNotes(editInvoice.notes ?? "");
    setLineItems(editLineItems.length ? editLineItems.map((item: any) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })) : [{ description: "", quantity: 1, unitPrice: 0 }]);
    setEditHydrated(true);
    setSavedInvoiceId(editInvoiceId);
    setHasUnsavedChanges(false);
  }, [editInvoiceId, editInvoice, editLineItems, editHydrated]);

  useEffect(() => {
    if (!referenceEdited && referenceSuggestion) setInvoiceNumber(referenceSuggestion);
  }, [referenceEdited, referenceSuggestion]);

  const project = projects?.find((item: any) => item._id === projectId);
  const client = clients?.find((item: any) => item._id === project?.clientId);
  const billableLineItems = useMemo(() => lineItems.filter((item) => item.description.trim()), [lineItems]);
  const subtotal = billableLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const safeTaxRate = Number.isFinite(taxRate) ? Math.max(0, taxRate) : 0;
  const taxAmount = subtotal * safeTaxRate / 100;
  const total = subtotal + taxAmount;
  const updateLine = (index: number, updates: Partial<LineItem>) => {
    markDirty();
    setLineItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item));
  };

  const persistDraft = useCallback(async () => {
    const id = await updateDraft({
      id: (savedInvoiceId ?? undefined) as any,
        projectId: projectId ? (projectId as any) : null,
        clientId: project?.clientId ?? null,
        issueDate,
        dueDate: fromDateInput(dueDate),
        invoiceNumber: referenceEdited && invoiceNumber.trim() ? invoiceNumber.trim() : undefined,
        subtotal,
        taxRate: safeTaxRate,
        currency,
        notes: notes || null,
        lineItems: billableLineItems.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      token: getStoredToken()!,
    });
    if (!savedInvoiceId) {
      setSavedInvoiceId(id);
      setEditHydrated(true);
      router.replace(`/admin/invoices/new?invoiceId=${id}`);
    }
    return id as string;
  }, [updateDraft, savedInvoiceId, projectId, project?.clientId, issueDate, dueDate, referenceEdited, invoiceNumber, subtotal, safeTaxRate, currency, notes, billableLineItems, router]);

  useEffect(() => {
    if (!hasUnsavedChanges || autosaveStatus === "saving" || (editInvoiceId && !editHydrated)) return;
    const version = changeVersion.current;
    const timer = setTimeout(() => {
      if (saveInFlight.current) {
        setAutosaveStatus("unsaved");
        return;
      }
      saveInFlight.current = true;
      setAutosaveStatus("saving");
      void persistDraft().then(() => {
        if (changeVersion.current === version) {
          setHasUnsavedChanges(false);
          setAutosaveStatus("saved");
        } else {
          setAutosaveStatus("saved");
          window.setTimeout(() => setAutosaveStatus("unsaved"), 0);
        }
      }).catch((error: any) => {
        setAutosaveStatus("error");
        toast.error(error?.message ?? "Draft autosave failed. Your changes are still here.");
      }).finally(() => { saveInFlight.current = false; });
    }, 1000);
    autosaveTimer.current = timer;
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, autosaveStatus, editInvoiceId, editHydrated, persistDraft]);

  const saveDraftAndExit = async () => {
    if (saveInFlight.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    saveInFlight.current = true;
    setSubmitting(true);
    setAutosaveStatus("saving");
    try {
      const id = await persistDraft();
      toast.success("Invoice saved as draft");
      router.push(`/admin/invoices/${id}`);
    } catch (error: any) {
      setAutosaveStatus("error");
      toast.error(error?.message ?? "Could not save invoice draft");
    } finally {
      saveInFlight.current = false;
      setSubmitting(false);
    }
  };

  const generateInvoice = async () => {
    if (autosaveStatus === "saving" || saveInFlight.current) return;
    if (!billableLineItems.length) {
      toast.error("Add at least one line item before generating the invoice.");
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    saveInFlight.current = true;
    setSubmitting(true);
    setAutosaveStatus("saving");
    try {
      const id = hasUnsavedChanges || !savedInvoiceId ? await persistDraft() : savedInvoiceId;
      await finalizeDraft({ id: id as any, token: getStoredToken()! });
      toast.success("Invoice generated and marked as sent");
      router.push(`/admin/invoices/${id}`);
    } catch (error: any) {
      setAutosaveStatus("error");
      toast.error(error?.message ?? "Could not generate invoice");
    } finally {
      saveInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Invoices / {editInvoiceId ? "Edit draft" : "New invoice"}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{editInvoiceId ? "Edit invoice draft" : "Create invoice"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter invoice details and review the document before {editInvoiceId ? "saving changes" : "creating it"}.</p>
        </div>

        {editInvoiceId && editInvoice && editInvoice.status !== "draft" && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Only draft invoices can be edited. This invoice is {editInvoice.status}.</p>}
        {editInvoiceId && editInvoice === null && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Invoice not found. It may have been deleted.</p>}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="details-heading">
            <div>
              <h2 id="details-heading" className="text-base font-semibold">Invoice details</h2>
              <p className="mt-1 text-sm text-muted-foreground">The preview updates as you edit.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="invoiceNumber">Invoice reference no.</Label>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => { markDirty(); setReferenceEdited(false); setInvoiceNumber(referenceSuggestion ?? ""); }}>
                    Use suggested
                  </Button>
                </div>
                <Input id="invoiceNumber" value={invoiceNumber} maxLength={100} placeholder="Generating reference…" onChange={(event) => { markDirty(); setInvoiceNumber(event.target.value); setReferenceEdited(true); }} />
                <p className="text-xs text-muted-foreground">Suggested from your Brand settings. You can change it for this invoice.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="project">Project</Label>
                <Select value={projectId || "none"} onValueChange={(value) => { markDirty(); setProjectId(value === "none" ? "" : value); }}>
                  <SelectTrigger id="project"><SelectValue placeholder="Select a project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects?.map((item: any) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {project && <p className="text-xs text-muted-foreground">{client?.name ?? "No client linked to this project"}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(value) => { markDirty(); setCurrency(value); }}>
                  <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT">BDT</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax rate (%)</Label>
                <Input id="taxRate" type="number" min="0" step="0.01" value={taxRate} onChange={(event) => { markDirty(); setTaxRate(Number(event.target.value)); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(event) => { markDirty(); setDueDate(event.target.value); }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => { markDirty(); setLineItems((items) => [...items, { description: "", quantity: 1, unitPrice: 0 }]); }}>
                  <Plus aria-hidden="true" /> Add item
                </Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_64px_96px_36px] items-end gap-2">
                    <div className="min-w-0 space-y-2">
                      {index === 0 && <Label htmlFor="item-description-0" className="text-xs text-muted-foreground">Description</Label>}
                      <Input id={`item-description-${index}`} aria-label={`Item ${index + 1} description`} placeholder="Item description" value={item.description} onChange={(event) => updateLine(index, { description: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      {index === 0 && <Label htmlFor="item-quantity-0" className="text-xs text-muted-foreground">Qty</Label>}
                      <Input id={`item-quantity-${index}`} aria-label={`Item ${index + 1} quantity`} type="number" min="0" step="1" value={item.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      {index === 0 && <Label htmlFor="item-price-0" className="text-xs text-muted-foreground">Unit price</Label>}
                      <Input id={`item-price-${index}`} aria-label={`Item ${index + 1} unit price`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${index + 1}`} disabled={lineItems.length === 1} onClick={() => { markDirty(); setLineItems((items) => items.filter((_, itemIndex) => itemIndex !== index)); }}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(event) => { markDirty(); setNotes(event.target.value); }} rows={3} placeholder="Payment terms or additional details" />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Total due</p>
                <p className="text-xs text-muted-foreground">{currency} {formatAmount(total)}</p>
                <p className="mt-1 text-xs text-muted-foreground" role="status" aria-live="polite">
                  {autosaveStatus === "saving" ? "Saving draft…" : autosaveStatus === "error" ? "Autosave failed; edit again to retry." : autosaveStatus === "unsaved" ? "Changes will save automatically." : savedInvoiceId ? "Draft saved" : "Changes save automatically as a draft."}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={saveDraftAndExit} disabled={submitting || autosaveStatus === "saving" || (!!editInvoiceId && (!editInvoice || editInvoice.status !== "draft" || !editHydrated))}>
                  Save draft
                </Button>
                <Button type="button" onClick={generateInvoice} disabled={submitting || autosaveStatus === "saving" || (!!editInvoiceId && (!editInvoice || editInvoice.status !== "draft" || !editHydrated))}>
                  {submitting ? "Generating…" : "Generate invoice"}
                </Button>
              </div>
            </div>
          </section>

          <section className="min-w-0 xl:sticky xl:top-6" aria-label="Live invoice preview">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Live preview</h2>
                <p className="text-sm text-muted-foreground">This is how the invoice document will look.</p>
              </div>
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">DRAFT</span>
            </div>
            <InvoiceDocumentPreview
              issueDate={issueDate}
              dueDate={fromDateInput(dueDate)}
              referenceNumber={invoiceNumber || "Draft"}
              brandName={brand?.brandName ?? "GATEKEEPER"}
              businessName={brand?.businessName ?? "GatePay"}
              address={brand?.address ?? ""}
              email={brand?.email ?? ""}
              phone={brand?.phone ?? ""}
              footer={brand?.footer ?? ""}
              logoUrl={brand?.logoUrl ?? null}
              projectName={project?.name}
              clientName={client?.businessName || client?.name}
              clientEmail={client?.email}
              clientPhone={client?.phone}
              lineItems={billableLineItems.length ? billableLineItems : lineItems}
              currency={currency}
              subtotal={subtotal}
              taxRate={safeTaxRate}
              taxAmount={taxAmount}
              total={total}
              notes={notes}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
