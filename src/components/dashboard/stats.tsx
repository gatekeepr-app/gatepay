"use client";

import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "./delta";
import { DashboardCard } from "./card";

type Stat = {
  label: string;
  value: string;
  delta: number;
};

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <>
      {stats.map((s) => (
        <DashboardCard key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-normal text-xs tracking-wide text-muted-foreground">
              {s.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
          </CardContent>
          <CardFooter className="gap-1 rounded-none bg-muted/50 text-xs">
            <Delta value={s.delta}>
              <DeltaIcon />
              <DeltaValue />
            </Delta>
            <span className="text-muted-foreground">vs last week</span>
          </CardFooter>
        </DashboardCard>
      ))}
    </>
  );
}
