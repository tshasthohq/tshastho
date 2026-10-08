# Pharmacy Item 15 — Staff Commission Auto-calc ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

POS-sale-based commission system. Staff who complete a POS sale
earn commission = sale.profit × staff.commissionPercent.

Uses the generic Commission model with `partnerType='STAFF'`.

## Flow

1. Staff completes POS sale via POST /api/pharmacy/pos/sale
   - tx.posSale.create with staffId = current user
2. After transaction commits, auto-trigger fires
   - calcStaffCommission(sale.id) — fire-and-forget
3. calcStaffCommission:
   - Loads PosSale (skips if returned / no staff)
   - Idempotent via Commission.orderId = posSaleId (unique)
   - Rate = User.commissionPercent
   - Base = sale.profit (fallback: totalAmount if profit ≤ 0)
   - Creates Commission record (status PENDING, partnerType=STAFF)
4. Owner marks PENDING → PAID via POST /staff/commissions/payout
   - Bulk update by staffId
   - Metadata stores paidAt, paidBy, method, note

## Files

### New
- src/lib/pharmacy/staff-commission.ts
  - calcStaffCommission(posSaleId)
  - listStaffCommissions({ pharmacyId, staffId, status, from, to, limit, offset })
  - payoutStaffCommissions({ pharmacyId, staffId, method, note, byUserId })
- src/app/api/pharmacy/staff/commissions/route.ts (GET)
- src/app/api/pharmacy/staff/commissions/payout/route.ts (POST)
- src/components/pharmacy/CommissionBadge.tsx
- src/components/pharmacy/StaffCommissionList.tsx

### Modified
- src/app/api/pharmacy/pos/sale/route.ts — auto-trigger after tx

## Data Model (existing)

Reused `Commission` model:
- orderId → stores posSaleId (unique → idempotency)
- partnerId → staff userId
- partnerType → 'STAFF'
- orderAmount → base (profit or total)
- commissionRate → percent (from User)
- commissionAmount → final amount
- partnerShare → same as commissionAmount
- status → PENDING | PAID
- metadata → { pharmacyId, saleNumber, source, base }

Reused `User.commissionPercent` (default 0).

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/pharmacy/staff/commissions?staffId=&status=&from=&to= | OWNER/STAFF/ADMIN | List |
| POST | /api/pharmacy/staff/commissions/payout | OWNER/ADMIN | Mark PENDING → PAID |

### Permissions
- STAFF: sees only their own commissions
- OWNER: all staff in their pharmacy
- ADMIN: cross-pharmacy

## Components

- CommissionBadge — PENDING (yellow), PAID (green), etc.
- StaffCommissionList — 3 summary cards + filter + table + payout button

## Business Rules

1. One commission per POS sale (unique via Commission.orderId)
2. Zero commissionPercent → skip (no record)
3. Returned sale → skip
4. No staff on sale → skip
5. Base uses profit when profit > 0, else totalAmount
6. Payout marks all PENDING → PAID in one go for a staff
7. Fire-and-forget: sale create never fails due to commission error

## Known Limitations

1. Commission only recalculated on sale create — changing commissionPercent later does not retroactively update
2. No commission reversal on sale return (future item)
3. Payout has no reverse/cancel operation yet
4. No monthly report aggregator (can add via listStaffCommissions with from/to)

## Next: Item 16 — Mushak 6.3 Export
