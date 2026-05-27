import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken, clearToken } from "@/integrations/convex/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const getMe = useMutation(api.auth.getMe);
  const [user, setUser] = useState<{ _id: string; email: string; name?: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login", search: { redirect: "/admin" } });
      return;
    }
    (async () => {
      try {
        const u = await getMe({ token });
        setUser(u);
      } catch {
        clearToken();
        navigate({ to: "/login" });
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = () => {
    clearToken();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} onSignOut={handleSignOut} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
