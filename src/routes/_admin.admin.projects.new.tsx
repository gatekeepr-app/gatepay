import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/projects/new")({
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const clients = useQuery(api.clients.list);
  const createProject = useMutation(api.projects.create);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", description: "", clientId: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await createProject({
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId ? (form.clientId as any) : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        createdBy: "" as any,
      });
      toast.success("Project created");
      navigate({ to: "/admin/projects" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold">New project</h1>
      <div className="mt-4 space-y-4">
        {step === 0 && (
          <>
            <input placeholder="Project name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={3} />
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">No client</option>
              {clients?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <button onClick={() => setStep(1)} disabled={!form.name.trim()} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
              Next
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <input placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={submit} disabled={submitting} className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
              {submitting ? "Creating…" : "Create project"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
