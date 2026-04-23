// src/components/priority-delivery-countdown.tsx
"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getNextDeliveryDate, formatDeliveryDate } from "@/lib/shipping";

interface Props {
  /** When false the component renders nothing. */
  active: boolean;
  className?: string;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

export function PriorityDeliveryCountdown({ active, className }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [active]);

  if (!active || !now) return null;

  const info = getNextDeliveryDate(now);
  const dateLabel = formatDeliveryDate(info.deliveryDate);

  if (info.cutoffPassed) {
    return (
      <div className={className}>
        <p className="text-xs text-warm-gray flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-charcoal" />
          Dostawa <span className="font-medium text-charcoal">{dateLabel}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs text-orange-600 flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" />
        Zamów w ciągu <span className="font-semibold">{formatDuration(info.msUntilCutoff)}</span>, dostawa{" "}
        <span className="font-semibold text-charcoal">{dateLabel}</span>
      </p>
    </div>
  );
}
