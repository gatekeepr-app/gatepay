"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken, clearToken } from "@/integrations/convex/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = getStoredToken();
  const getMe = useMutation(api.auth.getMe);
  const [user, setUser] = useState<{ _id: string; email: string; name?: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login?redirect=/admin");
      return;
    }
    (async () => {
      try {
        const u = await getMe({ token });
        setUser(u);
      } catch {
        clearToken();
        router.push("/login");
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
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} onSignOut={handleSignOut} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
