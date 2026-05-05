import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/admin/Sidebar";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = () => {
      const redirectParam = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.replace(`/login?redirect=${redirectParam}`);
    };

    const evaluate = async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!sess.session) {
          redirectToLogin();
          return;
        }
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sess.session.user.id);
        if (cancelled) return;
        if (error) {
          console.error("[admin] role check failed", error);
          setState("denied");
          return;
        }
        const allowed = ["super_admin", "admin", "member"];
        const hasAccess = (roles ?? []).some((r) => allowed.includes(r.role));
        setState(hasAccess ? "ok" : "denied");
      } catch (e) {
        console.error("[admin] auth check error", e);
        if (!cancelled) redirectToLogin();
      }
    };

    evaluate();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        if (cancelled) return;
        if (!session) {
          redirectToLogin();
        } else {
          setState("checking");
          evaluate();
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in but don't have workspace access.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/", replace: true });
            }}
            className="mt-6 rounded-full border border-border px-5 py-2 text-sm hover:bg-muted"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
