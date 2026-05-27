"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export default function BillingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const existing = useQuery(api.billing.getByProject, { projectId: projectId as any });
  const upsertBilling = useMutation(api.billing.upsert);
  const [form, setForm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const f = form ?? existing ?? {
    billingType: "monthly",
    amount: 0,
    currency: "BDT",
    monthsCount: 1,
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await upsertBilling({ projectId: projectId as any, ...f });
      toast.success("Billing saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <Link href={`/admin/projects/${projectId}`} className="text-sm text-primary hover:underline">← Back to project</Link>
      <h1 className="mt-2 text-2xl font-semibold">Billing</h1>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Billing type</span>
          <select value={f.billingType} onChange={(e) => setForm({ ...f, billingType: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="per_project">Per project</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount</span>
          <input type="number" value={f.amount} onChange={(e) => setForm({ ...f, amount: parseFloat(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
          <input value={f.currency} onChange={(e) => setForm({ ...f, currency: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>
        {f.billingType === "monthly" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Months</span>
            <input type="number" value={f.monthsCount} onChange={(e) => setForm({ ...f, monthsCount: parseInt(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
        )}
        <button onClick={submit} disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {submitting ? "Saving…" : "Save billing"}
        </button>
      </div>
    </div>
  );
}
