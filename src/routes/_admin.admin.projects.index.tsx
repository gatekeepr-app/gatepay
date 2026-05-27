import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = useQuery(api.projects.list);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link to="/admin/projects/new">
          <Button><Plus className="mr-2 h-4 w-4" />New project</Button>
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {projects?.map((p) => (
          <Link
            key={p._id}
            to="/admin/projects/$projectId"
            params={{ projectId: p._id }}
            className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50"
          >
            <div className="font-medium">{p.name}</div>
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
              <span>{p.projectCode}</span>
              <span className={`rounded px-1.5 py-0.5 ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-muted"}`}>{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
