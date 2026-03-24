import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorized, success, serverError } from '@/lib/server/auth';

interface FetchedRates {
  srRate: number | null;
  usdRate: number | null;
  cadRate: number | null;
  goldPrice: number | null;
  silverPrice: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const rates: FetchedRates = {
      srRate: null,
      usdRate: null,
      cadRate: null,
      goldPrice: null,
      silverPrice: null,
    };

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/PKR');
      const data = await res.json();
      if (data?.rates) {
        rates.srRate = data.rates.SAR ? Math.round((1 / data.rates.SAR) * 100) / 100 : null;
        rates.usdRate = data.rates.USD ? Math.round((1 / data.rates.USD) * 100) / 100 : null;
        rates.cadRate = data.rates.CAD ? Math.round((1 / data.rates.CAD) * 100) / 100 : null;
      }
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
    }

    try {
      const res = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=demo&base=PKR&currencies=XAU,XAG');
      const data = await res.json();
      if (data?.rates) {
        if (data.rates.PKRXAU) rates.goldPrice = Math.round((1 / data.rates.PKRXAU) * 100) / 100;
        if (data.rates.PKRXAG) rates.silverPrice = Math.round((1 / data.rates.PKRXAG) * 100) / 100;
      }
    } catch (err) {
      console.error('Failed to fetch metal prices:', err);
    }

    return success(rates);
  } catch (err) {
    return serverError(err);
  }
}
