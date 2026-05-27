import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/invoices/new")({
  component: NewInvoicePage,
});

function NewInvoicePage() {
  const navigate = useNavigate();
  const projects = useQuery(api.projects.list);
  const createInvoice = useMutation(api.invoices.create);
  const [form, setForm] = useState({
    projectId: "",
    subtotal: 0,
    taxRate: 0,
    notes: "",
  });
  const [lineItems, setLineItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await createInvoice({
        projectId: form.projectId ? (form.projectId as any) : undefined,
        issueDate: Date.now(),
        subtotal: form.subtotal,
        taxRate: form.taxRate,
        notes: form.notes || undefined,
        createdBy: "" as any,
        lineItems: lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
      });
      toast.success("Invoice created");
      navigate({ to: "/admin/invoices" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold">New invoice</h1>
      <div className="mt-4 space-y-4">
        <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">No project</option>
          {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        {lineItems.map((li, i) => (
          <div key={i} className="flex gap-2">
            <input placeholder="Description" value={li.description} onChange={(e) => { const n = [...lineItems]; n[i].description = e.target.value; setLineItems(n); }} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="Qty" value={li.quantity} onChange={(e) => { const n = [...lineItems]; n[i].quantity = parseInt(e.target.value) || 0; setLineItems(n); }} className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="Price" value={li.unitPrice} onChange={(e) => { const n = [...lineItems]; n[i].unitPrice = parseFloat(e.target.value) || 0; setLineItems(n); }} className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
        ))}
        <button onClick={addLine} className="text-sm text-primary hover:underline">+ Add line item</button>
        <input type="number" placeholder="Tax rate %" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button onClick={submit} disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating…" : "Create invoice"}
        </button>
      </div>
    </div>
  );
}
