"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export default function LeadsPage() {
  const leads = useQuery(api.leads.list);
  const updateStatus = useMutation(api.leads.updateStatus);
  const deleteLead = useMutation(api.leads.remove);

  const mark = async (id: string, status: string) => {
    await updateStatus({ id: id as any, status });
    toast.success(`Lead marked as ${status}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Leads</h1>
      <div className="mt-4 space-y-2">
        {leads?.map((lead) => (
          <div key={lead._id} className="rounded-lg border border-border bg-card p-4">
            <div className="font-medium">{lead.name}</div>
            <div className="text-xs text-muted-foreground">{lead.email} · {lead.status}</div>
            {lead.message && <div className="mt-1 text-sm">{lead.message}</div>}
            <div className="mt-2 flex gap-2">
              {lead.status === "new" && <button onClick={() => mark(lead._id, "contacted")} className="rounded bg-muted px-2 py-1 text-xs">Contacted</button>}
              <button onClick={() => deleteLead({ id: lead._id })} className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
