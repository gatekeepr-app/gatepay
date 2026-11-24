"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { getStoredToken } from "@/integrations/convex/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type BrandForm = {
  brandName: string;
  businessName: string;
  address: string;
  email: string;
  phone: string;
  footer: string;
  logoStorageId: Id<"_storage"> | null;
  referencePrefix: string;
  referenceMonthCodes: string;
  referenceSeriesPrefix: string;
  referencePattern: string;
  referenceSequenceScope: "global" | "project";
};

const emptyForm: BrandForm = {
  brandName: "GATEKEEPER",
  businessName: "GatePay",
  address: "",
  email: "",
  phone: "",
  footer: "",
  logoStorageId: null,
  referencePrefix: "TLS",
  referenceMonthCodes: "JA,FE,MR,AP,MY,JN,JL,AU,SP,OC,NO,DE",
  referenceSeriesPrefix: "AA",
  referencePattern: "{prefix}-{yy}{month}{project}-{series}{index}",
  referenceSequenceScope: "project",
};

export default function BrandSettingsPage() {
  const token = getStoredToken();
  const settings = useQuery(api.brand.getSettings, token ? { token } : "skip");
  const generateLogoUploadUrl = useMutation(api.brand.generateLogoUploadUrl);
  const saveSettings = useMutation(api.brand.saveSettings);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      brandName: settings.brandName,
      businessName: settings.businessName,
      address: settings.address,
      email: settings.email,
      phone: settings.phone,
      footer: settings.footer,
      logoStorageId: settings.logoStorageId ?? null,
      referencePrefix: settings.referencePrefix ?? emptyForm.referencePrefix,
      referenceMonthCodes: settings.referenceMonthCodes ?? emptyForm.referenceMonthCodes,
      referenceSeriesPrefix: settings.referenceSeriesPrefix ?? emptyForm.referenceSeriesPrefix,
      referencePattern: settings.referencePattern ?? emptyForm.referencePattern,
      referenceSequenceScope: settings.referenceSequenceScope ?? emptyForm.referenceSequenceScope,
    });
    setRemoveLogo(false);
  }, [settings]);

  useEffect(() => {
    if (!selectedLogo) {
      setLogoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedLogo);
    setLogoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedLogo]);

  const updateField = (field: keyof Omit<BrandForm, "logoStorageId" | "referenceSequenceScope">, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("Your session has expired. Sign in again.");
      return;
    }

    setSaving(true);
    try {
      let logoStorageId = removeLogo ? null : form.logoStorageId;
      if (selectedLogo) {
        const uploadUrl = await generateLogoUploadUrl({ token });
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedLogo.type },
          body: selectedLogo,
        });
        if (!response.ok) throw new Error("Logo upload failed");
        const result = await response.json() as { storageId: Id<"_storage"> };
        logoStorageId = result.storageId;
      }

      await saveSettings({ ...form, logoStorageId, token });
      setSelectedLogo(null);
      setRemoveLogo(false);
      toast.success("Brand settings saved");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not save brand settings");
    } finally {
      setSaving(false);
    }
  };

  const visibleLogo = !removeLogo && (logoPreviewUrl || settings?.logoUrl);

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Admin / Settings</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Brand settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">These details and the logo appear on invoice previews.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="brand-details-title">
            <div>
              <h2 id="brand-details-title" className="font-semibold">Invoice identity</h2>
              <p className="mt-1 text-sm text-muted-foreground">Set the issuer name and contact details shown on new invoices.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandName">Brand name</Label>
              <Input id="brandName" value={form.brandName} maxLength={80} onChange={(event) => updateField("brandName", event.target.value)} placeholder="GATEKEEPER" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" value={form.businessName} maxLength={120} onChange={(event) => updateField("businessName", event.target.value)} placeholder="GatePay Ltd." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Business address</Label>
              <Textarea id="address" value={form.address} maxLength={500} rows={3} onChange={(event) => updateField("address", event.target.value)} placeholder="Street, city, country" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" value={form.email} maxLength={254} onChange={(event) => updateField("email", event.target.value)} placeholder="billing@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact phone</Label>
                <Input id="phone" type="tel" value={form.phone} maxLength={40} onChange={(event) => updateField("phone", event.target.value)} placeholder="+880 …" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer">Invoice footer</Label>
              <Textarea id="footer" value={form.footer} maxLength={300} rows={2} onChange={(event) => updateField("footer", event.target.value)} placeholder="Optional thank-you note or payment terms" />
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <div>
                <h2 className="font-semibold">Invoice reference rule</h2>
                <p className="mt-1 text-sm text-muted-foreground">Set the default pattern. You can still edit each reference when creating an invoice.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referencePrefix">Reference prefix</Label>
                  <Input id="referencePrefix" value={form.referencePrefix} maxLength={20} onChange={(event) => updateField("referencePrefix", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceSeriesPrefix">Sequence prefix</Label>
                  <Input id="referenceSeriesPrefix" value={form.referenceSeriesPrefix} maxLength={12} onChange={(event) => updateField("referenceSeriesPrefix", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceMonthCodes">Month codes (January to December)</Label>
                <Input id="referenceMonthCodes" value={form.referenceMonthCodes} onChange={(event) => updateField("referenceMonthCodes", event.target.value)} />
                <p className="text-xs text-muted-foreground">Enter 12 comma-separated codes. The example uses SP for September.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencePattern">Reference pattern</Label>
                <Input id="referencePattern" value={form.referencePattern} maxLength={100} onChange={(event) => updateField("referencePattern", event.target.value)} />
                <p className="text-xs text-muted-foreground">Tokens: {"{prefix}"}, {"{yy}"}, {"{month}"}, {"{project}"}, {"{series}"}, {"{index}"}. Example: TLS-26SP03-AA1.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceSequenceScope">Sequence numbering</Label>
                <Select value={form.referenceSequenceScope} onValueChange={(value: "global" | "project") => setForm((current) => ({ ...current, referenceSequenceScope: value }))}>
                  <SelectTrigger id="referenceSequenceScope"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Separate sequence for each project</SelectItem>
                    <SelectItem value="global">One sequence across all projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" onClick={handleSave} disabled={saving || settings === undefined}>
                {saving ? "Saving…" : "Save brand settings"}
              </Button>
            </div>
          </section>

          <aside className="h-fit rounded-xl border border-border bg-card p-5" aria-labelledby="logo-title">
            <h2 id="logo-title" className="font-semibold">Invoice logo</h2>
            <p className="mt-1 text-sm text-muted-foreground">PNG, JPEG, or WebP · up to 2 MB</p>
            <div className="mt-4 flex h-36 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background p-4">
              {visibleLogo ? (
                <Image src={visibleLogo} alt="Invoice brand logo preview" width={240} height={100} unoptimized className="max-h-24 w-auto max-w-full object-contain" />
              ) : (
                <span className="text-lg font-black tracking-tight text-blue-900">{form.brandName || "GATEKEEPER"}</span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <Label htmlFor="brand-logo">Upload logo</Label>
              <Input
                id="brand-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > 2_000_000) {
                    toast.error("Choose an image smaller than 2 MB");
                    setSelectedLogo(null);
                    event.target.value = "";
                    return;
                  }
                  setSelectedLogo(file);
                  setRemoveLogo(false);
                }}
                className="h-auto cursor-pointer px-2 py-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
              />
              {(form.logoStorageId || selectedLogo) && !removeLogo && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedLogo(null); setRemoveLogo(true); }}>
                  Remove logo
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
