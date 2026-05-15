import { useRef, useState } from "react";
import darvizMark from "@/assets/darviz-logomark.png";
import gtkrMark from "@/assets/gtkr-logomark.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Biz = {
  name: string;
  label: string;
  tagline: string;
  description: string;
  services: string[];
  focus: string[];
  accent: string;
  motif: "studio" | "grid" | "stage" | "document";
};

const businesses: Biz[] = [
  {
    name: "Darviz Labs",
    label: "DIGITAL SOLUTIONS FOR YOU",
    tagline: "Technology built with business intent.",
    description:
      "Websites, web apps, internal tools, automations, and product systems for businesses that need stronger technical infrastructure and craft memorable brand experiences.",
    services: ["Web Apps", "Tools", "AI Automation", "Branding"],
    focus: [
      "Custom web apps and internal tools for operating teams",
      "AI-powered workflows and automation systems",
      "Product engineering for early-stage and scaling companies",
    ],
    accent: "DL",
    motif: "grid",
  },
  {
    name: "Gatestart Experiences",
    label: "AN EXPERIENCE VERTICAL",
    tagline: "Events and activations with taste.",
    description:
      "Launches, activations, campus campaigns, corporate events, and branded experiences executed with creative and operational control.",
    services: ["Events", "Activations", "Launches"],
    focus: [
      "Brand launches and product reveals end-to-end",
      "Campus and community activation campaigns",
      "Corporate gatherings with creative direction",
    ],
    accent: "GE",
    motif: "stage",
  },
];

function Motif({ kind }: { kind: Biz["motif"] }) {
  // Subtle, distinct background motif for each business — kept low-opacity & monochrome
  if (kind === "studio") {
    // Brand board / creative tiles
    return (
      <div className="pointer-events-none absolute inset-x-6 bottom-6 grid grid-cols-4 gap-2 opacity-[0.10]">
        <div className="aspect-square rounded-md bg-background" />
        <div className="aspect-square rounded-md border border-background/40" />
        <div className="aspect-square rounded-md bg-background/60" />
        <div className="aspect-square rounded-full border border-background/40" />
      </div>
    );
  }
  if (kind === "grid") {
    // UI grid / column lines (technical + classical)
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          color: "var(--background)",
        }}
      />
    );
  }
  if (kind === "stage") {
    // Stage / spotlight rays
    return (
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-72 w-[140%] -translate-x-1/2 opacity-[0.10]"
        style={{
          backgroundImage:
            "conic-gradient(from 200deg at 50% 100%, transparent 0deg, var(--background) 8deg, transparent 16deg, var(--background) 28deg, transparent 36deg, var(--background) 52deg, transparent 60deg)",
        }}
      />
    );
  }
  // document — ruled lines like a planning page
  return (
    <div
      className="pointer-events-none absolute inset-x-8 bottom-8 h-40 opacity-[0.10]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, var(--background) 0 1px, transparent 1px 14px)",
      }}
    />
  );
}

export function Businesses() {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Biz | null>(null);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section id="businesses" className="relative border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="reveal max-w-2xl">
            <div className="text-eyebrow mb-4 text-muted-foreground">01 — Portfolio</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl">
              Our businesses
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
              At the heart of Gatekeepr is a group of businesses built around
              one operating belief: better branding, better technology, and
              better execution.
            </p>
          </div>

          <div className="reveal reveal-delay-1 flex items-center gap-2">
            <button
              aria-label="Previous"
              onClick={() => scroll(-1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border transition hover:border-foreground"
            >
              ←
            </button>
            <button
              aria-label="Next"
              onClick={() => scroll(1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border transition hover:border-foreground"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {businesses.map((b, i) => (
            <article
              key={b.name}
              className="card-hover group relative flex w-[88%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl bg-foreground p-10 text-background transition-transform duration-500 sm:w-[60%] lg:w-[44%] xl:w-[36%] md:p-12"
              style={{ minHeight: 560, animation: `fadeUp 0.8s cubic-bezier(.2,.8,.2,1) ${i * 0.08}s both` }}
            >
              {/* Marble corner glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-[0.10] marble-bg" />
              {/* Per-business motif */}
              <Motif kind={b.motif} />
              {/* Bottom accent line */}
              <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-background/60 transition-all duration-500 group-hover:w-full" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="text-eyebrow text-background/55">{b.label}</div>
                  {b.name === "Darviz Labs" ? (
                    <img src={darvizMark} alt="Darviz Labs" className="h-10 w-10 object-contain" />
                  ) : b.name === "Gatestart Experiences" ? (
                    <img src={gtkrMark} alt="Gatestart Experiences" className="h-10 w-10 object-contain rounded-md" />
                  ) : (
                    <div className="text-display text-3xl text-background/30">{b.accent}</div>
                  )}
                </div>
                <h3 className="text-display mt-10 text-3xl md:text-4xl">{b.name}</h3>
                <p className="mt-4 text-lg italic text-background/75">{b.tagline}</p>
                <p className="mt-6 text-[16px] leading-relaxed text-background/80">
                  {b.description}
                </p>
              </div>

              <div className="relative mt-10">
                <div className="flex flex-wrap gap-2">
                  {b.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-background/25 px-3.5 py-1.5 text-[13px] text-background/90"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                {b.name === "Darviz Labs" ? (
                  <a
                    href="https://darvizlabs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-10 inline-flex items-center gap-2 text-[15px] font-medium text-background"
                  >
                    <span className="neon-underline">Visit Darviz Labs</span>
                    <span>→</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(b)}
                    className="mt-10 inline-flex items-center gap-2 text-[15px] font-medium text-background"
                  >
                    <span className="neon-underline">Learn more</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl border-border bg-background p-0 sm:rounded-2xl">
          {active && (
            <div className="p-8 md:p-10">
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-eyebrow text-muted-foreground">{active.label}</div>
                  {active.name === "Darviz Labs" ? (
                    <img src={darvizMark} alt="" className="h-9 w-9 object-contain" />
                  ) : active.name === "Gatestart Experiences" ? (
                    <img src={gtkrMark} alt="" className="h-9 w-9 object-contain rounded-md" />
                  ) : (
                    <div className="text-display text-2xl text-muted-foreground/50">
                      {active.accent}
                    </div>
                  )}
                </div>
                <DialogTitle className="text-display text-3xl md:text-4xl">
                  {active.name}
                </DialogTitle>
                <DialogDescription className="text-base italic text-muted-foreground">
                  {active.tagline}
                </DialogDescription>
              </DialogHeader>

              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                {active.description}
              </p>

              <div className="mt-8">
                <div className="text-eyebrow mb-3 text-foreground/60">Services</div>
                <div className="flex flex-wrap gap-2">
                  {active.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-3 py-1 text-xs text-foreground/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="text-eyebrow mb-3 text-foreground/60">Focus areas</div>
                <ul className="space-y-2">
                  {active.focus.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-foreground/80">
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href="https://darvizlabs.com/career"
                  onClick={() => setActive(null)}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-foreground/85"
                >
                  Contact Us
                  <span>→</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
