# Pharmacy Item 21 — Barcode Scanner Hardware ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Support for USB / Bluetooth barcode scanners in "keyboard-wedge" mode.
Devices emit chars very fast (<50ms gap) followed by Enter —
distinguishable from human typing.

## Flow

1. BarcodeScannerListener mounted on POS page
2. Window keydown listener feeds each key to detector
3. Detector:
   - Tracks chars within maxGapMs (default 50ms)
   - On Enter: if buffer length >= minLength (4) return code
   - Otherwise reset (human typing)
4. On detection: play beep (Web Audio API) + dispatch CustomEvent
   tshastho:barcode-scanned on window
5. POS page useEffect listens for the event:
   - Extracts detail.code
   - GET /api/pharmacy/pos/scan?barcode=CODE
   - On success: addToCart(medicine)

## Files

### New
- src/lib/pharmacy/scanner-detector.ts
  - createScannerDetector(opts)
  - playBeep(opts) — Web Audio API
  - SCANNER_EVENT = 'tshastho:barcode-scanned'
- src/components/pharmacy/BarcodeScannerListener.tsx

### Modified
- src/app/pharmacy/pos/page.tsx — listener + global event handler

## Detection Algorithm

maxGapMs          = 50
minLength         = 4
bufferTimeoutMs   = 200

- Chars faster than 50ms gap = scanner sequence
- Enter commits the scan
- Human typing (>50ms gaps) resets buffer
- Skips TEXTAREA + contenteditable

## Beep Feedback

- Success: 1400 Hz, 70ms, volume 0.15
- Uses AudioContext (browser native)
- Silent fail if audio blocked

## Existing Integration

POS page already had:
- Manual barcode input field (type + Enter)
- /api/pharmacy/pos/scan?barcode=... endpoint
- addToCart(medicine) function

Item 21 adds:
- Global keyboard listener (works even if input not focused)
- Hardware-scanner detection heuristic
- Beep feedback

## API Endpoint

GET /api/pharmacy/pos/scan?barcode=CODE
- Returns medicine + stock
- Scoped to caller's pharmacy

## Known Limitations

1. No prefix filtering applied (option exists: prefixFilter prop)
2. Beep uses Web Audio — silent if user gesture not yet occurred
3. No failure beep (only success beep)
4. No scan log — scans not persisted to audit trail
5. No multi-scanner support — single global listener
6. Focus steal risk — fast typing may trigger false positive
   (mitigated by 50ms threshold + Enter requirement)

## Next: Item 23 — Live SSLCommerz
