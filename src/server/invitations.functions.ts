import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    } else if (existing.role !== data.role) {
      // Update the role on the existing invite to match the latest request
      const { data: updated, error: updErr } = await supabase
        .from("invitations")
        .update({ role: data.role })
        .eq("id", existing.id)
        .select("id, token, email, role, expires_at, status")
        .single();
      if (updErr) throw new Error(updErr.message);
      invite = updated;
    }

    // Send Supabase auth invite email so user can set password
    const origin =
      process.env.SITE_URL ||
      process.env.VITE_SITE_URL ||
      "https://gatekeepr-foundations-build.lovable.app";
    const redirectTo = `${origin}/invite/${invite.token}`;

    const { error: mailErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      { redirectTo, data: { invited_role: data.role } },
    );

    // If user already exists, fall back to a password recovery email
    if (mailErr) {
      const msg = mailErr.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered")) {
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: data.email,
          options: { redirectTo },
        });
      } else {
        throw new Error(mailErr.message);
      }
    }

    return { ok: true, invite };
  });
