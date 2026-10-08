# Pharmacy Item 16 — Mushak 6.3 Export ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Mushak 6.3 (মূসক ৬.৩) is the NBR-prescribed VAT Challan form in Bangladesh.
This item adds a PDF generator for VatInvoice records + a download button.

## Flow

1. VatInvoice exists (created at POS sale or Order checkout)
2. User clicks "Mushak 6.3 PDF" button (component)
3. GET /api/pharmacy/vat-invoices/[id]/mushak-6.3
4. buildMushakData(invoiceId):
   - Loads VatInvoice
   - Loads Pharmacy + TaxConfiguration (seller BIN/VAT/business)
   - Loads OrderItems OR PosSaleItems (falls back to summary row if neither)
   - Returns structured Mushak6_3Data
5. renderMushakPDF(data) → PDFKit buffer
6. Stream response as application/pdf with inline disposition

## Files

### New
- src/lib/pharmacy/mushak-pdf.ts
  - buildMushakData(invoiceId): Promise<Mushak6_3Data | null>
  - renderMushakPDF(data): Promise<Buffer>
- src/app/api/pharmacy/vat-invoices/[id]/mushak-6.3/route.ts (GET)
- src/components/pharmacy/MushakDownloadButton.tsx

### Dependencies added
- pdfkit (runtime)
- @types/pdfkit (dev)

## Data Sources

| Field | Source |
|---|---|
| Invoice No | VatInvoice.invoiceNumber |
| Date | VatInvoice.invoiceDate |
| Seller name | TaxConfiguration.businessName → Pharmacy.name |
| Seller BIN | TaxConfiguration.vatNumber |
| Seller address | TaxConfiguration.businessAddress → Pharmacy.address |
| Buyer name | VatInvoice.customerName → "Walk-in Customer" |
| Buyer BIN | VatInvoice.customerVatNumber |
| Items | OrderItem (via orderId) OR PosSaleItem (via posSaleId) |
| Subtotal / Discount / VAT / Total | VatInvoice fields |

## PDF Layout (A4)

- Header: Govt of Bangladesh + NBR + "Mushak 6.3" title
- Top: Invoice No + Date
- Two boxes: Seller (left) / Buyer (right) with BIN + address
- Items table: # | Description | Qty | Unit Price | Total
- Totals: Subtotal / Discount / VAT (rate) / Grand Total
- Footer: "Computer-generated challan" + generation timestamp

## API

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | /api/pharmacy/vat-invoices/[id]/mushak-6.3 | OWNER/STAFF/ADMIN | application/pdf stream |

Response headers:
- Content-Type: application/pdf
- Content-Disposition: inline; filename="Mushak-6.3-{invoiceNumber}.pdf"
- Cache-Control: no-store

## Component

`MushakDownloadButton` — fetches PDF, triggers browser download via blob URL.

## Known Limitations

1. **No Bengali font** — Bengali header text (মূসক ৬.৩) currently rendered as
   Latin transliteration "Mushak 6.3" only. Adding NotoSansBengali requires
   font embedding (future item).
2. **No NBR signature/stamp image** — printed as computer-generated challan.
3. **Single invoice only** — bulk monthly export not yet implemented
   (VatReport exists, separate PDF not added).
4. **Prisma relation names** — code uses `prisma as any` for VatInvoice to
   avoid strict relation typing; can be tightened later.
5. **Item description truncation** at 60 chars for table fit.

## Next: Item 17 — AI Drug Recall Alert
