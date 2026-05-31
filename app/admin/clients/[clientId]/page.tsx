"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import { formatDate } from "@/lib/admin/format";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const token = getStoredToken();
  const client = useQuery(api.clients.getById, token ? { id: clientId as any, token } : "skip");
  const projects = useQuery(api.projects.list, token ? { token } : "skip");
  const updateClient = useMutation(api.clients.update);
  const deleteClient = useMutation(api.clients.remove);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", businessName: "", brandName: "", phone: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const clientProjects = projects?.filter((p) => p.clientId === clientId);

  if (!client) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const openEdit = () => {
    setForm({
      name: client.name,
      email: client.email ?? "",
      businessName: client.businessName ?? "",
      brandName: client.brandName ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? "",
    });
    setEditOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await updateClient({
        id: clientId as any,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        businessName: form.businessName.trim() || undefined,
        brandName: form.brandName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        token: getStoredToken()!,
      });
      toast.success("Client updated");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    await deleteClient({ id: clientId as any, token: getStoredToken()! });
    toast.success("Client deleted");
  };

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to clients
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {client.email && <div className="text-sm text-muted-foreground">{client.email}</div>}
        </div>
        <button onClick={openEdit} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>

      {/* Details */}
      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Field label="Name">{client.name}</Field>
          <Field label="Email">{client.email ?? "—"}</Field>
          <Field label="Business">{client.businessName ?? "—"}</Field>
          <Field label="Brand">{client.brandName ?? "—"}</Field>
          <Field label="Phone">{client.phone ?? "—"}</Field>
          <Field label="Created">{formatDate(new Date(client.createdAt))}</Field>
        </div>
        {client.notes && (
          <div className="mt-4">
            <Field label="Notes">{client.notes}</Field>
          </div>
        )}
      </section>

      {/* Linked projects */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Projects</h2>
        {!clientProjects || clientProjects.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No projects linked.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {clientProjects.map((p: any) => (
              <li key={p._id}>
                <Link href={`/admin/projects/${p._id}`} className="flex items-center justify-between py-3 text-sm hover:underline">
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-muted-foreground">({p.projectCode})</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-muted"}`}>{p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={handleDelete} className="mt-6 text-xs text-destructive hover:underline">Delete client</button>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Name *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Business name</span>
              <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Brand name</span>
              <input value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setEditOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="button" onClick={save} disabled={saving}
              className="rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
