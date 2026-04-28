import logo from "@/assets/gatekeepr-logo.png";
import marble from "@/assets/marble.jpg";
import statue from "@/assets/statue-bust.jpg";

const cols = [
  {
    title: "Our businesses",
    links: ["Timeline Studios", "Darviz Labs", "Gatekeepr Experiences", "Gatekeepr Advisory"],
  },
  {
    title: "Services",
    links: [
      "Marketing",
      "Website Development",
      "Tool Development",
      "Event Management",
      "Creative Production",
      "Business Systems",
    ],
  },
  {
    title: "Company",
    links: ["Culture", "Work", "Blog", "Careers", "Contact"],
  },
  {
    title: "Get in touch",
    links: ["Contact Us", "Start a project", "Business inquiries"],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      {/* Marble texture wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url(${marble})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "multiply",
        }}
      />
      {/* Statue bust motif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 hidden h-[110%] w-[40%] opacity-[0.06] md:block"
        style={{
          backgroundImage: `url(${statue})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left bottom",
          filter: "grayscale(1) contrast(1.1)",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 py-20 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <img src={logo} alt="Gatekeepr" className="h-7 w-auto" />
            <p className="mt-6 max-w-xs text-sm text-muted-foreground">
              A modern business house — creative, technical and operational
              power for ambitious companies.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-eyebrow mb-5 text-foreground/50">{c.title}</div>
              <ul className="space-y-3">
                {c.links.map((l) => {
                  const isCareers = l === "Careers";
                  return (
                    <li key={l}>
                      <a
                        href={isCareers ? "https://darvizlabs.com/career" : "#contact"}
                        target={isCareers ? "_blank" : undefined}
                        rel={isCareers ? "noopener noreferrer" : undefined}
                        className="neon-underline text-sm text-foreground/80"
                      >
                        {l}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© 2026 Gatekeepr. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
