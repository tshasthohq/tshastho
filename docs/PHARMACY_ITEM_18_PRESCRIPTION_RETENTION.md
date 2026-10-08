# Pharmacy Item 18 — Prescription Retention Policy ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

DGDA-compliant prescription retention. Auto-anonymizes prescriptions
after their retention period expires. Supports GDPR-style erasure requests.

## Retention Policies

| Policy | Years | Use Case |
|---|---|---|
| DGDA_5Y | 5 | Default (Bangladesh DGDA) |
| GDPR_2Y | 2 | GDPR/compliance-lite |
| MANUAL | 0 | Explicit override (no auto-purge) |

## Flow

1. Prescription created → retentionUntil set via backfill/setRetention
2. Daily cron (03:00 UTC) calls POST /api/internal/retention/purge
3. runRetentionPurge():
   - Finds prescriptions where retentionUntil <= now
     - anonymizedAt IS NULL
     - legalHold = false
   - Calls anonymizePrescription() per record
4. anonymizePrescription():
   - imageUrl = 'REDACTED'
   - anonymizedAt = now()
   - Preserves audit metadata (dates, ids, status history)
5. Patient-initiated: POST /api/pharmacy/prescriptions/[id]/erasure
   - Verifies ownership, checks legal hold, anonymizes immediately

## Files

### Modified
- prisma/schema.prisma — Prescription + 6 retention fields
  - retentionUntil, anonymizedAt, archivedAt, purgeAfter
  - retentionPolicy (DGDA_5Y | GDPR_2Y | MANUAL)
  - legalHold (boolean)

### New
- src/lib/pharmacy/retention-policy.ts
  - computeRetentionUntil(base, policy)
  - anonymizePrescription(id)
  - runRetentionPurge({ pharmacyId?, limit? })
  - setRetention(id, policy)
  - requestErasure({ prescriptionId, patientId })
  - getRetentionStats(pharmacyId?)
  - backfillRetention(policy)
- src/app/api/pharmacy/prescriptions/retention/stats/route.ts (GET)
- src/app/api/pharmacy/prescriptions/[id]/erasure/route.ts (POST)
- src/app/api/internal/retention/purge/route.ts (POST, x-cron-secret)
- .github/workflows/retention-purge.yml (daily 03:00 UTC)

## APIs

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/pharmacy/prescriptions/retention/stats | OWNER/ADMIN | Stats |
| POST | /api/pharmacy/prescriptions/[id]/erasure | PATIENT | GDPR erasure |
| POST | /api/internal/retention/purge | x-cron-secret | Cron purge |

## Environment Variables Required

- `CRON_SECRET` — shared secret for cron endpoint
- `APP_URL` — deployed URL (GitHub Action secret)

## Data Model (Prescription additions)

| Field | Type | Notes |
|---|---|---|
| retentionUntil | DateTime? | Auto-purge trigger time |
| anonymizedAt | DateTime? | Set when purged |
| archivedAt | DateTime? | Reserved for future archive tier |
| purgeAfter | DateTime? | Reserved for hard-delete tier |
| retentionPolicy | String | DGDA_5Y (default) / GDPR_2Y / MANUAL |
| legalHold | Boolean | Blocks purge |

## Anonymization Scope

Preserved:
- id, patientId, doctorId, createdAt, retentionPolicy, retentionUntil

Redacted:
- imageUrl → 'REDACTED'
- All clinical fields (notes, diagnosis, etc. — cleared)

## Business Rules

1. legalHold=true blocks both auto-purge and erasure request
2. Anonymization is idempotent (safe to re-run)
3. Purge runs in batches of 500 (limit param)
4. Erasure request requires patient ownership
5. Audit trail (dates, IDs) preserved for DGDA compliance
6. GDPR_2Y doesn't override legalHold

## Known Limitations

1. No archive tier — anonymized records kept indefinitely (schedule hard-delete later)
2. Purge doesn't delete image storage — only DB imageUrl redaction
   (future: S3/R2 object deletion)
3. No patient-facing retention policy display
4. No per-prescription custom retention (policy is enum-based only)
5. Cron requires APP_URL + CRON_SECRET configured in GitHub secrets

## Next: Item 19-27 — Production Blockers (Offline POS, Multiple terminals, etc.)
