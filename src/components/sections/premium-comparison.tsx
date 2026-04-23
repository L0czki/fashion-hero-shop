// src/components/sections/premium-comparison.tsx
import { Check, X } from "lucide-react";

const rows: Array<{ label: string; standard: string | boolean; premium: string | boolean }> = [
  { label: "Darmowa dostawa", standard: "Od 99 zł", premium: "Zawsze" },
  { label: "Next-day delivery (do 14:00)", standard: false, premium: true },
  { label: "Early access do ekskluzywów", standard: false, premium: true },
  { label: "Cena", standard: "0 zł", premium: "59 zł / rok" },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return <span className="text-[13px] text-charcoal">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-charcoal mx-auto" />
  ) : (
    <X className="h-4 w-4 text-warm-gray/60 mx-auto" />
  );
}

export function PremiumComparison() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-20">
      <h2 className="text-[11px] uppercase tracking-[0.8px] text-warm-gray text-center mb-4">
        Porównanie
      </h2>
      <h3 className="text-2xl md:text-3xl font-light text-center mb-10 text-charcoal">
        Standard vs Premium
      </h3>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-cream-light">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-[0.8px] text-warm-gray font-medium px-4 py-3"></th>
              <th className="text-[11px] uppercase tracking-[0.8px] text-warm-gray font-medium px-4 py-3">Standard</th>
              <th className="text-[11px] uppercase tracking-[0.8px] text-charcoal font-semibold px-4 py-3">Premium</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 1 ? "bg-cream-light/40" : ""}>
                <td className="text-[13px] text-warm-gray px-4 py-3">{row.label}</td>
                <td className="text-center px-4 py-3"><Cell value={row.standard} /></td>
                <td className="text-center px-4 py-3"><Cell value={row.premium} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
