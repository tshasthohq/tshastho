# Pharmacy Item 22 — Cash Drawer Hardware ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Cash drawer integration via ESC/POS printer kick command + audit trail.
Drawer opens automatically on cash payments; manual button for change/refund.

## Flow

### Auto (cash payment)
1. Staff completes POS sale with paymentMethod === 'CASH'
2. After transaction, cash-drawer log created (fire-and-forget)
3. (Drawer kick bytes already sent via ESC/POS from printer — handled by POS print flow)
4. Log entry: reason=SALE, amount, posSaleId, shiftId, userId

### Manual (button)
1. Staff clicks "Open Drawer" button (CashDrawerButton component)
2. Component:
   - Requests Bluetooth printer
   - Sends `buildCashDrawerKick()` bytes (ESC p 0 25 250)
   - Logs result (success/error) to /api/pharmacy/cash-drawer

## Files

### New
- Prisma model: CashDrawerLog (cash_drawer_logs table)
  - pharmacyId, userId, shiftId, reason, amount, posSaleId
  - notes, deviceName, success, errorMessage, createdAt
- src/lib/pharmacy/cash-drawer.ts
  - logCashDrawer(params)
  - listCashDrawerLogs({ pharmacyId, userId, reason, from, to, limit, offset })
  - getDrawerStats(pharmacyId)
- src/app/api/pharmacy/cash-drawer/route.ts (GET list + stats, POST log)
- src/components/pharmacy/CashDrawerButton.tsx

### Modified
- src/app/api/pharmacy/pos/sale/route.ts — auto-log on CASH payment

### Existing (reused from Item 12)
- src/lib/pharmacy/printer/escpos.ts — openCashDrawer()
- src/lib/pharmacy/printer/receipt-builder.ts — buildCashDrawerKick()
- src/lib/pharmacy/printer/bluetooth.ts — Web Bluetooth connector

## Reason Enum

`MANUAL | SALE | CHANGE | REFUND | OPEN_SHIFT`

## ESC/POS Command

`ESC p 0 25 250` (hex: 1b 70 00 19 fa)
- Pin 2 (default)
- On-time: 25 × 2ms = 50ms
- Off-time: 250 × 2ms = 500ms

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/pharmacy/cash-drawer | OWNER/STAFF | Log drawer open |
| GET | /api/pharmacy/cash-drawer?reason=&from=&to=&userId= | OWNER/STAFF | List logs + stats |

## Business Rules

1. Every drawer open logged for loss-prevention audit
2. Auto log on CASH payments (fire-and-forget, non-blocking)
3. Manual button requires Bluetooth printer connection
4. Stats: todayCount, todayAmount (sum of SALE amounts), openShifts

## Known Limitations

1. Logged after physical open — no pre-authorization check
2. No requirement for manager PIN on high-amount opens (future)
3. No integration with shift reconciliation (future: shift close expects drawer total)
4. Device disconnect not tracked after kick
5. No webhook from printer hardware (kick bytes are fire-and-forget)

## Next: Item 24 — Sentry Monitoring
