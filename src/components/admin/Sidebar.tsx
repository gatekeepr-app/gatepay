"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, FileText, UserCog, LogOut, Wallet, Code2, KeyRound, BarChart3, Menu, X, History, RotateCcw, PanelLeftClose, PanelLeftOpen, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/projects", label: "Projects", icon: Briefcase },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/transactions", label: "Transactions", icon: Wallet },
  { to: "/admin/refunds", label: "Refunds", icon: RotateCcw },
  { to: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/admin/api-docs", label: "API Docs", icon: Code2 },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/activity-log", label: "Activity Log", icon: History },
  { to: "/admin/settings/brand", label: "Brand settings", icon: Settings2 },
];

function SidebarContent({
  user,
  onSignOut,
  onLinkClick,
  collapsed = false,
  onCollapseToggle,
}: {
  user: { _id: string; email: string; name?: string; role: string };
  onSignOut: () => void;
  onLinkClick?: () => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}) {
  const path = usePathname();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <>
      <div className={cn("flex items-center border-b border-border py-3", collapsed ? "justify-center px-2" : "justify-between px-5")}>
        {!collapsed && (
          <Link href="/admin" onClick={onLinkClick} className="text-lg font-semibold tracking-tight" aria-label="GatePay home">
            GatePay<span className="ml-2 text-xs font-normal text-muted-foreground">Workspace</span>
          </Link>
        )}
        {onCollapseToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", collapsed && "h-7 w-7")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
            onClick={onCollapseToggle}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
        )}
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
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2 text-sm transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin/users"
            onClick={onLinkClick}
            aria-label={collapsed ? "Users" : undefined}
            title={collapsed ? "Users" : undefined}
            className={cn(
              "flex items-center rounded-lg py-2 text-sm transition-colors",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
              path.startsWith("/admin/users")
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            <UserCog className="h-4 w-4 shrink-0" />
            {!collapsed && "Users"}
          </Link>
        )}
      </nav>
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        {!collapsed && <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{user.email}</div>}
        <Button
          type="button"
          variant="ghost"
          aria-label={collapsed ? "Log out" : undefined}
          title={collapsed ? "Log out" : undefined}
          onClick={onSignOut}
          className={cn("h-9 w-full text-sm text-foreground/70", collapsed ? "justify-center px-2" : "justify-start gap-3 px-3")}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Log out"}
        </Button>
      </div>
    </>
  );
}

export function Sidebar({
  user,
  onSignOut,
  open,
  onToggle,
  collapsed,
  onCollapseToggle,
}: {
  user: { _id: string; email: string; name?: string; role: string };
  onSignOut: () => void;
  open: boolean;
  onToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) onToggle();
  }, [pathname]);

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center border-b border-border bg-card px-4 py-3 md:hidden">
        <Button type="button" variant="ghost" size="icon" aria-label={open ? "Close navigation menu" : "Open navigation menu"} onClick={onToggle}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
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
      <aside className={cn("hidden max-h-screen shrink-0 overflow-y-auto border-r border-border bg-card transition-[width] duration-200 md:flex md:flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", collapsed ? "w-16" : "w-60")}>
        <SidebarContent user={user} onSignOut={onSignOut} collapsed={collapsed} onCollapseToggle={onCollapseToggle} />
      </aside>
    </>
  );
}
