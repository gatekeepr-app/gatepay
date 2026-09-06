import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_KEY = "gk_session_token";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: Request) {
  const { action, token } = await req.json();
  const cookieStore = await cookies();

  if (action === "set" && token) {
    cookieStore.set(TOKEN_KEY, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: MAX_AGE,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "clear") {
    cookieStore.set(TOKEN_KEY, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
