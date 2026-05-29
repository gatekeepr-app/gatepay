import { createHash, randomUUID } from "node:crypto";
import { convex, extractBearer, hashKey } from "@/integrations/convex/server";
import { api } from "@/../convex/_generated/api";

const ALLOWED_ORIGINS = [
  "https://pay.darvizlabs.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

function getCorsOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  // Allow any origin — API key handles authentication
  // Widget runs on external client sites, so strict CORS would block it
  if (origin) return origin;
  return ALLOWED_ORIGINS[0];
}

export function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export const MAX_BODY_BYTES = 10_240;

export function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

export function jsonFromRequest(body: unknown, request: Request, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

export function jsonOk(data: unknown, requestId?: string) {
  return json(data, 200, requestId ? { "x-request-id": requestId } : undefined);
}

export function jsonError(error: string, status: number, requestId?: string) {
  return json({ error }, status, requestId ? { "x-request-id": requestId } : undefined);
}

export function generateRequestId(): string {
  return `gk_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`rl:${ip}`).digest("hex").slice(0, 16);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function extractIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key")?.trim() || null;
}

export async function checkRateLimit(
  ipHash: string,
  route: string,
  limit: number,
  windowMs: number,
  keyHash?: string,
): Promise<{ blocked: boolean; reason?: string }> {
  try {
      const rl = await convex.mutation(api.rate_limit.checkRateLimit, {
      ipHash,
      route,
      limit,
      windowMs,
    });
    if (rl.blocked) return { blocked: true, reason: "rate_limited" };
  } catch {
    // fail open
  }
  if (keyHash) {
    try {
      const rlKey = await convex.mutation(api.rate_limit.checkRateLimit, {
        ipHash: createHash("sha256").update(`key:${keyHash}`).digest("hex").slice(0, 16),
        route: `key:${route}`,
        limit: Math.max(limit, 100),
        windowMs,
      });
      if (rlKey.blocked) return { blocked: true, reason: "key_rate_limited" };
    } catch {
      // fail open
    }
  }
  return { blocked: false };
}

export function checkCsrf(request: Request): boolean {
  // CSRF check is relaxed for widget — API key handles authentication
  // External client sites will have different origins
  return true;
}

export function checkBodySize(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) return false;
  return true;
}

export async function logApiCall(params: {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  apiKeyPrefix?: string;
  ipHash?: string;
  error?: string;
}) {
  try {
    await convex.mutation(api.api_logs.log, {
      requestId: params.requestId,
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      durationMs: params.durationMs,
      apiKeyPrefix: params.apiKeyPrefix,
      ipHash: params.ipHash,
      error: params.error,
      createdAt: Date.now(),
    });
  } catch {
    // logging failures are non-fatal
  }
}

export { extractBearer, hashKey };
