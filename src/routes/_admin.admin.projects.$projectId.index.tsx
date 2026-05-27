import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/projects/$projectId/")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const project = useQuery(api.projects.getById, { id: projectId as any });
  const invoices = useQuery(api.invoices.list);
  const projectInvoices = invoices?.filter((i) => i.projectId === projectId);
  const deleteProject = useMutation(api.projects.remove);
  const updateProject = useMutation(api.projects.update);

  if (!project) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const handleDelete = async () => {
    if (!confirm("Delete this project?")) return;
    await deleteProject({ id: projectId as any });
    toast.success("Project deleted");
  };

  return (
    <div className="p-6 max-w-2xl">
      <Link to="/admin/projects" className="text-sm text-primary hover:underline">← Back to projects</Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="font-mono text-xs text-muted-foreground">{project.projectCode}</div>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/projects/$projectId/billing" params={{ projectId }}>
            <Button variant="outline">Billing</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div><span className="text-muted-foreground">Status:</span> <span className={`rounded px-1.5 py-0.5 ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-muted"}`}>{project.status}</span></div>
        {project.description && <div><span className="text-muted-foreground">Description:</span> {project.description}</div>}
        {project.payCode && <div><span className="text-muted-foreground">Pay code:</span> <span className="font-mono">{project.payCode}</span></div>}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Invoices</h2>
      <div className="mt-2 space-y-2">
        {projectInvoices?.map((inv) => (
          <Link key={inv._id} to="/admin/invoices/$invoiceId" params={{ invoiceId: inv._id }} className="block rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted/50">
            <div className="font-medium">{inv.invoiceNumber}</div>
            <div className="text-xs text-muted-foreground">{inv.status} · {inv.total} {inv.currency}</div>
          </Link>
        ))}
        {(!projectInvoices || projectInvoices.length === 0) && <p className="text-sm text-muted-foreground">No invoices.</p>}
        <Link to="/admin/invoices/new"><Button size="sm" className="mt-2">New invoice</Button></Link>
      </div>
    </div>
  );
}
