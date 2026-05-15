import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Businesses } from "@/components/site/Businesses";
import { VisionMission } from "@/components/site/VisionMission";
import { Services } from "@/components/site/Services";
import { Culture } from "@/components/site/Culture";
import { Faq } from "@/components/site/Faq";
import { ContactCTA } from "@/components/site/ContactCTA";
import { Footer } from "@/components/site/Footer";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { CursorBlend } from "@/components/site/CursorBlend";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gatekeepr — A standard for modern business execution" },
      {
        name: "description",
        content:
          "Gatekeepr builds brands, websites, tools, campaigns and experiences for ambitious businesses. A modern business house with creative, technical and operational power.",
      },
      { property: "og:title", content: "Gatekeepr — Modern business execution" },
      {
        property: "og:description",
        content:
          "Brands, websites, tools, campaigns and experiences for businesses that refuse to look average.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-background text-foreground">
      <CursorBlend />
      <RevealOnScroll />
      <Header />
      <Hero />
      <Businesses />
      <VisionMission />
      <Services />
      <Culture />
      <Faq />
      <ContactCTA />
      <Footer />
    </main>
  );
}
