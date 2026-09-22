import { Check, X } from "lucide-react";
import type { EnabledFeatures } from "@/lib/merchants/queries";
import { cn } from "@/lib/utils";

const FEATURE_LABELS: { key: keyof EnabledFeatures; label: string }[] = [
  { key: "prepaidDiscount", label: "Prepaid Discount" },
  { key: "partialPayment", label: "Partial Payment" },
  { key: "oneClickCodCheckout", label: "1-Click COD Checkout" },
  { key: "bundles", label: "Bundles" },
  { key: "upsells", label: "Upsells" },
  { key: "downsell", label: "Downsell" },
  { key: "otp", label: "OTP" },
  { key: "whatsappOrderConfirmation", label: "WhatsApp Order Confirmation" },
  { key: "whatsappOrderStatus", label: "WhatsApp Order Status" },
  { key: "whatsappAbandonedCheckout", label: "WhatsApp Abandoned Checkout" },
];

export function FeatureChecklist({ features }: { features: EnabledFeatures }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {FEATURE_LABELS.map(({ key, label }) => {
        const on = features[key];
        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
              on
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-border bg-surface-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                on ? "bg-emerald-500 text-white" : "bg-border text-muted-foreground",
              )}
            >
              {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}
