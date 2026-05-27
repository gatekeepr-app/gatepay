import { ConvexHttpClient } from "convex/browser";
import { createHash } from "node:crypto";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable");
}

export const convex = new ConvexHttpClient(CONVEX_URL);

export function extractBearer(request: Request): string | null {
  const h = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function hashKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
