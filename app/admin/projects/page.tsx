"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const token = getStoredToken();
  const projects = useQuery(api.projects.list, token ? { token } : "skip");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/admin/projects/new">
          <Button><Plus className="mr-2 h-4 w-4" />New project</Button>
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {projects?.map((p: any) => (
          <Link
            key={p._id}
            href={`/admin/projects/${p._id}`}
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
