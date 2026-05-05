import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/leads")({
  head: () => ({
    meta: [
      { title: "Admin — Gatekeepr" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads((data ?? []) as Lead[]);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((cur) => cur.filter((l) => l.id !== id));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-eyebrow text-foreground/50">Admin</div>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Leads inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {loading ? "Loading…" : `${leads.length} ${leads.length === 1 ? "lead" : "leads"} total`}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>

        <div className="mt-10 space-y-4">
          {!loading && leads.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No leads yet.
            </div>
          )}
          {leads.map((l) => (
            <article
              key={l.id}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">{l.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        l.status === "new"
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground/70"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <a href={`mailto:${l.email}`} className="hover:underline">
                      {l.email}
                    </a>
                    {l.company ? ` · ${l.company}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
                {l.message}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {l.status !== "contacted" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(l.id, "contacted")}
                  >
                    Mark contacted
                  </Button>
                )}
                {l.status !== "archived" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(l.id, "archived")}
                  >
                    Archive
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(l.id)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
