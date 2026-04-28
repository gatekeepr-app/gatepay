import statue from "@/assets/hero-statue.jpg";
import marble from "@/assets/marble.jpg";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Subtle marble texture wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url(${marble})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "multiply",
        }}
      />

      {/* Background marble bust silhouette — soft, typographic-led hero */}
      <div
        aria-hidden
        className="float-slow pointer-events-none absolute -right-32 top-20 hidden h-[110%] w-[48%] opacity-[0.04] md:block"
        style={{
          backgroundImage: `url(${statue})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right top",
          filter: "grayscale(1) contrast(0.9) blur(1px) drop-shadow(0 30px 40px oklch(0.16 0 0 / 0.15))",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6 pb-28 pt-20 md:px-10 md:pb-40 md:pt-32">
        <div className="text-eyebrow mb-8 flex items-center gap-3 text-muted-foreground fade-up" style={{ animationDelay: "0.05s" }}>
          <span className="ticker inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Est. 2024 — A modern business house
        </div>

        <h1 className="text-display text-[12vw] leading-[0.9] sm:text-[9vw] lg:text-[6.4vw] fade-up" style={{ animationDelay: "0.15s" }}>
          Gatekeepr isn't<br />
          just a company.<br />
          <span className="italic font-light text-muted-foreground">It's a standard</span><br />
          for modern business<br />
          execution.
        </h1>

        <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-muted-foreground md:text-lg fade-up" style={{ animationDelay: "0.35s" }}>
          We build brands, websites, tools, campaigns, events, and digital
          systems for businesses that refuse to look average.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3 fade-up" style={{ animationDelay: "0.5s" }}>
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-[15px] font-medium text-background transition hover:-translate-y-0.5 hover:bg-foreground/85 hover:shadow-lg"
          >
            Contact Us
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a
            href="#businesses"
            className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-[15px] font-medium transition hover:-translate-y-0.5 hover:border-foreground"
          >
            View Our Businesses
          </a>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground md:flex">
        <div className="text-eyebrow">Scroll</div>
        <div className="h-10 w-px animate-pulse bg-foreground/40" />
      </div>
    </section>
  );
}
