const TOKEN_KEY = "gk_session_token";

function parseCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  return Object.fromEntries(
    document.cookie.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, decodeURIComponent(val.join("="))];
    })
  );
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  // Read from httpOnly cookie (set by /api/auth/* routes)
  const cookies = parseCookies();
  return cookies[TOKEN_KEY] ?? null;
}

export async function storeToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;
  // Set cookie via server route (httpOnly, secure, SameSite=Strict)
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "set", token }),
  });
}

export async function clearToken(): Promise<void> {
  if (typeof window === "undefined") return;
  // Clear cookie via server route
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "clear" }),
  });
}
