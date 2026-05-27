import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, SECURITY_HEADERS } from "@/lib/api/helpers";

export const Route = createFileRoute("/api/public/transactions/verify")({
  server: {
    handlers: {
      POST: async () =>
        new Response(null, {
          status: 308,
          headers: { Location: "/api/v1/public/transactions/verify" },
        }),
      OPTIONS: async ({ request }) =>
        new Response(null, {
          status: 204,
          headers: { ...corsHeaders(request), ...SECURITY_HEADERS },
        }),
    },
  },
});
