import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { getStoredToken } from "@/integrations/convex/auth";

export const Route = createFileRoute("/_admin/admin/transactions/$id")({
  component: TransactionDetailPage,
});

function TransactionDetailPage() {
  const { id } = Route.useParams();
  const tx = useQuery(api.transactions.getById, { id: id as any });
  const deleteTx = useMutation(api.transactions.remove);
  const triggerVerify = useMutation(api.public.triggerVerifyBatch);
  const [verifying, setVerifying] = useState(false);

  if (!tx) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return;
    await deleteTx({ id: id as any });
    toast.success("Transaction deleted");
  };

  const handleTriggerVerify = async () => {
    setVerifying(true);
    try {
      const result = await triggerVerify({ ids: [id as any], token: getStoredToken() ?? "" });
      if (result.groups?.[0]?.status === "delivered") {
        toast.success("Verified via callback");
      } else {
        toast.info(`Result: ${result.groups?.[0]?.status ?? "no_callback"}`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Verify failed");
    }
    setVerifying(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <Link to="/admin/transactions" className="text-sm text-primary hover:underline">← Back to transactions</Link>
      <h1 className="mt-2 text-2xl font-semibold">{tx.transactionRef}</h1>
      <div className="mt-4 space-y-2 text-sm">
        <div><span className="text-muted-foreground">Amount:</span> {tx.amount} {tx.currency}</div>
        <div><span className="text-muted-foreground">Method:</span> {tx.method ?? "—"}</div>
        <div><span className="text-muted-foreground">Status:</span> {tx.verifiedAt ? "Verified" : "Unverified"}</div>
        {tx.verifiedExternalName && <div><span className="text-muted-foreground">Verified by:</span> {tx.verifiedExternalName}</div>}
        <div className="mt-4 flex gap-2">
          {!tx.verifiedAt && (
            <button onClick={handleTriggerVerify} disabled={verifying} className="rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {verifying ? "Verifying…" : "Trigger verify"}
            </button>
          )}
          <button onClick={handleDelete} className="rounded-full bg-destructive px-4 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90">Delete</button>
        </div>
      </div>
    </div>
  );
}
