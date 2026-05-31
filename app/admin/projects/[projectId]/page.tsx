"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { ArrowLeft, Copy, FileText, Pencil, Settings2 } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const token = getStoredToken();
  const project = useQuery(api.projects.getById, token ? { id: projectId as any, token } : "skip");
  const billing = useQuery(api.billing.getByProject, token ? { projectId: projectId as any } : "skip");
  const invoices = useQuery(api.invoices.list, token ? { token } : "skip");
  const clients = useQuery(api.clients.list, token ? { token } : "skip");
  const projectInvoices = invoices?.filter((i: any) => i.projectId === projectId);
  const deleteProject = useMutation(api.projects.remove);
  const updateProject = useMutation(api.projects.update);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", clientId: "", status: "draft", tags: [] as string[] });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  if (!project) return <main className="px-6 py-10 text-sm text-muted-foreground">Loading…</main>;

  const openEdit = () => {
    setEditForm({
      name: project.name,
      description: project.description ?? "",
      clientId: project.clientId ?? "",
      status: project.status,
      tags: project.tags ?? [],
    });
    setTagInput("");
    setEditOpen(true);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || editForm.tags.includes(t)) return;
    setEditForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const saveEdit = async () => {
    const name = editForm.name.trim();
    if (!name) return toast.error("Name is required");
    setSaving(true);
    try {
      await updateProject({
        id: projectId as any,
        name,
        description: editForm.description.trim() || undefined,
        clientId: editForm.clientId ? (editForm.clientId as any) : undefined,
        status: editForm.status,
        tags: editForm.tags,
        token: getStoredToken()!,
      });
      toast.success("Project updated");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update");
    }
    setSaving(false);
  };

  const setStatus = async (status: string) => {
    try {
      await updateProject({ id: projectId as any, status, token: getStoredToken()! });
      toast.success("Updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project? This will also remove its billing and invoices.")) return;
    await deleteProject({ id: projectId as any, token: getStoredToken()! });
    toast.success("Deleted");
  };

  return (
    <main className="px-6 py-10 md:px-10">
      <Link href="/admin/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to projects
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{project.projectCode}</div>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{project.status}</span>
            {project.clientId && clients && (
              <Link href={`/admin/clients/${project.clientId}`} className="hover:underline">
                {clients.find((c: any) => c._id === project.clientId)?.name ?? "—"}
              </Link>
            )}
            <span>· Created {formatDate(new Date(project._creationTime))}</span>
          </div>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <Link
            href={`/admin/projects/${projectId}/billing`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <Settings2 className="h-4 w-4" /> Billing
          </Link>
          <Link
            href="/admin/invoices/new"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            <FileText className="h-4 w-4" /> Generate invoice
          </Link>
        </div>
      </div>

      {project.payCode && (
        <section className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Client payment link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this permanent link with the client. It always shows the next payment due based on this project&apos;s billing.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {typeof window !== "undefined" ? window.location.origin : ""}/pay/{project.payCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pay/${project.payCode}`);
                toast.success("Link copied");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <a
              href={`/pay/${project.payCode}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Open
            </a>
          </div>
        </section>
      )}

      {project.description && (
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Billing</h2>
          {billing ? (
            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">Type:</span> {billing.billingType}</div>
              <div><span className="text-muted-foreground">Rate:</span> {formatMoney(billing.amount, billing.currency)}{billing.billingType === "monthly" ? ` / month × ${billing.monthsCount ?? 1}` : billing.billingType === "yearly" ? " / year" : ""}</div>
              {billing.startDate && <div><span className="text-muted-foreground">Period:</span> {formatDate(new Date(billing.startDate))} → {formatDate(billing.endDate ? new Date(billing.endDate) : undefined)}</div>}
              {billing.paymentTerms && <div><span className="text-muted-foreground">Terms:</span> {billing.paymentTerms}</div>}
              <div className="mt-3 rounded-lg bg-muted p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                <div className="mt-1 text-2xl font-semibold">{formatMoney(billing.totalCalculated, billing.currency)}</div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No billing configured.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["draft", "active", "paused", "completed"].map((s) => (
              <button key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs ${project.status === s ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={handleDelete} className="mt-6 text-xs text-destructive hover:underline">Delete project</button>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Invoices</h2>
        {!projectInvoices || projectInvoices.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {projectInvoices.map((inv: any) => (
              <li key={inv._id} className="py-3">
                <Link href={`/admin/invoices/${inv._id}`} className="flex items-center justify-between hover:underline">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">{inv.invoiceNumber}</span>
                    <span className="ml-3 text-xs text-muted-foreground">{formatDate(new Date(inv.issueDate))}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{inv.status}</span>
                    <span className="font-medium">{formatMoney(inv.total, inv.currency)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/invoices/new" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <FileText className="h-3 w-3" /> New invoice
        </Link>
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Name *</span>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Description</span>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Client</span>
              <select value={editForm.clientId} onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">— None —</option>
                {clients?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-2">
                {editForm.tags.map((t) => (
                  <button key={t} type="button" onClick={() => setEditForm({ ...editForm, tags: editForm.tags.filter((x) => x !== t) })}
                    className="rounded-full bg-muted px-2 py-1 text-xs">
                    {t} ×
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <button type="button" onClick={addTag} className="rounded-lg border border-border px-3 text-sm">Add</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setEditOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="button" onClick={saveEdit} disabled={saving}
              className="rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
