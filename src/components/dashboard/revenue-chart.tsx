"use client";

import { useId } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "./delta";
import { DashboardCard } from "./card";
import { formatMoney } from "@/lib/admin/format";

type RevenueChartProps = {
  data: { day: string; amount: number }[];
  growthPct: number;
};

export function RevenueChart({ data, growthPct }: RevenueChartProps) {
  const chartUid = useId().replace(/:/g, "");

  return (
    <DashboardCard className="md:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Revenue</CardTitle>
          <Delta value={growthPct} variant="badge">
            <DeltaIcon variant="trend" />
            <DeltaValue />
          </Delta>
        </div>
        <CardDescription>Daily revenue, last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <svg width="100%" height="100%" viewBox="0 0 600 256" className="overflow-visible">
            {[0, 60, 120, 180, 230].map((y) => (
              <line key={y} x1={0} y1={y} x2={560} y2={y} stroke="hsl(var(--border))" strokeWidth={1} />
            ))}
            {data.map((d, i) => {
              const maxVal = Math.max(...data.map((x) => x.amount));
              const barH = maxVal > 0 ? (d.amount / maxVal) * 180 : 0;
              const barW = 50;
              const gap = 30;
              const x = i * (barW + gap) + gap;
              const y = 230 - barH;
              const gid = `grad-${chartUid}-${i}`;
              return (
                <g key={d.day}>
                  <defs>
                    <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <rect x={x} y={y} width={barW} height={barH} rx={6} fill={`url(#${gid})`} />
                  <text x={x + barW / 2} y={250} textAnchor="middle" fontSize={12} fill="hsl(var(--muted-foreground))">
                    {d.day}
                  </text>
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))" fontWeight="500">
                    {formatMoney(d.amount)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
