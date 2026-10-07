import { prisma } from '@/lib/prisma';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

const DEFAULT_CURRENCIES = [
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', isBase: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', isBase: false },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', isBase: false },
  { code: 'EUR', name: 'Euro', symbol: '€', isBase: false },
];

export async function seedCurrencies() {
  const count = await prisma.currency.count();
  if (count > 0) return { seeded: 0 };

  for (const c of DEFAULT_CURRENCIES) {
    await prisma.currency.create({ data: c }).catch(() => {});
  }

  const bdt = await prisma.currency.findUnique({ where: { code: 'BDT' } });
  const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
  const inr = await prisma.currency.findUnique({ where: { code: 'INR' } });

  if (bdt && usd) {
    await prisma.exchangeRate.create({
      data: { fromCurrencyId: usd.id, toCurrencyId: bdt.id, rate: 120 },
    }).catch(() => {});
  }
  if (bdt && inr) {
    await prisma.exchangeRate.create({
      data: { fromCurrencyId: inr.id, toCurrencyId: bdt.id, rate: 1.45 },
    }).catch(() => {});
  }

  return { seeded: DEFAULT_CURRENCIES.length };
}

export async function convertAmount(amount: number, fromCode: string, toCode: string): Promise<number> {
  if (fromCode === toCode) return amount;

  const [from, to] = await Promise.all([
    prisma.currency.findUnique({ where: { code: fromCode } }),
    prisma.currency.findUnique({ where: { code: toCode } }),
  ]);
  if (!from || !to) throw new Error('Currency not found');

  const direct = await prisma.exchangeRate.findFirst({
    where: { fromCurrencyId: from.id, toCurrencyId: to.id, isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });
  if (direct) return amount * Number(direct.rate);

  const reverse = await prisma.exchangeRate.findFirst({
    where: { fromCurrencyId: to.id, toCurrencyId: from.id, isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });
  if (reverse) return amount / Number(reverse.rate);

  throw new Error(`No exchange rate for ${fromCode} → ${toCode}`);
}

export async function getCurrenciesWithRates(): Promise<CurrencyInfo[]> {
  const currencies = await prisma.currency.findMany({ where: { isActive: true } });
  const bdt = currencies.find((c) => c.code === 'BDT');
  if (!bdt) return [];

  const result: CurrencyInfo[] = [];
  for (const c of currencies) {
    let rate = 1;
    if (c.code !== 'BDT') {
      const r = await prisma.exchangeRate.findFirst({
        where: { fromCurrencyId: c.id, toCurrencyId: bdt.id, isActive: true },
        orderBy: { effectiveFrom: 'desc' },
      });
      rate = r ? Number(r.rate) : 0;
    }
    result.push({ code: c.code, name: c.name, symbol: c.symbol, rate });
  }
  return result;
}

export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}
