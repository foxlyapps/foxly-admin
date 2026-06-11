"use client";

import Link from "next/link";
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
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Store, Users, Plug, TrendingUp, Layers, Truck,
  FileText, Activity, ShieldAlert, KeyRound, ScrollText, CreditCard,
};

interface StatCardProps {
  slug: string;
  label: string;
  count: number;
  icon: string;
}

export function StatCard({ slug, label, count, icon }: StatCardProps) {
  const Icon = ICONS[icon] ?? Store;
  return (
    <Link
      href={`/dashboard/${slug}`}
      className="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {count.toLocaleString()}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}
