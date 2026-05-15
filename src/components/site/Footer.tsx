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
  { label: "Website Design & Development", href: "#services" },
  { label: "Brand Identity & Strategy", href: "#services" },
  { label: "AI Automation Systems", href: "#services" },
  { label: "Software & Products", href: "#services" },
];

const learnMore = [
  { label: "Terms of Service", href: "#" },
  { label: "Press Kit", href: "#" },
  { label: "Enterprise Support", href: "#contact" },
  { label: "Developer Documentation", href: "#" },
];

const regions = [
  { label: "Asia", address: null },
  { label: "Europe", address: null },
  {
    label: "Oceania",
    address: ["New South Wales 2150, Australia", "1 Station Street W, Parramatta, West Sydney,"],
  },
  { label: "North America", address: null },
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

      <div className="relative mx-auto max-w-[1400px] px-6 py-24 md:px-10">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Sitemap */}
          <div>
            <h3 className="mb-8 text-2xl font-medium text-background">Sitemap</h3>
            <ul className="space-y-5">
              {sitemap.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[17px] text-background/55 transition hover:text-background">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-8 text-2xl font-medium text-background">Services</h3>
            <ul className="space-y-5">
              {services.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[17px] text-background/55 transition hover:text-background">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn More */}
          <div>
            <h3 className="mb-8 text-2xl font-medium text-background">Learn More</h3>
            <ul className="space-y-5">
              {learnMore.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[17px] text-background/55 transition hover:text-background">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in touch */}
          <div>
            <div className="mb-8 flex items-center justify-between gap-4">
              <h3 className="text-2xl font-medium text-background">Get in touch</h3>
              <div className="flex items-center gap-4 text-background/70">
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

            <ul className="space-y-6">
              {regions.map((r) => (
                <li key={r.label} className="border-t border-background/15 pt-4">
                  <div
                    className={`text-[17px] ${
                      r.address ? "text-background" : "text-background/55"
                    }`}
                  >
                    {r.label}
                  </div>
                  {r.address && (
                    <div className="mt-2 space-y-1 text-[15px] text-background/70">
                      {r.address.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-background/15 pt-8 text-[14px] text-background/55 md:flex-row md:items-center md:justify-between">
          <div>© 2026 Gatekeepr. All rights reserved.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-background">Privacy Policy</a>
            <a href="#" className="hover:text-background">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
