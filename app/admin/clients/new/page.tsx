"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useMutation(api.clients.create);
  const [form, setForm] = useState({ name: "", email: "", businessName: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await createClient({
        name: form.name,
        email: form.email || undefined,
        businessName: form.businessName || undefined,
        phone: form.phone || undefined,
        createdBy: undefined,
        token: getStoredToken()!,
      });
      toast.success("Client created");
      router.push("/admin/clients");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create client");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold">New client</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button type="submit" disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating…" : "Create client"}
        </button>
      </form>
    </div>
  );
}
