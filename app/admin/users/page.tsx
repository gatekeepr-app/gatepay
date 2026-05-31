"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getStoredToken } from "@/integrations/convex/auth";
import { toast } from "sonner";

export default function UsersPage() {
  const token = getStoredToken();
  const users = useQuery(api.users.list, token ? { token } : "skip");
  const invitations = useQuery(api.invitations.list, token ? { token } : "skip");
  const sendInvite = useMutation(api.invitations.create);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await sendInvite({ email, role, invitedBy: undefined, token: getStoredToken()! });
      toast.success("Invitation sent");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <div className="mt-4 space-y-2">
        {users?.map((u: any) => (
          <div key={u._id} className="rounded-lg border border-border bg-card p-4">
            <div className="font-medium">{u.email}</div>
            <div className="text-xs text-muted-foreground">Role: {u.role}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Invite user</h2>
      <div className="mt-2 flex gap-2">
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleInvite} disabled={submitting} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
          Invite
        </button>
      </div>

      {invitations && invitations.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Pending invitations</h2>
          <div className="mt-2 space-y-2">
            {invitations.filter((i: any) => i.status === "pending").map((inv: any) => (
              <div key={inv._id} className="rounded-lg border border-border bg-card p-3 text-sm">
                {inv.email} · {inv.role}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
