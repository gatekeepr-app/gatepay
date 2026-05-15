import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inviteTokenSchema } from "@/lib/validation";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({ meta: [{ title: "Accept invitation — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InvitePage,
});

type Invite = { id: string; email: string; role: string; status: string; expires_at: string };

function InvitePage() {
  const { token } = Route.useParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "expired" | "missing" | "accepted">("loading");

  useEffect(() => {
    (async () => {
      const tokenParsed = inviteTokenSchema.safeParse(token);
      if (!tokenParsed.success) return setState("missing");
      const { data } = await supabase
        .from("invitations")
        .select("id,email,role,status,expires_at")
        .eq("token", tokenParsed.data)
        .maybeSingle();
      if (!data) return setState("missing");
      if (data.status !== "pending") return setState("accepted");
      if (new Date(data.expires_at).getTime() < Date.now()) return setState("expired");
      setInvite(data as Invite);
      setState("ok");
    })();
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold">Workspace invitation</h1>
        {state === "loading" && <p className="mt-4 text-sm text-muted-foreground">Checking…</p>}
        {state === "missing" && <p className="mt-4 text-sm text-muted-foreground">This invitation link is not valid.</p>}
        {state === "expired" && <p className="mt-4 text-sm text-muted-foreground">This invitation has expired.</p>}
        {state === "accepted" && <p className="mt-4 text-sm text-muted-foreground">This invitation has already been used or revoked.</p>}
        {state === "ok" && invite && (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              You're invited as <strong className="text-foreground">{invite.role}</strong>.
              <br />Sign up with <strong className="text-foreground">{invite.email}</strong> to accept.
            </p>
            <Link to="/login" search={{ redirect: "/admin", invite_email: invite.email } as never}
              className="mt-6 inline-block rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90">
              Continue to sign up
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
