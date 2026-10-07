# Pharmacy Item 17 — AI Drug Recall Alert ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Match external drug recalls (FDA/WHO/DGDA) against pharmacy stock batches
and surface alerts. Uses generic DrugRecall + RecallMatch models.

## Flow

1. Super admin (or future cron) POSTs recalls to /api/pharmacy/recalls
   (bulk import, source: FDA | WHO | DGDA | MANUAL)
2. upsertRecalls() inserts/updates DrugRecall records (idempotent by externalId)
3. scanAllPharmacies(recallId) fires (fire-and-forget):
   - For each pharmacy: matchRecallToPharmacy()
   - BATCH match: batchNumber in recall.batchNumbers (exact, active batches)
   - NAME fallback: medicine.name contains drugName (only if no BATCH matches)
   - Creates RecallMatch rows (unique on recallId + pharmacyId + batchId)
4. Pharmacy dashboard banner (RecallAlertBanner) shows OPEN count
5. Pharmacy page lists matches with status workflow:
   OPEN → ACKNOWLEDGED → RESOLVED

## Files

### New (Prisma)
- DrugRecall model (drug_recalls)
  - source, drugName, genericName, batchNumbers[], severity, recallDate
  - externalId @unique (idempotency), rawPayload Json, aiExtracted flag
- RecallMatch model (recall_matches)
  - recallId, pharmacyId, batchId, medicineId
  - matchType: BATCH | NAME | MANUAL
  - status: OPEN | ACKNOWLEDGED | RESOLVED
  - unique(recallId, pharmacyId, batchId)
- Migrations: add_drug_recall_item_17

### New (Service)
- src/lib/pharmacy/recall-scanner.ts
  - upsertRecalls(recalls[]) → { scanned, inserted, errors }
  - matchRecallToPharmacy(recallId, pharmacyId) → { matches, errors }
  - scanAllPharmacies(recallId) → { pharmacyCount, totalMatches }
  - listPharmacyRecalls({ pharmacyId, status, limit, offset })
  - updateMatchStatus({ matchId, status, pharmacyId, notes })

### New (API)
- GET  /api/pharmacy/recalls?status=&limit=&offset= — list matches
- POST /api/pharmacy/recalls — SUPER_ADMIN bulk import + auto-scan
- POST /api/pharmacy/recalls/[id]/status — update status

### New (Components)
- RecallAlertBanner — red banner with OPEN count (auto-hides if 0)
- RecallMatchList — filterable list with Acknowledge / Resolve actions

## Matching Logic

| Match Type | Trigger |
|---|---|
| BATCH | recall.batchNumbers intersects pharmacy batch.batchNumber |
| NAME | Fallback: medicine.name contains drugName (case-insensitive, only if 0 BATCH matches) |

## Severity Levels

`LOW | MEDIUM | HIGH | CRITICAL`

## Status Workflow

`OPEN → ACKNOWLEDGED → RESOLVED`

## Known Limitations

1. **No automated external feed** — recalls must be POSTed by SUPER_ADMIN
   (future: cron job fetching FDA/DGDA RSS + AI extraction via OpenAI)
2. **Name fallback is fuzzy** — uses `contains` (not full-text search)
3. **No auto-notification** — integration with email/SMS/WhatsApp exists
   but not wired to recall creation yet (future)
4. **No stock lockdown** — matching is informational, doesn't block sales of
   affected batches (future enhancement)

## Future Roadmap

- GitHub Action cron → fetch DGDA recalls daily
- OpenAI-based recall parsing from unstructured PDFs/RSS
- Auto-SMS to pharmacy owner on CRITICAL match
- POS block on recalled batch sale

## Next: Item 18 — Prescription Retention Policy
