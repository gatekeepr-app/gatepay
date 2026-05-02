import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!sess.session) {
        navigate({
          to: "/login",
          search: { redirect: location.pathname },
          replace: true,
        });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      if (cancelled) return;
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      setState(isAdmin ? "ok" : "denied");
    };

    evaluate();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        navigate({
          to: "/login",
          search: { redirect: location.pathname },
          replace: true,
        });
      } else {
        evaluate();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

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
            You're signed in but don't have admin permission.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/login", replace: true });
            }}
            className="mt-6 rounded-full border border-border px-5 py-2 text-sm hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
