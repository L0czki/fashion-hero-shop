// src/app/premium/page.tsx
import type { Metadata } from "next";
import { PremiumHero } from "@/components/sections/premium-hero";
import { PremiumBenefits } from "@/components/sections/premium-benefits";
import { PremiumHowItWorks } from "@/components/sections/premium-how-it-works";
import { PremiumComparison } from "@/components/sections/premium-comparison";
import { PremiumCTA } from "@/components/sections/premium-cta";

export const metadata: Metadata = {
  title: "Premium | FashionHero",
  description: "FashionHero Premium — darmowa dostawa, next-day, early access. 59 zł / rok.",
};

export default function PremiumPage() {
  return (
    <main>
      <PremiumHero />
      <PremiumBenefits />
      <PremiumHowItWorks />
      <PremiumComparison />
      <PremiumCTA />
    </main>
  );
}
