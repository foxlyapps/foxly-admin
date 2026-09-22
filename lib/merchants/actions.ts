"use server";

import {
  listMerchants,
  getMerchantOrderStats,
  getMerchantJsonInsights,
  getMerchantOpsInsights,
  resolveMerchantRange,
  type MerchantListFilters,
} from "./queries";
import { isPreset, type RangePreset } from "@/lib/analytics/ranges";

export async function fetchMerchants(filters: MerchantListFilters, page: number) {
  return listMerchants(filters, page);
}

function resolveRangeArg(presetOrRange: string | { from: string; to: string }) {
  if (typeof presetOrRange === "string") {
    const safe: RangePreset = isPreset(presetOrRange) ? presetOrRange : "last_30_days";
    const range = resolveMerchantRange(safe);
    return { from: range.from.toISOString(), to: range.to.toISOString() };
  }
  return presetOrRange;
}

export async function fetchMerchantOrderStats(
  shopDomain: string,
  presetOrRange: string | { from: string; to: string },
) {
  return getMerchantOrderStats(shopDomain, resolveRangeArg(presetOrRange));
}

export async function fetchMerchantJsonInsights(
  shopDomain: string,
  presetOrRange: string | { from: string; to: string },
) {
  return getMerchantJsonInsights(shopDomain, resolveRangeArg(presetOrRange));
}

/** Combined order stats + JSON-derived + ops insights for one range fetch. */
export async function fetchMerchantPerformance(
  shopDomain: string,
  presetOrRange: string | { from: string; to: string },
) {
  const range = resolveRangeArg(presetOrRange);
  const [orderStats, insights, ops] = await Promise.all([
    getMerchantOrderStats(shopDomain, range),
    getMerchantJsonInsights(shopDomain, range),
    getMerchantOpsInsights(shopDomain, range),
  ]);
  return { orderStats, insights, ops };
}
