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

export default function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const router = useRouter();
  const params = use(searchParams);
  const rawTarget = params.redirect || "/admin";
  const target = /^\/(?!\/)/.test(rawTarget) ? rawTarget : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const signIn = useMutation(api.auth.signIn);
  const signUp = useMutation(api.auth.signUp);

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
      const result = await signIn(creds);
      storeToken(result.token);
      toast.success("Signed in");
      router.push(target);
    } catch {
      try {
        const result = await signUp(creds);
        storeToken(result.token);
        const retryResult = await signIn(creds);
        storeToken(retryResult.token);
        toast.success("Account created and signed in");
        router.push(target);
      } catch (signUpErr: any) {
        toast.error(signUpErr?.message ?? "Authentication failed");
      }
    }
    setSubmitting(false);
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
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
