import { internalMutation } from "./_generated/server";
import { pbkdf2Hash } from "./lib/crypto";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (existing) return;

    const defaultPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!defaultPassword) return;

    const { salt, hash } = await pbkdf2Hash(defaultPassword);

    await ctx.db.insert("users", {
      email: "product.gatekeepr@gmail.com",
      passwordHash: `${salt}:${hash}`,
      name: "Gatekeepr Admin",
      role: "super_admin",
      createdAt: Date.now(),
    });
  },
});
