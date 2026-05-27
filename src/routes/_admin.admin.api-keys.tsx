import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { getStoredToken } from "@/integrations/convex/auth";

export const Route = createFileRoute("/_admin/admin/api-keys")({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const token = getStoredToken() ?? "";
  const keys = useQuery(api.api_keys.list, token ? { token } : "skip");
  const createKey = useMutation(api.api_keys.create);
  const revokeKey = useMutation(api.api_keys.revoke);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", businessName: "", callbackUrl: "", signingSecret: "" });
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    try {
      const result = await createKey({
        name: form.name,
        businessName: form.businessName || undefined,
        callbackUrl: form.callbackUrl || undefined,
        signingSecret: form.signingSecret || undefined,
        token: getStoredToken() ?? "",
      });
      setNewToken(result.token);
      setShowForm(false);
      setForm({ name: "", businessName: "", callbackUrl: "", signingSecret: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const copyToken = async () => {
    if (newToken) {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          {showForm ? "Cancel" : "New key"}
        </button>
      </div>

      {newToken && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">API key created. Copy it now — it won't be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-green-100 px-3 py-2 font-mono text-sm">{newToken}</code>
            <button onClick={copyToken} className="rounded bg-green-200 p-2 hover:bg-green-300">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
          <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Callback URL" value={form.callbackUrl} onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Signing secret" value={form.signingSecret} onChange={(e) => setForm({ ...form, signingSecret: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={handleCreate} disabled={!form.name.trim()} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
            Create
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {keys?.map((key) => (
          <div key={key._id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{key.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{key.keyPrefix}…</div>
                {key.businessName && <div className="text-xs text-muted-foreground">{key.businessName}</div>}
              </div>
              {!key.revokedAt && (
                <button onClick={() => revokeKey({ id: key._id, token: getStoredToken() ?? "" })} className="rounded bg-destructive/10 px-3 py-1 text-xs text-destructive">
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
