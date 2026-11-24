import { Badge } from "@/components/ui/badge";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  sent: "border-border bg-muted text-muted-foreground",
  paid: "border-[#dbe8dc] bg-[#edf4ed] text-[#456849] dark:border-[#344a36] dark:bg-[#202c21] dark:text-[#b8d2ba]",
  overdue: "border-[#f0e2c8] bg-[#fbf3e4] text-[#87652b] dark:border-[#4e4029] dark:bg-[#30291d] dark:text-[#d8bd88]",
  void: "border-border bg-muted text-muted-foreground",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const knownStatuses: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "void"];
  const normalizedStatus = knownStatuses.includes(status as InvoiceStatus) ? status as InvoiceStatus : "draft";
  return (
    <Badge variant="outline" className={statusStyles[normalizedStatus]}>
      {normalizedStatus.replaceAll("_", " ")}
    </Badge>
  );
}
