import scene from "@/assets/vision-scene.jpg";

export function VisionMission() {
  return (
    <section className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-6 md:px-10 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="text-eyebrow mb-4 text-muted-foreground">02 — Principles</div>

          <div className="space-y-14">
            <div>
              <div className="text-eyebrow mb-4 text-foreground/50">Our vision</div>
              <p className="text-display text-3xl leading-tight md:text-4xl">
                To become the business execution company for emerging
                brands — where creative taste, technical capability, and
                operational discipline come together.
              </p>
            </div>
            <div className="h-px w-24 bg-foreground/20" />
            <div>
              <div className="text-eyebrow mb-4 text-foreground/50">Our mission</div>
              <p className="text-display text-3xl leading-tight md:text-4xl">
                To help businesses build stronger identities, better
                digital infrastructure, sharper campaigns, and memorable
                experiences that create real commercial value.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl border border-border">
            <img
              src={scene}
              alt="Editorial composition of Greek statue with modern websites and brand boards"
              width={1280}
              height={1280}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-foreground px-5 py-4 text-background shadow-xl md:block">
            <div className="text-eyebrow text-background/50">Operating belief</div>
            <div className="text-display mt-1 text-lg">Taste. Systems. Speed.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
