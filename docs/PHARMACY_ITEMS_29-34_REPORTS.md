# Pharmacy Items 29-34 — Reports Cluster ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Six business reports sharing one service + one API + one UI.
Reusable filter bar with date-range presets + CSV/JSON export.

## Reports

| # | Report | Purpose |
|---|---|---|
| 29 | Doctor-wise | Referral tracking, net sales per doctor |
| 30 | Area/Zone | Delivery zone performance |
| 31 | Peak Hours | Hourly heatmap + top 5 slots |
| 32 | P&L | Revenue - COGS - Expenses = Net Profit |
| 33 | Customer Aging | Outstanding 0-30/31-60/61-90/90+ |
| 34 | Supplier Aging | Payable buckets by supplier |

## Files

### New (Prisma)
- Order additions: referralDoctorId, referralDoctorName, deliveryArea, deliveryZone

### New (Service)
- src/lib/pharmacy/reports.ts
  - parseRange(from?, to?)
  - doctorWiseReport()
  - areaWiseReport()
  - peakHoursReport()
  - pnlReport()
  - customerAgingReport()
  - supplierAgingReport()
  - toCSV(rows)
  - runReport(type, pharmacyId, range)

### New (API)
- GET /api/pharmacy/reports?type=&from=&to=&format=json|csv
  - type: doctor-wise | area-wise | peak-hours | pnl | customer-aging | supplier-aging
  - format: json (default) | csv (download)

### New (UI)
- src/components/pharmacy/ReportTabs.tsx — tab switcher
- src/components/pharmacy/ReportFilters.tsx — date range + presets (7d/30d/90d/1y) + export buttons
- src/components/pharmacy/ReportTable.tsx — generic column-based table
- src/app/pharmacy/reports/page.tsx — dashboard with 6 tabs

## Report Details

### Doctor-wise (Item 29)
Groups by referralDoctorId/Name. Columns: Doctor, Orders, Gross, Discount, Net.
Walk-in orders bucketed as 'Walk-in (no referral)'.

### Area/Zone (Item 30)
Groups by deliveryArea + deliveryZone. Columns: Area, Zone, Orders, Net.

### Peak Hours (Item 31)
7x24 bucket heatmap. Returns: heatmap[], hourly[24], topHours[5], totalOrders.
UI table shows hourly summary; heatmap visual can be added later.

### P&L (Item 32)
Revenue (sum finalAmount) - COGS (sum qty * purchasePrice) - Expenses
= Net Profit. Margin % + order count. Falls back gracefully if no
PharmacyExpense model — expenses=0.

### Customer Aging (Item 33)
Groups by patient. Buckets: 0-30 / 31-60 / 61-90 / 90+ days (based on createdAt).
Only PENDING/PARTIAL/UNPAID orders with dueAmount > 0.

### Supplier Aging (Item 34)
Similar buckets by supplier. Uses purchaseOrder model if present; empty otherwise.

## Export

CSV: built-in (no external dep). Escapes quotes/commas/newlines.
JSON: raw response body (for integrations).
Filenames: `<type>-<from>-to-<to>.csv`

## Auth

- OWNER / STAFF: scoped to own pharmacy
- SUPER_ADMIN: cross-pharmacy access

## Known Limitations

1. Peak Hours heatmap grid UI deferred (data returned, hourly table only)
2. Supplier Aging depends on PurchaseOrder model (returns empty if absent)
3. P&L expenses only present if PharmacyExpense model exists
4. No PDF export (CSV + JSON only — PDF item future)
5. No saved report presets
6. No scheduled email reports (future cron)
7. referralDoctorId must be set at order create for Doctor-wise to populate

## Next: Item 35 — Medicine Substitution UI
