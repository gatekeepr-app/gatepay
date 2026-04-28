const services = [
  { n: "01", title: "Marketing & Brand Building", desc: "Brand identity, campaigns, content systems, social creatives, and launch storytelling." },
  { n: "02", title: "Website Development", desc: "Fast, modern, conversion-focused websites for companies, creators, events, and products." },
  { n: "03", title: "Tool & Product Development", desc: "Custom business tools, internal dashboards, automations, and digital products." },
  { n: "04", title: "Creative Production", desc: "Motion graphics, videos, visuals, pitch assets, and campaign material." },
  { n: "05", title: "Event Management", desc: "Launches, activations, campus events, corporate gatherings, and branded experiences." },
  { n: "06", title: "Business Systems", desc: "Operational workflows, digital process design, client journeys, and execution infrastructure." },
];

const Glyph = ({ i }: { i: number }) => {
  const glyphs = ["◇", "❘❘❘", "▢", "△", "◯", "✦"];
  return <span className="text-2xl text-foreground/70">{glyphs[i]}</span>;
};

export function Services() {
  return (
    <section id="services" className="relative border-t border-border bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-eyebrow mb-4 text-muted-foreground">03 — Capabilities</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl">What we build</h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base">
            Six disciplines under one roof — engineered to work together,
            available individually when you need them.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <article
              key={s.title}
              className="group relative flex flex-col gap-6 bg-background p-8 transition-colors duration-300 hover:bg-card md:p-10"
            >
              <div className="flex items-center justify-between">
                <span className="inline-block transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Glyph i={i} />
                </span>
                <span className="text-eyebrow text-foreground/40">{s.n}</span>
              </div>
              <h3 className="text-display text-2xl md:text-3xl">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{s.desc}</p>
              <div className="mt-auto h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
