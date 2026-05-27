import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function getSessionUser(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"users"> | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  const user = await ctx.db.get(session.userId as Id<"users">);
  return user ?? null;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"users">> {
  const user = await getSessionUser(ctx, token);
  if (!user) throw new Error("Authentication required");
  if (user.role !== "admin" && user.role !== "super_admin") throw new Error("Admin role required");
  return user;
}

export async function cleanupSession(ctx: MutationCtx, token: string): Promise<void> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (session) await ctx.db.delete(session._id);
}
