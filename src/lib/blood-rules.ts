// Single source of truth for donor eligibility rules.
// Confirm these numbers with your medical advisor before launch.
export const DONATION_GAP_DAYS = { male: 90, female: 120 } as const;
export const DONOR_LIMITS = { minAge: 18, maxAge: 65, minKg: 50 } as const;
export const CROSSMATCH_RESERVE_HOURS = 48;
