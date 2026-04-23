"use client";

import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { useAuth } from "./auth-provider";

export function AnnouncementBar() {
  const { isPremiumActive } = useAuth();
  const message = isPremiumActive
    ? "Premium: darmowa dostawa bez progu + next-day do 14:00"
    : `Darmowa dostawa od ${FREE_SHIPPING_THRESHOLD} zł · Łatwe zwroty`;
  return (
    <div className="bg-charcoal text-white text-center" style={{ height: "36px", lineHeight: "36px" }}>
      <p className="text-[11px] font-medium tracking-wide">{message}</p>
    </div>
  );
}
