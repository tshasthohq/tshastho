# Pharmacy Item 25 — UAT (User Acceptance Testing) ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

UAT infrastructure: test data seeder, smoke test runner, and manual QA checklist.

## Files

### New
- prisma/seed-uat.ts
- scripts/smoke-test.ts
- docs/PHARMACY_ITEM_25_UAT.md (this file)

### Modified
- package.json (scripts: seed:uat, smoke)

## Test Data (Fixed IDs)

| Entity | ID | Role |
|---|---|---|
| Owner | uat-owner-001 | PHARMACY_OWNER |
| Staff | uat-staff-001 | PHARMACY_STAFF |
| Patient | uat-patient-001 | PATIENT |
| Pharmacy | uat-pharmacy-001 | linked to owner |

## Commands

```bash
npm run seed:uat
npm run smoke
APP_URL=https://staging.tshastho.com UAT_COOKIE="tshastho_session=..." npm run smoke
```

## Smoke Test Coverage

| Endpoint | Verifies |
|---|---|
| / | Homepage |
| /pharmacy/pos | POS page |
| /api/pharmacy/pos/scan | Barcode lookup |
| /api/pharmacy/cash-drawer | Cash drawer |
| /api/pharmacy/recalls | Drug recalls |
| /api/pharmacy/staff/commissions | Staff commissions |
| /api/pharmacy/prescriptions/retention/stats | Retention stats |
| /api/pharmacy/reviews | Reviews |

Status codes: 2xx/3xx = PASS, 401 = AUTH-REQUIRED, 5xx/ERR = FAIL

## Manual UAT Checklist

### Setup
- [ ] npm run seed:uat succeeds
- [ ] npm run smoke shows >= 5 PASS
- [ ] Login as uat-owner@tshastho.test

### POS Flow
- [ ] Open /pharmacy/pos
- [ ] Scan barcode (hardware or manual) adds to cart
- [ ] Beep plays on scan
- [ ] CASH payment logs drawer entry
- [ ] Print receipt (Bluetooth + Browser)
- [ ] Staff commission entry created
- [ ] SSLCommerz sandbox payment COMPLETED

### Returns & Refunds
- [ ] Create return -> Approve -> Process -> refundStatus updates
- [ ] Retry refund endpoint works if FAILED

### Reviews
- [ ] Delivered order allows review
- [ ] Star + comment saves
- [ ] Owner reply works
- [ ] avgRating recalculates

### Recalls
- [ ] Super admin imports recall
- [ ] Matching runs against stock
- [ ] Banner shows OPEN count
- [ ] Acknowledge -> Resolve workflow

### Retention
- [ ] Stats endpoint returns counts
- [ ] Patient erasure request works
- [ ] Cron purge (x-cron-secret) works

### Mushak 6.3
- [ ] PDF generates from VatInvoice
- [ ] PDF downloads + opens

### Cash Drawer
- [ ] Manual open button (BT printer)
- [ ] Auto-log on cash payment
- [ ] GET history works

### Monitoring
- [ ] Sentry DSN set -> errors appear
- [ ] global-error.tsx renders

### Multi-currency & Voice POS
- [ ] Currency switcher works
- [ ] Bengali voice input captures text

## Bug Report Template

```
Title: [PHARMACY] Short description
Severity: Critical | High | Medium | Low
Environment: Local | Staging | Production
Sector: POS | Returns | Reviews | Recalls | Retention | Printer | Payment
Steps: 1... 2... 3...
Expected: ...
Actual: ...
Screenshot/Log: ...
Sentry event ID: ...
Reproducible: Yes | No | Sometimes
```

## Known Limitations

1. No automated E2E (HTTP-level smoke tests only)
2. No CI integration yet
3. No fixtures teardown (fixed IDs persist)
4. No coverage metrics
5. Cookie-based auth manual paste

## Next: Item 19 — Offline POS
