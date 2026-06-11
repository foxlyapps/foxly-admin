/** Shared client-side formatters for analytics displays. */

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency: string): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currencySymbol(currency)}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}${currencySymbol(currency)}${(abs / 1_000).toFixed(1)}k`;
  return formatCurrency(value, currency);
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDelta(value: number | null): {
  text: string;
  positive: boolean | null;
} {
  if (value === null) return { text: "—", positive: null };
  const positive = value >= 0;
  return { text: `${positive ? "+" : ""}${value.toFixed(1)}%`, positive };
}

function currencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat(undefined, { style: "currency", currency })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? ""
    );
  } catch {
    return "";
  }
}

/** A consistent categorical palette (OKLCH brand-adjacent hues). */
export const CHART_COLORS = [
  "oklch(0.62 0.20 42)", // brand
  "oklch(0.60 0.13 230)", // blue
  "oklch(0.65 0.15 160)", // green
  "oklch(0.70 0.15 90)", // amber
  "oklch(0.58 0.18 300)", // purple
  "oklch(0.62 0.16 350)", // pink
];
