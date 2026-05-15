import { useState } from "react";
import { Mail, Facebook, Linkedin, Instagram, Youtube, ChevronDown } from "lucide-react";
import marble from "@/assets/marble.jpg";
import statue from "@/assets/statue-bust.jpg";

const sitemap = [
  { label: "Home", href: "#home" },
  { label: "Work", href: "#work" },
  { label: "Career", href: "https://darvizlabs.com/career" },
  { label: "Contact", href: "#contact" },
];

const services = [
  { label: "Website Design & Development", href: "https://darvizlabs.com/projects/website-design" },
  { label: "Brand Identity & Strategy", href: "https://darvizlabs.com/projects/website-design" },
  { label: "AI Automation Systems", href: "https://darvizlabs.com/projects/website-design" },
  { label: "Software & Products", href: "https://darvizlabs.com/projects/website-design" },
];

const learnMore = [
  { label: "Terms of Service", href: "#" },
  { label: "Press Kit", href: "#" },
  { label: "Enterprise Support", href: "#contact" },
  { label: "Developer Documentation", href: "#" },
];

const regions: { label: string; address: string[] }[] = [
  { label: "Asia", address: ["Kuala Lumpur, Malaysia", "Bukit Kiara, 60000, Wilayah Persekutuan,", "492 Bashundhara R/A Link Road", "Dhaka 1212, Bangladesh"] },
  { label: "Europe", address: ["Frankfurt, Germany", "Henriette Fürth Straße 2, Frankfurt am Main, 60529"] },
  {
    label: "Oceania",
    address: ["New South Wales 2150, Australia", "1 Station Street W, Parramatta, West Sydney"],
  },
  { label: "North America", address: ["ON M1N 2K2, Canada", "302 Aylesworth AVE, Toronto"] },
];

// Custom X (Twitter) icon since lucide doesn't include the new logo
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  const [openRegion, setOpenRegion] = useState<string | null>("Oceania");

  return (
    <footer className="relative overflow-hidden border-t border-border bg-foreground text-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url(${marble})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 hidden h-[110%] w-[35%] opacity-[0.05] md:block"
        style={{
          backgroundImage: `url(${statue})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left bottom",
          filter: "grayscale(1) contrast(1.1) invert(1)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4 lg:gap-12">
          {/* Sitemap */}
          <div>
            <h3 className="mb-6 text-xl font-medium text-background sm:mb-8 sm:text-2xl">Sitemap</h3>
            <ul className="space-y-4 sm:space-y-5">
              {sitemap.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-base text-background/55 transition hover:text-background sm:text-[17px]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-6 text-xl font-medium text-background sm:mb-8 sm:text-2xl">Services</h3>
            <ul className="space-y-4 sm:space-y-5">
              {services.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-base text-background/55 transition hover:text-background sm:text-[17px]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn More */}
          <div>
            <h3 className="mb-6 text-xl font-medium text-background sm:mb-8 sm:text-2xl">Learn More</h3>
            <ul className="space-y-4 sm:space-y-5">
              {learnMore.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-base text-background/55 transition hover:text-background sm:text-[17px]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in touch */}
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8 sm:gap-4">
              <h3 className="text-xl font-medium text-background sm:text-2xl">Get in touch</h3>
              <div className="flex flex-wrap items-center gap-3 text-background/70 sm:gap-4">
                <a href="mailto:hello@gatekeepr.com" aria-label="Email" className="transition hover:text-background">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Facebook" className="transition hover:text-background">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" aria-label="X" className="transition hover:text-background">
                  <XIcon className="h-[18px] w-[18px]" />
                </a>
                <a href="#" aria-label="LinkedIn" className="transition hover:text-background">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Instagram" className="transition hover:text-background">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" aria-label="YouTube" className="transition hover:text-background">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            <ul className="space-y-2">
              {regions.map((r) => {
                const isOpen = openRegion === r.label;
                return (
                  <li
                    key={r.label}
                    className="group border-t border-background/15 pt-3"
                    onMouseEnter={() => setOpenRegion(r.label)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenRegion(isOpen ? null : r.label)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 text-left text-[17px] text-background/70 transition hover:text-background"
                    >
                      <span className={isOpen ? "text-background" : ""}>{r.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-background" : "text-background/50"
                        }`}
                      />
                    </button>
                    <div
                      className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        isOpen ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0">
                        <div className="space-y-1 pb-1 text-[14px] leading-relaxed text-background/70 sm:text-[15px]">
                          {r.address.map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-background/15 pt-6 text-[13px] text-background/55 sm:mt-20 sm:pt-8 sm:text-[14px] md:flex-row md:items-center md:justify-between">
          <div>© 2026 Gatekeepr. All rights reserved.</div>
          <div className="flex flex-wrap gap-6 sm:gap-8">
            <a href="#" className="hover:text-background">Privacy Policy</a>
            <a href="#" className="hover:text-background">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
