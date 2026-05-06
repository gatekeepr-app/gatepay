import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Briefcase, FileText, Inbox, UserCog, LogOut, Wallet, Code2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/lib/admin/usePermissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/projects", label: "Projects", icon: Briefcase },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/transactions", label: "Transactions", icon: Wallet },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/admin/api-docs", label: "API Docs", icon: Code2 },
];

export function Sidebar() {
  const { isAdmin, email } = usePermissions();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.href = "/";
  };

  return (
    <aside className="hidden h-screen w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link to="/admin" className="text-lg font-semibold tracking-tight">
          Gatekeepr
        </Link>
        <div className="mt-1 text-xs text-muted-foreground">Workspace</div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {isSuperAdmin && (
          <Link
            to="/admin/users"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              path.startsWith("/admin/users")
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            <UserCog className="h-4 w-4" />
            Users
          </Link>
        )}
      </nav>
      <div className="border-t border-border p-3">
        <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{email}</div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
