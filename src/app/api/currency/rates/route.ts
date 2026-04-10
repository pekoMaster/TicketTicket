import { NextResponse } from 'next/server';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

export async function GET() {
  try {
    const response = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 3600 * 12 }, // Cache effectively for 12 hours
    });

    if (!response.ok) {
      throw new Error(`Exchangerate API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ rates: data.rates });
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return NextResponse.json({ error: 'Failed to fetch currency rates' }, { status: 500 });
  }
}
