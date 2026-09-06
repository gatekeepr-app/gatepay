"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { formatMoney } from "@/lib/admin/format";
import { getStoredToken } from "@/integrations/convex/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function RevenueForecast() {
  const token = getStoredToken();
  const forecast = useQuery(
    api.overdue.getRevenueForecast,
    token ? { token, months: 6 } : "skip"
  );

  if (!forecast || forecast.length === 0) return null;

  const data = forecast.map((f) => ({
    name: new Date(f.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    expected: f.expected,
    received: f.received,
    collectionRate: f.expected > 0 ? Math.round((f.received / f.expected) * 100) : 0,
  }));

  const totalExpected = forecast.reduce((s, f) => s + f.expected, 0);
  const totalReceived = forecast.reduce((s, f) => s + f.received, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">Revenue Forecast</h3>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatMoney(totalExpected, "BDT")}</span>
        <span className="text-sm text-muted-foreground">expected (6 months)</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {formatMoney(totalReceived, "BDT")} collected ({totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0}%)
      </div>

      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              formatter={(value: number) => formatMoney(value, "BDT")}
              contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
            />
            <Bar dataKey="expected" name="Expected" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="received" name="Received" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.collectionRate >= 80 ? "#22c55e" : entry.collectionRate >= 50 ? "#eab308" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
