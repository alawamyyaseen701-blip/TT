import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/auth';

/** Returns admin wallet addresses for crypto payments — from env vars */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const method = searchParams.get('method');

  const addresses: Record<string, string> = {
    usdt_trc20:   process.env.ADMIN_USDT_TRC20  || 'غير مفعّل',
    usdt_bep20:   process.env.ADMIN_USDT_BEP20  || 'غير مفعّل',
    usdt_erc20:   process.env.ADMIN_USDT_ERC20  || 'غير مفعّل',
    binance_pay:  process.env.ADMIN_BINANCE_PAY || 'غير مفعّل',
    wise:         process.env.ADMIN_WISE_EMAIL  || 'غير مفعّل',
    bank:         process.env.ADMIN_BANK_IBAN   || 'غير مفعّل',
    paypal:       process.env.ADMIN_PAYPAL_EMAIL|| 'غير مفعّل',
  };

  if (method && addresses[method]) {
    return apiSuccess({ address: addresses[method] });
  }

  // Return all addresses
  return apiSuccess({ addresses });
}
