import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export const Route = createFileRoute("/_admin/admin/clients/$clientId")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const client = useQuery(api.clients.getById, { id: clientId as any });

  if (!client) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link to="/admin/clients" className="text-sm text-primary hover:underline">← Back to clients</Link>
      <h1 className="mt-2 text-2xl font-semibold">{client.name}</h1>
      <div className="mt-4 space-y-2 text-sm">
        {client.email && <div><span className="text-muted-foreground">Email:</span> {client.email}</div>}
        {client.businessName && <div><span className="text-muted-foreground">Business:</span> {client.businessName}</div>}
        {client.brandName && <div><span className="text-muted-foreground">Brand:</span> {client.brandName}</div>}
        {client.phone && <div><span className="text-muted-foreground">Phone:</span> {client.phone}</div>}
      </div>
    </div>
  );
}
