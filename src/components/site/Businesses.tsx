import { useRef } from "react";
import darvizMark from "@/assets/darviz-logomark.png";

type Biz = {
  name: string;
  label: string;
  tagline: string;
  description: string;
  services: string[];
  accent: string;
};

const businesses: Biz[] = [
  {
    name: "Timeline Studios",
    label: "A Gatekeepr company",
    tagline: "Brands that move, speak, and sell.",
    description:
      "Timeline Studios is Gatekeepr's creative and marketing arm — branding, graphic design, motion graphics, video, websites and social media execution for businesses that need a sharper digital presence.",
    services: ["Branding", "Graphic Design", "Motion", "Video", "Websites", "Social"],
    accent: "TS",
  },
  {
    name: "Darviz Labs",
    label: "A Gatekeepr company",
    tagline: "Technology built with business intent.",
    description:
      "Darviz Labs is Gatekeepr's technology and product arm — websites, web apps, internal tools, automations and digital systems for businesses that need stronger technical infrastructure.",
    services: ["Websites", "Web Apps", "Products", "Tools", "Automation", "AI Systems"],
    accent: "DL",
  },
  {
    name: "Gatekeepr Experiences",
    label: "A Gatekeepr service vertical",
    tagline: "Events, activations and experiences with taste.",
    description:
      "Event management, brand activations, launch experiences, campus campaigns and business gatherings — with strong creative direction and operational control.",
    services: ["Events", "Activations", "Launches", "Campus", "Corporate", "Experience"],
    accent: "GE",
  },
  {
    name: "Gatekeepr Advisory",
    label: "A Gatekeepr service vertical",
    tagline: "Strategy before execution.",
    description:
      "Helping founders clarify positioning, sharpen offers, plan digital operations and build execution systems before scaling campaigns, products or websites.",
    services: ["Strategy", "Positioning", "Growth", "Operations", "Launch Planning", "Offers"],
    accent: "GA",
  },
];

export function Businesses() {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section id="businesses" className="relative border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-eyebrow mb-4 text-muted-foreground">01 — Portfolio</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl">
              Our businesses
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              At the heart of Gatekeepr is a group of businesses built around one
              operating belief: better branding, better technology, better execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
          {businesses.map((b) => (
            <article
              key={b.name}
              className="card-hover group relative flex w-[88%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl bg-foreground p-8 text-background sm:w-[60%] lg:w-[42%] xl:w-[34%]"
              style={{ minHeight: 520 }}
            >
              {/* Marble accent panel */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-[0.08] marble-bg" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-1 w-0 bg-accent transition-all duration-500 group-hover:w-full" />

              <div>
                <div className="flex items-start justify-between">
                  <div className="text-eyebrow text-background/50">{b.label}</div>
                  {b.name === "Darviz Labs" ? (
                    <img src={darvizMark} alt="Darviz Labs" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="text-display text-3xl text-background/30">{b.accent}</div>
                  )}
                </div>
                <h3 className="text-display mt-8 text-3xl md:text-4xl">{b.name}</h3>
                <p className="mt-3 text-lg italic text-background/70">{b.tagline}</p>
                <p className="mt-6 text-sm leading-relaxed text-background/70">
                  {b.description}
                </p>
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap gap-2">
                  {b.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-background/20 px-3 py-1 text-xs text-background/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <a
                  href="#contact"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-background"
                >
                  <span className="neon-underline">Learn more</span>
                  <span>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
