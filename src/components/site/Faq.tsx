import { useState } from "react";

const faqs = [
  {
    num: "01",
    q: "What happens after I contact Gatekeepr?",
    a: "After you submit your details, we review and typically reply within one business day to schedule a free, no-obligation intro call. We’ll clarify your goals, constraints, and success metrics, then suggest next steps. If it’s a fit, we’ll share a clear scope, timeline, and estimate so you can decide without pressure. If not, we’ll still point you in the right direction.",
  },
  {
    num: "02",
    q: "What budget do projects typically require? Can we trim scope if needed?",
    a: "Most engagements start at $15k–$200k+ depending on complexity. If your needs fall below our model, we’ll tell you early and suggest a leaner path. Costs can be reduced by phasing, trimming features, or launching a focused v1 first. Either way, we’re happy to talk — even if it’s just to share useful advice.",
  },
  {
    num: "03",
    q: "How soon can you start, and can you meet deadlines?",
    a: "We keep a limited number of active slots to protect quality. Discovery typically begins within ~1 week of agreement, with kickoff 1–2 weeks later. If you have a hard deadline, we’ll propose a milestone-based plan with weekly checkpoints and phased delivery — never overpromising.",
  },
  {
    num: "04",
    q: "What’s it like to work with you — process, comms, payments?",
    a: "We operate as a partner team, aligned to your time zone. Expect weekly updates, clear milestones, and tight feedback loops. Payments are milestone-based: start, mid, and launch. Ongoing support — design, optimization, and automation — is available through a monthly retainer.",
  },
];

function FaqItem({ item }: { item: (typeof faqs)[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-6 py-7 text-left transition-colors hover:text-foreground/80 md:py-8"
      >
        <span className="text-eyebrow mt-1 shrink-0 text-muted-foreground">{item.num}</span>
        <span className="text-display flex-1 text-xl leading-snug md:text-2xl">{item.q}</span>
        <span className="text-eyebrow mt-1 shrink-0 text-muted-foreground transition-transform duration-300">
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="pb-8 pl-12 pr-6 text-[16px] leading-relaxed text-muted-foreground md:pl-14 md:text-[17px]">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="relative border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="reveal text-eyebrow mb-12 text-muted-foreground">06 — Questions</div>
        <h2 className="text-display reveal reveal-delay-1 mb-16 max-w-2xl text-4xl leading-[1.05] md:text-5xl lg:text-6xl">
          Frequently asked
        </h2>

        <div className="reveal reveal-delay-2 max-w-4xl">
          {faqs.map((item) => (
            <FaqItem key={item.num} item={item} />
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  );
}
