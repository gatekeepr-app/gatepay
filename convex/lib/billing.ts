export function calcBillingTotal(
  billingType: "monthly" | "yearly" | "per_project",
  amount: number,
  monthsCount?: number | null,
  startDate?: number | null,
  endDate?: number | null,
): number {
  if (billingType === "monthly") return amount * (monthsCount ?? 1);
  if (billingType === "yearly") {
    if (startDate && endDate) {
      const years = Math.max(1, Math.ceil((endDate - startDate) / (365 * 24 * 60 * 60 * 1000)));
      return amount * years;
    }
    return amount;
  }
  return amount;
}
