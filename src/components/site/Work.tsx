import { useRef } from "react";

const items = [
  { badge: "Creative", title: "Timeline Studios Portfolio", desc: "Branding, visuals, motion and content work." },
  { badge: "Technology", title: "Darviz Labs Builds", desc: "Websites, tools, automations and product systems." },
  { badge: "Events", title: "Gatekeepr Experiences", desc: "Launches, activations and managed experiences." },
  { badge: "Thinking", title: "Founder Notes", desc: "Notes on business, execution, brand and building." },
];

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
          <div className="lg:col-span-5">
            <div className="text-eyebrow mb-4 text-muted-foreground">05 — Output</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl">
              Our work<br />at a glance
            </h2>
            <p className="mt-8 max-w-md text-muted-foreground">
              A look at the brands, websites, campaigns, products and
              experiences being built across Gatekeepr.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm text-background hover:bg-foreground/85"
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

          <div className="lg:col-span-7">
            <div
              ref={scroller}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((it, i) => (
                <article
                  key={it.title}
                  className="card-hover group relative flex w-[85%] shrink-0 snap-start flex-col justify-between rounded-3xl border border-border bg-card p-7 sm:w-[55%]"
                  style={{ minHeight: 360 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-border px-3 py-1 text-xs">{it.badge}</span>
                    <span className="text-eyebrow text-foreground/40">REPORT · 0{i + 1}</span>
                  </div>
                  <div className="mt-12">
                    <h3 className="text-display text-2xl md:text-3xl">{it.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{it.desc}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                    <span className="neon-underline text-sm font-medium">Open report</span>
                    <span className="text-xl">→</span>
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
