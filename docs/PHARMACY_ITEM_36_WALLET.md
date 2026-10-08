# Pharmacy Item 36 — Platform-Wide Wallet ✅

**Status:** Core complete (2026-10-07)
**Branch:** phase-0-security

## Overview

One wallet per User. Cross-vertical (Pharmacy, Doctor, Diagnostic, Delivery, Hospital, International).
Handles both customer payments and provider earnings.

## Design Principles

- 1 User = 1 Wallet (global, cross-vertical)
- No negative balance (enforced atomically)
- Full double-entry audit (WalletTransaction)
- Idempotent via idempotencyKey
- Freeze/unfreeze by admin
- No expiry, no withdrawal (regulatory-safe)

## Data Model

### WalletAccount (wallet_accounts)
- id, userId @unique
- balance, holdBalance, availableBalance (Decimal)
- totalTopUp, totalSpent, totalEarnings, totalRefunds (lifetime)
- primaryVertical, currency (default BDT)
- isActive, isFrozen, frozenReason
- kycVerified, kycLevel (BASIC)

### WalletTransaction (wallet_transactions)
- walletId, type, direction (CREDIT/DEBIT)
- amount, balanceBefore, balanceAfter
- vertical (PHARMACY|DOCTOR|...), contextId
- referenceType, referenceId, referenceNumber
- idempotencyKey @unique
- description, notes, metadata, createdBy, createdByRole
- status, reversedByTxId

### PosCustomer
- Added optional userId link (walk-in → registered User)

## Txn Types

| Type | Direction | Use |
|---|---|---|
| TOPUP | CREDIT | Customer adds money |
| SPEND | DEBIT | Customer pays |
| EARN | CREDIT | Provider earns |
| REFUND | CREDIT | Refund to wallet |
| ADJUST | CREDIT | Admin correction |
| HOLD/RELEASE | — | Reserved (future) |
| WITHDRAW | — | Not implemented (regulatory) |

## Files

### Service (src/lib/wallet/)
- constants.ts — VERTICALS, TXN_TYPES, CREDIT_TYPES
- core.ts — getOrCreateWallet, freeze/unfreeze
- transactions.ts — applyWalletTxn (atomic), listWalletTransactions
- flows.ts — walletTopUp, walletSpend, walletRefund, walletEarn, walletAdjust
- index.ts — barrel

### API
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/wallet/me | Any user | Own balance + stats |
| GET | /api/wallet/me/transactions | Any user | Own history |
| GET | /api/pharmacy/wallet/[userId] | Pharmacy staff | Customer view |
| POST | /api/pharmacy/wallet/[userId]/topup | Pharmacy staff | Cash top-up |
| POST | /api/wallet/internal/spend | Service-role | Spend trigger |
| POST | /api/wallet/internal/earn | SUPER_ADMIN | Earnings |

### UI
- src/components/wallet/WalletBadge.tsx — header balance chip
- src/components/wallet/WalletPayButton.tsx — POS-compatible pay button
- src/app/wallet/page.tsx — customer dashboard (/wallet)
- src/app/pharmacy/wallet/page.tsx — staff lookup + top-up tool

## Atomicity Guarantees

```ts
// All balance changes go through this in a single DB transaction:
1. Read wallet (balance, isActive, isFrozen)
2. Compute delta (CREDIT + / DEBIT -)
3. Check balanceAfter >= 0
4. UPDATE wallet_accounts WHERE balance >= amount (DEBIT)
5. INSERT wallet_transactions
```

If `UPDATE` affects 0 rows → concurrent modification detected → rollback.

## Idempotency

Every txn can pass `idempotencyKey`. If key already exists:
- Return existing txn ID + balanceAfter (no double-credit)

Usage: POS order idempotency (Item 19 offline replay), refund retry, etc.

## Integration Status

| Integration | Status |
|---|---|
| Service + API | ✅ Complete |
| Customer /wallet UI | ✅ Complete |
| Staff /pharmacy/wallet tool | ✅ Complete |
| WalletBadge (header) | ✅ Ready — wire into layout |
| WalletPayButton | ✅ Ready — wire into POS payment flow |
| POS split-payment + wallet | ⏳ Next session |
| Refund-to-wallet (Item 13) | ⏳ Next session |
| Doctor/Diagnostic earnings API | ⏳ Stub ready — vertical fills later |

## Regulatory Notes

Safe zone (no BB license needed):
- Internal pharmacy credit (goods-only)
- Provider earnings payout (doctor/rider)
- No cash withdrawal
- No P2P transfer
- No interest

Future if withdrawal added: Bangladesh Bank PSD license required.

## Known Limitations

1. POS integration stubbed (button exists, not yet in payment modal)
2. Refund-to-wallet not wired into Item 13 auto-refund flow
3. No expiry / no withdrawal (by design)
4. KYC capture UI not built (field exists)
5. Cross-currency not supported (single BDT)
6. Ledger double-entry not auto-created (WalletTransaction IS the audit)
7. No email/SMS notification on top-up/freeze

## Next: Wire POS + Refund integration

Two small follow-ups:
1. Add Wallet option to POS payment method selector
2. Auto-credit wallet on refund (Item 13) if original payment was wallet

## Next Item: 37 — Sample Medicine Tracker

---

## B1-B3: POS + Refund Wiring (session 2)

### POS Integration
- Payment selector: WALLET option added
- Server (POS sale route): pre-check + post-debit via walletSpend()
- Insufficient balance → 400 with available/required
- Frozen wallet → 400
- Idempotency key: pos-{saleId}

### Refund Integration (Item 13)
- refund-service.ts branch for refundMethod=WALLET
- Resolves customer from original order (patientId)
- walletRefund() with idempotencyKey refund-{returnId}
- Prisma enum RefundMethod + zod extended with WALLET
- Refund + ledger + ReturnOrder.refundStatus=COMPLETED

### Files Modified
- prisma/schema.prisma — RefundMethod enum
- src/app/pharmacy/pos/page.tsx
- src/app/api/pharmacy/pos/sale/route.ts
- src/lib/pharmacy/refund-service.ts
- src/app/api/pharmacy/returns/route.ts

### End-to-End Flows
1. Wallet pay at POS → balance debited
2. Wallet refund on return → balance credited
3. Idempotent retry-safe

## Status: Item 36 FULLY COMPLETE
