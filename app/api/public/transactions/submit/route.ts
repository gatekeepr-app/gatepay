import { NextRequest } from "next/server";
import { redirectLegacyPublicApi, respondToLegacyPreflight } from "@/lib/api/legacyAliases";

export async function OPTIONS(request: NextRequest) {
  return respondToLegacyPreflight(request);
}

export async function POST(request: NextRequest) {
  return redirectLegacyPublicApi(request);
}
