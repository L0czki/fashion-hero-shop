# FashionHero Premium — Prototype Design Spec

**Date:** 2026-04-23
**Author:** brainstormed with user
**Status:** Approved by user (section-by-section), pending written-spec review
**Scope:** Prototype for client pitch. No real payments, no backend. Mock auth + localStorage only.

## 1. Goal

Introduce a paid "Premium" tier as a presentable prototype. A logged-in user can click "Activate Premium" and the tier activates immediately (no payment flow). Premium unlocks free shipping regardless of cart value, priority next-day delivery, and early access to exclusive products.

## 2. Product decisions

| Decision | Value |
| --- | --- |
| Plan name | FashionHero Premium |
| Price (display only) | **59 zł / year** |
| Benefit 1 | Free shipping, always (no minimum) |
| Benefit 2 | Priority next-day delivery if ordered before 14:00 local time |
| Benefit 3 | Early access to exclusive products |
| Non-premium free-shipping threshold | **99 zł** (changed from current 299 zł) |
| Standard shipping cost (non-premium, below threshold) | 19.90 zł (unchanged) |
| Activation | Single click → premium instantly active for 365 days |
| Cancellation | Available in account and on /premium page (so demo can toggle states) |
| Gating | Only logged-in users can activate; guest CTA → `/account/login?redirect=/premium` |

## 3. Data model and shared state

### 3.1 `User` in `src/components/auth-provider.tsx`

Extend the existing user shape:

```ts
interface User {
  email: string;
  firstName: string;
  lastName: string;
  premium?: {
    activatedAt: string;  // ISO date
    expiresAt: string;    // ISO date, activatedAt + 365 days
  };
}
```

### 3.2 New methods on `AuthContext`

- `activatePremium()` — sets `user.premium` with `activatedAt = now`, `expiresAt = now + 365 days`; persists to localStorage; triggers a success toast.
- `cancelPremium()` — clears `user.premium`; persists; toast.
- `isPremiumActive` — computed boolean: `!!user?.premium && new Date(user.premium.expiresAt) > new Date()`.

### 3.3 New module `src/lib/shipping.ts`

Single source of truth for shipping logic:

```ts
export const FREE_SHIPPING_THRESHOLD = 99;
export const SHIPPING_COST = 19.9;

export function getShippingCost(subtotal: number, isPremium: boolean): number {
  if (isPremium) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export interface DeliveryInfo {
  cutoffPassed: boolean;
  deliveryDate: Date;
  msUntilCutoff: number;
}

export function getNextDeliveryDate(now: Date): DeliveryInfo;
// Cutoff = today 14:00 local time.
// If before cutoff: deliveryDate = next business day (skip Sat/Sun).
// If after cutoff: deliveryDate = business day after next; cutoffPassed = true.
```

Every place currently hardcoding `299` or `19.9` is migrated to this module and reads `isPremium` from `useAuth()`:

- `src/components/announcement-bar.tsx`
- `src/components/cart-drawer.tsx`
- `src/components/product-info.tsx`
- `src/app/checkout/page.tsx`

## 4. `/premium` landing page

**Files:**
- `src/app/premium/page.tsx` — thin page that composes section components
- `src/components/sections/premium-hero.tsx`
- `src/components/sections/premium-benefits.tsx`
- `src/components/sections/premium-how-it-works.tsx`
- `src/components/sections/premium-comparison.tsx`
- `src/components/sections/premium-cta.tsx`
- `src/hooks/use-activate-premium.ts`

### 4.1 Page structure (top-to-bottom)

1. **Hero** — dark background for "premium feel" contrast. Title "FashionHero Premium". Subtagline "Darmowa dostawa. Next-day. Early access.". Price "59 zł / rok" with "Jeden klik, zero zobowiązań". Primary CTA "Aktywuj Premium". Secondary "Dowiedz się więcej" (scroll to benefits).
2. **Benefits grid** — three cards with Lucide icons (`Truck`, `Zap`, `Sparkles`) and 2-sentence descriptions for the three benefits.
3. **How it works** — numbered three-step strip: Aktywuj → Kup cokolwiek → Odbierz jutro.
4. **Comparison table** — four rows (free shipping, next-day, early access, price) with Standard vs Premium columns.
5. **Bottom CTA** — repeats primary CTA; small disclaimer "Prototyp — płatności nieaktywne".

### 4.2 Dynamic state rules

| User state | Hero CTA | Additional UI |
| --- | --- | --- |
| Guest | "Zaloguj się, by aktywować" → `/account/login?redirect=/premium` | — |
| Logged-in, not premium | "Aktywuj Premium" → calls `activatePremium()` | — |
| Logged-in, premium | Hero CTA replaced with active-state banner: "Twoje Premium jest aktywne do {expiresAt}" + "Anuluj Premium" link | Banner is state-driven; after cancel, Activate CTA returns without a refresh |

### 4.3 `useActivatePremium()` hook

Encapsulates the CTA logic once, used by hero and bottom CTA:

```ts
function useActivatePremium() {
  const { user, activatePremium, isPremiumActive } = useAuth();
  const router = useRouter();
  return () => {
    if (!user) router.push("/account/login?redirect=/premium");
    else if (!isPremiumActive) activatePremium();
  };
}
```

## 5. Cart drawer, checkout, and priority-delivery countdown

### 5.1 Cart drawer (`src/components/cart-drawer.tsx`)

Three distinct states replace the current single progress bar:

| State | UI |
| --- | --- |
| Premium | Green check + "Premium: darmowa dostawa odblokowana". Sub-line: "Dostawa next-day przy zamówieniu do 14:00". No progress bar. |
| Non-premium, subtotal < 99 zł | Progress bar toward 99 zł (existing pattern, new threshold) + "Dodaj jeszcze X zł do darmowej dostawy" + subtle nudge "Albo kup Premium za 59 zł/rok → zawsze 0 zł dostawy" (link to `/premium`) |
| Non-premium, subtotal >= 99 zł | "Masz darmową dostawę w tym zamówieniu ✓" + nudge "Z Premium masz ją zawsze + next-day. Sprawdź →" |

### 5.2 Checkout (`src/app/checkout/page.tsx`)

- Replace `const shipping = subtotal >= 299 ? 0 : 19.9;` with `getShippingCost(subtotal, isPremiumActive)`.
- Order summary `Shipping` row:
  - Premium: strikethrough 19.90 zł and **0 zł** with "Premium" badge beside it.
  - Non-premium, <99 zł: show 19.90 zł + one-line upsell "Premium = 0 zł dostawy + next-day za 59 zł/rok" linking to `/premium`.
  - Non-premium, >=99 zł: show 0 zł (current behavior).

### 5.3 Priority-delivery countdown — `PriorityDeliveryCountdown`

New client component, shown for premium users in checkout (inside the Shipping section) and on PDP (`product-info.tsx`).

- Reads a clock via `new Date()` on mount, recalculates every 60s via `setInterval`.
- Uses `getNextDeliveryDate(now)` from `src/lib/shipping.ts`.
- Before 14:00: "Zamów w ciągu {hh}h {mm}min, dostawa **{weekday, data}**". Orange accent (urgency).
- After 14:00: "Dostawa **{next business day after tomorrow}**". Neutral styling. Countdown hidden.
- Renders nothing (null) for non-premium users.

### 5.4 Non-premium fallback on PDP/checkout

Where premium users see the countdown, non-premium users see: "Dostawa 2–4 dni robocze" + subtle link "Next-day z Premium →" pointing to `/premium`.

## 6. Early access to exclusive products

### 6.1 Data

Extend `Product` in `src/data/products.ts`:

```ts
interface Product {
  // ...existing fields
  premiumEarlyAccess?: boolean;
}
```

Tag **3 products** with `premiumEarlyAccess: true`, chosen for visual variety (e.g., 1 sneaker + 1 apparel + 1 accessory).

### 6.2 Collection page

Slug `premium-early-access` handled inside the existing `src/app/collections/[slug]/page.tsx`. Reuses `CollectionView`/`CollectionHero`/`FilterSidebar`.

- Hero uses the same dark palette as `/premium` for visual consistency with a "Premium Early Access" badge above the title and the tagline "48h wcześniej niż reszta".
- Grid shows the three tagged products.

### 6.3 State-dependent behavior

| User state | Card behavior | PDP behavior |
| --- | --- | --- |
| Premium | Normal click → PDP. "Premium Early Access" badge in card corner and on PDP. "Add to cart" works normally. | Normal PDP. Badge near title. |
| Not premium (guest or logged-in) | Card renders with `PremiumLockOverlay` (semi-transparent gradient + `Lock` icon + "Tylko dla Premium"). Click opens `PremiumLockModal` instead of navigating. | Direct URL access still renders the PDP (soft-gating). "Add to cart" opens `PremiumLockModal`. |

Server-side routing is not blocked — soft-gating on the client is sufficient and simpler for a prototype.

### 6.4 New components

- `PremiumLockOverlay` — used on `ProductCard` when `product.premiumEarlyAccess && !isPremiumActive`.
- `PremiumLockModal` — reusable recap of the three benefits + CTA "Aktywuj Premium (59 zł/rok)" linking to `/premium`.
- `PremiumBadge` — small crown-icon pill, reused on card, PDP, and header.

### 6.5 Navigation

In `src/components/mega-menu.tsx`, add a "Premium Early Access" link with a small `Crown` icon. Always visible (including to non-premium users) to drive conversion.

## 7. Header premium badge

When `isPremiumActive`, show a small `Crown` icon next to the account avatar in `src/components/header.tsx`. Tooltip on hover: "Premium aktywne do {expiresAt}". Non-premium users see nothing — no icon, no placeholder.

## 8. Out of scope

- Real payments, Stripe, or any checkout integration for the premium plan itself.
- Server-side gating of premium routes or products (we soft-gate on the client).
- Email receipts, invoices, account history for premium purchases.
- Cancellation grace period, proration, or refund logic.
- Multi-tier plans, family plans, gift subscriptions.
- A/B testing different price points or copy variants.

## 9. Implementation order (suggested for planning phase)

1. `src/lib/shipping.ts` (pure module; no UI) + unit-testable `getNextDeliveryDate`.
2. Extend `auth-provider.tsx` with `premium`, `activatePremium`, `cancelPremium`, `isPremiumActive`.
3. Migrate 4 shipping touch-points to `getShippingCost` + `useAuth` (announcement-bar, cart-drawer, product-info, checkout).
4. Build `/premium` landing page and its sections.
5. `PriorityDeliveryCountdown` component + integration on PDP and checkout.
6. `premiumEarlyAccess` flag on 3 products + collection slug handling + lock overlay + lock modal + badge.
7. Header crown icon + mega-menu link.
8. Manual walk-through: guest → login → activate → add to cart → checkout → cancel → see off-state.
