# Pharmacy Item 38 — Exchange Medicine ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Exchange = customer returns item(s) + receives new item(s) in one flow.
Different from Item 13 (pure return) — has IN + OUT sides.
Difference settled via CASH / WALLET / GATEWAY / REFUND.

## Data Model

### ReturnOrder additions (Item 38)
- ReturnType enum: + EXCHANGE
- exchangeOutItems Json? (array of { medicineId, quantity, unitPrice, subtotal, batchId })
- exchangeOutAmount Decimal
- exchangeDifference Decimal (OUT - IN)
- exchangeDifferenceMethod String (CASH|WALLET|GATEWAY|REFUND)

### Reuses ReturnItem
IN side items stored as standard ReturnItem rows.

## Flow

1. Staff opens /pharmacy/exchanges → + New Exchange
2. Modal captures items IN (returned) + items OUT (given)
3. Live difference shows customer pays / customer refund
4. Select difference method
5. POST /api/pharmacy/exchanges creates ReturnOrder (type=EXCHANGE, status=PENDING)
6. Staff approves → POST .../approve → status=APPROVED
7. Staff processes → POST .../process:
   - Restock IN items (RETURN_IN movement)
   - Deduct OUT items (SALE movement)
   - status=PROCESSED

## Files

### Service — src/lib/pharmacy/exchanges.ts
- createExchange({ itemsIn, itemsOut, differenceMethod, ... })
- processExchange({ exchangeId, userId })
- listExchanges({ pharmacyId, status?, dateRange? })

### API
| Method | Path | Purpose |
|---|---|---|
| GET | /api/pharmacy/exchanges | List |
| POST | /api/pharmacy/exchanges | Create |
| POST | /api/pharmacy/exchanges/[id]/approve | PENDING → APPROVED |
| POST | /api/pharmacy/exchanges/[id]/process | Restock IN + deduct OUT |

### UI
- src/components/pharmacy/ExchangeModal.tsx
- src/app/pharmacy/exchanges/page.tsx

## Difference Settlement

- CASH → handled at counter (manual)
- WALLET → walletRefund / walletSpend (future hook)
- GATEWAY → SSLCommerz refund (future hook)
- REFUND → uses ORIGINAL refund method

Currently CASH assumed; WALLET/GATEWAY/REFUND stored as intent, not auto-executed.

## Known Limitations

1. Difference settlement not auto-executed (stored intent only — manual until next session)
2. No medicine autocomplete in modal (text input for medicineId)
3. No Excel/PDF receipt for exchange
4. No customer notification
5. Batch selection not exposed in modal (uses FIFO)

## Next: Tier 3 Advanced (Items 39-48)
