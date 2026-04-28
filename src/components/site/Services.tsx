const services = [
  {
    n: "01",
    title: "Marketing & Brand Building",
    desc: "Brand identity, campaigns, content systems, and launch storytelling designed to make the business look sharper and sell better.",
  },
  {
    n: "02",
    title: "Website Development",
    desc: "Premium websites built for credibility, speed, clarity, and conversion.",
  },
  {
    n: "03",
    title: "Tool & Product Development",
    desc: "Custom tools, internal dashboards, automations, and digital products built around real business workflows.",
  },
  {
    n: "04",
    title: "Creative Production",
    desc: "Motion graphics, videos, visuals, pitch assets, and campaign materials with strong creative direction.",
  },
  {
    n: "05",
    title: "Event Management",
    desc: "Launches, activations, campus events, corporate gatherings, and branded experiences managed with operational control.",
  },
  {
    n: "06",
    title: "Business Systems",
    desc: "Digital workflows, client journeys, process design, and execution infrastructure for businesses outgrowing chaos.",
  },
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
              className="group relative flex flex-col gap-7 bg-background p-10 transition-colors duration-300 hover:bg-card md:p-12"
            >
              <div className="flex items-center justify-between">
                <span className="inline-block text-foreground/60 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Glyph i={i} />
                </span>
                <span className="text-eyebrow text-foreground/40">{s.n}</span>
              </div>
              <h3 className="text-display text-2xl md:text-3xl">{s.title}</h3>
              <p className="text-[16px] leading-relaxed text-muted-foreground">{s.desc}</p>
              <div
                className="mt-auto h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                style={{ backgroundColor: "#7DFF6A" }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
