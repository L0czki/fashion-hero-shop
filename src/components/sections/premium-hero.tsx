// src/components/sections/premium-hero.tsx
"use client";

import { useAuth } from "@/components/auth-provider";
import { useActivatePremium } from "@/hooks/use-activate-premium";
import { PremiumBadge } from "@/components/premium-badge";

function formatExpiry(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function PremiumHero() {
  const { user, isPremiumActive, cancelPremium } = useAuth();
  const onActivate = useActivatePremium();

  return (
    <section className="bg-charcoal text-white">
      <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
        <PremiumBadge className="mb-6 bg-white text-charcoal" />
        <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-tight">
          FashionHero Premium
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10">
          Darmowa dostawa. Next-day. Early access.
        </p>

        {isPremiumActive && user?.premium ? (
          <div className="inline-flex flex-col items-center gap-3 bg-white/10 px-6 py-5 rounded-lg">
            <p className="text-[15px]">
              Twoje Premium jest aktywne do{" "}
              <span className="font-semibold">{formatExpiry(user.premium.expiresAt)}</span>
            </p>
            <button
              onClick={cancelPremium}
              className="text-[12px] text-white/60 underline hover:text-white transition-colors"
            >
              Anuluj Premium
            </button>
          </div>
        ) : (
          <>
            <p className="text-3xl md:text-4xl font-medium mb-2">59 zł / rok</p>
            <p className="text-[13px] text-white/60 mb-8">Jeden klik, zero zobowiązań</p>
            <button
              onClick={onActivate}
              className="bg-white text-charcoal px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.8px] rounded-full hover:bg-white/90 transition-colors"
            >
              {user ? "Aktywuj Premium" : "Zaloguj się, by aktywować"}
            </button>
            <p className="mt-4">
              <a href="#benefits" className="text-[12px] text-white/60 underline hover:text-white transition-colors">
                Dowiedz się więcej ↓
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
