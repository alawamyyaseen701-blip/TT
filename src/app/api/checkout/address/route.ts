import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const method = new URL(req.url).searchParams.get('method');
  const map: Record<string, string> = {
    usdt_trc20:  process.env.ADMIN_USDT_TRC20  || '',
    usdt_bep20:  process.env.ADMIN_USDT_BEP20  || '',
    usdt_erc20:  process.env.ADMIN_USDT_ERC20  || '',
    binance_pay: process.env.ADMIN_BINANCE_PAY || '',
    wise:        process.env.ADMIN_WISE_EMAIL  || '',
    bank:        process.env.ADMIN_BANK_IBAN   || '',
    paypal:      process.env.ADMIN_PAYPAL_EMAIL|| '',
  };
  if (method && map[method]) return apiSuccess({ address: map[method] });
  return apiSuccess({ addresses: map });
}
