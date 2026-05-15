import { useState } from "react";
import scene from "@/assets/vision-scene.jpg";

export function VisionMission() {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-32 md:py-40">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="reveal text-eyebrow mb-10 text-muted-foreground">
          02 — Principle
        </div>

        <div
          className="group relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <h2 className="text-display max-w-5xl text-3xl leading-[1.15] tracking-tight md:text-5xl lg:text-[3.4rem]">
            We exist to help ambitious businesses build stronger identities,
            sharper digital infrastructure, and{" "}
            <span className="italic font-light text-muted-foreground">
              memorable experiences
            </span>{" "}
            that create lasting commercial value.
          </h2>

          {/* Hover image — sits to the side, fades in */}
          <div
            aria-hidden
            className={`pointer-events-none absolute right-0 top-0 hidden h-[260px] w-[360px] overflow-hidden rounded-xl border border-border transition-all duration-500 lg:block ${
              hovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <img
              src={scene}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover grayscale"
            />
          </div>
        </div>

        <div className="mt-20 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
          <span className="text-eyebrow">Est. 2024</span>
          <span className="text-eyebrow hidden md:inline">Taste · Systems · Speed</span>
          <span className="text-eyebrow">Mumbai · Remote</span>
        </div>
      </div>
    </section>
  );
}
