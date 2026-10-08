# Pharmacy Item 13 — Return → Auto-Refund ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Flow

1. Customer creates CUSTOMER_RETURN (existing API)
2. Pharmacy staff approves → status APPROVED (existing)
3. Staff processes → `processReturn()` in `src/lib/pharmacy/returns.ts`
   - Restocks returned items
   - Ledger entry for refund amount
   - Supplier credit (if supplier return)
   - **NEW:** fires `processReturnRefund()` async (fire-and-forget)
4. `processReturnRefund()` in `src/lib/pharmacy/refund-service.ts`
   - Loads ReturnOrder
   - Determines method (CASH = manual, others = gateway)
   - Calls `gateway.refund()` on SSLCommerz if applicable
   - Creates Refund record + Payment update + ledger entry
   - Updates ReturnOrder.refundStatus = COMPLETED | FAILED
5. On failure → staff can retry via POST /api/pharmacy/returns/[id]/retry-refund (max 5 attempts)

## Files

### Modified
- `prisma/schema.prisma` — ReturnOrder + 5 refund tracking fields
- `src/lib/payments/gateways/sslcommerz.ts` — added `refund()` method
- `src/lib/pharmacy/returns.ts` — auto-trigger refund-service after processReturn

### New
- `src/lib/pharmacy/refund-service.ts` — unified refund orchestrator
- `src/app/api/pharmacy/returns/[id]/retry-refund/route.ts` — manual retry endpoint
- Migration: `20261007082959_add_return_refund_fields_item_13`

## Refund Tracking Fields (ReturnOrder)

| Field | Type | Purpose |
|---|---|---|
| refundStatus | String (PENDING/PROCESSING/COMPLETED/FAILED) | lifecycle |
| refundTxnId | String? | gateway refund reference |
| refundedAt | DateTime? | completion timestamp |
| refundError | String? | failure reason (400 chars) |
| refundAttempts | Int | retry counter (max 5) |

## API

### POST /api/pharmacy/returns/[id]/retry-refund
Retry a FAILED or PENDING refund.
- Auth: PHARMACY_OWNER, SUPER_ADMIN
- Guards: type must be CUSTOMER_RETURN, status must be PROCESSED, not already COMPLETED, attempts < 5
- Returns: `{ success, ok, refundId, gatewayRefId, method }` or error

## Behavior Notes

- **CASH refunds** → marked COMPLETED with `manualRequired: true` (Refund record created, no gateway call)
- **NO_REFUND method** → skipped entirely (no Refund record)
- **Gateway failure** → ReturnOrder.refundStatus=FAILED + refundError captured, retry available
- **Duplicate refund prevention** → refundStatus check + attempts counter
- All refunds logged to ledger (PLATFORM → CUSTOMER debit/credit)

## Known Limitations

1. SSLCommerz refund uses bank_tran_id — requires payment to have `gatewayTxnId` (real gateway payments only)
2. Sandbox mode returns mock refund IDs when creds missing
3. Max 5 retry attempts (then requires SUPER_ADMIN intervention)
4. No webhook for async refunds — SSLCommerz refund API is synchronous

## Next: Item 14 — Pharmacy Rating/Review
