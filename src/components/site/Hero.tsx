import statue from "@/assets/statue-bust.jpg";
import founder from "@/assets/founder.jpg";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background statue silhouette */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 hidden h-[120%] w-[55%] opacity-[0.07] md:block"
        style={{
          backgroundImage: `url(${statue})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right top",
          filter: "grayscale(1) contrast(1.1)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-16 px-6 pb-28 pt-20 md:px-10 md:pb-40 md:pt-32 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="text-eyebrow mb-8 flex items-center gap-3 text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Est. 2026 — A modern business house
          </div>

          <h1 className="text-display text-[12vw] leading-[0.9] sm:text-[9vw] lg:text-[6.4vw]">
            Gatekeepr isn't<br />
            just a company.<br />
            <span className="italic font-light text-muted-foreground">It's a standard</span><br />
            for modern business<br />
            execution.
          </h1>

          <p className="mt-10 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            We build brands, websites, tools, campaigns, and experiences for
            businesses that refuse to look average.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-medium text-background transition hover:bg-foreground/85"
            >
              Contact Us
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#businesses"
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-sm font-medium hover:border-foreground"
            >
              View Our Businesses
            </a>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:pt-20">
          <div className="relative rounded-2xl border border-border bg-card p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)]">
            <div className="text-eyebrow mb-4 text-muted-foreground">
              A note from our Founder
            </div>
            <div className="flex items-center gap-4">
              <img
                src={founder}
                alt="Farzan Noor Chowdhury, Founder of Gatekeepr"
                width={72}
                height={72}
                loading="lazy"
                className="h-16 w-16 rounded-full object-cover grayscale"
              />
              <div>
                <div className="text-display text-lg leading-tight">
                  Farzan Noor<br />Chowdhury
                </div>
                <div className="text-xs text-muted-foreground">Founder & CEO</div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              "Average is the easiest thing to build. We're here to do the
              opposite — with taste, speed, and discipline."
            </p>
            <a
              href="#contact"
              className="neon-underline mt-5 inline-block text-sm font-medium"
            >
              Read more →
            </a>
          </div>
        </aside>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground md:flex">
        <div className="text-eyebrow">Scroll</div>
        <div className="h-10 w-px animate-pulse bg-foreground/40" />
      </div>
    </section>
  );
}
