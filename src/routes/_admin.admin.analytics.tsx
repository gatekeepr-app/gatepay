import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export const Route = createFileRoute("/_admin/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const stats = useQuery(api.analytics.getApiLogStats, { hours: 24 });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">API Usage (last 24h)</h1>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total requests</div>
          <div className="mt-1 text-2xl font-semibold">{stats?.total ?? "…"}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Errors (4xx/5xx)</div>
          <div className="mt-1 text-2xl font-semibold">{stats?.errors ?? "…"}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Error rate</div>
          <div className="mt-1 text-2xl font-semibold">
            {stats && stats.total > 0 ? `${((stats.errors / stats.total) * 100).toFixed(1)}%` : "…"}
          </div>
        </div>
      </div>

      {stats && stats.routeStats.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">By route</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Requests</th>
                  <th className="px-3 py-2">Errors</th>
                  <th className="px-3 py-2">Avg latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.routeStats.map((r) => (
                  <tr key={r.path}>
                    <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                    <td className="px-3 py-2">{r.count}</td>
                    <td className="px-3 py-2">{r.errors}</td>
                    <td className="px-3 py-2">{r.avgMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {stats && stats.keyStats.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">By API key</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Key prefix</th>
                  <th className="px-3 py-2">Requests</th>
                  <th className="px-3 py-2">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.keyStats.map((k) => (
                  <tr key={k.prefix}>
                    <td className="px-3 py-2 font-mono text-xs">{k.prefix}</td>
                    <td className="px-3 py-2">{k.count}</td>
                    <td className="px-3 py-2">{k.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {stats && stats.total === 0 && (
        <div className="mt-4 text-sm text-muted-foreground">No API calls in the last 24 hours.</div>
      )}
    </div>
  );
}
