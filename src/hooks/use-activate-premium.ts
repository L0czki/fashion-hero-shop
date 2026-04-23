// src/hooks/use-activate-premium.ts
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function useActivatePremium() {
  const { user, isPremiumActive, activatePremium } = useAuth();
  const router = useRouter();

  return function onActivate() {
    if (!user) {
      router.push("/account/login?redirect=/premium");
      return;
    }
    if (!isPremiumActive) {
      activatePremium();
    }
  };
}
