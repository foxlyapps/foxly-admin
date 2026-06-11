"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  name: string | null;
  email: string;
  role: string;
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (name ?? email)
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-foreground">
            {name ?? "Admin"}
          </span>
          <span className="block text-xs leading-tight text-muted-foreground">
            {email}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-4">
            <p className="text-sm font-medium text-foreground">{name ?? "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <div className="mt-2">
              <Badge tone={role === "superadmin" ? "brand" : "neutral"}>
                <ShieldCheck className="h-3 w-3" />
                {role === "superadmin" ? "Super Admin" : "Admin"}
              </Badge>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
