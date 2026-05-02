import { useState } from "react";
import statue from "@/assets/statue-bust.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ContactCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || null,
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send. Please try again.");
      return;
    }
    setDone(true);
    setName(""); setEmail(""); setCompany(""); setMessage("");
    toast.success("Thanks — we'll be in touch.");
  };

  return (
    <section id="contact" className="relative overflow-hidden border-t border-border bg-foreground text-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 hidden h-[120%] w-[55%] opacity-[0.18] md:block"
        style={{
          backgroundImage: `url(${statue})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right bottom",
          filter: "grayscale(1) invert(1) contrast(1.25) drop-shadow(0 40px 60px rgba(0,0,0,0.6))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-[55%] md:block"
        style={{
          background:
            "radial-gradient(60% 60% at 75% 50%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid max-w-[1400px] gap-16 px-6 py-28 md:grid-cols-[1.1fr_1fr] md:px-10 md:py-40">
        <div>
          <div className="reveal text-eyebrow mb-6 text-background/50">07 — Build with us</div>
          <h2 className="reveal reveal-delay-1 text-display max-w-2xl text-[10vw] leading-[0.95] sm:text-6xl md:text-6xl lg:text-[5.4vw]">
            Build something that looks serious, works properly, and
            <span className="italic font-light text-background/60"> moves people.</span>
          </h2>
          <p className="reveal reveal-delay-2 mt-10 max-w-xl text-[17px] leading-relaxed text-background/75 md:text-lg">
            Whether you need a brand, website, campaign, event, or digital system
            — Gatekeepr brings the creative, technical, and operational team to
            execute it properly.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="reveal reveal-delay-2 relative z-10 self-start rounded-2xl border border-background/15 bg-background/[0.04] p-7 backdrop-blur-sm md:p-9"
        >
          <div className="text-eyebrow mb-6 text-background/50">Start a project</div>
          {done ? (
            <div className="space-y-4">
              <p className="text-lg">Thank you. We'll respond within 1–2 business days.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDone(false)}
                className="border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"
              >
                Send another
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 border-background/20 bg-transparent text-background placeholder:text-background/40 focus-visible:ring-background/40"
              />
              <Input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-background/20 bg-transparent text-background placeholder:text-background/40 focus-visible:ring-background/40"
              />
              <Input
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-12 border-background/20 bg-transparent text-background placeholder:text-background/40 focus-visible:ring-background/40"
              />
              <textarea
                required
                rows={4}
                placeholder="Tell us what you're building"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-background/20 bg-transparent px-3 py-2.5 text-[15px] text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-background/40"
              />
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-background py-6 text-[15px] font-medium text-foreground hover:bg-background/90"
              >
                {submitting ? "Sending…" : "Contact Us →"}
              </Button>
              <a
                href="#businesses"
                className="block pt-2 text-center text-sm text-background/60 hover:text-background"
              >
                Or explore our businesses
              </a>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
