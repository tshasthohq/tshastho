# Pharmacy Item 23 — Live SSLCommerz ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Production hardening for SSLCommerz payment gateway:
- Env template updated
- Fetch retry + timeout
- IPN webhook for server-to-server reliability
- Idempotent payment confirmation

## Files

### New
- src/lib/payments/fetch-with-retry.ts
  - fetchWithRetry(url, init, opts)
  - Retries on 5xx/429 with exponential backoff
  - Timeout via AbortController (default 15s)
- src/app/api/payments/sslcommerz/ipn/route.ts (POST)
  - Idempotent server-to-server webhook
  - Verifies val_id via gateway
  - Ledger entry on success

### Modified
- src/lib/payments/gateways/sslcommerz.ts
  - All `await fetch()` → `await fetchWithRetry()`
  - Retry on transient gateway failures
- .env.example — SSLCommerz env template

## Environment Variables

| Var | Purpose |
|---|---|
| SSLCOMMERZ_SANDBOX | true (default) / false (production) |
| SSLCOMMERZ_STORE_ID | Merchant store ID |
| SSLCOMMERZ_STORE_PASS | Merchant password |
| SSLCOMMERZ_IPN_SECRET | Shared IPN secret (optional) |
| NEXT_PUBLIC_APP_URL | Public URL for callbacks |

## IPN Webhook

**Endpoint:** `POST /api/payments/sslcommerz/ipn`

SSLCommerz sends form-urlencoded fields:
- `status`: VALID / FAILED / CANCELLED
- `tran_id`: our paymentId
- `val_id`: validation ID (only on VALID)
- `bank_tran_id`: bank reference
- `amount`, `currency`, `card_type`, etc.

**Behavior:**
1. Look up Payment by id OR gatewayTxnId
2. Idempotency: skip if already COMPLETED / REFUNDED
3. On VALID: call gateway.verify(val_id) → update Payment + ledger
4. On FAILED/CANCELLED: mark Payment accordingly
5. Always return 200 with `{"status":"OK"}` (SSLCommerz expects ack)

## Retry Strategy

- Retries: 3 (default)
- Backoff: exponential (500ms, 1s, 2s)
- Retry on: 5xx, 429, network errors, timeouts
- Timeout: 15s per attempt

## Go-Live Checklist

### Before going live:
- [ ] SSLCommerz production account approved (KYC done)
- [ ] Production Store ID + Password obtained
- [ ] Set `SSLCOMMERZ_SANDBOX=false` in production env
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain (https)
- [ ] Whitelist production IP in SSLCommerz merchant panel
- [ ] Configure IPN URL in merchant panel:
      `https://<domain>/api/payments/sslcommerz/ipn`
- [ ] Test with real small-amount transaction
- [ ] Verify IPN received (check `Payment.gatewayPayload`)
- [ ] Test refund flow end-to-end
- [ ] Set up Sentry alerts on `[SSLCOMMERZ_IPN]` errors

### Callbacks already configured (existing):
- `/api/payments/sslcommerz/success`
- `/api/payments/sslcommerz/fail`
- `/api/payments/sslcommerz/cancel`

## Known Limitations

1. **IPN signature verification not enforced** — SSLCommerz IPN includes
   `verify_sign` + `verify_key` but we rely on server-side validator API call
   (safer, SSLCommerz-recommended approach)
2. **No automatic reconciliation job** — future: cron to fetch pending
   Payment records older than 30 min and re-verify via SSLCommerz
3. **Callback routes not refactored** — old callbacks still handle HTTP
   redirect flows; IPN is now the primary confirmation path
4. **No idempotency key from SSLCommerz** — we use `tran_id` uniqueness

## Next: Item 25 — UAT
