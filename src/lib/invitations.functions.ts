import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deliverInviteEmail } from "@/lib/invitations.server";

const InviteSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(["admin", "member"]),
});

export const sendInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify caller is workspace manager (admin/super_admin)
    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesErr) throw new Error(rolesErr.message);
    const isManager = (roles ?? []).some((r) =>
      r.role === "admin" || r.role === "super_admin",
    );
    if (!isManager) throw new Error("Forbidden");

    // Reuse an existing active (pending + not expired) invite if present
    const { data: existing } = await supabase
      .from("invitations")
      .select("id, token, email, role, expires_at, status")
      .eq("email", data.email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let invite = existing;
    if (!invite) {
      const { data: created, error: insErr } = await supabase
        .from("invitations")
        .insert({ email: data.email, role: data.role, invited_by: userId })
        .select("id, token, email, role, expires_at, status")
        .single();
      if (insErr) throw new Error(insErr.message);
      invite = created;
    } else if (existing && existing.role !== data.role) {
      const { data: updated, error: updErr } = await supabase
        .from("invitations")
        .update({ role: data.role })
        .eq("id", existing.id)
        .select("id, token, email, role, expires_at, status")
        .single();
      if (updErr) throw new Error(updErr.message);
      invite = updated;
    }

    if (!invite) throw new Error("Failed to create invitation");
    await deliverInviteEmail(invite.email, invite.token, invite.role);
    return { ok: true, invite };
  });

const ResendSchema = z.object({ id: z.string().uuid() });

export const resendInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ResendSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesErr) throw new Error(rolesErr.message);
    const isManager = (roles ?? []).some(
      (r) => r.role === "admin" || r.role === "super_admin",
    );
    if (!isManager) throw new Error("Forbidden");

    const { data: invite, error: invErr } = await supabase
      .from("invitations")
      .select("id, email, role, status, expires_at, token")
      .eq("id", data.id)
      .maybeSingle();
    if (invErr) throw new Error(invErr.message);
    if (!invite) throw new Error("Invitation not found");
    if (invite.status !== "pending") throw new Error("Invitation is not pending");

    // Extend expiry if expired/near expiry
    let token = invite.token;
    if (new Date(invite.expires_at).getTime() < Date.now() + 60_000) {
      const { data: refreshed, error: updErr } = await supabase
        .from("invitations")
        .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
        .eq("id", invite.id)
        .select("token")
        .single();
      if (updErr) throw new Error(updErr.message);
      token = refreshed.token;
    }

    await deliverInviteEmail(invite.email, token, invite.role);
    return { ok: true };
  });


