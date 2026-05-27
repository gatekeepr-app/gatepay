import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/api/public", "/api/v1/public");
  return NextResponse.redirect(url.toString(), { status: 308 });
}
