import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/projects/$projectId/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { projectId } = Route.useParams();
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
      <Link to="/admin/projects/$projectId" params={{ projectId }} className="text-sm text-primary hover:underline">← Back to project</Link>
      <h1 className="mt-2 text-2xl font-semibold">Billing</h1>
      <div className="mt-4 space-y-4">
        <select value={f.billingType} onChange={(e) => setForm({ ...f, billingType: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="per_project">Per project</option>
        </select>
        <input type="number" placeholder="Amount" value={f.amount} onChange={(e) => setForm({ ...f, amount: parseFloat(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input placeholder="Currency" value={f.currency} onChange={(e) => setForm({ ...f, currency: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        {f.billingType === "monthly" && <input type="number" placeholder="Months" value={f.monthsCount} onChange={(e) => setForm({ ...f, monthsCount: parseInt(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />}
        <button onClick={submit} disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {submitting ? "Saving…" : "Save billing"}
        </button>
      </div>
    </div>
  );
}
