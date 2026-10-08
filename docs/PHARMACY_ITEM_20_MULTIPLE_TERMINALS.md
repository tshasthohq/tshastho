# Pharmacy Item 20 — Multiple Terminals ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Multiple POS terminals per pharmacy. Terminal identity via device UUID.
Race-safe inventory deduction. Heartbeat + registration.

## Flow

1. POS page loads → useInventorySync hook
2. getOrCreateTerminalId() → localStorage UUID (persistent)
3. registerTerminal() → POST /api/pharmacy/pos/terminals (upsert)
4. Heartbeat every 60s (updates lastSeenAt)
5. Sync tick every 30s (stockSyncTick counter)
6. Stock deduction uses atomic updateMany with gte check

## Files

### New (Prisma)
- PosTerminal model (pos_terminals table)
  - id, pharmacyId, deviceId @unique, name, model, os
  - isActive, lastSeenAt, registeredAt, registeredBy, notes

### New
- src/app/api/pharmacy/pos/terminals/route.ts
  - POST { action: 'register' | 'heartbeat', deviceId, ... }
  - GET — list with online status (< 2 min heartbeat)
- src/lib/offline/terminal.ts
  - getOrCreateTerminalId() — localStorage UUID
  - registerTerminal(id, name)
  - heartbeatTerminal(id)
  - detectOS() — navigator.userAgent parse
- src/hooks/useInventorySync.ts
  - Terminal registration + heartbeat + sync tick

### Modified
- src/lib/pharmacy/stock.ts
  - recordStockMovement: atomic stock update
  - Decrement path: updateMany({ where: { id, stock: { gte: qty } }, data: { decrement: qty } })
  - Conflict check: result.count === 0 → throw
  - Increment path: update({ increment })

## Race-Safe Stock Deduction

OLD (buggy):
  const previousStock = medicine.stock;   // read
  const newStock = previousStock + signedQty;
  await tx.medicine.update({ data: { stock: newStock } });

Two terminals read stock=10 → both compute 9 → one sale lost.

NEW (atomic):
  if (signedQty < 0) {
    const result = await tx.medicine.updateMany({
      where: { id, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });
    if (result.count === 0) throw new Error('Insufficient stock');
  } else {
    await tx.medicine.update({ data: { stock: { increment: qty } } });
  }

Postgres serializes concurrent UPDATEs → no lost updates.

## Terminal API

| Method | Path | Purpose |
|---|---|---|
| POST | /api/pharmacy/pos/terminals | register / heartbeat |
| GET | /api/pharmacy/pos/terminals | list + online status |

## Terminal Identity

- localStorage key: tshastho:pos-terminal-id
- Format: term-<uuid>
- Persistent across reloads
- Cleared only by clearing localStorage

## Known Limitations

1. No real-time push (polling only — 30s sync tick)
2. No terminal-specific feature gating (all terminals can do all actions)
3. No conflict resolution UI (client just retries)
4. No offline terminal registration (needs network)
5. No cross-pharmacy terminal awareness
6. Sync tick counter currently unused (hook ready for inventory refresh)

## Next: Item 28 — Reports (Business Essential phase)
