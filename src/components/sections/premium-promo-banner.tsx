import Link from "next/link";
import { Crown, Truck, Zap, Sparkles } from "lucide-react";

const highlights = [
  { icon: Truck, text: "Darmowa dostawa zawsze" },
  { icon: Zap, text: "Next-day przed 14:00" },
  { icon: Sparkles, text: "Early access do ekskluzywów" },
];

export function PremiumPromoBanner() {
  return (
    <section className="bg-charcoal text-white">
      <div className="max-w-5xl mx-auto px-4 py-14 md:py-16 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] mb-5">
          <Crown className="h-3 w-3" />
          FashionHero Premium
        </div>
        <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-3">
          Jeden klik, trzy korzyści
        </h2>
        <p className="text-[15px] text-white/70 mb-8 max-w-xl mx-auto">
          Dołącz do Premium za 59 zł / rok — darmowa dostawa bez progu, next-day i early access.
        </p>

        <ul className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-10 mb-10 text-[13px] text-white/80">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="inline-flex items-center justify-center gap-2">
              <Icon className="h-4 w-4" />
              {text}
            </li>
          ))}
        </ul>

        <Link
          href="/premium"
          className="inline-block bg-white text-charcoal px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.8px] rounded-full hover:bg-white/90 transition-colors"
        >
          Odkryj Premium
        </Link>
      </div>
    </section>
  );
}
