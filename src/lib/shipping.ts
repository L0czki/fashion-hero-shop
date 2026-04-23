// src/lib/shipping.ts

export const FREE_SHIPPING_THRESHOLD = 99;
export const SHIPPING_COST = 19.9;
export const PRIORITY_CUTOFF_HOUR = 14; // local time

export function getShippingCost(subtotal: number, isPremium: boolean): number {
  if (isPremium) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export interface DeliveryInfo {
  /** True if the 14:00 cutoff has already passed today. */
  cutoffPassed: boolean;
  /** Next business-day delivery date (Mon–Fri). */
  deliveryDate: Date;
  /** Milliseconds until today's cutoff. 0 if cutoffPassed. */
  msUntilCutoff: number;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function nextBusinessDay(from: Date): Date {
  let d = addDays(from, 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d = addDays(d, 1);
  }
  return d;
}

export function getNextDeliveryDate(now: Date): DeliveryInfo {
  const cutoff = new Date(now);
  cutoff.setHours(PRIORITY_CUTOFF_HOUR, 0, 0, 0);

  const cutoffPassed = now.getTime() >= cutoff.getTime();
  const msUntilCutoff = cutoffPassed ? 0 : cutoff.getTime() - now.getTime();

  const base = cutoffPassed ? nextBusinessDay(now) : now;
  const deliveryDate = nextBusinessDay(base);

  return { cutoffPassed, deliveryDate, msUntilCutoff };
}

/** Formats a Date as "wtorek, 23 kwietnia" (day-of-week, day month). */
export function formatDeliveryDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
