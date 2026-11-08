import { localeOf, type Lang } from "@/i18n";

/** All math is done in paisa (integers) to avoid floating-point errors. */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Accepts "500", "৫০০", "1,250.50", "১২৫০.৫০" -> paisa. */
export function parseAmount(input: string): number | null {
  const v = input
    .trim()
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/[,\s]/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(v)) return null;
  const paisa = Math.round(parseFloat(v) * 100);
  return paisa > 0 ? paisa : null;
}

/** "500.00" (DB numeric string) -> 50000 */
export function toPaisa(v: string | number): number {
  return Math.round(Number(v) * 100);
}

/** 50000 -> "500.00" (for storing in a numeric column) */
export function paisaToNumeric(p: number): string {
  return (p / 100).toFixed(2);
}

export function formatTaka(p: number, lang: Lang): string {
  const hasFraction = p % 100 !== 0;
  return (
    "৳" +
    (p / 100).toLocaleString(localeOf(lang), {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(d: string, lang: Lang): string {
  return new Date(d + "T00:00:00Z").toLocaleDateString(localeOf(lang), {
    day: "numeric",
    month: lang === "bn" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z"));
}
