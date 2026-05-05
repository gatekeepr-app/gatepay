import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "admin" | "moderator" | "member" | "user";

export function usePermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (!cancelled) setLoading(false);
        return;
      }
      const uid = sess.session.user.id;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (cancelled) return;
      setUserId(uid);
      setEmail(sess.session.user.email ?? null);
      setRoles(((data ?? []) as { role: Role }[]).map((r) => r.role));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin");
  const isMember = isAdmin || roles.includes("member");

  return { roles, userId, email, isSuperAdmin, isAdmin, isMember, loading };
}
