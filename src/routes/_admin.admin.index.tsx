import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Users, FileText, Inbox, Plus } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gatekeepr" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState({ clients: 0, projects: 0, invoices: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, p, i, l] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        clients: c.count ?? 0,
        projects: p.count ?? 0,
        invoices: i.count ?? 0,
        leads: l.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Clients", value: stats.clients, icon: Users, to: "/admin/clients" },
    { label: "Projects", value: stats.projects, icon: Briefcase, to: "/admin/projects" },
    { label: "Invoices", value: stats.invoices, icon: FileText, to: "/admin/invoices" },
    { label: "Leads", value: stats.leads, icon: Inbox, to: "/admin/leads" },
  ];

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-eyebrow text-foreground/50">Workspace</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/clients/new"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New client
          </Link>
          <Link
            to="/admin/projects/new"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> New project
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <Icon className="h-4 w-4 text-foreground/40" />
              </div>
              <div className="mt-3 text-3xl font-semibold tabular-nums">
                {loading ? "—" : c.value}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
