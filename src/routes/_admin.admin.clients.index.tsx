import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/admin/format";

export const Route = createFileRoute("/_admin/admin/clients/")({
  head: () => ({ meta: [{ title: "Clients — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ClientsPage,
});

type Client = {
  id: string;
  name: string;
  email: string | null;
  business_name: string | null;
  brand_name: string | null;
  created_at: string;
};

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("clients")
        .select("id,name,email,business_name,brand_name,created_at")
        .order("created_at", { ascending: false });
      setClients((data ?? []) as Client[]);
      setLoading(false);
    })();
  }, []);

  const filtered = clients.filter((c) => {
    const s = q.toLowerCase();
    return (
      !s ||
      c.name.toLowerCase().includes(s) ||
      (c.email ?? "").toLowerCase().includes(s) ||
      (c.business_name ?? "").toLowerCase().includes(s) ||
      (c.brand_name ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-eyebrow text-foreground/50">Workspace</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Clients</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${clients.length} total`}
          </p>
        </div>
        <Link
          to="/admin/clients/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add client
        </Link>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/30"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {loading ? "Loading…" : "No clients yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to="/admin/clients/$clientId" params={{ clientId: c.id }} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.brand_name && (
                      <span className="ml-2 text-xs text-muted-foreground">{c.brand_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.business_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
