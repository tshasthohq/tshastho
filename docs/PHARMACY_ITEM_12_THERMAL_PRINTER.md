# Pharmacy Item 12 — Thermal Printer Integration

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Files Added

### Library — src/lib/pharmacy/printer/
- types.ts
- escpos.ts
- receipt-builder.ts
- preview.ts
- bluetooth.ts

### API — src/app/api/pharmacy/print/
- route.ts (POST /api/pharmacy/print)
- log/route.ts (GET /api/pharmacy/print/log)

### Components — src/components/pharmacy/
- ReceiptPreview.tsx
- ThermalPrintButton.tsx

### Database
- PrintLog model (table print_logs)
- Migration: 20261007073636_add_print_log_item_12

### Scripts
- scripts/preview-receipt.ts

## Features
- ESC/POS command builder
- 58mm / 80mm paper widths
- CODE128 barcode + QR code
- Cash drawer kick
- Web Bluetooth connection
- Browser print fallback
- Print audit log (DB)
- Auto IP + UA capture
- Receipt: items, totals, VAT, Mushak 6.3, Rx

## Limitations
1. Bengali text needs raster mode (future item)
2. Web Bluetooth: Chrome/Edge only (HTTPS required)
3. Tk used instead of Taka symbol

## Test
npx tsx scripts/preview-receipt.ts
(Expected: ~1088 bytes)

## Next
- Item 13: Return -> Auto-refund
- Item 14: Pharmacy Rating/Review
