import type { Table } from "drizzle-orm";
import {
  Store,
  Users,
  Plug,
  TrendingUp,
  Layers,
  Truck,
  FileText,
  Activity,
  ShieldAlert,
  KeyRound,
  ScrollText,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import {
  shops,
  customers,
  integrationSettings,
  upsellOffers,
  quantityOfferGroups,
  shippingRates,
  formSettings,
  pixelTrackingSettings,
  fraudProtectionSettings,
  shopifySessions,
  orderLogs,
  partialPaymentSettings,
  merchantSubscriptions,
  merchantUsageCycles,
  otpSettings,
} from "@/db/schema";
import { adminUsers } from "@/db/admin";

export interface ResourceConfig {
  /** URL slug, e.g. /dashboard/customers */
  slug: string;
  /** Singular + plural display names. */
  label: string;
  labelSingular: string;
  description: string;
  icon: LucideIcon;
  table: Table;
  /** Group for sidebar organization. */
  group: "Store" | "Offers" | "Settings" | "System" | "Admin";
  /** Columns (drizzle keys) to prioritize in the list view. */
  primaryColumns: string[];
  /** Restrict management to superadmin only. */
  superAdminOnly?: boolean;
  /** Disable create (e.g. system-managed tables). */
  disableCreate?: boolean;
}

export const RESOURCES: ResourceConfig[] = [
  {
    slug: "shops",
    label: "Shops",
    labelSingular: "Shop",
    description: "Connected Shopify stores and their access tokens.",
    icon: Store,
    table: shops,
    group: "Store",
    primaryColumns: ["shopDomain", "scope", "installedAt", "uninstalledAt"],
  },
  {
    slug: "customers",
    label: "Customers",
    labelSingular: "Customer",
    description: "Customer records collected across stores.",
    icon: Users,
    table: customers,
    group: "Store",
    primaryColumns: ["name", "phone", "shopDomain", "city", "createdAt"],
  },
  {
    slug: "order-logs",
    label: "Order Logs",
    labelSingular: "Order Log",
    description: "Order processing history and events.",
    icon: ScrollText,
    table: orderLogs,
    group: "Store",
    primaryColumns: ["shopDomain", "createdAt"],
  },
  {
    slug: "upsell-offers",
    label: "Upsell Offers",
    labelSingular: "Upsell Offer",
    description: "Post-purchase and in-cart upsell configurations.",
    icon: TrendingUp,
    table: upsellOffers,
    group: "Offers",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "quantity-offers",
    label: "Quantity Offers",
    labelSingular: "Quantity Offer Group",
    description: "Volume / quantity break discount groups.",
    icon: Layers,
    table: quantityOfferGroups,
    group: "Offers",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "shipping-rates",
    label: "Shipping Rates",
    labelSingular: "Shipping Rate",
    description: "Configured shipping rates and conditions.",
    icon: Truck,
    table: shippingRates,
    group: "Settings",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "form-settings",
    label: "Form Settings",
    labelSingular: "Form Setting",
    description: "Checkout / COD form configuration per store.",
    icon: FileText,
    table: formSettings,
    group: "Settings",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "integrations",
    label: "Integrations",
    labelSingular: "Integration",
    description: "Third-party integration credentials and config.",
    icon: Plug,
    table: integrationSettings,
    group: "Settings",
    primaryColumns: ["shopDomain", "integrationId", "enabled", "connected"],
  },
  {
    slug: "pixel-tracking",
    label: "Pixel Tracking",
    labelSingular: "Pixel Setting",
    description: "Analytics and conversion pixel settings.",
    icon: Activity,
    table: pixelTrackingSettings,
    group: "Settings",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "fraud-protection",
    label: "Fraud Protection",
    labelSingular: "Fraud Setting",
    description: "Fraud and risk protection rules.",
    icon: ShieldAlert,
    table: fraudProtectionSettings,
    group: "Settings",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "partial-payments",
    label: "Partial Payments",
    labelSingular: "Partial Payment Setting",
    description: "Partial / deposit payment configuration.",
    icon: CreditCard,
    table: partialPaymentSettings,
    group: "Settings",
    primaryColumns: ["shopDomain"],
  },
  {
    slug: "merchant-subscriptions",
    label: "Subscriptions",
    labelSingular: "Subscription",
    description: "Merchant billing plan and subscription status.",
    icon: CreditCard,
    table: merchantSubscriptions,
    group: "Store",
    primaryColumns: ["shop", "planName", "status", "billingCycle", "renewsOn"],
  },
  {
    slug: "merchant-usage-cycles",
    label: "Usage Cycles",
    labelSingular: "Usage Cycle",
    description: "Per-merchant billing usage cycle windows and order counts.",
    icon: ScrollText,
    table: merchantUsageCycles,
    group: "Store",
    primaryColumns: ["shop", "planName", "cycleStart", "cycleEnd", "status"],
  },
  {
    slug: "otp-settings",
    label: "OTP Settings",
    labelSingular: "OTP Setting",
    description: "Per-store OTP verification mode and config.",
    icon: ShieldAlert,
    table: otpSettings,
    group: "Settings",
    primaryColumns: ["shopDomain", "mode"],
  },
  {
    slug: "shopify-sessions",
    label: "Shopify Sessions",
    labelSingular: "Shopify Session",
    description: "Active Shopify OAuth sessions (system-managed).",
    icon: KeyRound,
    table: shopifySessions,
    group: "System",
    primaryColumns: ["shop", "isOnline"],
    disableCreate: true,
  },
  {
    slug: "admin-users",
    label: "Admin Users",
    labelSingular: "Admin User",
    description: "Dashboard administrators and their roles.",
    icon: Users,
    table: adminUsers,
    group: "Admin",
    primaryColumns: ["email", "name", "role", "isActive", "lastLoginAt"],
    superAdminOnly: true,
  },
];

export function getResource(slug: string): ResourceConfig | undefined {
  return RESOURCES.find((r) => r.slug === slug);
}

export function resourcesForRole(role: string): ResourceConfig[] {
  return RESOURCES.filter((r) => !r.superAdminOnly || role === "superadmin");
}
