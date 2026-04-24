import { NextResponse } from 'next/server';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

const SUPPORTED_CURRENCIES = ['JPY', 'USD', 'TWD', 'EUR', 'KRW', 'IDR'] as const;

const FALLBACK_RATES: Record<string, number> = {
  JPY: 149.5,
  USD: 1,
  TWD: 32.5,
  EUR: 0.92,
  KRW: 1380,
  IDR: 16200,
};

function filterRates(rates: Record<string, number>): Record<string, number> {
  const filtered: Record<string, number> = {};
  for (const code of SUPPORTED_CURRENCIES) {
    if (rates[code]) filtered[code] = rates[code];
  }
  return filtered;
}

export async function GET() {
  try {
    const response = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 3600 * 12 },
    });

    if (!response.ok) {
      throw new Error(`Exchangerate API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ rates: filterRates(data.rates) });
  } catch (error) {
    console.error('Error fetching currency rates, using fallback:', error);
    return NextResponse.json({ rates: FALLBACK_RATES, fallback: true });
  }
}
