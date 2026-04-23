// src/components/premium-badge.tsx
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** small = 10px label + 10px icon, default = 11px */
  size?: "sm" | "md";
  label?: string;
}

export function PremiumBadge({ className, size = "md", label = "Premium" }: Props) {
  const sizeCls = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-charcoal text-white font-semibold uppercase tracking-wider",
        sizeCls,
        className
      )}
    >
      <Crown className={iconSize} />
      {label}
    </span>
  );
}
