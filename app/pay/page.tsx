"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { payCodeSchema } from "@/lib/validation";

export default function PayPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = payCodeSchema.safeParse(code);
    if (!parsed.success) {
      setError("Enter a valid 6-character payment code");
      return;
    }
    setError("");
    router.push(`/pay/${parsed.data}`);
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-md pt-20">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure payment
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Enter your payment code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste the 6-character code from your invoice or payment link.
          </p>

          <form onSubmit={submit} className="mt-6">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              placeholder="e.g. DNKX4U"
              autoFocus
              maxLength={6}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center font-mono text-lg uppercase tracking-widest outline-none focus:border-foreground/30"
            />
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Powered by Gatekeepr</p>
      </div>
    </main>
  );
}
