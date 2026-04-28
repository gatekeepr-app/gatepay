import culture from "@/assets/culture.jpg";

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
        <div className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-3xl border border-border">
            <img
              src={culture}
              alt="Sculptural creative studio workspace"
              width={1280}
              height={1280}
              loading="lazy"
              className="h-full w-full object-cover grayscale"
            />
          </div>
        </div>
        <div className="lg:col-span-6 lg:pt-8">
          <div className="text-eyebrow mb-4 text-muted-foreground">04 — Inside</div>
          <h2 className="text-display text-5xl md:text-6xl">Working at Gatekeepr</h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            This is a place for people who care about taste, speed, ownership
            and high standards. We build like operators, design like craftsmen,
            and execute like the details matter — because they do.
          </p>

          <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {principles.map((p, i) => (
              <li
                key={p}
                className="flex items-center gap-4 bg-background px-5 py-4 text-[15px]"
              >
                <span className="text-eyebrow text-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium">{p}</span>
              </li>
            ))}
          </ul>

          <a
            href="#contact"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[15px] font-medium hover:border-foreground"
          >
            Contact Us →
          </a>
        </div>
      </div>
    </section>
  );
}
