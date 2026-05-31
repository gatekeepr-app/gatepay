"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import BannerImage from "../../assets/banner.png";

export function DashboardBanner({ userName }: { userName: string }) {
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl h-64 bg-linear-to-r from-primary/90 to-primary text-primary-foreground flex items-end w-full">
      <Image
        src={BannerImage}
        alt=""
        width={2100}
        height={900}
        className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
      />
      <div className="relative z-10 w-full flex items-center justify-between px-6 py-6 sm:px-8 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome {userName},
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Here&apos;s what&apos;s happening with your payments today.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 p-2 transition-colors hover:bg-primary-foreground/20"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </div>
    </div>
  );
}
