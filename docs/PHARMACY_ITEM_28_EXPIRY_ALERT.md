# Pharmacy Item 28 — Expiry Alert 90 Days Advance ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Tier-based expiry alert system. Daily cron scans active batches
expiring within 90 days → creates tiered alerts (T30/T60/T90).

## Tier Model

| Tier | Window | Urgency |
|---|---|---|
| T30 | 0-30 days | Red — immediate action |
| T60 | 31-60 days | Orange — plan write-off |
| T90 | 61-90 days | Yellow — early warning |

## Flow

1. Cron (07:00 UTC daily) POSTs /api/internal/expiry/scan (x-cron-secret)
2. scanExpiringBatches():
   - Loads active batches with expiryDate <= now+90d and quantity > 0
   - Computes daysRemaining → tier
   - Upsert ExpiryAlert (idempotent via unique(batchId, tier))
   - Refreshes daysRemaining for existing OPEN alerts
3. Pharmacy dashboard banner shows counts (30/60/90)
4. Owner/staff can Acknowledge or Write-off alerts

## Files

### New (Prisma)
- ExpiryAlert model (expiry_alerts table)
  - pharmacyId, batchId, medicineId
  - expiryDate, daysRemaining, tier (T30/T60/T90), quantity
  - status (OPEN/ACKNOWLEDGED/WRITTEN_OFF/DISMISSED)
  - notifiedAt, notifiedVia, acknowledgedAt, acknowledgedBy, notes
  - unique(batchId, tier), indexes for status + daysRemaining

### New (Service)
- src/lib/pharmacy/expiry-scanner.ts
  - scanExpiringBatches({ pharmacyId?, notify? })
  - listExpiryAlerts({ pharmacyId, status, tier, limit, offset })
  - updateAlertStatus({ alertId, pharmacyId, status, userId, notes })
  - markNotified(alertIds, via)

### New (API)
- GET  /api/pharmacy/expiry-alerts?status=&tier=
- POST /api/pharmacy/expiry-alerts (manual scan trigger)
- POST /api/pharmacy/expiry-alerts/[id]/status (ACK/DISMISS/WRITE_OFF)
- POST /api/internal/expiry/scan (cron, x-cron-secret)

### New (UI)
- src/components/pharmacy/ExpiryAlertBanner.tsx
  - Red/orange/yellow color by highest-priority tier
  - Auto-hides when zero alerts
- src/components/pharmacy/ExpiryAlertList.tsx
  - 3 summary cards (T30/T60/T90 counts)
  - Filter by tier + status
  - Row actions: Ack / Write-off

### New (Cron)
- .github/workflows/expiry-scan.yml (daily 07:00 UTC)

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/pharmacy/expiry-alerts | OWNER/STAFF | List alerts + summary |
| POST | /api/pharmacy/expiry-alerts | OWNER/ADMIN | Manual scan |
| POST | /api/pharmacy/expiry-alerts/[id]/status | OWNER/STAFF | Update status |
| POST | /api/internal/expiry/scan | x-cron-secret | Daily cron |

## Status Workflow

`OPEN → ACKNOWLEDGED → WRITTEN_OFF`
`OPEN → DISMISSED`

## Environment Variables

- `CRON_SECRET` — for /api/internal/expiry/scan
- `APP_URL` — GitHub Action secret

## Known Limitations

1. Notifications (email/SMS/WhatsApp) not wired yet — markNotified() ready
2. No auto-write-off (manual via UI only)
3. No POS block on selling expiring batches
4. No notification throttle (would spam if many alerts)
5. No tier downgrade logic (T90 → T60 → T30 auto-promotes via new alert rows; old rows stay)
6. Batch quantity reflects snapshot at alert creation

## Integration Points (for later wiring)

- Email: src/lib/email (Resend)
- SMS: src/lib/sms (SSL Wireless)
- WhatsApp: src/lib/whatsapp (Twilio)
- markNotified(alertIds, 'EMAIL,SMS') updates DB log

## Next: Item 29 — Doctor-wise Sales Report
