import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, Plus, Trash2 } from "lucide-react";
import { CURRENCIES, formatMoney, formatDate } from "@/lib/admin/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/projects/$projectId/payment-links")({
  head: () => ({ meta: [{ title: "Payment links — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PaymentLinksPage,
});

type PaymentLink = {
  id: string;
  code: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
};

function genCode() {
  // 6-char base32-ish, no ambiguous chars
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const inputCls = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/30";

function PaymentLinksPage() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<{ name: string; project_code: string } | null>(null);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "BDT", description: "", expires_at: "" });

  const load = async () => {
    const [p, l] = await Promise.all([
      supabase.from("projects").select("name,project_code").eq("id", projectId).maybeSingle(),
      supabase
        .from("payment_links")
        .select("id,code,amount,currency,description,status,expires_at,paid_at,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);
    setProject(p.data as any);
    setLinks((l.data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("Amount must be > 0");
    setCreating(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      setCreating(false);
      return toast.error("Not signed in");
    }

    // Try to insert with a fresh code; retry on unique conflict
    let lastErr: any = null;
    for (let i = 0; i < 5; i++) {
      const code = genCode();
      const { error } = await supabase.from("payment_links").insert({
        code,
        project_id: projectId,
        amount,
        currency: form.currency,
        description: form.description.trim() || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        created_by: uid,
      });
      if (!error) {
        lastErr = null;
        break;
      }
      lastErr = error;
      if (!String(error.message).includes("duplicate")) break;
    }
    setCreating(false);
    if (lastErr) return toast.error(lastErr.message);
    setForm({ amount: "", currency: "BDT", description: "", expires_at: "" });
    toast.success("Payment link created");
    load();
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/pay/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this payment link?")) return;
    const { error } = await supabase.from("payment_links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLinks((ls) => ls.filter((l) => l.id !== id));
  };

  const toggleStatus = async (l: PaymentLink) => {
    const next = l.status === "active" ? "disabled" : "active";
    const { error } = await supabase.from("payment_links").update({ status: next }).eq("id", l.id);
    if (error) return toast.error(error.message);
    setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: next } : x)));
  };

  if (loading) return <main className="px-6 py-10">Loading…</main>;

  return (
    <main className="px-6 py-10 md:px-10">
      <Link
        to="/admin/projects/$projectId"
        params={{ projectId }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to project
      </Link>
      <div className="mt-3">
        <div className="text-xs font-mono text-muted-foreground">{project?.project_code}</div>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Payment links</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate a short link your client can open at <span className="font-mono">/pay/CODE</span> to pay this project.
        </p>
      </div>

      <form onSubmit={create} className="mt-8 max-w-3xl rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">New link</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="block md:col-span-1">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount *</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Currency</span>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Expires (optional)</span>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block md:col-span-4">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Description (shown to client)</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Milestone 1 — Design phase"
              className={inputCls}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Generate link"}
        </button>
      </form>

      <section className="mt-6 rounded-xl border border-border bg-card">
        {links.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No payment links yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {links.map((l) => {
              const url = typeof window !== "undefined" ? `${window.location.origin}/pay/${l.code}` : `/pay/${l.code}`;
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm">{l.code}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {l.status}
                      </span>
                      <span className="font-medium">{formatMoney(Number(l.amount), l.currency)}</span>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {l.description || "—"} · created {formatDate(l.created_at)}
                      {l.expires_at && ` · expires ${formatDate(l.expires_at)}`}
                      {l.paid_at && ` · paid ${formatDate(l.paid_at)}`}
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(l.code)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <a
                      href={`/pay/${l.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => toggleStatus(l)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      {l.status === "active" ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => remove(l.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
