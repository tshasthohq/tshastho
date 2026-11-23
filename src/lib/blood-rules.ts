// Single source of truth for donor eligibility rules.
// Confirm these numbers with your medical advisor before launch.
export const DONATION_GAP_DAYS = { male: 90, female: 120 } as const;
export const DONOR_LIMITS = { minAge: 18, maxAge: 65, minKg: 50 } as const;
// A compatible crossmatch is valid, and holds the bag for that patient, for this long.
export const CROSSMATCH_VALID_HOURS = 72;
