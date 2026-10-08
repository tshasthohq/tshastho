// Wallet constants — Item 36

export const VERTICALS = {
  PLATFORM: 'PLATFORM',
  PHARMACY: 'PHARMACY',
  DOCTOR: 'DOCTOR',
  DIAGNOSTIC: 'DIAGNOSTIC',
  DELIVERY: 'DELIVERY',
  HOSPITAL: 'HOSPITAL',
  INTERNATIONAL: 'INTERNATIONAL',
} as const;

export type Vertical = (typeof VERTICALS)[keyof typeof VERTICALS];

export const TXN_TYPES = {
  TOPUP: 'TOPUP',
  SPEND: 'SPEND',
  EARN: 'EARN',
  REFUND: 'REFUND',
  HOLD: 'HOLD',
  RELEASE: 'RELEASE',
  ADJUST: 'ADJUST',
  WITHDRAW: 'WITHDRAW',
} as const;

export type TxnType = (typeof TXN_TYPES)[keyof typeof TXN_TYPES];
export type Direction = 'CREDIT' | 'DEBIT';

export const CREDIT_TYPES: TxnType[] = ['TOPUP', 'EARN', 'REFUND', 'RELEASE', 'ADJUST'];
