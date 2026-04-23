// src/components/sections/premium-how-it-works.tsx
const steps = [
  { n: "1", title: "Aktywuj", body: "Jeden klik, Premium działa od razu." },
  { n: "2", title: "Kup cokolwiek", body: "Dowolna kwota — dostawa 0 zł." },
  { n: "3", title: "Odbierz jutro", body: "Zamówienie do 14:00 — dostawa next-day." },
];

export function PremiumHowItWorks() {
  return (
    <section className="bg-cream-light">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-[11px] uppercase tracking-[0.8px] text-warm-gray text-center mb-4">
          Jak to działa
        </h2>
        <h3 className="text-2xl md:text-3xl font-light text-center mb-12 text-charcoal">
          Trzy kroki od aktywacji do dostawy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-charcoal text-charcoal mx-auto flex items-center justify-center mb-4 font-medium">
                {s.n}
              </div>
              <h4 className="text-[14px] font-semibold text-charcoal mb-2">{s.title}</h4>
              <p className="text-[13px] text-warm-gray leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
