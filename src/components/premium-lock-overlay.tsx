// src/components/premium-lock-overlay.tsx
import { Lock } from "lucide-react";

export function PremiumLockOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-charcoal/50 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-2 text-white">
        <Lock className="h-6 w-6" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px]">Tylko dla Premium</p>
      </div>
    </div>
  );
}
