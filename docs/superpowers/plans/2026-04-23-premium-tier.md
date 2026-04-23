# FashionHero Premium Tier — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a presentable FashionHero Premium prototype: one-click activation (no payment), free shipping always, priority next-day delivery countdown, early access to 3 exclusive products, plus a `/premium` landing page and cross-app UX touchpoints.

**Architecture:** Extend the existing mock `AuthProvider` (localStorage) with a `premium` sub-object and `activatePremium` / `cancelPremium` / `isPremiumActive` APIs. Centralise shipping logic in a new pure module `src/lib/shipping.ts` and migrate the 4 hardcoded-threshold touchpoints to consume it plus `useAuth`. Add a new `/premium` route with composed section components, a countdown component reused in PDP + checkout, a lock overlay/modal for early-access products, and a crown badge in the header. Everything is client-soft-gated — no backend or SSR changes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Lucide React icons, shadcn/ui primitives. No test framework is installed in the project — verification uses `npm run lint`, `npm run build`, and a final manual browser walkthrough (consistent with the "prototype for client pitch" scope).

**Spec:** `docs/superpowers/specs/2026-04-23-premium-tier-design.md`

---

## File Map

### Created

| Path | Responsibility |
| --- | --- |
| `src/lib/shipping.ts` | Pure shipping/delivery logic — constants + `getShippingCost` + `getNextDeliveryDate` |
| `src/hooks/use-activate-premium.ts` | Encapsulates "guest → login redirect; logged-in → activatePremium()" |
| `src/components/premium-badge.tsx` | Reusable crown-icon pill |
| `src/components/premium-lock-overlay.tsx` | Semi-transparent lock overlay for non-premium product cards |
| `src/components/premium-lock-modal.tsx` | Modal shown when non-premium clicks a premium-early-access product |
| `src/components/priority-delivery-countdown.tsx` | Client-only countdown showing next-day cutoff |
| `src/components/sections/premium-hero.tsx` | Dark hero for `/premium` with dynamic CTA |
| `src/components/sections/premium-benefits.tsx` | 3-card benefits grid |
| `src/components/sections/premium-how-it-works.tsx` | 3-step strip |
| `src/components/sections/premium-comparison.tsx` | Standard vs Premium table |
| `src/components/sections/premium-cta.tsx` | Bottom repeat of primary CTA + disclaimer |
| `src/app/premium/page.tsx` | Composes `/premium` page from section components |

### Modified

| Path | Change |
| --- | --- |
| `src/components/auth-provider.tsx` | Extend `User` with `premium`, add `activatePremium` / `cancelPremium` / `isPremiumActive` |
| `src/components/announcement-bar.tsx` | Use `FREE_SHIPPING_THRESHOLD` and become premium-aware |
| `src/components/cart-drawer.tsx` | Replace single-state shipping bar with 3-state block; use `getShippingCost` |
| `src/app/checkout/page.tsx` | Use `getShippingCost`; show premium strikethrough; show countdown; non-premium upsell |
| `src/components/product-info.tsx` | Replace hardcoded "over 299" copy; show countdown or fallback |
| `src/components/header.tsx` | Render crown badge next to avatar when premium |
| `src/components/mega-menu.tsx` | Add "Premium Early Access" top-level nav link |
| `src/components/product-card.tsx` | Render `PremiumLockOverlay` when `premiumEarlyAccess && !isPremiumActive` |
| `src/data/products.ts` | Add `premiumEarlyAccess: true` to products `"35"`, `"39"`, `"31"` |
| `src/data/collections.ts` | Add `premium-early-access` collection entry |
| `src/types/index.ts` | Extend `Product` with optional `premiumEarlyAccess` |
| `src/app/account/login/page.tsx` | Honour `?redirect=` query param |

---

## Conventions used throughout

- Polish copy in user-facing strings (the rest of the app mixes EN and PL; the spec is PL so we stay PL).
- Prices always with the `zl` suffix, no currency symbol (matches existing codebase).
- Follow existing Tailwind token names: `charcoal`, `warm-gray`, `cream-light`, `cream-dark`, `border`. Use `text-[NNpx]` exact sizes where the file around you does so.
- After every edit that meaningfully changes TypeScript surface area, run `npm run lint` and/or `npm run build`. Expected output in each step.
- Frequent commits — one per task. Commit messages follow existing repo style (`feat:`, `fix:`, `refactor:`). Include the Claude co-author trailer.

---

## Task 1: Shipping library

**Files:**
- Create: `src/lib/shipping.ts`

- [ ] **Step 1: Create the module**

```ts
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
```

- [ ] **Step 2: Verify with a sanity script (throwaway)**

Run:

```bash
cd /home/coder/AIPH/FashionHero_repo && npx --yes tsx --eval '
import { getShippingCost, getNextDeliveryDate, formatDeliveryDate } from "./src/lib/shipping.ts";
console.log("premium 50 →", getShippingCost(50, true));
console.log("non-prem 50 →", getShippingCost(50, false));
console.log("non-prem 150 →", getShippingCost(150, false));
const before = new Date(2026, 3, 23, 10, 0, 0);
const after = new Date(2026, 3, 23, 15, 0, 0);
console.log("before 14:00 →", formatDeliveryDate(getNextDeliveryDate(before).deliveryDate), "cutoffPassed:", getNextDeliveryDate(before).cutoffPassed);
console.log("after 14:00 →", formatDeliveryDate(getNextDeliveryDate(after).deliveryDate), "cutoffPassed:", getNextDeliveryDate(after).cutoffPassed);
'
```

Expected:
- `premium 50 → 0`
- `non-prem 50 → 19.9`
- `non-prem 150 → 0`
- `before 14:00` prints a next-business-day date (Fri 24 April) with `cutoffPassed: false`
- `after 14:00` prints the business day *after* that (Mon 27 April if 24th is Fri) with `cutoffPassed: true`

If `tsx` is not available, skip this step and rely on `npm run build` at the end of Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/lib/shipping.ts
git commit -m "$(cat <<'EOF'
feat: add shipping library with premium-aware cost and delivery cutoff helpers

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Extend AuthProvider with premium

**Files:**
- Modify: `src/components/auth-provider.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `src/components/auth-provider.tsx` with:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export interface PremiumStatus {
  activatedAt: string;  // ISO date
  expiresAt: string;    // ISO date — activatedAt + 365 days
}

interface User {
  email: string;
  firstName: string;
  lastName: string;
  premium?: PremiumStatus;
}

interface AuthContextValue {
  user: User | null;
  isPremiumActive: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  activatePremium: () => void;
  cancelPremium: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "stepforward_user";
const PREMIUM_DURATION_DAYS = 365;

function persist(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const newUser: User = {
      email,
      firstName: email.split("@")[0],
      lastName: "",
    };
    persist(newUser);
    setUser(newUser);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const newUser: User = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    persist(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    persist(null);
    setUser(null);
  }, []);

  const activatePremium = useCallback(() => {
    setUser((current) => {
      if (!current) return current;
      const now = new Date();
      const expires = new Date(now);
      expires.setDate(expires.getDate() + PREMIUM_DURATION_DAYS);
      const next: User = {
        ...current,
        premium: {
          activatedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const cancelPremium = useCallback(() => {
    setUser((current) => {
      if (!current) return current;
      const { premium: _removed, ...rest } = current;
      void _removed;
      const next: User = rest;
      persist(next);
      return next;
    });
  }, []);

  const isPremiumActive = useMemo(() => {
    if (!user?.premium) return false;
    return new Date(user.premium.expiresAt).getTime() > Date.now();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, isPremiumActive, login, register, logout, activatePremium, cancelPremium }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify**

Run:

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no new errors. (Pre-existing unrelated warnings are OK; nothing should reference the old `useAuth` shape since we added properties, not removed any.)

- [ ] **Step 3: Commit**

```bash
git add src/components/auth-provider.tsx
git commit -m "$(cat <<'EOF'
feat: extend auth provider with premium activation and isPremiumActive

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate announcement bar to new threshold

**Files:**
- Modify: `src/components/announcement-bar.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
"use client";

import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { useAuth } from "./auth-provider";

export function AnnouncementBar() {
  const { isPremiumActive } = useAuth();
  const message = isPremiumActive
    ? "Premium: darmowa dostawa bez progu + next-day do 14:00"
    : `Darmowa dostawa od ${FREE_SHIPPING_THRESHOLD} zł · Łatwe zwroty`;
  return (
    <div className="bg-charcoal text-white text-center" style={{ height: "36px", lineHeight: "36px" }}>
      <p className="text-[11px] font-medium tracking-wide">{message}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run:

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run build 2>&1 | tail -30
```

Expected: build succeeds (possibly with warnings). If it fails, the most likely issue is that `AnnouncementBar` is rendered in a server component. If so, add `"use client"` where it's imported, or wrap it; inspect `src/app/layout.tsx` to confirm. The file is already marked `"use client"` so it must be mounted inside a client tree. If the build surfaces "useAuth must be within AuthProvider", confirm `AnnouncementBar` is rendered inside the `AuthProvider` in `layout.tsx` — if it is above the provider, move it inside.

- [ ] **Step 3: Commit**

```bash
git add src/components/announcement-bar.tsx
git commit -m "$(cat <<'EOF'
feat: make announcement bar premium-aware and shift threshold to 99 zł

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Rework cart drawer with three-state shipping block

**Files:**
- Modify: `src/components/cart-drawer.tsx:28-68`

- [ ] **Step 1: Update imports at top of file**

At the top of `src/components/cart-drawer.tsx`, after the existing imports, add:

```tsx
import { FREE_SHIPPING_THRESHOLD, getShippingCost } from "@/lib/shipping";
import { useAuth } from "./auth-provider";
```

- [ ] **Step 2: Replace the subtotal / shipping calculation and shipping-bar JSX**

Replace lines 24–68 (the `const subtotal`, `const freeShippingThreshold`, `const remaining`, plus the entire `{/* Shipping bar */}` block) with:

```tsx
  const { isPremiumActive } = useAuth();
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingCost = getShippingCost(subtotal, isPremiumActive);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-nav">CART ({items.length})</h2>
          <button onClick={onClose} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {/* Shipping bar — three states */}
        <div className="px-4 py-3 bg-cream-light">
          {isPremiumActive ? (
            <div className="text-center">
              <p className="text-xs font-medium text-charcoal">
                ✓ Premium: darmowa dostawa odblokowana
              </p>
              <p className="text-[11px] text-warm-gray mt-0.5">
                Dostawa next-day przy zamówieniu do 14:00
              </p>
            </div>
          ) : remaining > 0 ? (
            <div className="text-center">
              <p className="text-xs text-warm-gray">
                Dodaj jeszcze <span className="text-charcoal font-medium">{remaining.toFixed(0)} zł</span> do darmowej dostawy
              </p>
              <Link
                href="/premium"
                onClick={onClose}
                className="text-[11px] text-warm-gray underline hover:text-charcoal transition-colors mt-0.5 inline-block"
              >
                Albo kup Premium za 59 zł/rok — zawsze 0 zł dostawy →
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-charcoal font-medium">
                Masz darmową dostawę w tym zamówieniu ✓
              </p>
              <Link
                href="/premium"
                onClick={onClose}
                className="text-[11px] text-warm-gray underline hover:text-charcoal transition-colors mt-0.5 inline-block"
              >
                Z Premium masz ją zawsze + next-day →
              </Link>
            </div>
          )}
        </div>
```

Leave the rest of the file untouched — the mapping of items, the footer subtotal, etc. We are NOT editing the footer subtotal here since cart drawer footer currently says "Shipping and taxes calculated at checkout." — that sentence is still accurate.

Note: `shippingCost` is computed but not displayed in the drawer (we keep the existing "calculated at checkout" copy). We keep the variable around in case we want to surface it later. If lint flags it as unused, remove the `const shippingCost =` line — it's fine either way.

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no new errors. If `shippingCost` is flagged as unused, remove its declaration line.

- [ ] **Step 4: Commit**

```bash
git add src/components/cart-drawer.tsx
git commit -m "$(cat <<'EOF'
feat: cart drawer shows 3 shipping states (premium / below / above threshold)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Migrate checkout page to premium-aware shipping (scaffolding only)

**Files:**
- Modify: `src/app/checkout/page.tsx:1-15` and the Shipping row in Order Summary.

(The actual countdown component is added in Task 7. Here we just rewire shipping cost + upsell copy.)

- [ ] **Step 1: Replace top-of-file imports + cost calc**

At the top of `src/app/checkout/page.tsx`, replace:

```tsx
"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
```

with:

```tsx
"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { getShippingCost, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
```

Then replace line 13 (`const shipping = subtotal >= 299 ? 0 : 19.9;`) with:

```tsx
  const { isPremiumActive } = useAuth();
  const shipping = getShippingCost(subtotal, isPremiumActive);
```

- [ ] **Step 2: Replace the Shipping row in Order Summary**

Find the block (currently lines 173–178):

```tsx
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : `${shipping.toFixed(2)} zl`}
                  </span>
                </div>
```

Replace with:

```tsx
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Dostawa</span>
                  <span className="font-medium">
                    {isPremiumActive ? (
                      <>
                        <span className="line-through text-warm-gray mr-2">19,90 zł</span>
                        <span className="text-charcoal">0 zł</span>
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider bg-charcoal text-white px-1.5 py-0.5 rounded">
                          Premium
                        </span>
                      </>
                    ) : shipping === 0 ? (
                      "0 zł"
                    ) : (
                      `${shipping.toFixed(2)} zł`
                    )}
                  </span>
                </div>
                {!isPremiumActive && subtotal < FREE_SHIPPING_THRESHOLD && (
                  <Link
                    href="/premium"
                    className="block text-[11px] text-warm-gray hover:text-charcoal underline"
                  >
                    Premium = 0 zł dostawy + next-day za 59 zł/rok →
                  </Link>
                )}
```

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "$(cat <<'EOF'
feat: checkout honours premium shipping and shows upsell below threshold

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Build PriorityDeliveryCountdown component

**Files:**
- Create: `src/components/priority-delivery-countdown.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/priority-delivery-countdown.tsx
"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getNextDeliveryDate, formatDeliveryDate } from "@/lib/shipping";

interface Props {
  /** When false the component renders nothing. */
  active: boolean;
  className?: string;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

export function PriorityDeliveryCountdown({ active, className }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [active]);

  if (!active || !now) return null;

  const info = getNextDeliveryDate(now);
  const dateLabel = formatDeliveryDate(info.deliveryDate);

  if (info.cutoffPassed) {
    return (
      <div className={className}>
        <p className="text-xs text-warm-gray flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-charcoal" />
          Dostawa <span className="font-medium text-charcoal">{dateLabel}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs text-orange-600 flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" />
        Zamów w ciągu <span className="font-semibold">{formatDuration(info.msUntilCutoff)}</span>, dostawa{" "}
        <span className="font-semibold text-charcoal">{dateLabel}</span>
      </p>
    </div>
  );
}
```

Note: uses `lucide-react` which is already a dependency (see `package.json`). If `Zap` is not exported by the installed version, replace with any small existing icon from `src/components/icons.tsx`.

- [ ] **Step 2: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/priority-delivery-countdown.tsx
git commit -m "$(cat <<'EOF'
feat: add priority delivery countdown with 14:00 cutoff awareness

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Integrate countdown in checkout and PDP

**Files:**
- Modify: `src/app/checkout/page.tsx` (add countdown under Shipping row)
- Modify: `src/components/product-info.tsx:175-186`

- [ ] **Step 1: Checkout integration**

In `src/app/checkout/page.tsx`, add the import at the top alongside others:

```tsx
import { PriorityDeliveryCountdown } from "@/components/priority-delivery-countdown";
```

Then, immediately *after* the Shipping row block added in Task 5 (after the closing `</div>` of the `flex justify-between text-sm` that contains the "Dostawa" label), add:

```tsx
                <PriorityDeliveryCountdown active={isPremiumActive} className="pt-1" />
                {!isPremiumActive && (
                  <p className="text-[11px] text-warm-gray">
                    Dostawa 2–4 dni robocze ·{" "}
                    <Link href="/premium" className="underline hover:text-charcoal">
                      Next-day z Premium →
                    </Link>
                  </p>
                )}
```

Insert this *after* the upsell `Link` block from Task 5 so the order is: Shipping row → upsell (if any) → countdown → standard-delivery note.

Actually to avoid duplicated links, restructure: only render the standard-delivery note when `!isPremiumActive`. The upsell link added in Task 5 already covers the below-threshold case. Adjust so the two non-premium messages do not both appear simultaneously:

- If `!isPremiumActive && subtotal < FREE_SHIPPING_THRESHOLD`: show upsell link only (from Task 5).
- If `!isPremiumActive && subtotal >= FREE_SHIPPING_THRESHOLD`: show "Dostawa 2–4 dni robocze + Next-day z Premium" line.
- If `isPremiumActive`: show countdown only.

Concretely, replace the upsell block from Task 5 and add the new lines so the full post–Shipping-row block reads:

```tsx
                {isPremiumActive ? (
                  <PriorityDeliveryCountdown active={isPremiumActive} className="pt-1" />
                ) : subtotal < FREE_SHIPPING_THRESHOLD ? (
                  <Link
                    href="/premium"
                    className="block text-[11px] text-warm-gray hover:text-charcoal underline"
                  >
                    Premium = 0 zł dostawy + next-day za 59 zł/rok →
                  </Link>
                ) : (
                  <p className="text-[11px] text-warm-gray">
                    Dostawa 2–4 dni robocze ·{" "}
                    <Link href="/premium" className="underline hover:text-charcoal">
                      Next-day z Premium →
                    </Link>
                  </p>
                )}
```

- [ ] **Step 2: PDP integration**

In `src/components/product-info.tsx`, at the top add these imports (keep existing ones):

```tsx
import { useAuth } from "./auth-provider";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { PriorityDeliveryCountdown } from "./priority-delivery-countdown";
import Link from "next/link";
```

Inside the `ProductInfo` component, near the top where other hooks are used, add:

```tsx
  const { isPremiumActive } = useAuth();
```

Then replace the shipping-info block (currently lines 175–186, the `<div className="flex flex-col gap-2 pt-2 border-t border-border">` through its closing `</div>`) with:

```tsx
      {/* Shipping info */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        {isPremiumActive ? (
          <>
            <p className="text-xs text-charcoal font-medium">
              ✓ Premium: darmowa dostawa
            </p>
            <PriorityDeliveryCountdown active className="" />
          </>
        ) : (
          <>
            <p className="text-xs text-warm-gray">
              Darmowa dostawa od {FREE_SHIPPING_THRESHOLD} zł
            </p>
            <p className="text-xs text-warm-gray">
              Dostawa 2–4 dni robocze ·{" "}
              <Link href="/premium" className="underline hover:text-charcoal">
                Next-day z Premium →
              </Link>
            </p>
          </>
        )}
        <p className="text-xs text-warm-gray">Łatwe zwroty</p>
      </div>
```

If there is a `deliveryDate` variable or computation above this block that is now unused, remove it. (Grep with `grep -n 'deliveryDate' src/components/product-info.tsx` — it is referenced at line 181 in the pre-existing code.)

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no new errors. If `deliveryDate` is reported as unused, remove its definition.

- [ ] **Step 4: Commit**

```bash
git add src/components/product-info.tsx src/app/checkout/page.tsx
git commit -m "$(cat <<'EOF'
feat: surface priority delivery countdown in checkout and PDP

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Reusable PremiumBadge component

**Files:**
- Create: `src/components/premium-badge.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/premium-badge.tsx
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** small = 10px label + 10px icon, default = 11px */
  size?: "sm" | "md";
  label?: string;
}

export function PremiumBadge({ className, size = "md", label = "Premium" }: Props) {
  const sizeCls = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-charcoal text-white font-semibold uppercase tracking-wider",
        sizeCls,
        className
      )}
    >
      <Crown className={iconSize} />
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no errors. If `Crown` is not exported by the installed `lucide-react`, substitute a star/sparkle icon that is exported, or fall back to an inline SVG.

- [ ] **Step 3: Commit**

```bash
git add src/components/premium-badge.tsx
git commit -m "$(cat <<'EOF'
feat: add reusable PremiumBadge pill

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Header crown badge for premium users

**Files:**
- Modify: `src/components/header.tsx:78-90`

- [ ] **Step 1: Update imports**

Add at the top of `src/components/header.tsx` alongside existing imports:

```tsx
import { Crown } from "lucide-react";
```

And pull `isPremiumActive` from the existing `useAuth` call — replace `const { user } = useAuth();` with:

```tsx
  const { user, isPremiumActive } = useAuth();
```

- [ ] **Step 2: Replace the account link block**

Replace the `<Link href={user ? "/account" : "/account/login"}` block (currently lines 78–90) with:

```tsx
          <Link
            href={user ? "/account" : "/account/login"}
            aria-label="Account"
            className="hidden sm:flex p-1 hover:opacity-60 transition-opacity items-center justify-center gap-1 relative"
          >
            {user ? (
              <span className="w-5 h-5 rounded-full bg-charcoal text-white text-[11px] font-medium flex items-center justify-center">
                {user.firstName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserIcon />
            )}
            {isPremiumActive && (
              <span
                title="Premium aktywne"
                aria-label="Premium"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-charcoal text-white flex items-center justify-center"
              >
                <Crown className="h-2.5 w-2.5" />
              </span>
            )}
          </Link>
```

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/header.tsx
git commit -m "$(cat <<'EOF'
feat: show crown badge next to avatar when premium is active

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: useActivatePremium hook and login redirect

**Files:**
- Create: `src/hooks/use-activate-premium.ts`
- Modify: `src/app/account/login/page.tsx`

- [ ] **Step 1: Create the hook**

```ts
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
```

- [ ] **Step 2: Update login page to honour `?redirect=`**

Replace the contents of `src/app/account/login/page.tsx` with:

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    await login(email, password);
    router.push(redirect);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {/* Breadcrumb */}
      <nav className="text-[11px] text-warm-gray mb-8 tracking-wide">
        <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/account" className="hover:text-charcoal transition-colors">Account</Link>
        <span className="mx-1.5">/</span>
        <span className="text-charcoal">Sign In</span>
      </nav>

      <h1 className="text-2xl font-light text-charcoal mb-8 text-center">Sign In</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-red-600 text-[13px] text-center">{error}</p>
        )}
        <div>
          <label htmlFor="email" className="block text-[11px] font-medium uppercase tracking-[0.8px] text-charcoal mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-black/15 rounded px-3 py-2.5 text-[14px] text-charcoal outline-none focus:border-charcoal transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-[11px] font-medium uppercase tracking-[0.8px] text-charcoal mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-black/15 rounded px-3 py-2.5 text-[14px] text-charcoal outline-none focus:border-charcoal transition-colors"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="btn-cta w-full text-[12px]">
          SIGN IN
        </button>
      </form>

      <p className="text-center text-[13px] text-warm-gray mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/account/register" className="text-charcoal underline hover:opacity-60 transition-opacity">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
```

Note: `useSearchParams` requires a Suspense boundary in Next.js 16 App Router. That's why we wrap the form.

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint && npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-activate-premium.ts src/app/account/login/page.tsx
git commit -m "$(cat <<'EOF'
feat: add useActivatePremium hook and support ?redirect= on login

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Premium hero section

**Files:**
- Create: `src/components/sections/premium-hero.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/premium-hero.tsx
git commit -m "$(cat <<'EOF'
feat: add premium hero section with dynamic CTA and active-state banner

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Premium benefits, how-it-works, comparison, CTA sections

**Files:**
- Create: `src/components/sections/premium-benefits.tsx`
- Create: `src/components/sections/premium-how-it-works.tsx`
- Create: `src/components/sections/premium-comparison.tsx`
- Create: `src/components/sections/premium-cta.tsx`

- [ ] **Step 1: Benefits section**

```tsx
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
```

- [ ] **Step 2: How-it-works section**

```tsx
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
```

- [ ] **Step 3: Comparison section**

```tsx
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
```

- [ ] **Step 4: Bottom CTA section**

```tsx
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
```

- [ ] **Step 5: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no errors. If `Truck`, `Zap`, `Sparkles`, `Check`, or `X` are not exported by the installed `lucide-react`, substitute equivalent exported icons.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/premium-benefits.tsx src/components/sections/premium-how-it-works.tsx src/components/sections/premium-comparison.tsx src/components/sections/premium-cta.tsx
git commit -m "$(cat <<'EOF'
feat: add premium benefits, how-it-works, comparison, and bottom CTA sections

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Premium landing page

**Files:**
- Create: `src/app/premium/page.tsx`

- [ ] **Step 1: Create the route**

```tsx
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
```

- [ ] **Step 2: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run build 2>&1 | tail -30
```

Expected: build succeeds and the `/premium` route is listed in the route tree.

- [ ] **Step 3: Commit**

```bash
git add src/app/premium/page.tsx
git commit -m "$(cat <<'EOF'
feat: add /premium landing page composing premium sections

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Tag 3 products as premium early access

**Files:**
- Modify: `src/types/index.ts` (add optional field to `Product`)
- Modify: `src/data/products.ts` (set `premiumEarlyAccess: true` on ids `"35"`, `"39"`, `"31"`)
- Modify: `src/data/collections.ts` (register `premium-early-access` collection slug)

- [ ] **Step 1: Extend `Product` type**

In `src/types/index.ts`, inside the `Product` interface, add (anywhere after `tags`):

```ts
  sellerId: string;
  premiumEarlyAccess?: boolean;
}
```

(Only the `premiumEarlyAccess?: boolean;` line is new — the surrounding lines are shown for anchoring.)

- [ ] **Step 2: Flag three products**

In `src/data/products.ts`, find the product at `id: "35"` (Street Runner X, around line 206) and add `premiumEarlyAccess: true,` as a new field in the object literal (place it immediately after `sellerId:` if present, or just before the closing `}`).

Repeat for `id: "39"` (Utility Jacket, around line 334) and `id: "31"` (Tote Bag — find with `grep -n 'id: "31"' src/data/products.ts`).

Example, for product id `"35"`:

```ts
  {
    id: "35",
    name: "Street Runner X",
    // ...existing fields...
    sellerId: "alpha-footwear",
    premiumEarlyAccess: true,
  },
```

- [ ] **Step 3: Register the collection**

Append to the `collections` array in `src/data/collections.ts`, just before the closing `];` of the array:

```ts
  {
    id: "premium-early-access",
    name: "Premium Early Access",
    slug: "premium-early-access",
    description: "Ekskluzywne produkty dostępne 48h wcześniej tylko dla Premium.",
    heroImage: "/images/hero/collection-hero-1.jpg",
  },
```

Then update `getProductsByCollection` in `src/data/products.ts` (near line 3475) so the `premium-early-access` slug returns the tagged products. Replace the body of the function with:

```ts
export function getProductsByCollection(collectionSlug: string): Product[] {
  const categoryMap: Record<string, string> = {
    socks: "socks",
    apparel: "apparel",
    accessories: "accessories",
  };

  if (collectionSlug === "all") {
    return products;
  }

  if (collectionSlug === "premium-early-access") {
    return products.filter((p) => p.premiumEarlyAccess);
  }

  const productCat = categoryMap[collectionSlug];
  if (productCat) {
    return products.filter((p) => p.productCategory === productCat);
  }

  return products.filter((p) => p.collections.includes(collectionSlug));
}
```

- [ ] **Step 4: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run build 2>&1 | tail -30
```

Expected: build succeeds. `/collections/premium-early-access` should be present in the route tree (since `generateStaticParams` iterates collections).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/data/products.ts src/data/collections.ts
git commit -m "$(cat <<'EOF'
feat: flag 3 products and register premium-early-access collection

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: PremiumLockOverlay and PremiumLockModal

**Files:**
- Create: `src/components/premium-lock-overlay.tsx`
- Create: `src/components/premium-lock-modal.tsx`

- [ ] **Step 1: Lock overlay**

```tsx
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
```

- [ ] **Step 2: Lock modal**

```tsx
// src/components/premium-lock-modal.tsx
"use client";

import Link from "next/link";
import { Truck, Zap, Sparkles, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export function PremiumLockModal({ isOpen, onClose, productName }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white max-w-md w-full rounded-lg p-8 text-center">
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute top-3 right-3 p-1 hover:opacity-60 transition-opacity"
        >
          <X className="h-4 w-4 text-charcoal" />
        </button>
        <p className="text-[11px] uppercase tracking-[0.8px] text-warm-gray mb-3">Premium Early Access</p>
        <h3 className="text-xl font-light text-charcoal mb-2">
          {productName ? `"${productName}"` : "Ten produkt"} to Premium Early Access
        </h3>
        <p className="text-[13px] text-warm-gray mb-6">
          Aktywuj Premium, aby odblokować ten produkt i wszystkie pozostałe korzyści.
        </p>
        <ul className="text-left space-y-2 mb-6 text-[13px] text-charcoal">
          <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> Darmowa dostawa zawsze</li>
          <li className="flex items-center gap-2"><Zap className="h-4 w-4" /> Next-day przed 14:00</li>
          <li className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Dostęp do ekskluzywów</li>
        </ul>
        <Link
          href="/premium"
          onClick={onClose}
          className="block w-full bg-charcoal text-white py-3 text-[12px] font-semibold uppercase tracking-[0.8px] rounded-full hover:bg-charcoal-light transition-colors"
        >
          Aktywuj Premium — 59 zł / rok
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/premium-lock-overlay.tsx src/components/premium-lock-modal.tsx
git commit -m "$(cat <<'EOF'
feat: add premium lock overlay and modal for early-access products

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Product card gating for non-premium

**Files:**
- Modify: `src/components/product-card.tsx`

- [ ] **Step 1: Import dependencies and add state**

Add imports near the top:

```tsx
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { PremiumLockOverlay } from "./premium-lock-overlay";
import { PremiumLockModal } from "./premium-lock-modal";
import { PremiumBadge } from "./premium-badge";
```

Inside the `ProductCard` component, at the top (after `const firstColor = product.colors[0];`), add:

```tsx
  const { isPremiumActive } = useAuth();
  const isLocked = !!product.premiumEarlyAccess && !isPremiumActive;
  const [lockModalOpen, setLockModalOpen] = useState(false);
```

- [ ] **Step 2: Replace the outer `<Link>` wrapping the image**

Currently lines 45–99 wrap a `<Link href={`/products/${product.slug}`}>` around the image and quick-view button. Replace the outer wrapper so that when locked, we render a `<button>` that opens the modal instead of a navigating link.

Replace lines 43–105 (from `return ( ... </div>` just before the wishlist-button container) with:

```tsx
  return (
    <div className={cn("group", className)}>
      <div className="relative">
        {isLocked ? (
          <button
            type="button"
            onClick={() => setLockModalOpen(true)}
            className="block text-left w-full"
            aria-label={`${product.name} — Premium Early Access`}
          >
            <ImageArea
              product={product}
              firstColor={firstColor}
              badgeLabel={badgeLabel}
              imageSrc={imageSrc}
              showImage={showImage}
              openQuickView={openQuickView}
              disableQuickView
            />
            <PremiumLockOverlay />
          </button>
        ) : (
          <Link href={`/products/${product.slug}`} className="block">
            <ImageArea
              product={product}
              firstColor={firstColor}
              badgeLabel={badgeLabel}
              imageSrc={imageSrc}
              showImage={showImage}
              openQuickView={openQuickView}
              disableQuickView={false}
            />
          </Link>
        )}

        {product.premiumEarlyAccess && (
          <div className="absolute bottom-3 left-3 z-30">
            <PremiumBadge size="sm" label="Early Access" />
          </div>
        )}

        {/* Wishlist button — top-right, shows on hover */}
        {!isLocked && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:block hidden">
            <WishlistButton productId={product.id} className="bg-white/90 rounded-full p-1.5 hover:bg-white" />
          </div>
        )}
      </div>
```

Then, extract the image-area JSX into a local helper component at the bottom of the same file (still inside the module, above or below `ProductCard`):

```tsx
interface ImageAreaProps {
  product: Product;
  firstColor: Product["colors"][number];
  badgeLabel: string | null;
  imageSrc: string;
  showImage: boolean;
  openQuickView: (product: Product) => void;
  disableQuickView: boolean;
}

function ImageArea({ product, firstColor, badgeLabel, imageSrc, showImage, openQuickView, disableQuickView }: ImageAreaProps) {
  return (
    <div
      className="relative aspect-square overflow-hidden mb-3"
      style={{ background: productGradient(firstColor.hex) }}
    >
      {badgeLabel && (
        <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-wider bg-white/90 px-2 py-1 z-10">
          {badgeLabel}
        </span>
      )}
      {showImage ? (
        <Image
          src={imageSrc}
          alt={`${product.name} - ${firstColor.name}`}
          width={800}
          height={800}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <div className="relative w-3/5 h-2/5">
            <div
              className="absolute inset-0 rounded-[50%]"
              style={{
                background: `linear-gradient(135deg, ${firstColor.hex}88 0%, ${firstColor.hex}44 100%)`,
                transform: "rotate(-8deg) scaleX(1.6)",
              }}
            />
            <div
              className="absolute top-[-20%] left-[10%] w-[50%] h-[70%] rounded-[40%_60%_30%_70%]"
              style={{
                background: `linear-gradient(180deg, ${firstColor.hex}66 0%, ${firstColor.hex}33 100%)`,
                transform: "rotate(-15deg)",
              }}
            />
          </div>
        </div>
      )}

      {!disableQuickView && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openQuickView(product);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 text-[10px] font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block hover:bg-white z-10"
        >
          QUICK VIEW
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Mount the modal and guard the product-info link below the image**

At the very end of the `ProductCard`'s return statement (just before the closing `</div>` of the outer wrapper), add:

```tsx
      <PremiumLockModal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        productName={product.name}
      />
```

Also, in the lower product-info `<Link href={`/products/${product.slug}`}>` (currently around line 107), change it to:

```tsx
      {isLocked ? (
        <button
          type="button"
          onClick={() => setLockModalOpen(true)}
          className="block text-left w-full"
        >
          {/* Product info — same content as before */}
          <div>
            <h3 className="text-[12px] font-medium uppercase tracking-[0.5px] mb-0.5">
              {product.name}
            </h3>
            <p className="text-[12px] text-warm-gray mb-0.5">{firstColor?.name}</p>
            {seller && (
              <p className="text-[11px] text-warm-gray/70 mb-1">
                Sold by{" "}
                <span className="text-charcoal/60 hover:text-charcoal transition-colors">
                  {seller.name}
                </span>
                {seller.rating >= 4.5 && (
                  <span className="inline-block ml-1 text-[9px] bg-charcoal/10 text-charcoal/70 px-1 py-0.5 rounded uppercase tracking-wide">
                    Pro
                  </span>
                )}
              </p>
            )}
          </div>
        </button>
      ) : (
        <Link href={`/products/${product.slug}`} className="block">
          <div>
            <h3 className="text-[12px] font-medium uppercase tracking-[0.5px] mb-0.5">
              {product.name}
            </h3>
            <p className="text-[12px] text-warm-gray mb-0.5">{firstColor?.name}</p>
            {seller && (
              <p className="text-[11px] text-warm-gray/70 mb-1">
                Sold by{" "}
                <span className="text-charcoal/60 hover:text-charcoal transition-colors">
                  {seller.name}
                </span>
                {seller.rating >= 4.5 && (
                  <span className="inline-block ml-1 text-[9px] bg-charcoal/10 text-charcoal/70 px-1 py-0.5 rounded uppercase tracking-wide">
                    Pro
                  </span>
                )}
              </p>
            )}
          </div>
        </Link>
      )}
```

- [ ] **Step 4: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint && npm run build 2>&1 | tail -30
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/product-card.tsx
git commit -m "$(cat <<'EOF'
feat: gate premium-early-access products behind lock overlay on product card

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: PDP "Add to cart" gating for premium-early-access

**Files:**
- Modify: `src/components/product-info.tsx`

- [ ] **Step 1: Add state and gating**

Near the top of the `ProductInfo` component (beside the `useAuth` call added in Task 7), add:

```tsx
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const isEarlyAccessLocked = !!product.premiumEarlyAccess && !isPremiumActive;
```

Add imports at the top of the file:

```tsx
import { useState } from "react";  // if not already imported
import { PremiumLockModal } from "./premium-lock-modal";
import { PremiumBadge } from "./premium-badge";
```

(If `useState` is already imported from another line, leave it alone.)

- [ ] **Step 2: Replace the Add-to-cart button block**

Find the existing "Add to cart" block (currently around lines 167–173). Replace it with:

```tsx
      <button
        onClick={() => {
          if (isEarlyAccessLocked) {
            setLockModalOpen(true);
            return;
          }
          handleAddToCart();
        }}
        disabled={!selectedSize && !isEarlyAccessLocked}
        className="w-full py-4 bg-charcoal text-white text-[12px] font-medium uppercase tracking-[0.6px] rounded-full hover:bg-charcoal-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isEarlyAccessLocked
          ? "ODBLOKUJ Z PREMIUM"
          : selectedSize
            ? `ADD TO CART - ${product.price} zł`
            : "SELECT A SIZE"}
      </button>
```

- [ ] **Step 3: Add the PremiumBadge above the product title**

Find where `product.name` is rendered as the title inside `ProductInfo` (search: `grep -n "product.name" src/components/product-info.tsx`). Immediately above the title element, insert:

```tsx
      {product.premiumEarlyAccess && (
        <PremiumBadge size="sm" label="Early Access" className="mb-2" />
      )}
```

- [ ] **Step 4: Mount the modal**

At the bottom of the `ProductInfo` JSX tree (just before the final closing `</div>`), add:

```tsx
      <PremiumLockModal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        productName={product.name}
      />
```

- [ ] **Step 5: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/product-info.tsx
git commit -m "$(cat <<'EOF'
feat: gate add-to-cart on PDP for premium-early-access products

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Collection hero dark variant for early access + nav link

**Files:**
- Modify: `src/components/collection-hero.tsx` (dark variant when slug matches)
- Modify: `src/components/mega-menu.tsx` (add "Premium Early Access" link after the NEW link, same for mobile)

- [ ] **Step 1: Dark hero variant with `PremiumBadge` + tagline**

Replace the contents of `src/components/collection-hero.tsx` with:

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Collection } from "@/types";
import { PremiumBadge } from "./premium-badge";

interface CollectionHeroProps {
  collection: Collection;
}

const collectionGradients: Record<string, string> = {
  mens: "linear-gradient(145deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)",
  womens: "linear-gradient(145deg, #d4a5a5 0%, #c08080 50%, #9a5e5e 100%)",
  "new-arrivals": "linear-gradient(145deg, #5c6b4f 0%, #8a9a7a 50%, #c5cfbb 100%)",
  "best-sellers": "linear-gradient(145deg, #c4b59a 0%, #a89279 50%, #8a7d6b 100%)",
  sale: "linear-gradient(145deg, #9e4040 0%, #c06060 50%, #d48a8a 100%)",
  "premium-early-access": "linear-gradient(145deg, #1a1a1a 0%, #2b2b2b 50%, #3d3d3d 100%)",
};

export function CollectionHero({ collection }: CollectionHeroProps) {
  const gradient = collectionGradients[collection.slug] || collectionGradients["new-arrivals"];
  const hasImage = collection.heroImage.startsWith("/images/");
  const isPremium = collection.slug === "premium-early-access";

  return (
    <section
      className="relative w-full flex items-center justify-center"
      style={{
        background: gradient,
        minHeight: "220px",
      }}
    >
      {/* Background image — skip for premium early access so the dark gradient dominates */}
      {hasImage && !isPremium && (
        <Image
          src={collection.heroImage}
          alt={collection.name}
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Dark overlay for text readability */}
      <div className={isPremium ? "absolute inset-0 bg-black/30" : "absolute inset-0 bg-black/40"} />

      <div className="relative z-10 text-center px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-3" aria-label="Breadcrumb">
          <ol className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.6px] text-white/70">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-white">{collection.name}</li>
          </ol>
        </nav>

        {isPremium && (
          <>
            <div className="flex justify-center mb-3">
              <PremiumBadge label="Premium Early Access" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.8px] text-white/60 mb-2">
              48h wcześniej niż reszta
            </p>
          </>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-2 text-white">
          {collection.name}
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base max-w-lg mx-auto text-white/70">
          {collection.description}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mega-menu desktop link**

In `src/components/mega-menu.tsx`, find the existing NEW link in `MegaMenuNav` (around line 153):

```tsx
        <Link
          href="/collections/new-arrivals"
          className="text-[12px] font-medium uppercase tracking-[0.5px] text-charcoal hover:opacity-60 transition-opacity"
        >
          NEW
        </Link>
```

Immediately after it (still inside the same `<div className="hidden lg:flex ...">`), add:

```tsx
        <Link
          href="/collections/premium-early-access"
          className="flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.5px] text-charcoal hover:opacity-60 transition-opacity"
        >
          <Crown className="h-3 w-3" /> PREMIUM EARLY ACCESS
        </Link>
```

At the top of the file, add the import:

```tsx
import { Crown } from "lucide-react";
```

- [ ] **Step 3: Mega-menu mobile link**

In the same file, find the mobile NEW link inside `MobileMegaMenuContent` (around line 288):

```tsx
      <Link
        href="/collections/new-arrivals"
        className="block text-nav py-2"
        onClick={onLinkClick}
      >
        NEW
      </Link>
```

Immediately after it, still inside the same parent `<div>`, add:

```tsx
      <Link
        href="/collections/premium-early-access"
        className="flex items-center gap-2 text-nav py-2"
        onClick={onLinkClick}
      >
        <Crown className="h-3.5 w-3.5" /> PREMIUM EARLY ACCESS
      </Link>
```

- [ ] **Step 3: Verify**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run build 2>&1 | tail -30
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/collection-hero.tsx src/components/mega-menu.tsx
git commit -m "$(cat <<'EOF'
feat: dark hero for premium early access collection and nav link

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: Manual end-to-end verification

**Goal:** Exercise the prototype in a browser, confirming every scenario works end-to-end before calling it done.

- [ ] **Step 1: Start the dev server**

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run dev
```

Expected: Next dev server on http://localhost:3000 (or a provided port).

- [ ] **Step 2: Walk through these scenarios in a browser**

For each scenario, note the result. Fix anything broken before moving on.

**A. Guest (not logged in)**
1. Open `/`. Announcement bar reads `Darmowa dostawa od 99 zł · Łatwe zwroty`.
2. Add one product (any) to cart. Cart drawer opens. Sub-99-zł state shows "Dodaj jeszcze ... do darmowej dostawy" and the Premium nudge link.
3. Add enough items to exceed 99 zł. Drawer now shows the "Masz darmową dostawę w tym zamówieniu ✓" state + the "z Premium ... + next-day" nudge.
4. Click the nudge. Navigates to `/premium`.
5. On `/premium`, click the hero CTA. It should send you to `/account/login?redirect=/premium`.

**B. Guest clicks on premium-early-access product**
1. Go to `/collections/premium-early-access`. See three locked product cards + the dark hero + "48h wcześniej..." tagline.
2. Click any locked card. The `PremiumLockModal` opens with three benefits and the "Aktywuj Premium — 59 zł / rok" CTA.
3. Click the CTA. Navigates to `/premium`.

**C. Log in and activate**
1. At `/account/login?redirect=/premium`, enter any email + password. Submit.
2. You are redirected to `/premium`.
3. Click "Aktywuj Premium". The page state flips: hero shows "Twoje Premium jest aktywne do ...", "Anuluj Premium" link visible, bottom CTA section disappears.

**D. Premium user**
1. Header shows the crown pill next to the avatar.
2. Announcement bar reads "Premium: darmowa dostawa bez progu + next-day do 14:00".
3. Add a single cheap item to cart. Drawer shows the green "Premium: darmowa dostawa odblokowana" state.
4. Navigate to a premium-early-access product (click the card in `/collections/premium-early-access`). PDP opens normally, showing the "Early Access" badge above the title and the countdown in the shipping info block.
5. Go to checkout. Shipping row shows ~~19,90 zł~~ **0 zł** + Premium badge. Countdown renders below the row.

**E. Cancel and re-test off-state**
1. Return to `/premium`. Click "Anuluj Premium".
2. Crown in header disappears. Announcement bar returns to "Darmowa dostawa od 99 zł ...".
3. Reload `/collections/premium-early-access` — products are locked again.

**F. Priority countdown correctness**
- Before 14:00 local time, checkout countdown shows "Zamów w ciągu Xh YYmin, dostawa {next business day}" in orange.
- After 14:00, countdown shows "Dostawa {business day after next}" in neutral styling.
  (If the time of day when you test doesn't cooperate, temporarily set your system clock or wait — do not add a debug override to the code.)

- [ ] **Step 3: Production build sanity**

Stop the dev server and run:

```bash
cd /home/coder/AIPH/FashionHero_repo && npm run build 2>&1 | tail -20
```

Expected: build succeeds, no TypeScript errors, `/premium` and `/collections/premium-early-access` appear in the route tree.

- [ ] **Step 4: If everything passes, note it**

No commit for this task (it's verification-only). If any scenario required a code fix, commit the fix with a descriptive message following the repo's commit style.

---

## Appendix: Known Risks

- **`lucide-react` version 1.6.0** is pinned in `package.json`. That version family may expose icons under different names. If `Crown`, `Truck`, `Zap`, `Sparkles`, `Check`, or `X` are missing, substitute any exported icon with a similar silhouette — prefer updating the specific import rather than refactoring.
- **`AuthProvider` must wrap `AnnouncementBar`.** If the top-level layout renders the announcement bar outside the provider, Task 3 will crash with "useAuth must be within AuthProvider". Verify `src/app/layout.tsx` before running Task 3 and move components inside the provider if needed (no structural change beyond re-ordering children is required).
- **Next.js 16 Suspense boundary for `useSearchParams`.** Task 10 wraps the login form in `<Suspense>` because Next 16 requires it for client components that read search params. Don't skip the wrapper.
- **Soft gating only.** Non-premium users can still type `/products/<early-access-slug>` into the URL and reach the PDP. The gate only prevents Add-to-cart. This is by design per the spec — do not add server-side redirects.
- **No automated tests.** The codebase ships no test framework. If you add one later, cover `src/lib/shipping.ts` first — its functions are pure and easy to pin down.
