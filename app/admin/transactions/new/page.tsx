"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { toast } from "sonner";

export default function NewTransactionPage() {
  const router = useRouter();
  const token = getStoredToken();
  const clients = useQuery(api.clients.list, token ? { token } : "skip");
  const projects = useQuery(api.projects.list, token ? { token } : "skip");
  const createTx = useMutation(api.transactions.create);
  const [form, setForm] = useState({ transactionRef: "", amount: 0, currency: "BDT", method: "", clientId: "", projectId: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await createTx({
        transactionRef: form.transactionRef,
        amount: form.amount,
        currency: form.currency,
        method: form.method || undefined,
        clientId: form.clientId ? (form.clientId as any) : undefined,
        projectId: form.projectId ? (form.projectId as any) : undefined,
        notes: form.notes || undefined,
        createdBy: "",
        token: getStoredToken()!,
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
        <input placeholder="Transaction ref *" value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input type="number" placeholder="Amount *" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">No client</option>
          {clients?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">No project</option>
          {projects?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
        <button onClick={submit} disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating…" : "Create transaction"}
        </button>
      </div>
    </div>
  );
}
