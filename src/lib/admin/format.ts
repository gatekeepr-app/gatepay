export const CURRENCIES = ["BDT", "USD", "EUR", "INR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<string, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  INR: "₹",
  GBP: "£",
};

export function formatMoney(amount: number | string | null | undefined, currency: string = "BDT") {
  const n = Number(amount ?? 0);
  const sym = SYMBOLS[currency] ?? "";
  return `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
