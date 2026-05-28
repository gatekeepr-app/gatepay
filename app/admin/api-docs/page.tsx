"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApiDocsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/docs/payments-api");
  }, [router]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to API docs…
    </div>
  );
}
