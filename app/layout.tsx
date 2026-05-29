import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/integrations/convex/provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata = {
  title: "GatePay",
  description: "Payment Verification Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ConvexClientProvider>
          {children}
          <Toaster richColors closeButton />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
