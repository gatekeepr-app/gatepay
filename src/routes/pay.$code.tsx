import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/admin/format";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/pay/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Pay ${params.code} — Gatekeepr` },
      { name: "description", content: "Securely complete your project payment." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PayPage,
});

type LinkRow = {
  id: string;
  code: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  expires_at: string | null;
  paid_at: string | null;
  project_id: string;
};

function PayPage() {
  const { code } = Route.useParams();
  const [link, setLink] = useState<LinkRow | null>(null);
  const [project, setProject] = useState<{ name: string; project_code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ payer_name: "", method: "bKash", transaction_ref: "", notes: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payment_links")
        .select("id,code,amount,currency,description,status,expires_at,paid_at,project_id")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (data) {
        setLink(data as any);
        const { data: p } = await supabase
          .from("projects")
          .select("name,project_code")
          .eq("id", (data as any).project_id)
          .maybeSingle();
        setProject(p as any);
      }
      setLoading(false);
    })();
  }, [code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    if (!form.transaction_ref.trim()) return toast.error("Transaction reference is required");
    if (!form.payer_name.trim()) return toast.error("Your name is required");
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      transaction_ref: form.transaction_ref.trim(),
      amount: link.amount,
      currency: link.currency,
      occurred_at: new Date().toISOString(),
      method: form.method || null,
      project_id: link.project_id,
      notes: `Submitted via /pay/${link.code} by ${form.payer_name}${form.notes ? ` — ${form.notes}` : ""}`,
      created_by: "00000000-0000-0000-0000-000000000000",
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("transactions_ref_unique") ? "This reference has already been submitted." : "Could not submit. Please contact support.");
      return;
    }
    setDone(true);
  };

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading…</main>;
  }

  if (!link) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Invalid payment link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The code <span className="font-mono">{code}</span> doesn't exist or has been removed.
          </p>
        </div>
      </main>
    );
  }

  const expired = link.expires_at && new Date(link.expires_at) < new Date();
  const inactive = link.status !== "active" || expired || link.paid_at;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure payment
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{project?.name ?? "Project payment"}</h1>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {project?.project_code} · code {link.code}
          </div>

          <div className="mt-6 rounded-xl bg-muted p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</div>
            <div className="mt-1 text-3xl font-semibold">{formatMoney(Number(link.amount), link.currency)}</div>
            {link.description && <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>}
          </div>

          {done ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-foreground" />
              <h2 className="mt-3 text-lg font-semibold">Payment submitted</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We've recorded your payment. Our team will verify it and reach out shortly.
              </p>
            </div>
          ) : inactive ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-6 text-center">
              <h2 className="text-lg font-semibold">
                {link.paid_at ? "Already paid" : expired ? "Link expired" : "Link disabled"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please contact us to receive a new payment link.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Send the amount via your preferred method, then submit the transaction reference below to confirm.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Your name *</span>
                <input
                  value={form.payer_name}
                  onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Payment method</span>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                >
                  <option>bKash</option>
                  <option>Nagad</option>
                  <option>Rocket</option>
                  <option>Bank transfer</option>
                  <option>Card</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Transaction reference *</span>
                <input
                  value={form.transaction_ref}
                  onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })}
                  placeholder="e.g. 8FA2K9JX"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-foreground/30"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : `Confirm payment of ${formatMoney(Number(link.amount), link.currency)}`}
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Powered by Gatekeepr</p>
      </div>
    </main>
  );
}
