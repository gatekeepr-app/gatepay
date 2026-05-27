import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { inviteTokenSchema } from "@/lib/validation";
import { storeToken, getStoredToken } from "@/integrations/convex/auth";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "accepted">("loading");

  const parsed = inviteTokenSchema.safeParse(token);
  const invite = useQuery(
    api.invitations.getByToken,
    parsed.success ? { token: parsed.data } : "skip",
  );

  useEffect(() => {
    if (invite === undefined) return;
    if (!invite || invite.status !== "pending" || invite.expiresAt < Date.now()) {
      setStatus("invalid");
      return;
    }
    if (getStoredToken()) {
      setStatus("accepted");
      return;
    }
    setStatus("valid");
  }, [invite]);

  if (status === "loading" || invite === undefined || invite === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Invalid invitation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation link is invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">You're invited!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Email: <span className="font-medium text-foreground">{invite!.email}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Role: {invite!.role}
        </p>
        <div className="mt-6">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in to accept
          </a>
        </div>
      </div>
    </main>
  );
}
