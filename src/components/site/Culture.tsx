import atelier from "@/assets/culture-atelier.jpg";
import marble from "@/assets/marble.jpg";

const principles = [
  "Taste over noise",
  "Speed with standards",
  "Ownership over excuses",
  "Systems over chaos",
  "Craft in every detail",
];

export function Culture() {
  return (
    <section id="culture" className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-6 md:px-10 lg:grid-cols-12 lg:gap-20">
        {/* Left visual — editorial atelier composition */}
        <div className="lg:col-span-6">
          <div className="relative">
            {/* Marble plate behind image */}
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[28px] bg-secondary opacity-80"
              style={{
                backgroundImage: `url(${marble})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-[0_30px_60px_-30px_oklch(0.16_0_0/0.25)]">
              <img
                src={atelier}
                alt="Gatekeepr studio — brand boards, sketches and a marble bust on a designer's desk"
                width={1280}
                height={1280}
                loading="lazy"
                className="h-full w-full object-cover grayscale"
              />
              {/* Editorial caption strip */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-foreground/90 px-5 py-3 text-background backdrop-blur-sm">
                <span className="text-eyebrow text-background/70">Inside the studio</span>
                <span className="text-eyebrow text-background/50">Mumbai · Remote</span>
              </div>
            </div>

            {/* Floating numeric tag */}
            <div className="absolute -left-3 -top-3 hidden rounded-full border border-border bg-background px-4 py-2 text-eyebrow text-foreground/60 shadow-sm md:block">
              04 — Inside
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="lg:col-span-6 lg:pt-8">
          <div className="text-eyebrow mb-4 text-muted-foreground">04 — Inside</div>
          <h2 className="text-display text-5xl md:text-6xl">Working at Gatekeepr</h2>
          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-lg">
            A place for people who care about taste, speed, ownership, and high
            standards. We build like operators, design like craftsmen, and
            execute like the details matter — because they do.
          </p>

          <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {principles.map((p, i) => (
              <li
                key={p}
                className="flex items-center gap-4 bg-background px-6 py-5 text-[16px]"
              >
                <span className="text-eyebrow text-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium text-foreground">{p}</span>
              </li>
            ))}
          </ul>

          <a
            href="#contact"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[15px] font-medium hover:border-foreground"
          >
            Learn more about our culture →
          </a>
        </div>
      </div>
    </section>
  );
}
