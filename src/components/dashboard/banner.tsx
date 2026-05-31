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
    <div className="relative overflow-hidden rounded-2xl min-h-[180px] sm:min-h-64 text-white flex items-end w-full">
      <Image
        src={BannerImage}
        alt=""
        width={2100}
        height={900}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 sm:px-8 sm:py-8">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Welcome {userName},
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/80">
            Here&apos;s what&apos;s happening with your payments today.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="self-end sm:self-auto rounded-full border border-white/20 bg-white/10 p-2 transition-colors hover:bg-white/20 shrink-0"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-14 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </div>
    </div>
  );
}
