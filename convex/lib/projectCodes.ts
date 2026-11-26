import type { MutationCtx } from "../_generated/server";

export async function generateProjectCode(ctx: MutationCtx): Promise<string> {
  const year = new Date().getFullYear();
  const name = `projectCode-${year}`;
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", name))
    .first();
  const nextValue = (existing?.value ?? 0) + 1;
  if (existing) {
    await ctx.db.patch(existing._id, { value: nextValue });
  } else {
    await ctx.db.insert("counters", { name, value: nextValue });
  }
  return `GK-${year}-${String(nextValue).padStart(4, "0")}`;
}

export function generatePayCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
}
