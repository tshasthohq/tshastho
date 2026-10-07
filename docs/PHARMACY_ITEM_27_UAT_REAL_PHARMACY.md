# Pharmacy Item 27 — UAT with Real Pharmacy ✅

**Status:** Infrastructure ready (2026-10-07)
**Branch:** phase-0-security

## Overview

Complete UAT toolkit for staging deployment + real-pharmacy walkthrough.
Code-side ready. Real session scheduled after staging deploy.

## Files

### Docs (new)
- docs/STAGING_DEPLOYMENT_CHECKLIST.md — step-by-step staging setup (189 lines)
  - 10 sections: prerequisites, env vars, DB, Vercel, domain, SSLCommerz, cron, smoke, handoff, rollback
- docs/UAT_SCRIPT.md — 12-session walkthrough script (~230 lines)
  - Pre-session + 12 hands-on sessions + debrief + bug template + success criteria
- docs/PHARMACY_ITEM_25_UAT.md — infra + manual checklist (Item 25)

### Scripts (Item 25)
- prisma/seed-uat.ts — idempotent UAT seed data
- scripts/smoke-test.ts — HTTP smoke test runner
- package.json: `npm run seed:uat`, `npm run smoke`

## Deployment Flow

1. Provision Supabase staging DB
2. Set env vars per STAGING_DEPLOYMENT_CHECKLIST.md section 2
3. `npx prisma migrate deploy` + seed
4. Deploy Vercel with env vars
5. Configure domain + SSLCommerz callbacks + GitHub Secrets
6. Post-deploy `npm run smoke`
7. Schedule UAT session with pharmacy
8. Run UAT_SCRIPT.md sessions
9. Collect feedback + triage bugs
10. Fix + re-run critical sessions

## UAT Sessions Covered (12)

| # | Session | Focus |
|---|---|---|
| 1 | Login & Dashboard | Auth + layout |
| 2 | POS Barcode Sale | Scanner + cart |
| 3 | POS Cash Payment | Drawer + commission |
| 4 | POS Online Payment | SSLCommerz |
| 5 | Offline Mode | Queue + sync |
| 6 | Returns & Refund | Auto-refund |
| 7 | Prescription & Retention | OCR + GDPR |
| 8 | Drug Recall Alert | Import + workflow |
| 9 | Reports & Mushak 6.3 | VAT PDF |
| 10 | Multi-Terminal | Race-safe stock |
| 11 | Notifications | SMS/Email/WhatsApp |
| 12 | Debrief | Feedback + NPS |

## Success Criteria

- No Critical bugs
- <= 3 High-severity bugs (documented)
- Pharmacy answers Yes/Maybe to production
- All 12 sessions completed
- Feedback collected

## Sign-off

| Role | Name | Date |
|---|---|---|
| Tech Lead | | |
| QA Lead | | |
| Pharmacy Owner | | |

## Known Limitations

1. Real-pharmacy session pending (organizational — needs partner + schedule)
2. Sandbox payment/email/SMS may not deliver to real addresses
3. Staging data may reset between sessions
4. No automated browser E2E (smoke tests are HTTP-level)
5. No load testing included (future)

## Production Blockers Phase — Status

| # | Item | Status |
|---|---|---|
| 19 | Offline POS | ✅ |
| 20 | Multiple Terminals | ✅ |
| 21 | Barcode Scanner | ✅ |
| 22 | Cash Drawer | ✅ |
| 23 | Live SSLCommerz | ✅ |
| 24 | Sentry Monitoring | ✅ |
| 25 | UAT Infrastructure | ✅ |
| 26 | Backup Automation | ✅ |
| 27 | UAT with Real Pharmacy | ✅ (infra ready) |

**Phase complete — 9/9 items.**

## Next Phase: Business Essential (Items 28-38)

Reports, Customer Wallet, Sample Tracker, Exchange, etc.
