import { useRef } from "react";
import marble from "@/assets/marble.jpg";

type Item = {
  badge: string;
  title: string;
  desc: string;
  cta: string;
  visual: "brand" | "ui" | "stage" | "editorial";
};

const items: Item[] = [
  {
    badge: "Events · 2024",
    title: "Global Spell Bee 2024",
    desc: "End-to-end execution of the Global Spell Bee 2024 — branding, campaign, stage, and operations.",
    cta: "Open work",
    visual: "stage",
  },
  {
    badge: "Events · 2025",
    title: "Global Spell Bee 2025",
    desc: "Returning bigger in 2025 — creative direction, production, and live experience for the next edition.",
    cta: "Open work",
    visual: "stage",
  },
];

function Visual({ kind }: { kind: Item["visual"] }) {
  if (kind === "brand") {
    // Brand board: tiles with logomark, type sample, swatches
    return (
      <div className="relative h-full w-full bg-secondary p-5">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `url(${marble})`,
            backgroundSize: "cover",
            mixBlendMode: "multiply",
          }}
        />
        <div className="relative grid h-full grid-cols-3 grid-rows-2 gap-2">
          <div className="row-span-2 rounded-md bg-foreground text-background grid place-items-center">
            <span className="text-display text-3xl">G.</span>
          </div>
          <div className="rounded-md border border-border bg-background grid place-items-center">
            <span className="text-display text-sm leading-none">Aa</span>
          </div>
          <div className="rounded-md bg-foreground/85" />
          <div className="rounded-md border border-border bg-background flex items-center gap-1.5 px-2">
            <span className="h-3 w-3 rounded-full bg-foreground" />
            <span className="h-3 w-3 rounded-full bg-foreground/60" />
            <span className="h-3 w-3 rounded-full bg-foreground/30" />
          </div>
          <div className="rounded-md border border-border bg-background grid place-items-center">
            <span className="text-eyebrow text-foreground/60">Brand</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "ui") {
    // Web app / dashboard mockup
    return (
      <div className="relative h-full w-full bg-background p-5">
        <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-secondary">
          <div className="flex items-center gap-1.5 border-b border-border bg-background px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-foreground/20" />
            <span className="h-2 w-2 rounded-full bg-foreground/20" />
            <span className="h-2 w-2 rounded-full bg-foreground/20" />
            <span className="ml-2 h-2 w-24 rounded bg-foreground/10" />
          </div>
          <div className="grid grid-cols-4 gap-2 p-3">
            <div className="col-span-1 space-y-1.5">
              <div className="h-2 rounded bg-foreground/15" />
              <div className="h-2 rounded bg-foreground/10" />
              <div className="h-2 rounded bg-foreground/10" />
              <div className="h-2 rounded bg-foreground/15" />
            </div>
            <div className="col-span-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 rounded border border-border bg-background" />
                <div className="h-10 rounded border border-border bg-background" />
                <div className="h-10 rounded border border-border bg-background" />
              </div>
              <div className="h-16 rounded border border-border bg-background p-2">
                <div className="flex h-full items-end gap-1">
                  {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-foreground/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "stage") {
    // Stage / spotlight
    return (
      <div className="relative h-full w-full overflow-hidden bg-foreground">
        <div
          className="absolute -bottom-10 left-1/2 h-[140%] w-[180%] -translate-x-1/2 opacity-60"
          style={{
            backgroundImage:
              "conic-gradient(from 200deg at 50% 100%, transparent 0deg, oklch(0.99 0 0 / 0.35) 8deg, transparent 18deg, oklch(0.99 0 0 / 0.25) 30deg, transparent 42deg, oklch(0.99 0 0 / 0.3) 56deg, transparent 70deg)",
          }}
        />
        <div className="absolute bottom-6 left-1/2 h-1.5 w-40 -translate-x-1/2 rounded-full bg-background/80" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-eyebrow text-background/60">
          Live · On stage
        </div>
      </div>
    );
  }
  // editorial — magazine cover placeholder
  return (
    <div className="relative h-full w-full bg-background p-5">
      <div className="h-full w-full rounded-md border border-border bg-secondary p-5">
        <div className="text-eyebrow text-foreground/50">Issue 01</div>
        <div className="mt-3 text-display text-2xl leading-tight text-foreground">
          Notes on<br />building <em className="font-light text-foreground/60">Gatekeepr</em>
        </div>
        <div className="mt-5 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-foreground/15" />
          <div className="h-1.5 w-5/6 rounded bg-foreground/10" />
          <div className="h-1.5 w-4/6 rounded bg-foreground/10" />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-eyebrow text-foreground/40">Founder · F.N.C.</span>
          <span className="h-6 w-6 rounded-full border border-border" />
        </div>
      </div>
    </div>
  );
}

export function Work() {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (d: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section id="work" className="relative border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="reveal lg:col-span-5">
            <div className="text-eyebrow mb-4 text-muted-foreground">05 — Output</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl">
              Our work<br />at a glance
            </h2>
            <p className="mt-8 max-w-md text-[17px] leading-relaxed text-muted-foreground md:text-lg">
              A look at the brands, websites, campaigns, products, and
              experiences being built across Gatekeepr.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background hover:bg-foreground/85"
              >
                View our work →
              </a>
              <div className="flex gap-2">
                <button
                  aria-label="Previous"
                  onClick={() => scroll(-1)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border hover:border-foreground"
                >
                  ←
                </button>
                <button
                  aria-label="Next"
                  onClick={() => scroll(1)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border hover:border-foreground"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="reveal reveal-delay-1 lg:col-span-7">
            <div
              ref={scroller}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((it) => (
                <article
                  key={it.title}
                  className="card-hover group relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-background sm:w-[60%]"
                  style={{ minHeight: 420 }}
                >
                  {/* Visual thumbnail */}
                  <div className="relative h-52 w-full overflow-hidden border-b border-border">
                    <Visual kind={it.visual} />
                    <span className="absolute left-4 top-4 rounded-full border border-border bg-background/90 px-3 py-1 text-[12px] font-medium tracking-wide text-foreground backdrop-blur-sm">
                      {it.badge}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="text-display text-2xl md:text-[26px]">{it.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {it.desc}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-6">
                      <span className="neon-underline text-[15px] font-medium">{it.cta}</span>
                      <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
