import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function deliverInviteEmail(email: string, token: string, role: string) {
  const origin =
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://gatekeepr-foundations-build.lovable.app";
  const redirectTo = `${origin}/invite/${token}`;

  const { error: mailErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo, data: { invited_role: role } },
  );

  if (mailErr) {
    const msg = mailErr.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered")) {
      const { error: recErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (recErr) throw new Error(recErr.message);
    } else {
      throw new Error(mailErr.message);
    }
  }
}