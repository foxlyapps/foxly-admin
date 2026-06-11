"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import {
  PRESET_GROUPS,
  PRESET_LABELS,
  type RangePreset,
} from "@/lib/analytics/ranges";
import { cn } from "@/lib/utils";

interface RangeFilterProps {
  value: RangePreset;
  onChange: (preset: RangePreset) => void;
  disabled?: boolean;
}

export function RangeFilter({ value, onChange, disabled }: RangeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {PRESET_LABELS[value]}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          {PRESET_GROUPS.map((group) => (
            <div key={group.label} className="mb-1 last:mb-0">
              <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              {group.presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    onChange(preset);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors",
                    preset === value
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-foreground hover:bg-surface-muted",
                  )}
                >
                  {PRESET_LABELS[preset]}
                  {preset === value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
