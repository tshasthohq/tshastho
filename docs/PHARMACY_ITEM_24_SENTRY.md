# Pharmacy Item 24 — Sentry Monitoring ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Sentry error tracking + basic performance monitoring.
Captures client, server, and edge runtime errors automatically.

## Files

- sentry.client.config.ts
- sentry.server.config.ts
- sentry.edge.config.ts
- instrumentation.ts
- src/app/global-error.tsx
- .env.example (env template)

## next.config.ts

NOT wrapped with withSentryConfig — Next.js 16 + Turbopack
plugin incompatibility. Sentry works via instrumentation.ts.
Source-map upload + tunnel route disabled.

## Env Vars

NEXT_PUBLIC_SENTRY_DSN — required to enable
SENTRY_ORG — optional
SENTRY_PROJECT — optional
SENTRY_AUTH_TOKEN — optional (source maps)

If NEXT_PUBLIC_SENTRY_DSN unset, Sentry is disabled (safe no-op).

## Sampling

- tracesSampleRate: 0.1 prod / 1.0 dev
- replays: session 0% / on-error 10%

## Behavior

| Feature | Status |
|---|---|
| Client capture | YES |
| Server capture | YES |
| Edge capture | YES |
| Error boundary | YES |
| Performance traces | YES (10% prod) |
| Session replay | YES (10% on error) |
| Source maps | NO (Turbopack) |

## Known Limitations

1. No source maps in production (minified traces)
2. No tunnel route — ad-blockers may block sentry.io
3. console.error not migrated to Sentry.captureException
4. No user context (Sentry.setUser not called)

## Next: Item 21 — Barcode Scanner Hardware
