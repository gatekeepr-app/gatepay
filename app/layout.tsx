import type { ReactNode } from "react";
import { ConvexClientProvider } from "@/integrations/convex/provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "GatePay",
  description: "Payment Verification Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ConvexClientProvider>
          {children}
          <Toaster richColors closeButton />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
