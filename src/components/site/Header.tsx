import { useEffect, useState } from "react";
import logo from "@/assets/gatekeepr-logo.png";

const nav = [
  { label: "Home", href: "#home" },
  { label: "Businesses", href: "#businesses" },
  { label: "Services", href: "#services" },
  { label: "Culture", href: "#culture" },
  { label: "Work", href: "#work" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10">
        <a href="#home" className="flex items-center" aria-label="Gatekeepr">
          <img src={logo} alt="Gatekeepr" className="h-5 w-auto md:h-6" />
        </a>

        <nav className="hidden items-center gap-10 lg:flex xl:gap-12">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="neon-underline text-base font-medium text-foreground/80 hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden rounded-full bg-foreground px-5 py-2.5 text-[15px] font-medium text-background transition hover:bg-foreground/85 md:inline-flex"
          >
            Contact Us
          </a>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border lg:hidden"
          >
            <span className="block h-px w-5 bg-foreground" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="flex flex-col px-6 py-4">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base"
              >
                {n.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-foreground px-5 py-3 text-center text-sm text-background"
            >
              Contact Us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
