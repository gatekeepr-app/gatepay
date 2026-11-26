import type { MutationCtx } from "../_generated/server";

export async function logAdminAction(
  ctx: MutationCtx,
  params: {
    action: string;
    entityType?: string;
    entityId?: string;
    details?: string;
    userId?: string;
    userEmail?: string;
  },
) {
  await ctx.db.insert("adminLogs", {
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    userId: params.userId,
    userEmail: params.userEmail,
    createdAt: Date.now(),
  });
}
