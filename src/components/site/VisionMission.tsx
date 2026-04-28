import { useState } from "react";
import scene from "@/assets/vision-scene.jpg";
import statue from "@/assets/statue-bust.jpg";
import marble from "@/assets/marble.jpg";

const principles = [
  {
    n: "I",
    label: "Our vision",
    image: scene,
    body: (
      <>
        To become the{" "}
        <span className="italic font-light text-muted-foreground">
          business execution company
        </span>{" "}
        for emerging brands — where creative taste, technical capability, and
        operational discipline come together.
      </>
    ),
  },
  {
    n: "II",
    label: "Our mission",
    image: statue,
    body: (
      <>
        To help businesses build stronger identities, better digital
        infrastructure, sharper campaigns, and{" "}
        <span className="italic font-light text-muted-foreground">
          memorable experiences
        </span>{" "}
        that create real commercial value.
      </>
    ),
  },
];

export function VisionMission() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden border-t border-border bg-secondary py-24 md:py-32">
      {/* Marble texture wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url(${marble})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "multiply",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="text-eyebrow mb-4 text-muted-foreground">
              02 — Principles
            </div>
            <h2 className="text-display text-5xl leading-[0.95] md:text-6xl lg:text-7xl">
              The two ideas <br />
              <span className="italic font-light text-muted-foreground">
                we operate by.
              </span>
            </h2>
          </div>
          <div className="md:col-span-5">
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              Vision and mission, written plainly. No corporate fog. These are
              the two sentences every Gatekeepr decision is measured against.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="mt-20">
          <div className="relative">
            {/* Vertical accent line */}
            <div
              aria-hidden
              className="absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-px bg-foreground/15 md:block"
            />

            <div className="space-y-16 md:pl-12">
              {principles.map((p) => (
                <article
                  key={p.n}
                  className="group relative"
                  onMouseEnter={() => setHovered(p.n)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Numeral */}
                  <div
                    aria-hidden
                    className="text-display pointer-events-none absolute -left-12 top-0 hidden text-7xl leading-none text-foreground/10 transition-colors duration-500 group-hover:text-accent/70 md:block lg:text-8xl"
                  >
                    {p.n}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="ticker inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    <div className="text-eyebrow text-foreground/60">
                      {p.label}
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                    <p className="text-display text-3xl leading-[1.1] md:text-4xl lg:col-span-8 lg:text-[2.6rem]">
                      {p.body}
                    </p>

                    {/* Hover image preview */}
                    <div
                      aria-hidden
                      className={`pointer-events-none hidden lg:col-span-4 lg:block ${
                        hovered === p.n
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-3"
                      } transition-all duration-500`}
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_60px_-30px_oklch(0.16_0_0/0.25)]">
                        <img
                          src={p.image}
                          alt=""
                          width={640}
                          height={480}
                          loading="lazy"
                          className="h-56 w-full object-cover grayscale transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                        <div className="pointer-events-none absolute inset-2 rounded-xl border border-background/30" />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Footer signature */}
          <div className="mt-20 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground md:pl-12">
            <span className="text-eyebrow">Est. 2026</span>
            <span className="text-eyebrow">Taste · Systems · Speed</span>
            <span className="text-eyebrow">Mumbai · Remote</span>
          </div>
        </div>
      </div>
    </section>
  );
}
