import statue from "@/assets/statue-bust.jpg";

const cards = [
  {
    title: "Raising the standard of local business execution",
    desc: "Gatekeepr helps businesses move beyond average branding, weak websites, scattered marketing and unstructured operations.",
  },
  {
    title: "Building ambitious creative and technical talent",
    desc: "Through Timeline Studios and Darviz Labs, Gatekeepr is designed to become a training ground for designers, developers, marketers, operators and builders.",
  },
  {
    title: "Making digital presence feel premium",
    desc: "We help businesses present themselves with the confidence, clarity and polish usually reserved for larger companies.",
  },
];

export function Impact() {
  return (
    <section id="blog" className="relative border-t border-border bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-eyebrow mb-4 text-muted-foreground">06 — Beyond</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl">
              Our impact<br />beyond business
            </h2>
            <p className="mt-6 max-w-xl text-muted-foreground md:text-lg">
              We are building for the businesses, creators and operators who
              deserve better design, better systems and better execution.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <article
              key={c.title}
              className="card-hover group relative overflow-hidden rounded-3xl border border-border bg-background p-8"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                <img
                  src={statue}
                  alt=""
                  width={800}
                  height={600}
                  loading="lazy"
                  className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="text-eyebrow text-foreground/40">0{i + 1}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <h3 className="text-display mt-4 text-2xl">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              <a href="#contact" className="neon-underline mt-6 inline-block text-sm font-medium">
                Learn more →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
