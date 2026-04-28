import statue from "@/assets/statue-bust.jpg";

export function ContactCTA() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-border bg-foreground text-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 hidden h-[120%] w-[55%] opacity-[0.12] md:block"
        style={{
          backgroundImage: `url(${statue})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right bottom",
          filter: "grayscale(1) invert(1) contrast(1.2)",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="text-eyebrow mb-6 text-background/50">07 — Build with us</div>
        <h2 className="text-display max-w-5xl text-[10vw] leading-[0.95] sm:text-6xl md:text-7xl lg:text-[6.4vw]">
          Build something that looks serious, works properly, and
          <span className="italic font-light text-background/60"> moves people.</span>
        </h2>
        <p className="mt-10 max-w-2xl text-base text-background/70 md:text-lg">
          Whether you need a brand, website, product, campaign or event —
          Gatekeepr brings the creative, technical and operational team to
          execute it.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <a
            href="mailto:hello@gatekeepr.com"
            className="inline-flex items-center gap-2 rounded-full bg-background px-7 py-4 text-sm font-medium text-foreground hover:bg-background/90"
          >
            Contact Us →
          </a>
          <a
            href="#businesses"
            className="inline-flex items-center gap-2 rounded-full border border-background/30 px-7 py-4 text-sm font-medium text-background hover:border-background"
          >
            Explore our businesses
          </a>
        </div>
      </div>
    </section>
  );
}
