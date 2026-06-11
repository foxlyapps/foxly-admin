import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { verifySession } from "@/lib/dal";
import {
  resolveRange,
  previousRange,
  type RangePreset,
  type DateRange,
} from "./ranges";

export interface Kpi {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  customers: number;
  /** Percentage deltas vs the previous equivalent period (null when N/A). */
  deltas: {
    revenue: number | null;
    orders: number | null;
    avgOrderValue: number | null;
    customers: number | null;
  };
}

export interface TimePoint {
  bucket: string; // ISO date/time label
  revenue: number;
  orders: number;
}

export interface Breakdown {
  label: string;
  value: number;
  revenue: number;
}

/** Adoption / behavioural insights derived from order feature flags. */
export interface FeatureInsights {
  /** Payment feature mix with share of orders + revenue + AOV. */
  paymentMix: {
    method: string;
    orders: number;
    revenue: number;
    orderShare: number; // 0..100
    revenueShare: number; // 0..100
    aov: number;
  }[];
  /** Single-flag adoption rates (% of orders using the feature). */
  adoption: {
    key: string;
    label: string;
    used: number;
    total: number;
    rate: number; // 0..100
  }[];
  /** Headline: most-used payment feature. */
  topFeature: { method: string; orders: number; orderShare: number } | null;
  /** Discount / coupon impact. */
  discount: {
    ordersWithCoupon: number;
    couponRate: number; // 0..100
    totalDiscount: number;
    avgDiscount: number;
  };
}

export interface AnalyticsData {
  preset: RangePreset;
  range: { from: string; to: string };
  currency: string;
  kpi: Kpi;
  series: TimePoint[];
  byStatus: Breakdown[];
  byPaymentMethod: Breakdown[];
  topShops: Breakdown[];
  topCities: Breakdown[];
  topProducts: Breakdown[];
  features: FeatureInsights;
  bucket: DateRange["bucket"];
}

const REVENUE_EXPR = sql`coalesce(final_total, total_price, 0)`;

/** Aggregate KPI totals over an arbitrary [from, to) window. */
async function totals(from: Date, to: Date) {
  const result = await db.execute<{
    orders: number;
    revenue: number;
    customers: number;
  }>(sql`
    select
      count(*)::int as orders,
      coalesce(sum(${REVENUE_EXPR}), 0)::float as revenue,
      count(distinct coalesce(customer_phone, customer_email))::int as customers
    from order_logs
    where created_at >= ${from.toISOString()} and created_at < ${to.toISOString()}
  `);
  const row = result.rows[0] ?? { orders: 0, revenue: 0, customers: 0 };
  return {
    orders: row.orders,
    revenue: row.revenue,
    customers: row.customers,
    avgOrderValue: row.orders > 0 ? row.revenue / row.orders : 0,
  };
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

/** Build the full analytics payload for the requested preset. */
export async function getAnalytics(preset: RangePreset): Promise<AnalyticsData> {
  await verifySession();

  const range = resolveRange(preset);
  const prev = previousRange(range);
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  const [cur, previous, series, byStatus, byPayment, topShops, topCities, topProducts, features, currencyRow] =
    await Promise.all([
      totals(range.from, range.to),
      totals(prev.from, prev.to),
      timeSeries(from, to, range.bucket),
      breakdown(from, to, "status"),
      breakdown(from, to, "payment_method"),
      breakdown(from, to, "shop_domain", 6),
      breakdown(from, to, "city", 6, true),
      breakdown(from, to, "product_title", 6, true),
      featureInsights(from, to),
      db.execute<{ currency: string }>(sql`
        select currency from order_logs
        where created_at >= ${from} and created_at < ${to}
        group by currency order by count(*) desc limit 1
      `),
    ]);

  return {
    preset,
    range: { from, to },
    currency: currencyRow.rows[0]?.currency ?? "USD",
    bucket: range.bucket,
    kpi: {
      revenue: cur.revenue,
      orders: cur.orders,
      avgOrderValue: cur.avgOrderValue,
      customers: cur.customers,
      deltas: {
        revenue: pctDelta(cur.revenue, previous.revenue),
        orders: pctDelta(cur.orders, previous.orders),
        avgOrderValue: pctDelta(cur.avgOrderValue, previous.avgOrderValue),
        customers: pctDelta(cur.customers, previous.customers),
      },
    },
    series,
    byStatus,
    byPaymentMethod: byPayment,
    topShops,
    topCities,
    topProducts,
    features,
  };
}

/** Bucketed revenue + order time series using date_trunc + generate_series. */
async function timeSeries(
  from: string,
  to: string,
  bucket: DateRange["bucket"],
): Promise<TimePoint[]> {
  const result = await db.execute<{
    bucket: string;
    revenue: number;
    orders: number;
  }>(sql`
    with buckets as (
      select generate_series(
        date_trunc(${bucket}, ${from}::timestamptz),
        date_trunc(${bucket}, (${to}::timestamptz - interval '1 microsecond')),
        ('1 ' || ${bucket})::interval
      ) as bucket
    )
    select
      b.bucket::text as bucket,
      coalesce(sum(${REVENUE_EXPR}), 0)::float as revenue,
      count(o.id)::int as orders
    from buckets b
    left join order_logs o
      on date_trunc(${bucket}, o.created_at) = b.bucket
      and o.created_at >= ${from} and o.created_at < ${to}
    group by b.bucket
    order by b.bucket
  `);
  return result.rows;
}

/** Group counts + revenue by a single column. */
async function breakdown(
  from: string,
  to: string,
  column: string,
  limit = 20,
  excludeNull = false,
): Promise<Breakdown[]> {
  const col = sql.raw(`"${column}"`);
  const nullFilter = excludeNull ? sql`and ${col} is not null and ${col} <> ''` : sql``;
  const result = await db.execute<{
    label: string | null;
    value: number;
    revenue: number;
  }>(sql`
    select
      ${col}::text as label,
      count(*)::int as value,
      coalesce(sum(${REVENUE_EXPR}), 0)::float as revenue
    from order_logs
    where created_at >= ${from} and created_at < ${to} ${nullFilter}
    group by ${col}
    order by value desc
    limit ${limit}
  `);
  return result.rows.map((r) => ({
    label: r.label ?? "Unknown",
    value: r.value,
    revenue: r.revenue,
  }));
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  partial_cod: "Partial COD",
  partial_payment: "Partial Payment",
  full_prepaid: "Full Prepaid",
  prepaid: "Prepaid",
};

function prettyMethod(m: string): string {
  return (
    PAYMENT_LABELS[m] ??
    m
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Derive feature-adoption insights: which payment features stores/customers
 * use most, single-flag adoption rates, and discount impact.
 */
async function featureInsights(
  from: string,
  to: string,
): Promise<FeatureInsights> {
  const [mixRes, flagsRes] = await Promise.all([
    db.execute<{ method: string; orders: number; revenue: number }>(sql`
      select
        coalesce(payment_method, 'unknown') as method,
        count(*)::int as orders,
        coalesce(sum(${REVENUE_EXPR}), 0)::float as revenue
      from order_logs
      where created_at >= ${from} and created_at < ${to}
      group by payment_method
      order by orders desc
    `),
    db.execute<{
      total: number;
      partial_cod: number;
      full_prepaid: number;
      coupon: number;
      total_discount: number;
    }>(sql`
      select
        count(*)::int as total,
        count(*) filter (where is_partial_cod)::int as partial_cod,
        count(*) filter (where is_full_prepaid)::int as full_prepaid,
        count(*) filter (where coupon_code is not null and coupon_code <> '')::int as coupon,
        coalesce(sum(coalesce(discount_amount, 0)), 0)::float as total_discount
      from order_logs
      where created_at >= ${from} and created_at < ${to}
    `),
  ]);

  const totalOrders = mixRes.rows.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = mixRes.rows.reduce((s, r) => s + r.revenue, 0);

  const paymentMix = mixRes.rows.map((r) => ({
    method: prettyMethod(r.method),
    orders: r.orders,
    revenue: r.revenue,
    orderShare: totalOrders ? (r.orders / totalOrders) * 100 : 0,
    revenueShare: totalRevenue ? (r.revenue / totalRevenue) * 100 : 0,
    aov: r.orders ? r.revenue / r.orders : 0,
  }));

  const flags = flagsRes.rows[0] ?? {
    total: 0,
    partial_cod: 0,
    full_prepaid: 0,
    coupon: 0,
    total_discount: 0,
  };
  const total = flags.total;

  const adoption = [
    { key: "partial_cod", label: "Partial COD", used: flags.partial_cod },
    { key: "full_prepaid", label: "Full Prepaid", used: flags.full_prepaid },
    { key: "coupon", label: "Coupon / Discount", used: flags.coupon },
  ].map((a) => ({
    ...a,
    total,
    rate: total ? (a.used / total) * 100 : 0,
  }));

  const top = mixRes.rows[0];

  return {
    paymentMix,
    adoption,
    topFeature: top
      ? {
          method: prettyMethod(top.method),
          orders: top.orders,
          orderShare: totalOrders ? (top.orders / totalOrders) * 100 : 0,
        }
      : null,
    discount: {
      ordersWithCoupon: flags.coupon,
      couponRate: total ? (flags.coupon / total) * 100 : 0,
      totalDiscount: flags.total_discount,
      avgDiscount: flags.coupon ? flags.total_discount / flags.coupon : 0,
    },
  };
}
