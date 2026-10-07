# Staging Deployment Checklist — Item 27

**Purpose:** Deploy Tshastho to a staging environment where a real pharmacy
can run UAT end-to-end.

**Target platform:** Vercel (app) + Supabase (Postgres) + Cloudflare R2 or S3 (backups)

---

## 1. Prerequisites

- [ ] GitHub repo access (write)
- [ ] Vercel account (team plan recommended)
- [ ] Supabase project (staging) created
- [ ] Domain or subdomain reserved (e.g. `staging.tshastho.com`)
- [ ] SSLCommerz sandbox merchant account
- [ ] Sentry project (staging) created
- [ ] Resend account (test domain verified)
- [ ] Twilio/Meta WhatsApp Business sandbox account
- [ ] SSL Wireless SMS sandbox credentials

---

## 2. Environment Variables

### 2.1 Core
```
# Database
DATABASE_URL=postgresql://...@staging-db.supabase.co:5432/postgres
DIRECT_URL=postgresql://...@staging-db.supabase.co:5432/postgres

# Auth / Session
JWT_SECRET=<random-64-char>
NEXT_PUBLIC_APP_URL=https://staging.tshastho.com
NODE_ENV=production
```

### 2.2 Payments (SSLCommerz sandbox)
```
SSLCOMMERZ_SANDBOX=true
SSLCOMMERZ_STORE_ID=<sandbox store id>
SSLCOMMERZ_STORE_PASS=<sandbox store pass>
SSLCOMMERZ_IPN_SECRET=<random>
```

### 2.3 Monitoring
```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=tshastho
SENTRY_PROJECT=tshastho-staging
SENTRY_AUTH_TOKEN=<scoped token>
```

### 2.4 Communications
```
RESEND_API_KEY=re_...
SSL_WIRELESS_API_KEY=...
SSL_WIRELESS_SENDER_ID=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
WHATSAPP_PHONE_ID=...
```

### 2.5 Storage / Backup
```
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=tshastho-staging-backup
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
BACKUP_PASSPHRASE=<random-32-char>
```

### 2.6 Cron / Retention
```
CRON_SECRET=<random-32-char>
```

**Rule:** Never commit `.env` files. Use Vercel Env or GitHub Secrets.

---

## 3. Database Setup

- [ ] Create Supabase staging project
- [ ] Copy `DATABASE_URL` + `DIRECT_URL`
- [ ] Local: `npx prisma migrate deploy` (runs all migrations)
- [ ] Seed base data: `npx tsx prisma/seed.ts`
- [ ] Seed medicines: `npx tsx prisma/seed-medicines.ts`
- [ ] (Optional) Rajshahi data: `npx tsx prisma/seed-rajshahi-100.ts`
- [ ] Seed UAT data: `npm run seed:uat`
- [ ] Verify: `npx prisma studio` shows tables populated

---

## 4. Deploy to Vercel

- [ ] Import repo in Vercel
- [ ] Set production branch: `phase-0-security` (or `main` when merged)
- [ ] Add all env vars from section 2
- [ ] Build command: `npm run build`
- [ ] Install command: `npm ci`
- [ ] Output: default (Next.js auto-detected)
- [ ] Enable Preview Deployments for PRs
- [ ] Trigger first deploy
- [ ] Wait for `✓ Compiled successfully`

---

## 5. Domain & SSL

- [ ] Add `staging.tshastho.com` in Vercel → Domains
- [ ] Configure DNS CNAME to Vercel
- [ ] Wait for SSL cert (Let's Encrypt auto)
- [ ] Verify HTTPS redirect works

---

## 6. SSLCommerz Callbacks

Configure in SSLCommerz merchant panel:
- [ ] Success URL: `https://staging.tshastho.com/api/payments/sslcommerz/success`
- [ ] Fail URL: `https://staging.tshastho.com/api/payments/sslcommerz/fail`
- [ ] Cancel URL: `https://staging.tshastho.com/api/payments/sslcommerz/cancel`
- [ ] IPN URL: `https://staging.tshastho.com/api/payments/sslcommerz/ipn`

---

## 7. GitHub Actions (Cron)

Add repo secrets:
- [ ] `APP_URL` = `https://staging.tshastho.com`
- [ ] `CRON_SECRET` = (matches env var)
- [ ] `BACKUP_PASSPHRASE` = (matches env var)
- [ ] `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

Verify workflows:
- [ ] `.github/workflows/backup.yml` — daily backup
- [ ] `.github/workflows/retention-purge.yml` — daily 03:00 UTC

---

## 8. Post-Deploy Smoke

```bash
APP_URL=https://staging.tshastho.com npm run smoke
```

- [ ] Homepage returns 200
- [ ] /pharmacy/pos returns 200
- [ ] Auth redirects to login when not signed in
- [ ] Sentry test event appears in dashboard
- [ ] SSLCommerz sandbox test transaction succeeds

---

## 9. UAT Handoff

- [ ] Share `docs/UAT_SCRIPT.md` with pharmacy partner
- [ ] Provide staging credentials (owner/staff/patient)
- [ ] Schedule 2-hour UAT session
- [ ] Set up feedback channel (WhatsApp group or shared doc)

---

## 10. Rollback Plan

**If critical issue found during UAT:**
1. Vercel → Deployments → promote last known-good
2. Supabase → Point-in-time recovery if DB corrupted
3. Notify pharmacy partner within 30 min

---

## Known Staging Limitations

1. Email/SMS/WhatsApp go to sandbox providers (may not deliver to real numbers)
2. Payment amounts are test-only
3. Data may be wiped between UAT sessions
4. No SLA on staging uptime

---

**Sign-off:**

| Role | Name | Date |
|---|---|---|
| Tech Lead | | |
| QA Lead | | |
| Pharmacy Owner | | |
