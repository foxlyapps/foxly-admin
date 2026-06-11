/**
 * Date-range presets for analytics filtering.
 * All ranges are computed in the server's local time and are inclusive of
 * `from` and exclusive of `to`.
 */

export type RangePreset =
  | "today"
  | "yesterday"
  | "current_week"
  | "last_week"
  | "current_month"
  | "last_month"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "current_year"
  | "all_time";

export interface DateRange {
  from: Date;
  to: Date;
  /** Granularity to bucket the time series. */
  bucket: "hour" | "day" | "week" | "month";
}

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  current_week: "This week",
  last_week: "Last week",
  current_month: "This month",
  last_month: "Last month",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  last_90_days: "Last 90 days",
  current_year: "This year",
  all_time: "All time",
};

/** Presets grouped for the filter dropdown. */
export const PRESET_GROUPS: { label: string; presets: RangePreset[] }[] = [
  { label: "Recent", presets: ["today", "yesterday", "last_7_days", "last_30_days", "last_90_days"] },
  { label: "Calendar", presets: ["current_week", "last_week", "current_month", "last_month", "current_year"] },
  { label: "All", presets: ["all_time"] },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sun
  const diff = (day + 6) % 7; // Monday as first day
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Resolve a preset into a concrete date range + bucket granularity. */
export function resolveRange(preset: RangePreset, now = new Date()): DateRange {
  const todayStart = startOfDay(now);
  const tomorrow = addDays(todayStart, 1);

  switch (preset) {
    case "today":
      return { from: todayStart, to: tomorrow, bucket: "hour" };
    case "yesterday":
      return { from: addDays(todayStart, -1), to: todayStart, bucket: "hour" };
    case "current_week":
      return { from: startOfWeek(now), to: tomorrow, bucket: "day" };
    case "last_week": {
      const ws = startOfWeek(now);
      return { from: addDays(ws, -7), to: ws, bucket: "day" };
    }
    case "current_month": {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: ms, to: tomorrow, bucket: "day" };
    }
    case "last_month": {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: prev, to: ms, bucket: "day" };
    }
    case "last_7_days":
      return { from: addDays(todayStart, -6), to: tomorrow, bucket: "day" };
    case "last_30_days":
      return { from: addDays(todayStart, -29), to: tomorrow, bucket: "day" };
    case "last_90_days":
      return { from: addDays(todayStart, -89), to: tomorrow, bucket: "week" };
    case "current_year": {
      const ys = new Date(now.getFullYear(), 0, 1);
      return { from: ys, to: tomorrow, bucket: "month" };
    }
    case "all_time":
      return { from: new Date(2000, 0, 1), to: tomorrow, bucket: "month" };
  }
}

/**
 * Compute the immediately-preceding comparison range of equal length,
 * used for trend deltas (e.g. "+12% vs previous period").
 */
export function previousRange(range: DateRange): { from: Date; to: Date } {
  const span = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - span),
    to: range.from,
  };
}

export function isPreset(value: string): value is RangePreset {
  return value in PRESET_LABELS;
}
