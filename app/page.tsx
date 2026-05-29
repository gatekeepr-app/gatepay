"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Shield,
  Activity,
  Wallet,
  Quote,
  Lock,
  Menu,
  X,
} from "lucide-react";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.9s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms, transform 0.9s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <Monitoring />
      <Testimonial />
      <Footer />
    </main>
  );
}

/* ─── Hero ─────────────────────────────────────────────── */

function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const steps = [
    "Submit payment transactions",
    "Verify in real time",
    "Get instant webhook callbacks",
  ];
  return (
    <section className="relative overflow-hidden rounded-b-[28px] bg-ink text-ink-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight sm:text-2xl">GatePay</Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-foreground/70 md:flex">
          <a href="#features" className="hover:text-ink-foreground">Features</a>
          <a href="#how-it-works" className="hover:text-ink-foreground">How it works</a>
          <a href="#partners" className="hover:text-ink-foreground">Partners</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/docs/payments-api" className="hidden text-sm text-ink-foreground/80 hover:text-ink-foreground sm:inline">
            Get API key &gt;
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-ink-foreground/10 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-ink-foreground/70">
            <a href="#features" onClick={() => setMenuOpen(false)} className="py-2 hover:text-ink-foreground">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="py-2 hover:text-ink-foreground">How it works</a>
            <a href="#partners" onClick={() => setMenuOpen(false)} className="py-2 hover:text-ink-foreground">Partners</a>
            <Link href="/docs/payments-api" onClick={() => setMenuOpen(false)} className="py-2 hover:text-ink-foreground">Get API key</Link>
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:grid-cols-12 lg:px-10 lg:pb-24">
        <div className="lg:col-span-7">
          <h1 className="font-display text-[11vw] leading-[0.9] sm:text-[10vw] lg:text-[112px] lg:leading-[0.92] text-ink-foreground">
            SECURE YOUR
            <br />
            PAYMENTS
            <Sparkles className="ml-2 inline-block h-6 w-6 -translate-y-4 fill-primary text-primary sm:h-10 sm:w-10 sm:-translate-y-6 lg:h-14 lg:w-14" />
          </h1>
          <p className="mt-6 max-w-md text-sm text-ink-foreground/70 sm:mt-8">
            Real-time payment verification for businesses.
            <br className="hidden sm:block" />
            Submit, verify, and audit — all via one API.
          </p>
          <div className="mt-6 flex items-center gap-3 sm:mt-8">
            <Link
              href="/docs/payments-api"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 sm:px-7 sm:py-3.5"
            >
              GET STARTED
            </Link>
            <Link
              href="/docs/payments-api"
              aria-label="Read the docs"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110 sm:h-12 sm:w-12"
            >
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>

          <div className="mt-10 sm:mt-14">
            <div className="flex items-center gap-2 text-xs text-ink-foreground/70">
              <span className="h-2 w-2 rounded-full bg-primary" /> Active businesses
            </div>
            <div className="mt-2 flex items-center gap-4">
              <div className="font-display text-4xl sm:text-5xl lg:text-6xl">500+</div>
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-7 w-7 rounded-full border-2 border-ink bg-gradient-to-br from-primary to-amber-300 sm:h-8 sm:w-8" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-ink-foreground/5 p-5 ring-1 ring-ink-foreground/10 sm:p-8">
            <div className="flex items-center gap-2 text-xs text-ink-foreground/60">
              <Lock className="h-3 w-3" /> Secure API
            </div>
            <div className="mt-3 font-mono text-xs text-ink-foreground/80 sm:mt-4 sm:text-sm">
              <span className="text-primary">POST</span> /api/v1/public/transactions/verify
            </div>
            <div className="mt-2 overflow-x-auto rounded-lg bg-ink-foreground/5 p-3 font-mono text-[10px] text-ink-foreground/60 sm:mt-3 sm:p-4 sm:text-xs">
              {`{
  "transaction_ref": "BK8FA2K9JX",
  "amount": 2500,
  "currency": "BDT"
}`}
            </div>
          </div>
          <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-4 border-b border-dashed border-ink-foreground/20 pb-3">
                <span className="text-xs text-ink-foreground/85 sm:text-sm">{s}</span>
                <ArrowUpRight className="h-3 w-3 text-ink-foreground/60 sm:h-4 sm:w-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── About ────────────────────────────────────────────── */

function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
      <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">ABOUT US</div>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
        <h2 className="font-display text-4xl text-foreground sm:text-5xl lg:text-7xl">
          GETTING TO
          <br />
          KNOW GATEKEEPR
        </h2>
        <p className="max-w-md self-end text-base text-muted-foreground">
          We are more than a verification tool — we are your trusted partner in building transparent, auditable payment workflows for your business.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30">
            <Shield className="h-4 w-4" />
          </div>
          <div className="mt-8 font-display text-6xl leading-none sm:mt-10 sm:text-7xl">
            500<span className="ml-1 align-top text-xl font-semibold sm:text-2xl">+</span>
          </div>
          <p className="mt-6 text-xs text-primary-foreground/85 sm:mt-8">
            Businesses trust GatePay to verify and audit their payment transactions every day.
          </p>
        </div>
        <div className="rounded-3xl bg-ink p-6 text-ink-foreground sm:p-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 text-[10px] font-bold text-primary-foreground">
            3ms
          </div>
          <div className="mt-8 font-display text-6xl leading-none sm:mt-10 sm:text-7xl">
            98<span className="ml-1 align-top text-2xl sm:text-3xl">%</span>
          </div>
          <p className="mt-6 text-xs text-ink-foreground/70 sm:mt-8">
            Uptime for our real-time payment verification API.
          </p>
        </div>
        <div className="rounded-3xl bg-card p-6 text-card-foreground ring-1 ring-border sm:p-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="mt-8 font-display text-6xl leading-none sm:mt-10 sm:text-7xl">
            24<span className="ml-1 align-top text-2xl sm:text-3xl">K</span>
          </div>
          <p className="mt-6 text-xs text-muted-foreground sm:mt-8">
            Transactions verified monthly across our partner network.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─────────────────────────────────────────── */

function Features() {
  const items = [
    { label: "Secure and Easy Transactions", icon: Shield },
    { label: "Real-Time Payment Monitoring", icon: Activity },
    { label: "Fast & Auditable Verification", icon: Wallet, active: true },
    { label: "Comprehensive API Documentation", icon: Sparkles },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
      <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">FEATURES</div>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
        <h2 className="font-display text-4xl leading-[0.95] sm:text-5xl lg:col-span-7 lg:text-7xl">
          ALL-IN-ONE PLATFORM
          <br />
          FOR PAYMENTS
        </h2>
        <p className="max-w-md self-end text-base text-muted-foreground lg:col-span-5">
          Simplify your payment workflows by securely submitting and verifying transactions through a single, auditable API.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 sm:mt-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <li
                  key={it.label}
                  className={`flex items-center justify-between py-4 transition sm:py-5 ${
                    it.active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                        it.active ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-display text-lg tracking-normal sm:text-xl lg:text-2xl">
                      {it.label}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-70 sm:h-5 sm:w-5" />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-card p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.25)] ring-1 ring-border sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Recent Transactions</div>
              <div className="flex gap-1.5 text-[10px] sm:gap-2">
                <span className="rounded-full bg-primary px-2.5 py-1 font-semibold text-primary-foreground sm:px-3">All</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground sm:px-3">Verified</span>
                <span className="hidden rounded-full bg-muted px-2.5 py-1 text-muted-foreground sm:inline sm:px-3">Pending</span>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
              {[
                { ref: "BK8FA2K9JX", amount: "৳2,500", status: "Verified" },
                { ref: "NG3MNP7QW", amount: "৳1,200", status: "Pending" },
                { ref: "RK9XYZ4AB", amount: "৳4,800", status: "Verified" },
              ].map((r) => (
                <div key={r.ref} className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-amber-300 sm:h-9 sm:w-9" />
                    <div>
                      <div className="font-mono text-xs font-semibold sm:text-sm">{r.ref}</div>
                      <div className="text-[10px] text-muted-foreground sm:text-[11px]">{r.status}</div>
                    </div>
                  </div>
                  <div className="font-display text-base sm:text-lg">{r.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    { num: "01", title: "Submit", desc: "Send transaction details to the API — amount, reference, and metadata." },
    { num: "02", title: "Verify", desc: "Query the transaction at verification time to confirm or reject a payment claim." },
    { num: "03", title: "Callback", desc: "Receive automatic webhooks when transactions are verified on your behalf." },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
      <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">HOW IT WORKS</div>
      <h2 className="mt-6 font-display text-4xl leading-[0.95] sm:text-5xl lg:text-7xl">
        THREE CALLS.
        <br />
        INFINITE CONFIDENCE.
      </h2>
      <div className="mt-10 grid gap-8 sm:mt-14 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.num} className="group">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-sm font-medium text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary sm:mb-6 sm:h-12 sm:w-12">
              {step.num}
            </div>
            <h3 className="mb-2 font-display text-xl tracking-normal sm:text-2xl">{step.title}</h3>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Partners / Monitoring ────────────────────────────── */

function Monitoring() {
  return (
    <section id="partners" className="relative overflow-hidden rounded-[28px] bg-ink text-ink-foreground mx-2 lg:mx-6">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
        <div className="text-[10px] font-semibold tracking-[0.3em] text-ink-foreground/60">
          OUR TRUSTED PARTNERS
        </div>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
          <h2 className="font-display text-4xl leading-[0.95] sm:text-5xl lg:col-span-7 lg:text-7xl">
            REAL-TIME FINANCIAL
            <br />
            MONITORING
          </h2>
          <p className="self-end text-sm text-ink-foreground/70 lg:col-span-5">
            GatePay integrates with your existing payment stack. bKash, Nagad, Rocket, bank transfer — verify any payment method through one unified API.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-4 md:grid-cols-4 md:grid-rows-2">
          <div className="row-span-2 rounded-3xl bg-primary p-5 text-primary-foreground sm:p-7">
            <div className="font-display text-5xl leading-none sm:text-7xl lg:text-8xl">
              98<span className="align-top text-xl sm:text-3xl">%</span>
            </div>
            <p className="mt-6 text-xs text-primary-foreground/85 sm:mt-8">
              Businesses enjoy faster transaction processing with GatePay&apos;s real-time monitoring.
            </p>
          </div>

          {[
            { label: "bKash", bg: "bg-primary" },
            { label: "Nagad", bg: "bg-primary" },
            { label: "Rocket", bg: "bg-primary" },
            { label: "Bank", bg: "bg-primary" },
          ].map((p) => (
            <div
              key={p.label}
              className={`flex aspect-square items-center justify-center rounded-3xl ${p.bg} text-primary-foreground`}
            >
              <span className="font-display text-lg sm:text-2xl">{p.label}</span>
            </div>
          ))}

          <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-ink-foreground/5 p-5 text-ink-foreground ring-1 ring-ink-foreground/10 sm:p-7 md:col-span-1">
            <div className="font-display text-lg leading-tight sm:text-2xl">
              CREATING TRUSTED PAYMENT VERIFICATION
            </div>
            <Link href="/docs/payments-api" className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground sm:mt-6 sm:h-11 sm:w-11">
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonial ──────────────────────────────────────── */

function Testimonial() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
      <div className="text-[10px] font-semibold tracking-[0.3em] text-muted-foreground">
        WHAT THEY SAY ABOUT US
      </div>
      <div className="mt-8 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-9">
          <Quote className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
          <p className="mt-4 font-display text-2xl leading-[1.15] sm:mt-6 sm:text-3xl lg:text-5xl">
            GatePay has completely transformed how we handle payment verification. The real-time API and webhook callbacks have been invaluable.
          </p>
        </div>
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-amber-300 sm:h-12 sm:w-12" />
            <div>
              <div className="text-sm font-semibold">Rafid Mahim</div>
              <div className="text-xs text-muted-foreground">CTO, Darviz Labs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="text-xl font-bold tracking-tight sm:text-2xl">GatePay</div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground sm:gap-6">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          <a href="#partners" className="hover:text-foreground">Partners</a>
          <Link href="/docs/payments-api" className="hover:text-foreground">API Docs</Link>
        </div>
        <div className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GatePay. All rights reserved.</div>
      </div>
    </footer>
  );
}
