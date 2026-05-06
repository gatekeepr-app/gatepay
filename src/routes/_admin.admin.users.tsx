import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, type Role } from "@/lib/admin/usePermissions";
import { z } from "zod";
import { toast } from "sonner";
import { formatDate } from "@/lib/admin/format";
import { Copy, Trash2 } from "lucide-react";
import { sendInvitation } from "@/server/invitations.functions";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({ meta: [{ title: "Users — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: UsersPage,
});

type Invite = { id: string; email: string; role: Role; status: string; token: string; expires_at: string; created_at: string };
type RoleRow = { id: string; user_id: string; role: Role; created_at: string };

function UsersPage() {
  const { isAdmin, loading } = usePermissions();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/admin", replace: true });
  }, [loading, isAdmin, navigate]);

  const reload = async () => {
    const [i, r] = await Promise.all([
      supabase.from("invitations").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
    ]);
    setInvites((i.data ?? []) as Invite[]);
    setRoles((r.data ?? []) as RoleRow[]);
  };

  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  const invite = async () => {
    const parsed = z.object({ email: z.string().trim().email(), role: z.enum(["admin", "member"]) }).safeParse({ email, role });
    if (!parsed.success) return toast.error("Valid email + role required");
    setBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await supabase.from("invitations").insert({
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: sess.session!.user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Invitation created");
    setEmail("");
    reload();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const removeRole = async (id: string) => {
    if (!confirm("Remove this role?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  if (loading || !isAdmin) return <main className="px-6 py-10">Loading…</main>;

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="text-eyebrow text-foreground/50">Workspace</div>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Users & invitations</h1>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Invite someone</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
            className="flex-1 min-w-[240px] rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={invite} disabled={busy}
            className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50">
            {busy ? "Sending…" : "Create invite"}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Share the generated link with the invitee. They'll get the role automatically when they sign up.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pending invitations</h2>
        {invites.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No invitations.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {inv.role} · {inv.status} · expires {formatDate(inv.expires_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {inv.status === "pending" && (
                    <>
                      <button onClick={() => copyLink(inv.token)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted">
                        <Copy className="h-3 w-3" /> Copy link
                      </button>
                      <button onClick={() => revoke(inv.id)} className="rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:bg-muted">
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active roles</h2>
        {roles.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No roles assigned.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {roles.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{r.user_id}</div>
                  <div className="text-xs text-muted-foreground">{r.role} · since {formatDate(r.created_at)}</div>
                </div>
                {r.role !== "super_admin" && (
                  <button onClick={() => removeRole(r.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:bg-muted">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
