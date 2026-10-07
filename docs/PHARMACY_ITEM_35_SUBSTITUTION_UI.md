# Pharmacy Item 35 — Medicine Substitution UI ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Enhancement to Item 8 substitution system. Auto-popup on stock shortage,
substitutes ranked by in-stock + savings, BEST value badge.

## What was already there (Item 8)

- src/lib/pharmacy/substitutes.ts (service)
- /api/pharmacy/medicines/[id]/substitutes-v2 (API)
- src/components/pharmacy/SubstituteModal.tsx (modal)
- POS integration (showSubstitutes state + onSelect handler)

## What Item 35 added

### 1. Auto-popup on stock shortage
File: src/app/pharmacy/pos/page.tsx

Before: `if (existing.quantity >= med.stock) return;` (silent fail)
After: opens SubstituteModal automatically when adding would exceed stock.

```ts
if (existing.quantity >= med.stock) {
  setShowSubstitutes({ id: med.id, name: med.name });
  return;
}
```

### 2. Ranking by in-stock + savings
File: src/components/pharmacy/SubstituteModal.tsx

After fetch, substitutes sorted:
1. In-stock first (stock > 0)
2. Then by savings (descending)

```ts
const ranked = (d.substitutes || []).slice().sort((a, b) => {
  const aStock = a.stock > 0 ? 1 : 0;
  const bStock = b.stock > 0 ? 1 : 0;
  if (aStock !== bStock) return bStock - aStock;
  return Number(b.savings ?? 0) - Number(a.savings ?? 0);
});
setSubs(ranked);
```

### 3. BEST badge
File: src/components/pharmacy/SubstituteModal.tsx

Top-ranked in-stock substitute gets green 'BEST' badge (absolute positioned).

```tsx
{idx === 0 && s.stock > 0 && (
  <span className="absolute -top-1 -right-1 rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">BEST</span>
)}
```

## Existing modal features (from Item 8)

- Savings display with ↑/↓ icon
- Stock count with color (red if 0, green if >0)
- matchType badge: CURATED (green) / GENERIC (blue) / CATEGORY (slate)
- Reason note
- 'Tap to add' hint
- Disabled state when out of stock

## Flow

1. Staff adds item to cart
2. If stock would be exceeded → SubstituteModal opens automatically
3. Modal fetches /substitutes-v2, ranks by stock + savings
4. Top in-stock option shows BEST badge
5. Staff picks substitute → onSelect → handleSubstituteSelect → addToCart
6. Modal closes

## Files Modified

- src/app/pharmacy/pos/page.tsx — auto-popup on stock shortage
- src/components/pharmacy/SubstituteModal.tsx — ranking + BEST badge

## Known Limitations

1. Auto-popup only fires on cart add — not on cart quantity increase (future)
2. BEST badge position depends on button having 'relative' class
3. No log/audit of substitution decisions (future: audit trail)
4. Ranking is stock-first, savings-second (not weighted composite)
5. No customer-facing approval flow (staff decides)

## Next: Item 36 — Customer Wallet / Prepaid
