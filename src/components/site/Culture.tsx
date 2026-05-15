
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
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="reveal reveal-delay-1">
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
