import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ name: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Verify caller is a workspace manager (admin/super_admin) via RLS-aware client.
    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesErr) throw new Error("role_check_failed");
    const allowed = (roles ?? []).some((r) =>
      ["admin", "super_admin"].includes(r.role as string),
    );
    if (!allowed) throw new Error("forbidden");

    const raw = `gk_${randomBytes(32).toString("base64url")}`;
    const key_hash = createHash("sha256").update(raw).digest("hex");
    const key_prefix = raw.slice(0, 10);

    const { data: row, error } = await supabaseAdmin
      .from("api_keys")
      .insert({ name: data.name, key_hash, key_prefix, created_by: userId })
      .select("id, name, key_prefix, created_at")
      .single();
    if (error) throw new Error(error.message);

    // Plaintext token returned ONCE.
    return { ...row, token: raw };
  });
