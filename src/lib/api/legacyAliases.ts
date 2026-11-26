import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, SECURITY_HEADERS } from "./helpers";

export function redirectLegacyPublicApi(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/api/public", "/api/v1/public");
  return NextResponse.redirect(url, {
    status: 308,
    headers: { ...corsHeaders(request), ...SECURITY_HEADERS },
  });
}

export function respondToLegacyPreflight(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(request), ...SECURITY_HEADERS },
  });
}
