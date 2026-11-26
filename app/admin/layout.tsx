"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken, clearToken } from "@/integrations/convex/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminSessionProvider } from "@/components/admin/UserProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isInvoicePrintPage = /^\/admin\/invoices\/[^/]+\/download\/?$/.test(pathname);
  const token = getStoredToken();
  const getMe = useMutation(api.auth.getMe);
  const [user, setUser] = useState<{ _id: string; email: string; name?: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "b" && event.code !== "KeyB") return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))) return;

      event.preventDefault();
      event.stopPropagation();
      if (window.matchMedia("(min-width: 768px)").matches) {
        toggleSidebarCollapsed();
      } else {
        setSidebarOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleShortcut, true);
    return () => document.removeEventListener("keydown", handleShortcut, true);
  }, [toggleSidebarCollapsed]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

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
        await clearToken();
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

  const handleSignOut = async () => {
    await clearToken();
    router.push("/login");
  };

  return (
    <AdminSessionProvider session={{ user, token: token! }}>
      {isInvoicePrintPage ? (
        <div className="min-h-dvh bg-white">{children}</div>
      ) : (
        <>
          <style>{`.scrollico{overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none}.scrollico::-webkit-scrollbar{display:none}`}</style>
          <div className="flex max-h-screen bg-background">
            <Sidebar
              user={user}
              onSignOut={handleSignOut}
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              collapsed={sidebarCollapsed}
              onCollapseToggle={toggleSidebarCollapsed}
            />
            <div className="scrollico flex-1 max-h-screen pt-12 md:pt-0">{children}</div>
          </div>
        </>
      )}
    </AdminSessionProvider>
  );
}
