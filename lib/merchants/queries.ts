import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { verifySession } from "@/lib/dal";
import { resolveRange, type RangePreset, type DateRange } from "@/lib/analytics/ranges";

export type InstalledFilter = "all" | "installed" | "uninstalled";

export interface MerchantListFilters {
  preset?: RangePreset;
  plan?: string;
  installed?: InstalledFilter;
  search?: string;
}

export interface MerchantListRow {
  shopDomain: string;
  plan: string | null;
  installedAt: string | null;
  uninstalledAt: string | null;
  orders: number;
  revenue: number;
}

const REVENUE_EXPR = sql`coalesce(o.final_total, o.total_price, 0)`;

/** Paginated, filtered list of merchants for the Merchants tab. */
export async function listMerchants(
  filters: MerchantListFilters,
  page = 1,
  pageSize = 20,
): Promise<{ rows: MerchantListRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  await verifySession();

  const conds: ReturnType<typeof sql>[] = [];

  if (filters.preset) {
    const range = resolveRange(filters.preset);
    conds.push(sql`s.installed_at >= ${range.from.toISOString()} and s.installed_at < ${range.to.toISOString()}`);
  }
  if (filters.plan) conds.push(sql`ms.plan_name = ${filters.plan}`);
  if (filters.installed === "installed") conds.push(sql`s.uninstalled_at is null`);
  if (filters.installed === "uninstalled") conds.push(sql`s.uninstalled_at is not null`);
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conds.push(sql`s.shop_domain ilike ${term}`);
  }

  const where = conds.length
    ? sql`where ${sql.join(conds, sql` and `)}`
    : sql``;

  const p = Math.max(1, page);
  const size = Math.min(100, Math.max(5, pageSize));
  const offset = (p - 1) * size;

  const [rowsRes, countRes] = await Promise.all([
    db.execute<Record<string, unknown> & MerchantListRow>(sql`
      select
        s.shop_domain as "shopDomain",
        ms.plan_name as "plan",
        s.installed_at::text as "installedAt",
        s.uninstalled_at::text as "uninstalledAt",
        coalesce(o.orders, 0)::int as "orders",
        coalesce(o.revenue, 0)::float as "revenue"
      from shops s
      left join merchant_subscriptions ms on ms.shop = s.shop_domain
      left join (
        select shop_domain, count(*)::int as orders, sum(${REVENUE_EXPR})::float as revenue
        from order_logs o
        group by shop_domain
      ) o on o.shop_domain = s.shop_domain
      ${where}
      order by s.installed_at desc nulls last
      limit ${size} offset ${offset}
    `),
    db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from shops s
      left join merchant_subscriptions ms on ms.shop = s.shop_domain
      ${where}
    `),
  ]);

  const total = countRes.rows[0]?.count ?? 0;

  return {
    rows: rowsRes.rows,
    total,
    page: p,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}

/** Distinct plan values present in `shops`, for the filter dropdown. */
export async function getDistinctPlans(): Promise<string[]> {
  await verifySession();
  const res = await db.execute<{ plan_name: string }>(sql`
    select distinct plan_name from merchant_subscriptions where plan_name is not null and plan_name <> '' order by plan_name
  `);
  return res.rows.map((r) => r.plan_name);
}

export interface MerchantHeader {
  shopDomain: string;
  plan: string | null;
  planStatus: string | null;
  installedAt: string | null;
  uninstalledAt: string | null;
  usageStartDate: string | null;
  usageEndDate: string | null;
}

/**
 * Core merchant identity/plan/usage-window fields for the detail header.
 * Plan comes from `merchant_subscriptions`, usage window from the active
 * row in `merchant_usage_cycles` (billing's own source of truth) — not
 * columns on `shops`.
 */
export async function getMerchantHeader(shopDomain: string): Promise<MerchantHeader | null> {
  await verifySession();
  const res = await db.execute<Record<string, unknown> & MerchantHeader>(sql`
    select
      s.shop_domain as "shopDomain",
      ms.plan_name as "plan",
      ms.status as "planStatus",
      s.installed_at::text as "installedAt",
      s.uninstalled_at::text as "uninstalledAt",
      uc.cycle_start::text as "usageStartDate",
      uc.cycle_end::text as "usageEndDate"
    from shops s
    left join merchant_subscriptions ms on ms.shop = s.shop_domain
    left join merchant_usage_cycles uc on uc.shop = s.shop_domain and uc.status = 'active'
    where s.shop_domain = ${shopDomain}
    limit 1
  `);
  return res.rows[0] ?? null;
}

export interface MerchantOrderStats {
  paid: { orders: number; revenue: number };
  partial: { orders: number; revenue: number };
  cod: { orders: number; revenue: number };
  total: { orders: number; revenue: number };
  currency: string;
}

/**
 * Orders & revenue split into Paid (full prepaid), Partial (partial COD),
 * and COD (pure cash on delivery) for a shop within [from, to).
 */
export async function getMerchantOrderStats(
  shopDomain: string,
  range: { from: string; to: string },
): Promise<MerchantOrderStats> {
  await verifySession();
  const res = await db.execute<{
    payment_method: string | null;
    orders: number;
    revenue: number;
  }>(sql`
    select
      coalesce(payment_method, 'cod') as payment_method,
      count(*)::int as orders,
      coalesce(sum(coalesce(final_total, total_price, 0)), 0)::float as revenue
    from order_logs
    where shop_domain = ${shopDomain}
      and created_at >= ${range.from} and created_at < ${range.to}
    group by payment_method
  `);

  const currencyRes = await db.execute<{ currency: string }>(sql`
    select currency from order_logs
    where shop_domain = ${shopDomain} and created_at >= ${range.from} and created_at < ${range.to}
    group by currency order by count(*) desc limit 1
  `);

  const bucket = { paid: { orders: 0, revenue: 0 }, partial: { orders: 0, revenue: 0 }, cod: { orders: 0, revenue: 0 } };
  for (const r of res.rows) {
    const target =
      r.payment_method === "full_prepaid" || r.payment_method === "prepaid"
        ? bucket.paid
        : r.payment_method === "partial_cod" || r.payment_method === "partial_payment"
          ? bucket.partial
          : bucket.cod;
    target.orders += r.orders;
    target.revenue += r.revenue;
  }

  return {
    ...bucket,
    total: {
      orders: bucket.paid.orders + bucket.partial.orders + bucket.cod.orders,
      revenue: bucket.paid.revenue + bucket.partial.revenue + bucket.cod.revenue,
    },
    currency: currencyRes.rows[0]?.currency ?? "USD",
  };
}

export interface EnabledFeatures {
  prepaidDiscount: boolean;
  partialPayment: boolean;
  oneClickCodCheckout: boolean;
  bundles: boolean;
  upsells: boolean;
  downsell: boolean;
  otp: boolean;
  whatsappOrderConfirmation: boolean;
  whatsappOrderStatus: boolean;
  whatsappAbandonedCheckout: boolean;
}

/** Enabled-feature checklist derived by joining every per-shop settings table. */
export async function getMerchantFeatures(shopDomain: string): Promise<EnabledFeatures> {
  await verifySession();

  const [partial, form, quantity, upsells, otp, whatsapp] = await Promise.all([
    db.execute<{ enabled: boolean | null; prepaid_discount_enabled: boolean | null }>(sql`
      select enabled, prepaid_discount_enabled from partial_payment_settings where shop_domain = ${shopDomain} limit 1
    `),
    db.execute<{ enabled: boolean | null }>(sql`
      select enabled from form_settings where shop_domain = ${shopDomain} limit 1
    `),
    db.execute<{ has_active: boolean }>(sql`
      select exists(select 1 from quantity_offer_groups where shop_domain = ${shopDomain} and active = true) as has_active
    `),
    db.execute<{ has_upsell: boolean; has_downsell: boolean }>(sql`
      select
        exists(select 1 from upsell_offers where shop_domain = ${shopDomain} and active = true and type <> 'downsell') as has_upsell,
        exists(select 1 from upsell_offers where shop_domain = ${shopDomain} and active = true and (type = 'downsell' or linked_downsell_id is not null)) as has_downsell
    `),
    // OTP is on/off via `otp_settings.mode` ('disabled' | 'pre_order' | 'post_order') — not a boolean flag.
    db.execute<{ mode: string | null }>(sql`
      select mode from otp_settings where shop_domain = ${shopDomain} limit 1
    `),
    db.execute<{ config: Record<string, unknown> | null; enabled: boolean | null }>(sql`
      select config, enabled from integration_settings where shop_domain = ${shopDomain} and integration_id = 'whatsapp' limit 1
    `),
  ]);

  const waConfig = (whatsapp.rows[0]?.config ?? {}) as Record<string, unknown>;
  const waEnabled = whatsapp.rows[0]?.enabled ?? false;

  return {
    prepaidDiscount: partial.rows[0]?.prepaid_discount_enabled ?? false,
    partialPayment: partial.rows[0]?.enabled ?? false,
    oneClickCodCheckout: form.rows[0]?.enabled ?? false,
    bundles: quantity.rows[0]?.has_active ?? false,
    upsells: upsells.rows[0]?.has_upsell ?? false,
    downsell: upsells.rows[0]?.has_downsell ?? false,
    otp: (otp.rows[0]?.mode ?? "disabled") !== "disabled",
    whatsappOrderConfirmation: waEnabled && Boolean(waConfig.orderConfirmation),
    whatsappOrderStatus: waEnabled && Boolean(waConfig.orderStatus),
    whatsappAbandonedCheckout: waEnabled && Boolean(waConfig.abandonedCheckout),
  };
}

export function resolveMerchantRange(preset: RangePreset): DateRange {
  return resolveRange(preset);
}

export interface MerchantUsageCycle {
  planName: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  includedOrdersUsed: number;
  overageOrders: number;
  overageChargedOrders: number;
  status: string | null;
}

/** The active billing usage-cycle counters (orders used / overage) for this shop. */
export async function getMerchantUsageCycle(shopDomain: string): Promise<MerchantUsageCycle | null> {
  await verifySession();
  const res = await db.execute<Record<string, unknown> & MerchantUsageCycle>(sql`
    select
      plan_name as "planName",
      cycle_start::text as "cycleStart",
      cycle_end::text as "cycleEnd",
      included_orders_used as "includedOrdersUsed",
      overage_orders as "overageOrders",
      overage_charged_orders as "overageChargedOrders",
      status
    from merchant_usage_cycles
    where shop = ${shopDomain} and status = 'active'
    order by created_at desc
    limit 1
  `);
  return res.rows[0] ?? null;
}

export interface Breakdown {
  label: string;
  value: number;
  revenue: number;
}

export interface MerchantJsonInsights {
  byCountry: Breakdown[];
  byOrderSource: Breakdown[];
  otpVerifiedRate: number;
  discountAdoptionRate: number;
  upsellAttachRate: number;
  avgDiscountPercent: number;
  sampledOrders: number;
}

/**
 * Store performance derived by parsing `order_logs.order_payload` (jsonb) —
 * the richer per-order snapshot captured at checkout (detected country,
 * funnel source, OTP verification, discount %, upsell items) that has no
 * equivalent plain column. Only rows with a payload are counted.
 */
export async function getMerchantJsonInsights(
  shopDomain: string,
  range: { from: string; to: string },
): Promise<MerchantJsonInsights> {
  await verifySession();

  const [countryRes, sourceRes, ratesRes] = await Promise.all([
    db.execute<{ label: string; value: number; revenue: number }>(sql`
      select
        coalesce(nullif(order_payload->>'detectedCountry', ''), 'Unknown') as label,
        count(*)::int as value,
        coalesce(sum(coalesce(final_total, total_price, 0)), 0)::float as revenue
      from order_logs
      where shop_domain = ${shopDomain}
        and created_at >= ${range.from} and created_at < ${range.to}
        and order_payload is not null
      group by 1
      order by value desc
      limit 10
    `),
    db.execute<{ label: string; value: number; revenue: number }>(sql`
      select
        coalesce(nullif(order_payload->>'order_source', ''), 'Unknown') as label,
        count(*)::int as value,
        coalesce(sum(coalesce(final_total, total_price, 0)), 0)::float as revenue
      from order_logs
      where shop_domain = ${shopDomain}
        and created_at >= ${range.from} and created_at < ${range.to}
        and order_payload is not null
      group by 1
      order by value desc
      limit 10
    `),
    db.execute<{
      total: number;
      otp_verified: number;
      has_discount: number;
      has_upsell: number;
      avg_discount_percent: number;
    }>(sql`
      select
        count(*)::int as total,
        count(*) filter (where (order_payload->>'_otpVerified')::boolean is true)::int as otp_verified,
        count(*) filter (where coalesce(nullif(order_payload->>'couponCode', ''), order_payload->>'discount_code') is not null)::int as has_discount,
        count(*) filter (where jsonb_array_length(coalesce(order_payload->'upsell_items', '[]'::jsonb)) > 0)::int as has_upsell,
        coalesce(avg(nullif(order_payload->>'discountPercent', '')::numeric) filter (where (order_payload->>'discountPercent')::numeric > 0), 0)::float as avg_discount_percent
      from order_logs
      where shop_domain = ${shopDomain}
        and created_at >= ${range.from} and created_at < ${range.to}
        and order_payload is not null
    `),
  ]);

  const rates = ratesRes.rows[0] ?? { total: 0, otp_verified: 0, has_discount: 0, has_upsell: 0, avg_discount_percent: 0 };

  return {
    byCountry: countryRes.rows,
    byOrderSource: sourceRes.rows,
    otpVerifiedRate: rates.total ? (rates.otp_verified / rates.total) * 100 : 0,
    discountAdoptionRate: rates.total ? (rates.has_discount / rates.total) * 100 : 0,
    upsellAttachRate: rates.total ? (rates.has_upsell / rates.total) * 100 : 0,
    avgDiscountPercent: rates.avg_discount_percent,
    sampledOrders: rates.total,
  };
}

export interface MerchantOpsInsights {
  aov: number;
  repeatCustomerRate: number;
  syncFailedCount: number;
  syncFailedRate: number;
  cancellationRate: number;
  topCities: Breakdown[];
}

/**
 * Operational, actionable signals: average order value, repeat-customer rate,
 * sync failures (Shopify order sync health — surfaced so ops can act on it),
 * cancellation rate, and top delivery cities. All from plain `order_logs`
 * columns, no JSON parsing needed here.
 */
export async function getMerchantOpsInsights(
  shopDomain: string,
  range: { from: string; to: string },
): Promise<MerchantOpsInsights> {
  await verifySession();

  const [summary, citiesRes] = await Promise.all([
    db.execute<{
      orders: number;
      revenue: number;
      distinct_customers: number;
      sync_failed: number;
      cancelled: number;
    }>(sql`
      select
        count(*)::int as orders,
        coalesce(sum(coalesce(final_total, total_price, 0)), 0)::float as revenue,
        count(distinct coalesce(nullif(customer_phone, ''), nullif(customer_email, '')))::int as distinct_customers,
        count(*) filter (where sync_status = 'failed_sync')::int as sync_failed,
        count(*) filter (where shopify_cancelled_at is not null)::int as cancelled
      from order_logs
      where shop_domain = ${shopDomain}
        and created_at >= ${range.from} and created_at < ${range.to}
    `),
    db.execute<{ label: string; value: number; revenue: number }>(sql`
      select
        coalesce(nullif(city, ''), 'Unknown') as label,
        count(*)::int as value,
        coalesce(sum(coalesce(final_total, total_price, 0)), 0)::float as revenue
      from order_logs
      where shop_domain = ${shopDomain}
        and created_at >= ${range.from} and created_at < ${range.to}
      group by 1
      order by value desc
      limit 6
    `),
  ]);

  const s = summary.rows[0] ?? { orders: 0, revenue: 0, distinct_customers: 0, sync_failed: 0, cancelled: 0 };

  return {
    aov: s.orders ? s.revenue / s.orders : 0,
    repeatCustomerRate: s.distinct_customers ? ((s.orders - s.distinct_customers) / s.orders) * 100 : 0,
    syncFailedCount: s.sync_failed,
    syncFailedRate: s.orders ? (s.sync_failed / s.orders) * 100 : 0,
    cancellationRate: s.orders ? (s.cancelled / s.orders) * 100 : 0,
    topCities: citiesRes.rows,
  };
}
