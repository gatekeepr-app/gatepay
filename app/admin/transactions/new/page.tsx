"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export default function NewTransactionPage() {
  const router = useRouter();
  const projects = useQuery(api.projects.list);
  const createTx = useMutation(api.transactions.create);
  const [form, setForm] = useState({ transactionRef: "", amount: 0, currency: "BDT", method: "", projectId: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await createTx({
        transactionRef: form.transactionRef,
        amount: form.amount,
        currency: form.currency,
        method: form.method || undefined,
        projectId: form.projectId ? (form.projectId as any) : undefined,
        notes: form.notes || undefined,
        createdBy: "",
      });
      toast.success("Transaction created");
      router.push("/admin/transactions");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold">New transaction</h1>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Transaction ref *</span>
          <input placeholder="e.g. BK8FA2K9JX" value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount *</span>
          <input type="number" placeholder="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
          <input placeholder="BDT" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Payment method</span>
          <input placeholder="e.g. bKash, Nagad, Bank transfer" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Project (optional)</span>
          <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">No project</option>
            {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
          <textarea placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" rows={2} />
        </label>
        <button onClick={submit} disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating…" : "Create transaction"}
        </button>
      </div>
    </div>
  );
}
