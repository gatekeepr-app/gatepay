import { NextRequest } from "next/server";
import { json, corsHeaders, SECURITY_HEADERS } from "@/lib/api/helpers";

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: { ...corsHeaders(request), ...SECURITY_HEADERS } });
}

export async function GET(request: NextRequest) {
  return json({ status: "ok" }, 200, undefined, request);
}


