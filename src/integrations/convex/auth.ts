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
  // Prefer local storage. The token is needed by the client for authenticated
  // Convex calls; fall back to the earlier cookie format for existing sessions.
  try {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  } catch {
    // Continue to the cookie fallback when storage is unavailable.
  }
  const cookies = parseCookies();
  return cookies[TOKEN_KEY] ?? null;
}

export async function storeToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Max-Age=0; path=/; SameSite=Strict`;
}
