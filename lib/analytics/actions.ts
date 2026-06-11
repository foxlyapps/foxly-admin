"use server";

import { getAnalytics, type AnalyticsData } from "./queries";
import { isPreset, type RangePreset } from "./ranges";

/** Server action to (re)fetch analytics for a given preset. */
export async function fetchAnalytics(preset: string): Promise<AnalyticsData> {
  const safe: RangePreset = isPreset(preset) ? preset : "last_30_days";
  return getAnalytics(safe);
}
