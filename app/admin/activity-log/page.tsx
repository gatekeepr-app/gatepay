"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { formatDate } from "@/lib/admin/format";

const ACTION_LABELS: Record<string, string> = {
  "user.remove": "User removed",
  "invitation.create": "Invitation sent",
  "api_key.create": "API key created",
  "api_key.revoke": "API key revoked",
  "transaction.verified": "Transaction verified",
  "transaction.reimbursed": "Transaction reimbursed",
  "transaction.failed": "Transaction failed",
  "transaction.pending": "Transaction reverted",
  "transaction.reimburse": "Payment reimbursed",
  "refund.initiate": "Refund initiated",
  "client.create": "Client created",
  "client.update": "Client updated",
  "client.remove": "Client removed",
  "project.create": "Project created",
  "project.update": "Project updated",
  "project.remove": "Project removed",
  "invoice.create": "Invoice created",
  "invoice.update": "Invoice updated",
  "invoice.remove": "Invoice removed",
};

export default function ActivityLogPage() {
  const token = getStoredToken();
  const logs = useQuery(api.admin_logs.list, token ? { token } : "skip");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Activity Log</h1>
      {!logs || logs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {logs.map((log: any) => (
            <div key={log._id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </div>
                  {log.details && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{log.details}</div>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div>{formatDate(new Date(log.createdAt))}</div>
                  {log.userEmail && <div className="mt-0.5">{log.userEmail}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
