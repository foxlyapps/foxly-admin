"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";

/**
 * Preference-only UI — nothing here writes to the database. Wiring this up
 * to persist and actually send needs a usage-notification table plus an
 * Email/WhatsApp provider, neither of which exist yet.
 */
export function UsageAutomationForm({ shopDomain }: { shopDomain: string }) {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Automation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Regularly notify {shopDomain} about their usage data. Preview only — persisting this preference and
          actually sending needs a settings table and an Email/WhatsApp provider, neither wired up yet.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">Email updates</span>
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">WhatsApp updates</span>
          <input
            type="checkbox"
            checked={whatsappEnabled}
            onChange={(e) => setWhatsappEnabled(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Frequency</label>
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
