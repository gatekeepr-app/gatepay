"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, FileText, UserCog, LogOut, Wallet, Code2, KeyRound, BarChart3, Menu, X, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/projects", label: "Projects", icon: Briefcase },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/transactions", label: "Transactions", icon: Wallet },
  { to: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/admin/api-docs", label: "API Docs", icon: Code2 },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/activity-log", label: "Activity Log", icon: History },
];

function SidebarContent({
  user,
  onSignOut,
  onLinkClick,
}: {
  user: { _id: string; email: string; name?: string; role: string };
  onSignOut: () => void;
  onLinkClick?: () => void;
}) {
  const path = usePathname();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <>
      <div className="border-b border-border px-5 py-5">
        <Link href="/admin" onClick={onLinkClick} className="text-lg font-semibold tracking-tight">
          GatePay
        </Link>
        <div className="mt-1 text-xs text-muted-foreground">Workspace</div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={onLinkClick}
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
        {isAdmin && (
          <Link
            href="/admin/users"
            onClick={onLinkClick}
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
        <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{user.email}</div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );
}

export function Sidebar({
  user,
  onSignOut,
  open,
  onToggle,
}: {
  user: { _id: string; email: string; name?: string; role: string };
  onSignOut: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) onToggle();
  }, [pathname]);

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center border-b border-border bg-card px-4 py-3 md:hidden">
        <button onClick={onToggle} className="p-1">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/admin" className="ml-3 text-lg font-semibold tracking-tight">GatePay</Link>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent user={user} onSignOut={onSignOut} onLinkClick={onToggle} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden max-h-screen w-60 shrink-0 overflow-y-auto border-r border-border bg-card md:flex md:flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <SidebarContent user={user} onSignOut={onSignOut} />
      </aside>
    </>
  );
}
