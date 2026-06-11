"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
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
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
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
};

export interface NavItem {
  slug: string;
  label: string;
  group: string;
  icon: string;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const overviewActive = pathname === "/dashboard";
  const analyticsActive = pathname.startsWith("/dashboard/analytics");

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      <div className="space-y-0.5">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            overviewActive
              ? "bg-sidebar-active text-sidebar-foreground"
              : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Overview
        </Link>
        <Link
          href="/dashboard/analytics"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            analyticsActive
              ? "bg-sidebar-active text-sidebar-foreground"
              : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
          )}
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          Analytics
        </Link>
      </div>

      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
            {group}
          </p>
          <ul className="space-y-0.5">
            {groupItems.map((item) => {
              const href = `/dashboard/${item.slug}`;
              const active = pathname.startsWith(href);
              const Icon = ICONS[item.icon];
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-active text-sidebar-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
