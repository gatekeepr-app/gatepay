"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loginSchema } from "@/lib/validation";
import { storeToken, getStoredToken } from "@/integrations/convex/auth";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const router = useRouter();
  const params = use(searchParams);
  const rawTarget = params.redirect || "/admin";
  const target = /^\/(?!\/)/.test(rawTarget) ? rawTarget : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const authenticate = useMutation(api.auth.authenticate);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }
    const creds = { email: parsed.data.email, password: parsed.data.password };
    setSubmitting(true);

    try {
      const result = await authenticate(creds);
      if (!result.ok) {
        toast.error("Invalid email or password");
        return;
      }
      await storeToken(result.token);
      toast.success(result.created ? "Account created and signed in" : "Signed in");
      router.push(target);
    } catch {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (getStoredToken()) {
      router.push(target);
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return null;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8"
      >
        <div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted access.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <Link href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </form>
    </main>
  );
}
