"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, BookOpen, Shield, Zap, Clock, Code2, Lock, GitBranch } from "lucide-react";

const neon = "oklch(0.45 0.31 264)";
const neonSoft = "oklch(0.45 0.31 264 / 0.15)";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="transition-all duration-900"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
        transitionDuration: "900ms",
        transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

function GridBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    />
  );
}

function Glow({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute opacity-40 blur-[120px] ${className ?? ""}`}
      style={{ background: `radial-gradient(circle, ${neon}, transparent 70%)` }}
    />
  );
}

const steps = [
  { num: "01", title: "Submit", desc: "Send transaction details to the API — amount, reference, and metadata." },
  { num: "02", title: "Verify", desc: "Query the transaction at verification time to confirm or reject a payment claim." },
  { num: "03", title: "Callback", desc: "Receive automatic webhooks when transactions are verified on your behalf." },
];

const features = [
  { icon: Shield, title: "Tamper-proof records", desc: "Transactions are immutable once submitted. No editing, no deletion, no dispute." },
  { icon: Clock, title: "Real-time verification", desc: "Verify payments in milliseconds. Your API key scopes every query to your business." },
  { icon: Code2, title: "RESTful API", desc: "Clean JSON endpoints with standard HTTP semantics. Idempotency, rate limiting, and CORS included." },
  { icon: Lock, title: "API key auth", desc: "Every request is authenticated with a bearer token. Hash-based key storage, no plaintext leakage." },
  { icon: Zap, title: "Idempotent submits", desc: "Submit the same transaction_ref twice and get the same result. No accidental duplicates." },
  { icon: GitBranch, title: "Callback webhooks", desc: "Optional HTTPS callbacks with HMAC signing. Know immediately when a transaction is verified." },
];

export default function PayHome() {
  return (
    <div className="relative min-h-screen bg-[#070708] text-white overflow-hidden">
      <GridBg />
      <Glow className="top-[-10vh] left-[-10vw] w-[50vw] h-[50vh]" />
      <Glow className="bottom-[-10vh] right-[-10vw] w-[40vw] h-[40vh]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold tracking-tight text-white"
            style={{ background: neon }}
          >
            G
          </div>
          <span className="text-sm font-medium tracking-tight text-white/80">pay</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/docs/payments-api"
            className="text-sm text-white/40 transition-colors hover:text-white/80"
          >
            Docs
          </Link>
          <Link
            href="/docs/payments-api"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Get API key
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <main className="relative z-10 w-full flex-col items-center justify-center mx-auto max-w-[1200px] px-6">

        {/* Hero */}
        <section className="w-full flex-col items-center justify-center pt-24 pb-16 text-center md:pt-36 md:pb-20">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/50">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Payment verification API
            </div>
          </FadeIn>
          <FadeIn delay={120}>
            <h1 className="w-full flex-col items-center justify-center max-w-4xl text-[clamp(2.5rem,8vw,5.5rem)] text-center font-medium leading-[0.92] tracking-[-0.04em]">
              Verify payments{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${neon}, #a78bfa, #818cf8)`,
                }}
              >
                in real time.
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={240}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/40 md:text-lg">
              Gatekeepr Pay lets businesses submit transaction records and instantly verify
              payment claims via a simple API. No dashboards, no portals — just clean,
              auditable payment proof.
            </p>
          </FadeIn>
          <FadeIn delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/docs/payments-api"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: neon }}
              >
                Read the docs
                <BookOpen className="h-4 w-4" />
              </Link>
              <Link
                href="/docs/payments-api"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                Example API call
                <Code2 className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 py-20 md:py-28">
          <FadeIn>
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-white/30">
              How it works
            </div>
            <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.03em] md:text-4xl">
              Three calls. Infinite confidence.
            </h2>
          </FadeIn>
          <div className="mt-14 grid gap-0 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 120}>
                <div className="group relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-white/30 transition-colors group-hover:border-white/20">
                    {step.num}
                  </div>
                  <h3 className="mb-2 text-lg font-medium tracking-tight text-white/90">{step.title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-white/40">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-white/5 py-20 md:py-28">
          <FadeIn>
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-white/30">
              Features
            </div>
            <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.03em] md:text-4xl">
              Everything you need to ship payment verification.
            </h2>
          </FadeIn>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 md:grid-cols-2">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <FadeIn key={feat.title} delay={(i % 2) * 120 + Math.floor(i / 2) * 80}>
                  <div className="bg-[#070708] p-8 transition-colors hover:bg-white/[0.02]">
                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ background: neonSoft }}
                    >
                      <Icon className="h-5 w-5" style={{ color: neon }} />
                    </div>
                    <h3 className="mb-2 text-base font-medium text-white/90">{feat.title}</h3>
                    <p className="max-w-sm text-sm leading-relaxed text-white/40">{feat.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-white/5 py-20 md:py-28">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { value: "3ms", label: "Median verification time" },
              { value: "100%", label: "Uptime SLA" },
              { value: "1", label: "Integration — one API key" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 120}>
                <div className="text-center">
                  <div className="text-4xl font-medium tracking-[-0.03em] md:text-5xl" style={{ color: neon }}>
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-white/40">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 py-20 md:py-28">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-medium leading-tight tracking-[-0.03em] md:text-4xl">
                Ready to ship payment verification?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/40">
                Get your API key, read the docs, and be live in minutes.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/docs/payments-api"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ background: neon }}
                >
                  Read the API docs
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs/payments-api"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  View on GitHub
                  <GitBranch className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-[1200px] px-6 pb-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <div className="flex items-center gap-2 text-xs text-white/20">
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white"
              style={{ background: neon }}
            >
              G
            </div>
            Gatekeepr Pay
          </div>
          <div className="flex items-center gap-6 text-xs text-white/20">
            <Link href="/docs/payments-api" className="transition-colors hover:text-white/40">Docs</Link>
            <a href="#" className="transition-colors hover:text-white/40">Status</a>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
