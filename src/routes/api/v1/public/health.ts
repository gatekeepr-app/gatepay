import { createFileRoute } from "@tanstack/react-router";
import { convex } from "@/integrations/convex/server";
import { api } from "@/../convex/_generated/api";
import { SECURITY_HEADERS } from "@/lib/api/helpers";

export const Route = createFileRoute("/api/v1/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const start = Date.now();
        let dbOk = false;
        try {
          await convex.mutation(api.rate_limit.checkRateLimit, {
            ipHash: "healthcheck",
            route: "health",
            limit: 99999,
            windowMs: 60000,
          });
          dbOk = true;
        } catch {}
        const body = JSON.stringify({
          status: dbOk ? "ok" : "degraded",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          db: dbOk ? "connected" : "error",
          latencyMs: Date.now() - start,
        });
        return new Response(body, {
          status: dbOk ? 200 : 503,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            ...SECURITY_HEADERS,
          },
        });
      },
    },
  },
});
