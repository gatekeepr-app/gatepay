import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/admin/format";

export const Route = createFileRoute("/_admin/admin/projects/")({
  head: () => ({ meta: [{ title: "Projects — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ProjectsPage,
});

type Project = {
  id: string; project_code: string; name: string; status: string;
  tags: string[] | null; created_at: string;
  client: { name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-foreground/70",
  active: "bg-foreground text-background",
  paused: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  completed: "bg-green-500/15 text-green-700 dark:text-green-400",
};

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id,project_code,name,status,tags,created_at,client:clients(name)")
        .order("created_at", { ascending: false });
      setProjects((data ?? []) as unknown as Project[]);
      setLoading(false);
    })();
  }, []);

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const s = q.toLowerCase();
    if (!s) return true;
    return (
      p.name.toLowerCase().includes(s) ||
      p.project_code.toLowerCase().includes(s) ||
      (p.client?.name ?? "").toLowerCase().includes(s) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(s))
    );
  });

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-eyebrow text-foreground/50">Workspace</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loading ? "Loading…" : `${projects.length} total`}</p>
        </div>
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">{loading ? "Loading…" : "No projects yet."}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.project_code}</td>
                  <td className="px-4 py-3">
                    <Link to="/admin/projects/$projectId" params={{ projectId: p.id }} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    {p.tags && p.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.client?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_COLORS[p.status] ?? "bg-muted"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
