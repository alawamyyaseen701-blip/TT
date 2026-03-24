import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc } from '@/lib/firebase';

const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const PAYMOB_API = 'https://accept.paymob.com/api';

/**
 * Step 1: Authenticate → get auth token
 */
async function paymobAuth(): Promise<string> {
  const res = await fetch(`${PAYMOB_API}/auth/tokens`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Paymob auth failed: ' + JSON.stringify(data));
  return data.token;
}

/**
 * Step 2: Create Paymob order → get order_id
 */
async function paymobCreateOrder(token: string, amountCents: number, dealId: string): Promise<number> {
  const res = await fetch(`${PAYMOB_API}/ecommerce/orders`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token:         token,
      delivery_needed:    false,
      amount_cents:       amountCents,
      currency:           'EGP',
      merchant_order_id:  dealId,
      items: [{
        name:       'Trust🔁Deal Escrow',
        amount_cents: amountCents,
        description: `صفقة #${dealId.slice(0, 8)}`,
        quantity:   1,
      }],
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Paymob order failed: ' + JSON.stringify(data));
  return data.id;
}

/**
 * Step 3: Get payment key → get iframe URL
 */
async function paymobPaymentKey(
  token: string,
  orderId: number,
  amountCents: number,
  buyer: any,
  integrationId: number
): Promise<string> {
  const res = await fetch(`${PAYMOB_API}/payment_keys`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token:     token,
      amount_cents:   amountCents,
      expiration:     3600,
      order_id:       orderId,
      billing_data: {
        apartment:    'NA', email: buyer.email || 'user@trustdeal.com',
        floor:        'NA', first_name: buyer.display_name?.split(' ')[0] || buyer.username || 'User',
        street:       'NA', building: 'NA',
        phone_number: buyer.phone || '+201000000000',
        shipping_method: 'NA', postal_code: 'NA',
        city: 'Cairo', country: 'EG',
        last_name: buyer.display_name?.split(' ').slice(1).join(' ') || 'User',
        state: 'Cairo',
      },
      currency:       'EGP',
      integration_id: integrationId,
      lock_order_when_paid: true,
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Paymob payment key failed: ' + JSON.stringify(data));
  return data.token;
}

/**
 * POST /api/checkout
 * body: { dealId, gateway: 'paymob_card' | 'paymob_wallet' | 'paypal' }
 * Returns: { checkoutUrl } — redirect buyer there
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, gateway } = await req.json();
    if (!dealId) return apiError('معرف الصفقة مطلوب');

    const validGateways = ['paymob_card', 'paymob_wallet', 'paypal'];
    if (!validGateways.includes(gateway))
      return apiError(`البوابة غير صالحة — اختر: ${validGateways.join(', ')}`);

    const deal = await getDoc('deals', dealId);
    if (!deal) return apiError('الصفقة غير موجودة', 404);
    if (deal.buyer_id !== auth.userId) return apiError('لست مشتري هذه الصفقة', 403);
    if (!['pending_payment', 'payment_sent'].includes(deal.status))
      return apiError('الصفقة ليست بانتظار الدفع');

    const buyerDoc = await getDoc('users', auth.userId);
    let checkoutUrl = '';

    // ── Paymob (Card / Mobile Wallet) ──────────────────────────
    if (gateway.startsWith('paymob_')) {
      if (!process.env.PAYMOB_API_KEY || process.env.PAYMOB_API_KEY.includes('REPLACE'))
        return apiError('Paymob غير مفعّل — أضف PAYMOB_API_KEY في .env.local', 503);

      // Paymob works in EGP — amount in cents
      // For USD deals, you can convert or use a fixed rate
      // Here we keep the deal.amount in USD but charge in EGP (1 USD ≈ 50 EGP approx)
      // In production you'd use a live exchange rate API
      const USD_TO_EGP = parseFloat(process.env.USD_TO_EGP_RATE || '50');
      const amountEGP   = Math.round(deal.amount * USD_TO_EGP * 100); // piasters

      const integrationId = gateway === 'paymob_card'
        ? parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID   || '0')
        : parseInt(process.env.PAYMOB_WALLET_INTEGRATION_ID || '0');

      if (!integrationId)
        return apiError(`Integration ID غير موجود لـ ${gateway}`, 503);

      const pmToken  = await paymobAuth();
      const orderId  = await paymobCreateOrder(pmToken, amountEGP, dealId);
      const payToken = await paymobPaymentKey(pmToken, orderId, amountEGP, buyerDoc, integrationId);
      const iframeId = process.env.PAYMOB_IFRAME_ID;

      checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${payToken}`;
    }

    // ── PayPal (دولي) ──────────────────────────────────────────
    if (gateway === 'paypal') {
      if (!process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID.includes('REPLACE'))
        return apiError('PayPal غير مفعّل — أضف PAYPAL_CLIENT_ID في .env.local', 503);

      const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
      const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

      const authStr = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
      const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
        method:  'POST',
        headers: { Authorization: `Basic ${authStr}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    'grant_type=client_credentials',
      });
      const { access_token } = await tokenRes.json();

      const orderRes = await fetch(`${base}/v2/checkout/orders`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: dealId,
            description:  `TrustDeal — صفقة #${dealId.slice(0, 8)}`,
            amount:       { currency_code: 'USD', value: deal.amount.toFixed(2) },
          }],
          application_context: {
            return_url: `${SITE_URL}/api/checkout/paypal/capture?deal_id=${dealId}`,
            cancel_url: `${SITE_URL}/payment/${dealId}?payment=cancelled`,
          },
        }),
      });
      const order = await orderRes.json();
      checkoutUrl  = order.links?.find((l: any) => l.rel === 'approve')?.href || '';
    }

    if (!checkoutUrl) return apiError('فشل إنشاء جلسة الدفع', 500);

    await updateDoc('deals', dealId, {
      payment_gateway:      gateway,
      payment_initiated_at: new Date().toISOString(),
    });

    return apiSuccess({ checkoutUrl });
  } catch (e: any) {
    console.error('[checkout POST]', e);
    return apiError('خطأ في إنشاء جلسة الدفع: ' + (e?.message || ''), 500);
  }
}
