"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { formatMoney } from "@/lib/admin/format";
import { getStoredToken } from "@/integrations/convex/auth";
import { AlertTriangle } from "lucide-react";

export function OverdueAlert() {
  const token = getStoredToken();
  const overdue = useQuery(
    api.overdue.getOverdueProjects,
    token ? { token } : "skip"
  );

  if (!overdue || overdue.length === 0) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
      <div className="flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-300">
        <AlertTriangle className="h-4 w-4" />
        {overdue.length} project{overdue.length > 1 ? "s" : ""} with overdue payment{overdue.length > 1 ? "s" : ""}
      </div>
      <div className="mt-3 space-y-2">
        {overdue.slice(0, 5).map((item: any) => (
          <div key={item.projectId} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{item.projectName}</span>
              <span className="ml-2 text-muted-foreground">({item.clientName})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">{item.month}</span>
              <span className="font-medium">{formatMoney(item.amount, item.currency)}</span>
              {item.payCode && (
                <a
                  href={`/pay/${item.payCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-orange-700 underline-offset-2 hover:underline dark:text-orange-300"
                >
                  Send link
                </a>
              )}
            </div>
          </div>
        ))}
        {overdue.length > 5 && (
          <p className="text-xs text-muted-foreground">+{overdue.length - 5} more</p>
        )}
      </div>
    </div>
  );
}
