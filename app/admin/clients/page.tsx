"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  const token = getStoredToken();
  const clients = useQuery(api.clients.list, token ? { token } : "skip");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link href="/admin/clients/new">
          <Button><Plus className="mr-2 h-4 w-4" />New client</Button>
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {clients?.map((c: any) => (
          <Link
            key={c._id}
            href={`/admin/clients/${c._id}`}
            className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50"
          >
            <div className="font-medium">{c.name}</div>
            {c.email && <div className="text-sm text-muted-foreground">{c.email}</div>}
          </Link>
        ))}
        {clients && clients.length === 0 && (
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        )}
      </div>
    </div>
  );
}
