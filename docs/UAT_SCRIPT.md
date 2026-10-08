# UAT Walkthrough Script — Item 27

**Purpose:** Step-by-step script for a real pharmacy to test Tshastho
end-to-end on staging.

**Duration:** ~2 hours
**Participants:** Pharmacy Owner, 1-2 Staff, Tshastho QA

---

## Pre-Session (Tshastho QA — 30 min before)

- [ ] Staging is up (`https://staging.tshastho.com` returns 200)
- [ ] `npm run smoke` passes >= 5
- [ ] UAT seed data present (owner/staff/patient/medicines)
- [ ] Sentry staging dashboard open
- [ ] Test credentials printed for pharmacy
- [ ] Feedback WhatsApp group created

**Credentials handout:**
```
Owner:   uat-owner@tshastho.test   / <password>
Staff:   uat-staff@tshastho.test   / <password>
Patient: uat-patient@tshastho.test / <password>
URL:     https://staging.tshastho.com
```

---

## Session 1 — Login & Dashboard (10 min)

**Owner logs in**
- [ ] Login works with provided credentials
- [ ] Dashboard loads without console errors
- [ ] Pharmacy name shows correctly
- [ ] No Sentry errors in last 5 min

**Feedback prompt:** Does the dashboard show the information you need?

---

## Session 2 — POS: Barcode Sale (15 min)

**Staff logs in at POS**
- [ ] Open `/pharmacy/pos`
- [ ] Scan a UAT barcode (`UAT-MED-001`) with hardware scanner
  - Expected: beep plays, medicine added to cart
- [ ] Manually type a barcode + Enter
  - Expected: same behavior
- [ ] Add 2-3 medicines to cart
- [ ] Verify subtotal, VAT, total computed correctly

**Feedback:** Is barcode scanning accurate? Response time OK?

---

## Session 3 — POS: Cash Payment (10 min)

- [ ] Change payment method to CASH
- [ ] Click Complete Sale
- [ ] Sale succeeds, receipt shows
  - Expected: cash drawer opens automatically
- [ ] Print receipt via Bluetooth printer (if available)
- [ ] Print via Browser fallback

**Verify in admin:**
- [ ] Cash drawer log created (`/api/pharmacy/cash-drawer`)
- [ ] Staff commission entry created (5% of profit)

**Feedback:** Does receipt layout meet pharmacy needs?

---

## Session 4 — POS: Online Payment (15 min)

- [ ] Add item to cart
- [ ] Select SSLCommerz (sandbox)
- [ ] Complete payment on SSLCommerz test page
- [ ] Redirect back → sale confirmed
- [ ] IPN processed (check Payment.gatewayPayload in DB)

**Feedback:** Payment flow smooth? Any confusion?

---

## Session 5 — Offline Mode (10 min)

- [ ] DevTools → Network → Offline
- [ ] Complete a sale
  - Expected: OfflineIndicator shows yellow banner 'sale queued'
- [ ] Bring network back online
  - Expected: Auto-sync within 30s, banner disappears
- [ ] Verify sale appears in DB

**Feedback:** Is offline behavior clear to staff?

---

## Session 6 — Returns & Refund (15 min)

**Staff creates a return:**
- [ ] Open `/pharmacy/returns`
- [ ] Create customer return for recent sale
- [ ] Approve return
- [ ] Process return → status becomes PROCESSED
- [ ] Refund auto-triggers (check refundStatus=COMPLETED)
- [ ] Stock restocked

**Feedback:** Return workflow matches your current process?

---

## Session 7 — Prescription & Retention (10 min)

**Patient uploads prescription:**
- [ ] Login as patient
- [ ] Upload prescription image
- [ ] OCR extracts text (verify accuracy)
- [ ] Verify retention date set (5 years default)

**GDPR test:**
- [ ] Patient requests erasure
- [ ] Image redacted, audit trail preserved

**Feedback:** OCR accuracy acceptable?

---

## Session 8 — Drug Recall Alert (10 min)

**QA simulates a recall:**
- [ ] POST /api/pharmacy/recalls with test recall matching UAT-MED-001 batch
- [ ] Pharmacy dashboard shows red banner with count
- [ ] Click 'Review now' → see match details
- [ ] Acknowledge match
- [ ] Resolve match

**Feedback:** Would this workflow help prevent dispensing recalled drugs?

---

## Session 9 — Reports & Mushak 6.3 (10 min)

- [ ] Open VAT invoices list
- [ ] Download Mushak 6.3 PDF for a sale
- [ ] Open PDF — verify layout
  - Header: Govt of Bangladesh + NBR + Mushak 6.3
  - Seller + Buyer boxes
  - Items table
  - VAT breakdown

**Feedback:** Does PDF format match NBR requirements?

---

## Session 10 — Multi-Terminal (15 min)

**Open 2 browser tabs (simulate 2 terminals):**
- [ ] Both register as separate terminals (localStorage UUIDs differ)
- [ ] Tab A sells last UAT-MED-001 unit
- [ ] Tab B tries to sell same unit
  - Expected: 'Insufficient stock' error (race-safe)
- [ ] Check `/api/pharmacy/pos/terminals` lists both terminals

**Feedback:** Multi-counter workflow matches your operation?

---

## Session 11 — Notifications (10 min)

- [ ] Trigger test SMS via SSL Wireless sandbox
- [ ] Trigger test email via Resend
- [ ] Trigger test WhatsApp via Twilio sandbox
- [ ] Verify delivery (may be sandbox-only)

**Feedback:** Preferred channel for order updates?

---

## Session 12 — Debrief (15 min)

**Go around the room:**

1. **Top 3 things that worked well?**
2. **Top 3 pain points?**
3. **Missing features for day-1 go-live?**
4. **Would you use this in production?** (Y/N/Maybe)

**Document responses in feedback WhatsApp group.**

---

## Bug Reporting

For each issue, use template (see `docs/PHARMACY_ITEM_25_UAT.md`):

```
Title: [PHARMACY] Short description
Severity: Critical | High | Medium | Low
Sector: POS | Returns | Reviews | Recalls | Retention | Printer | Payment
Steps: 1... 2... 3...
Expected: ...
Actual: ...
Screenshot: ...
Sentry event ID: ...
```

---

## Success Criteria

UAT passes if:
- [ ] No Critical bugs found
- [ ] <= 3 High-severity bugs (documented for fix)
- [ ] Pharmacy owner answers 'Yes' or 'Maybe' to production use
- [ ] All 12 sessions completed
- [ ] Feedback collected

---

## After UAT

- [ ] Compile bug report
- [ ] Triage (Critical → fix before prod; High → fix in week 1; others → backlog)
- [ ] Update roadmap with findings
- [ ] Schedule production deploy date
