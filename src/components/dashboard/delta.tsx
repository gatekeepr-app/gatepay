"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Badge } from "@/components/ui/badge";

type DeltaIconVariant = "default" | "trend" | "arrow";
type DeltaVariant = "default" | "badge";

type DeltaContextValue = { value: number };

const DeltaContext = React.createContext<DeltaContextValue | null>(null);

function useDeltaValue() {
  const ctx = React.useContext(DeltaContext);
  if (!ctx) throw new Error("DeltaIcon and DeltaValue must be used inside a Delta component.");
  return ctx.value;
}

function Delta({
  className,
  value,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { value: number; variant?: DeltaVariant }) {
  return (
    <DeltaContext.Provider value={{ value }}>
      {variant === "badge" ? (
        <Badge
          className={cn(
            "gap-1 border-none tabular-nums [&_svg]:size-4 [&_svg]:shrink-0",
            value > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
            className,
          )}
          variant="secondary"
          {...(props as React.ComponentProps<typeof Badge>)}
        />
      ) : (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-muted-foreground tabular-nums",
            "[&_svg]:size-3 [&_svg]:shrink-0",
            value > 0 ? "text-emerald-600 dark:text-emerald-400" : "",
            value < 0 ? "text-rose-600 dark:text-rose-400" : "",
            className,
          )}
          {...props}
        />
      )}
    </DeltaContext.Provider>
  );
}

function DeltaIcon({ variant = "default", className }: { variant?: DeltaIconVariant; className?: string }) {
  const value = useDeltaValue();
  if (!value || value === 0) return <span className={cn("text-muted-foreground", className)}>—</span>;
  if (variant === "trend") return <span className={cn(value > 0 ? "text-emerald-600" : "text-rose-600", className)}>↑</span>;
  return <span className={cn(value > 0 ? "text-emerald-600" : "text-rose-600", className)}>{value > 0 ? "↑" : "↓"}</span>;
}

function DeltaValue({ className, precision = 1, suffix = "%", absolute = true }: { className?: string; precision?: number; suffix?: string; absolute?: boolean }) {
  const value = useDeltaValue();
  const formatted = (absolute ? Math.abs(value) : value).toFixed(precision);
  return <span className={cn("tabular-nums", className)}>{formatted}{suffix}</span>;
}

export { Delta, DeltaIcon, DeltaValue };
