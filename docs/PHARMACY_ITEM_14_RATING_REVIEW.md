# Pharmacy Item 14 — Rating/Review System ✅

**Status:** Complete (2026-10-07)
**Branch:** phase-0-security

## Overview

Verified-purchase review system for pharmacies.
Only customers with DELIVERED orders can review. One review per order.

## Database — `PharmacyReview` model (table `pharmacy_reviews`)

| Field | Type | Notes |
|---|---|---|
| id | String | cuid |
| pharmacyId | String | FK → Pharmacy (Cascade) |
| orderId | String? @unique | FK → Order (SetNull) — one review per order |
| customerId | String | FK → User |
| rating | Int | 1-5 |
| title | String? | optional |
| comment | String? | optional |
| isVerified | Boolean | true (verified purchase) |
| status | String | PUBLISHED \| HIDDEN \| DELETED |
| flaggedBy | String? | moderator user id |
| flagReason | String? | moderation reason |
| replyText | String? | pharmacy owner reply |
| repliedAt | DateTime? | |
| repliedBy | String? | |
| createdAt, updatedAt | DateTime | |

### Pharmacy additions
- `avgRating Decimal @default(0)`
- `totalReviews Int @default(0)`
- `ratingBreakdown Json?` — { "1": n, "2": n, ..., "5": n }

### Relations added
- User `pharmacyReviews PharmacyReview[] @relation("CustomerPharmacyReviews")`
- Order `pharmacyReview PharmacyReview?`

## Service — `src/lib/pharmacy/reviews.ts`

| Function | Purpose |
|---|---|
| `createPharmacyReview` | Validates: order owns pharmacy + customer + DELIVERED + unique. Fires recalc. |
| `recalcPharmacyRating` | Aggregates PUBLISHED reviews → avgRating + totalReviews + breakdown |
| `listPharmacyReviews` | Paginated list with customer + order includes |
| `moderateReview` | HIDE / SHOW / DELETE + recalc |
| `replyToReview` | Owner reply (validates pharmacy ownership) |

## API Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/pharmacy/reviews | PATIENT/CUSTOMER | Create review |
| GET | /api/pharmacy/reviews?pharmacyId=... | public | List reviews (paginated, filter by rating) |
| POST | /api/pharmacy/reviews/[id]/moderate | OWNER/ADMIN | HIDE/SHOW/DELETE |
| POST | /api/pharmacy/reviews/[id]/reply | OWNER/ADMIN | Reply to review |

## Components

- `StarRating.tsx` — display + interactive input (sm/md/lg)
- `ReviewCard.tsx` — single review with verified badge + reply display
- `ReviewList.tsx` — summary (avg + breakdown bars) + clickable filter + list

## Business Rules

1. Only DELIVERED orders → review
2. One review per order (unique constraint)
3. Verified badge shown for all (verified purchase enforced at create)
4. avgRating recalculated on: create, moderate
5. HIDDEN/DELETED reviews excluded from aggregation
6. Owner reply validates pharmacy ownership

## Migration

`20261007xxxxxx_add_pharmacy_review_item_14`

## Next: Item 15 — Staff Commission Auto-calc
