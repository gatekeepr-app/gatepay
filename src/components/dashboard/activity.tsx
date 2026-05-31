"use client";

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "./card";
import { formatDate } from "@/lib/admin/format";

type ActivityItem = {
  title: string;
  time: string;
  icon: string;
};

export function DashboardActivity({ items }: { items: ActivityItem[] }) {
  return (
    <DashboardCard>
      <CardHeader className="border-b">
        <CardTitle>Activity</CardTitle>
        <CardDescription>Latest updates in your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item, i) => (
            <li className="flex h-16 items-center gap-3 px-6" key={i}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="line-clamp-1 text-pretty text-sm leading-snug text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </DashboardCard>
  );
}
