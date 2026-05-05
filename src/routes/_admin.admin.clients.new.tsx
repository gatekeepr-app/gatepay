import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/clients/new")({
  head: () => ({ meta: [{ title: "New client — Gatekeepr" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: NewClientPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  business_name: z.string().trim().max(200).optional(),
  brand_name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  instagram: z.string().trim().max(200).optional(),
  linkedin: z.string().trim().max(200).optional(),
  website: z.string().trim().max(200).optional(),
  x: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

type FormState = {
  name: string; email: string; business_name: string; brand_name: string; phone: string;
  instagram: string; linkedin: string; website: string; x: string; notes: string;
};

const initial: FormState = {
  name: "", email: "", business_name: "", brand_name: "", phone: "",
  instagram: "", linkedin: "", website: "", x: "", notes: "",
};

const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/30";

function NewClientPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initial);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) { toast.error("Not signed in"); setSaving(false); return; }
    const { data, error } = await supabase.from("clients").insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      business_name: parsed.data.business_name || null,
      brand_name: parsed.data.brand_name || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      social_links: {
        instagram: parsed.data.instagram || null,
        linkedin: parsed.data.linkedin || null,
        website: parsed.data.website || null,
        x: parsed.data.x || null,
      },
      created_by: uid,
    }).select("id").single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Client created");
    navigate({ to: "/admin/clients/$clientId", params: { clientId: data.id } });
  };

  return (
    <main className="px-6 py-10 md:px-10">
      <Link to="/admin/clients" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to clients
      </Link>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">New client</h1>

      <form onSubmit={submit} className="mt-8 max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basics</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Name *</span>
              <input className={inputCls} value={form.name} onChange={update("name")} autoFocus />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
              <input type="email" className={inputCls} value={form.email} onChange={update("email")} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Business name</span>
              <input className={inputCls} value={form.business_name} onChange={update("business_name")} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Brand name</span>
              <input className={inputCls} value={form.brand_name} onChange={update("brand_name")} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Phone</span>
              <input className={inputCls} value={form.phone} onChange={update("phone")} />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Social</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Website</span>
              <input className={inputCls} value={form.website} onChange={update("website")} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Instagram</span>
              <input className={inputCls} value={form.instagram} onChange={update("instagram")} placeholder="@handle" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">LinkedIn</span>
              <input className={inputCls} value={form.linkedin} onChange={update("linkedin")} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">X / Twitter</span>
              <input className={inputCls} value={form.x} onChange={update("x")} placeholder="@handle" />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
          <textarea
            value={form.notes}
            onChange={update("notes")}
            rows={4}
            className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
          />
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create client"}
          </button>
          <Link to="/admin/clients" className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
