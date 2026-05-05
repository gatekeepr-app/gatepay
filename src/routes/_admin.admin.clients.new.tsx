import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

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

function NewClientPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", business_name: "", brand_name: "", phone: "",
    instagram: "", linkedin: "", website: "", x: "", notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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

  const Field = ({ label, k, type = "text", placeholder }: { label: string; k: keyof typeof form; type?: string; placeholder?: string }) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={form[k]}
        onChange={set(k)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/30"
      />
    </label>
  );

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
            <Field label="Name *" k="name" />
            <Field label="Email" k="email" type="email" />
            <Field label="Business name" k="business_name" />
            <Field label="Brand name" k="brand_name" />
            <Field label="Phone" k="phone" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Social</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Website" k="website" placeholder="https://…" />
            <Field label="Instagram" k="instagram" placeholder="@handle" />
            <Field label="LinkedIn" k="linkedin" />
            <Field label="X / Twitter" k="x" placeholder="@handle" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
          <textarea
            value={form.notes}
            onChange={set("notes")}
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
