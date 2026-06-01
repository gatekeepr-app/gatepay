"use client";

import { useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { Copy, Check, Eye, EyeOff, Pencil } from "lucide-react";
import { getStoredToken } from "@/integrations/convex/auth";

export default function ApiKeysPage() {
  const token = getStoredToken() ?? "";
  const convex = useConvex();
  const keys = useQuery(api.api_keys.list, token ? { token } : "skip");
  const createKey = useMutation(api.api_keys.create);
  const updateKey = useMutation(api.api_keys.update);
  const revokeKey = useMutation(api.api_keys.revoke);
  const removeKey = useMutation(api.api_keys.remove);
  const [newCredentials, setNewCredentials] = useState<{ token: string; signingSecret: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", businessName: "", callbackUrl: "" });
  const [revealed, setRevealed] = useState<Record<string, { keyToken: string; signingSecret: string }>>({});
  const [loadingReveal, setLoadingReveal] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", businessName: "", callbackUrl: "" });

  const handleCreate = async () => {
    try {
      const result = await createKey({
        name: form.name,
        businessName: form.businessName || undefined,
        callbackUrl: form.callbackUrl || undefined,
        token: getStoredToken() ?? "",
      });
      setNewCredentials({ token: result.token, signingSecret: result.signingSecret });
      setShowForm(false);
      setForm({ name: "", businessName: "", callbackUrl: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const handleReveal = async (id: string) => {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setLoadingReveal((prev) => ({ ...prev, [id]: true }));
    try {
      const data = await convex.query(api.api_keys.revealKey, { id: id as any, token: getStoredToken() ?? "" });
      setRevealed((prev) => ({ ...prev, [id]: data }));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setLoadingReveal((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          {showForm ? "Cancel" : "New key"}
        </button>
      </div>

      {newCredentials && (
        <div className="mt-4 space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">API key created.</p>
          <div>
            <p className="text-xs font-medium text-green-700 dark:text-green-400">API Key</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-green-100 px-3 py-2 font-mono text-sm break-all dark:bg-green-900/50">{newCredentials.token}</code>
              <button onClick={() => copyText(newCredentials.token)} className="shrink-0 rounded bg-green-200 p-2 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-green-700 dark:text-green-400">Signing Secret</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-green-100 px-3 py-2 font-mono text-sm break-all dark:bg-green-900/50">{newCredentials.signingSecret}</code>
              <button onClick={() => copyText(newCredentials.signingSecret)} className="shrink-0 rounded bg-green-200 p-2 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
          <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Callback URL" value={form.callbackUrl} onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={handleCreate} disabled={!form.name.trim()} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
            Create
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {keys?.map((key) => {
          const isRevealed = revealed[key._id];
  const handleStartEdit = (key: any) => {
    setEditing(key._id);
    setEditForm({
      name: key.name ?? "",
      businessName: key.businessName ?? "",
      callbackUrl: key.callbackUrl ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateKey({
        id: editing as any,
        name: editForm.name || undefined,
        businessName: editForm.businessName || undefined,
        callbackUrl: editForm.callbackUrl || undefined,
        token: getStoredToken() ?? "",
      });
      toast.success("API key updated");
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  return (
            <div key={key._id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{key.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{key.keyPrefix}…</div>
                  {key.businessName && <div className="text-xs text-muted-foreground">{key.businessName}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleStartEdit(key)}
                    className="rounded bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleReveal(key._id)}
                    disabled={loadingReveal[key._id]}
                    className="rounded bg-muted px-3 py-1 text-xs hover:bg-muted/80 disabled:opacity-50"
                  >
                    {loadingReveal[key._id] ? "…" : isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  {!key.revokedAt && (
                    <button onClick={() => revokeKey({ id: key._id, token: getStoredToken() ?? "" }).then(() => toast.success("Revoked"))} className="rounded bg-destructive/10 px-3 py-1 text-xs text-destructive">
                      Revoke
                    </button>
                  )}
                  {key.revokedAt && (
                    <button onClick={() => { if (window.confirm("Permanently delete this API key?")) removeKey({ id: key._id, token: getStoredToken() ?? "" }).then(() => toast.success("Deleted")) }} className="rounded bg-destructive/10 px-3 py-1 text-xs text-destructive">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {editing === key._id && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    placeholder="Business name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    value={editForm.callbackUrl}
                    onChange={(e) => setEditForm({ ...editForm, callbackUrl: e.target.value })}
                    placeholder="Callback URL"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90">
                      Save
                    </button>
                    <button onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-1.5 text-xs hover:bg-muted">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {isRevealed && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">API Key</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs break-all">{isRevealed.keyToken}</code>
                      <button onClick={() => copyText(isRevealed.keyToken)} className="shrink-0 rounded p-1 hover:bg-muted">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Signing Secret</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs break-all">{isRevealed.signingSecret}</code>
                      <button onClick={() => copyText(isRevealed.signingSecret)} className="shrink-0 rounded p-1 hover:bg-muted">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
