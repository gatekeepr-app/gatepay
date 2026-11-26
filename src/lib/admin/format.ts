export const CURRENCIES = ["BDT", "USD", "EUR", "INR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<string, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  INR: "₹",
  GBP: "£",
};

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = "BDT",
  options: { locale?: string; style?: "symbol" | "currency" } = {},
) {
  const n = Number(amount ?? 0);
  if (options.style === "currency") {
    return new Intl.NumberFormat(options.locale ?? "en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  }
  const sym = SYMBOLS[currency] ?? "";
  return `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(
  d: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions & { locale?: string; fallback?: string } = {},
) {
  if (!d) return options.fallback ?? "—";
  const { locale, fallback: _fallback, ...formatOptions } = options;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...formatOptions,
  }).format(new Date(d));
}
