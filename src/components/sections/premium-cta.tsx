// src/components/sections/premium-cta.tsx
"use client";

import { useAuth } from "@/components/auth-provider";
import { useActivatePremium } from "@/hooks/use-activate-premium";

export function PremiumCTA() {
  const { user, isPremiumActive } = useAuth();
  const onActivate = useActivatePremium();

  if (isPremiumActive) return null;

  return (
    <section className="bg-charcoal text-white">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-light mb-4">Dołącz do Premium</h2>
        <p className="text-white/70 mb-8">59 zł / rok — anuluj w każdej chwili.</p>
        <button
          onClick={onActivate}
          className="bg-white text-charcoal px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.8px] rounded-full hover:bg-white/90 transition-colors"
        >
          {user ? "Aktywuj Premium" : "Zaloguj się, by aktywować"}
        </button>
        <p className="mt-6 text-[11px] text-white/40">
          Prototyp — płatności nieaktywne
        </p>
      </div>
    </section>
  );
}
