# Pharmacy Item 37 — Sample Medicine Tracker ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Track free sample medicines from pharma reps → distributions to doctors.
Fully isolated from saleable stock (separate models, no POS risk).

## Data Model

### SampleBatch (sample_batches)
- pharmacyId, medicineId (both FK)
- batchNumber, expiryDate, quantity, remaining
- supplierId, repName, repPhone
- receivedBy, receivedAt, isActive

### SampleDistribution (sample_distributions)
- pharmacyId, sampleBatchId (FK)
- doctorId (optional link), doctorName, doctorPhone, doctorClinic
- quantity, givenBy, givenAt
- feedback, feedbackAt, notes

## Files

### Service — src/lib/pharmacy/samples.ts
- receiveSampleBatch(params)
- listSampleBatches({ pharmacyId, medicineId?, expiringInDays? })
- distributeSample(params) — atomic decrement with race-safe check
- listDistributions({ doctorId?, dateRange? })
- addDistributionFeedback({ distributionId, feedback })
- getSampleStats(pharmacyId)

### API
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/pharmacy/samples | STAFF/OWNER | List batches |
| POST | /api/pharmacy/samples | STAFF/OWNER | Receive new batch |
| GET | /api/pharmacy/samples/stats | STAFF/OWNER | Summary stats |
| POST | /api/pharmacy/samples/distribute | STAFF/OWNER | Give to doctor |
| GET | /api/pharmacy/samples/distributions | STAFF/OWNER | History |
| POST | /api/pharmacy/samples/distributions/[id]/feedback | STAFF/OWNER | Add feedback |

### UI
- src/components/pharmacy/ReceiveSampleModal.tsx
- src/components/pharmacy/DistributeSampleModal.tsx
- src/app/pharmacy/samples/page.tsx (dashboard, 2 tabs: Inventory + Distributions)

## Race Safety

`distributeSample()` uses atomic `updateMany` with `remaining >= quantity` check —
no negative remaining, no lost distributions under concurrency.

Auto-deactivates batch when remaining hits 0.

## Business Flow

1. Pharma rep visits → staff opens 'Receive Sample' → enters medicine, qty, rep info
2. Sample batch added with `remaining = quantity`
3. Doctor visits → staff clicks 'Distribute' → enters doctor + qty
4. Atomic decrement, distribution record created
5. Optional: feedback captured later
6. Stats: active batches, expiring ≤30d, doctors reached

## Known Limitations

1. No expiry write-off for samples (future — reuse Item 28 pattern)
2. Doctor search by name is text input (no autocomplete — future)
3. No sample receipt PDF/confirmation to rep
4. No monthly report (samples given per rep/company)
5. No link to Doctor.referral for conversion tracking (future)

## Next: Item 38 — Exchange Medicine
