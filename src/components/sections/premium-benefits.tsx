// src/components/sections/premium-benefits.tsx
import { Truck, Zap, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Darmowa dostawa",
    body: "Bez progu minimalnego zamówienia. Zawsze 0 zł.",
  },
  {
    icon: Zap,
    title: "Priorytet next-day",
    body: "Zamów do 14:00, dostawa następnego dnia roboczego.",
  },
  {
    icon: Sparkles,
    title: "Early access",
    body: "Ekskluzywne kolekcje 48h wcześniej niż reszta świata.",
  },
];

export function PremiumBenefits() {
  return (
    <section id="benefits" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-[11px] uppercase tracking-[0.8px] text-warm-gray text-center mb-4">
        Co dostajesz
      </h2>
      <h3 className="text-2xl md:text-3xl font-light text-center mb-12 text-charcoal">
        Trzy korzyści, zero formalności
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {benefits.map((b) => (
          <div key={b.title} className="text-center">
            <div className="w-12 h-12 rounded-full bg-charcoal text-white mx-auto flex items-center justify-center mb-4">
              <b.icon className="h-5 w-5" />
            </div>
            <h4 className="text-[14px] font-semibold text-charcoal mb-2">{b.title}</h4>
            <p className="text-[13px] text-warm-gray leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
