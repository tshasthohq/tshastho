# Pharmacy Item 19 — Offline POS ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

POS sales captured offline via IndexedDB queue. Auto-sync on reconnect.
Idempotent via client-generated UUID (clientSaleId).

## Flow

1. Staff submits sale → submitPosSale(body)
2. If offline: enqueue to IndexedDB, return queued response
3. If online: POST with x-client-sale-id header
4. Server checks clientSaleId uniqueness → returns existing sale if found (idempotent)
5. Sync engine runs on reconnect + every 30s
6. Auto-retries failed sales up to 5 attempts

## Files

### New
- src/lib/offline/db.ts — IndexedDB wrapper (pending_sales + meta stores)
- src/lib/offline/sync.ts — syncPendingSales() replay engine
- src/lib/offline/sale-submit.ts — submitPosSale() with offline fallback
- src/hooks/useOfflineSync.ts — React hook (online status + pending count)
- src/components/pharmacy/OfflineIndicator.tsx

### Modified
- prisma/schema.prisma — PosSale.clientSaleId String? @unique
- src/app/api/pharmacy/pos/sale/route.ts — idempotency check + clientSaleId field
- src/app/pharmacy/pos/page.tsx — submitPosSale + OfflineIndicator

## IndexedDB Schema

Database: tshastho-offline (v1)
- pending_sales (keyPath: id)
  - id (UUID), payload, createdAt, attempts, lastError, status
- meta (keyPath: key)

## Sync Behavior

- Trigger: window online event + 30s interval
- Batch: all PENDING with attempts < 5
- Idempotent: server returns 200/409 → remove from queue
- Failed: increment attempts, mark FAILED at 5

## Server-Side Idempotency

Header: x-client-sale-id (UUID)
- If PosSale.clientSaleId matches → return existing (200, idempotent: true)
- Otherwise create new sale with clientSaleId stored

## UI

OfflineIndicator shows when:
- Offline + pending > 0 (red)
- Syncing (blue)
- Online + pending > 0 (yellow + Sync now button)

Hidden when: online + 0 pending + not syncing

## Known Limitations

1. No background sync (Service Worker SyncManager not used)
2. No offline product catalog cache (still needs network for barcode lookup)
3. No conflict resolution beyond idempotency
4. No multi-tab coordination (each tab has own queue)
5. No inventory deduction until server sync
6. Service worker (public/sw.js) not yet updated for offline shell caching

## Next: Item 20 — Multiple Terminals
