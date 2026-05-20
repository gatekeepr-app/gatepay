import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Check, KeyRound, Trash2, Plus, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/api-keys")({
  component: ApiKeysPage,
});

async function generateToken(): Promise<{ token: string; hash: string; prefix: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const token = `gk_${b64}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { token, hash, prefix: token.slice(0, 10) };
}

function generateSigningSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Row = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  business_name: string | null;
  callback_url: string | null;
  key_token: string | null;
  signing_secret: string | null;
};

function ApiKeysPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newCredential, setNewCredential] = useState<{ token: string; secret: string } | null>(
    null,
  );
  const [copied, setCopied] = useState<"token" | "secret" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCallback, setEditCallback] = useState("");
  const [editBusiness, setEditBusiness] = useState("");
  const [viewing, setViewing] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used_at, revoked_at, business_name, callback_url")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const userId = sess.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { token, hash, prefix } = await generateToken();
      const signing = generateSigningSecret();
      const { error } = await supabase.from("api_keys").insert({
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
        created_by: userId,
        business_name: businessName.trim() || null,
        callback_url: callbackUrl.trim() || null,
        signing_secret: signing,
      });
      if (error) throw new Error(error.message);
      setNewCredential({ token, secret: signing });
      setName("");
      setBusinessName("");
      setCallbackUrl("");
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this API key? Calls using it will start failing immediately.")) return;
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Key revoked");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this API key permanently?")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Key deleted");
    load();
  };

  const startEdit = (r: Row) => {
    setEditingId(r.id);
    setEditCallback(r.callback_url ?? "");
    setEditBusiness(r.business_name ?? "");
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("api_keys")
      .update({
        callback_url: editCallback.trim() || null,
        business_name: editBusiness.trim() || null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditingId(null);
    load();
  };

  const copyTo = async (kind: "token" | "secret", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Developers</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bearer tokens used by partner websites to submit and verify transactions.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New key
          </button>
        )}
      </header>

      {showForm && (
        <form onSubmit={create} className="mb-6 space-y-3 rounded-lg border border-border bg-card p-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Key label
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nerdy production"
              maxLength={120}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Business name
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Nerdy — used to group inbound transactions"
              maxLength={160}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Stamped on transactions this key submits. Used to route verify-batches back.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Callback URL
            </label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="https://your-site.com/api/gatekeepr/verify-batch"
              maxLength={500}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              When admin hits "Trigger verify", we POST the batch of unverified transactions to this URL.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setName("");
                setBusinessName("");
                setCallbackUrl("");
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create key"}
            </button>
          </div>
        </form>
      )}

      {newCredential && (
        <div className="mb-6 rounded-lg border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4" /> Copy these now — shown only once
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Store both in your secret manager. Gatekeepr only keeps a hash of the token; the
                signing secret is shown once and cannot be retrieved later.
              </p>
            </div>
            <button
              onClick={() => setNewCredential(null)}
              className="rounded p-1 text-muted-foreground hover:bg-background"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                API token (Authorization: Bearer …)
              </div>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background p-2">
                <code className="flex-1 break-all font-mono text-xs">{newCredential.token}</code>
                <button
                  onClick={() => copyTo("token", newCredential.token)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted"
                >
                  {copied === "token" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "token" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Signing secret (verifies X-Gatekeepr-Signature on callbacks)
              </div>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background p-2">
                <code className="flex-1 break-all font-mono text-xs">{newCredential.secret}</code>
                <button
                  onClick={() => copyTo("secret", newCredential.secret)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted"
                >
                  {copied === "secret" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "secret" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Business</th>
              <th className="px-3 py-2">Callback URL</th>
              <th className="px-3 py-2">Prefix</th>
              <th className="px-3 py-2">Last used</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No API keys yet. Create one to start authorizing partner calls.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">
                    {editingId === r.id ? (
                      <input
                        value={editBusiness}
                        onChange={(e) => setEditBusiness(e.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    ) : (
                      <span className="text-muted-foreground">{r.business_name || "—"}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[260px]">
                    {editingId === r.id ? (
                      <input
                        type="url"
                        value={editCallback}
                        onChange={(e) => setEditCallback(e.target.value)}
                        placeholder="https://…"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    ) : (
                      <span className="block truncate text-xs text-muted-foreground" title={r.callback_url ?? ""}>
                        {r.callback_url || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {r.key_prefix}…
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {r.last_used_at ? new Date(r.last_used_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs",
                        r.revoked_at
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      {r.revoked_at ? "Revoked" : "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      {editingId === r.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(r.id)}
                            className="rounded px-2 py-1 text-xs hover:bg-muted"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded px-2 py-1 text-xs hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(r)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {!r.revoked_at && (
                            <button
                              onClick={() => revoke(r.id)}
                              className="rounded px-2 py-1 text-xs hover:bg-muted"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => remove(r.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
