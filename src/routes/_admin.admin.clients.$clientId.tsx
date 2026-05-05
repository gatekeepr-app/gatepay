import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Phone, Globe, Instagram, Linkedin, Twitter } from "lucide-react";
import { formatDate } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/clients/$clientId")({
  head: () => ({ meta: [{ title: "Client — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ClientDetailPage,
});

type Client = {
  id: string; name: string; email: string | null; business_name: string | null;
  brand_name: string | null; phone: string | null; notes: string | null;
  social_links: Record<string, string | null>; created_at: string;
};

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<{ id: string; project_code: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
        supabase.from("projects").select("id,project_code,name,status").eq("client_id", clientId).order("created_at", { ascending: false }),
      ]);
      if (c.error) toast.error(c.error.message);
      setClient(c.data as Client | null);
      setProjects((p.data ?? []) as typeof projects);
      setLoading(false);
    })();
  }, [clientId]);

  if (loading) return <main className="px-6 py-10">Loading…</main>;
  if (!client) return <main className="px-6 py-10">Not found.</main>;

  const social = client.social_links ?? {};

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/clients" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to clients
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.business_name}{client.brand_name ? ` · ${client.brand_name}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Added {formatDate(client.created_at)}</p>
        </div>
        <Link
          to="/admin/projects/new"
          search={{ client: client.id }}
          className="rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          + New project for client
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {client.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a></li>}
            {client.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{client.phone}</li>}
            {social.website && <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><a href={social.website} target="_blank" rel="noreferrer" className="hover:underline">{social.website}</a></li>}
            {social.instagram && <li className="flex items-center gap-2"><Instagram className="h-4 w-4 text-muted-foreground" />{social.instagram}</li>}
            {social.linkedin && <li className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-muted-foreground" />{social.linkedin}</li>}
            {social.x && <li className="flex items-center gap-2"><Twitter className="h-4 w-4 text-muted-foreground" />{social.x}</li>}
          </ul>
          {client.notes && (
            <>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{client.notes}</p>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Projects</h2>
          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {projects.map((p) => (
                <li key={p.id} className="py-3">
                  <Link to="/admin/projects/$projectId" params={{ projectId: p.id }} className="flex items-center justify-between hover:underline">
                    <span>
                      <span className="text-xs text-muted-foreground">{p.project_code}</span>
                      <span className="ml-2 font-medium">{p.name}</span>
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
