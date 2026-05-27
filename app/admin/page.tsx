"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Users, Briefcase, FileText, MessageSquare } from "lucide-react";

export default function DashboardPage() {
  const clients = useQuery(api.clients.list);
  const projects = useQuery(api.projects.list);
  const invoices = useQuery(api.invoices.list);
  const leads = useQuery(api.leads.list);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Clients" value={clients?.length ?? "…"} />
        <StatCard icon={Briefcase} label="Projects" value={projects?.length ?? "…"} />
        <StatCard icon={FileText} label="Invoices" value={invoices?.length ?? "…"} />
        <StatCard icon={MessageSquare} label="Leads" value={leads?.length ?? "…"} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
