import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, FileText, Settings2 } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/projects/$projectId/")({
  head: () => ({ meta: [{ title: "Project — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ProjectDetailPage,
});

type Project = {
  id: string; project_code: string; name: string; description: string | null;
  status: string; tags: string[] | null; created_at: string; created_by: string;
  pay_code: string | null;
  client: { id: string; name: string } | null;
};
type Billing = {
  billing_type: string; amount: number; currency: string;
  months_count: number | null; start_date: string | null; end_date: string | null;
  total_calculated: number; payment_terms: string | null;
};
type Invoice = { id: string; invoice_number: string; status: string; total: number; currency: string; issue_date: string };

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [p, b, i] = await Promise.all([
      supabase.from("projects").select("*,client:clients(id,name)").eq("id", projectId).maybeSingle(),
      supabase.from("project_billing").select("*").eq("project_id", projectId).maybeSingle(),
      supabase.from("invoices").select("id,invoice_number,status,total,currency,issue_date").eq("project_id", projectId).order("issue_date", { ascending: false }),
    ]);
    setProject(p.data as unknown as Project | null);
    setBilling(b.data as Billing | null);
    setInvoices((i.data ?? []) as Invoice[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
    if (error) return toast.error(error.message);
    setProject((p) => p ? { ...p, status } : p);
    toast.success("Updated");
  };

  const remove = async () => {
    if (!confirm("Delete this project? This will also remove its billing and invoices.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/admin/projects" });
  };

  if (loading) return <main className="px-6 py-10">Loading…</main>;
  if (!project) return <main className="px-6 py-10">Not found.</main>;

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to projects
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{project.project_code}</div>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{project.status}</span>
            {project.client && (
              <Link to="/admin/clients/$clientId" params={{ clientId: project.client.id }} className="hover:underline">
                {project.client.name}
              </Link>
            )}
            <span>· Created {formatDate(project.created_at)}</span>
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
          <Link
            to="/admin/projects/$projectId/billing"
            params={{ projectId }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <Settings2 className="h-4 w-4" /> Billing
          </Link>
          <Link
            to="/admin/projects/$projectId/billing"
            params={{ projectId }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <Settings2 className="h-4 w-4" /> Billing
          </Link>
          <Link
            to="/admin/invoices/new"
            search={{ project: projectId }}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            <FileText className="h-4 w-4" /> Generate invoice
          </Link>
        </div>
      </div>

      {project.pay_code && (
        <section className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Client payment link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this permanent link with the client. It always shows the next payment due based on this project's billing.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {typeof window !== "undefined" ? window.location.origin : ""}/pay/{project.pay_code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pay/${project.pay_code}`);
                toast.success("Link copied");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <a
              href={`/pay/${project.pay_code}`}
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
              <div><span className="text-muted-foreground">Type:</span> {billing.billing_type}</div>
              <div><span className="text-muted-foreground">Rate:</span> {formatMoney(billing.amount, billing.currency)}{billing.billing_type === "monthly" ? ` / month × ${billing.months_count ?? 1}` : billing.billing_type === "yearly" ? " / year" : ""}</div>
              {billing.start_date && <div><span className="text-muted-foreground">Period:</span> {formatDate(billing.start_date)} → {formatDate(billing.end_date)}</div>}
              {billing.payment_terms && <div><span className="text-muted-foreground">Terms:</span> {billing.payment_terms}</div>}
              <div className="mt-3 rounded-lg bg-muted p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                <div className="mt-1 text-2xl font-semibold">{formatMoney(billing.total_calculated, billing.currency)}</div>
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
          <button onClick={remove} className="mt-6 text-xs text-destructive hover:underline">Delete project</button>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="py-3">
                <Link to="/admin/invoices/$invoiceId" params={{ invoiceId: inv.id }} className="flex items-center justify-between hover:underline">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">{inv.invoice_number}</span>
                    <span className="ml-3 text-xs text-muted-foreground">{formatDate(inv.issue_date)}</span>
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
      </section>
    </main>
  );
}
