import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc } from '@/lib/firebase';

const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const SECRET_KEY = process.env.PAYMOB_SECRET_KEY || '';
const PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY  || '';
const IFRAME_ID  = process.env.PAYMOB_IFRAME_ID   || '999475';

// ── Paymob Intention API v2 ────────────────────────────────────────────
// Uses SECRET_KEY directly — no auth token needed → no rate limiting
async function createPaymobIntention(
  amountCents: number,
  dealId: string,
  integrationId: number,
  buyer: any,
): Promise<{ clientSecret: string; intentionId: string }> {
  const res = await fetch('https://accept.paymob.com/v1/intention/', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Token ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount:          amountCents,
      currency:        'EGP',
      payment_methods: [integrationId],
      special_reference: dealId,
      // redirect after payment (success or fail)
      redirection_url: `${SITE_URL}/payment/${dealId}?payment=result`,
      // webhook — auto-activates deal on success
      notification_url: `${SITE_URL}/api/webhooks/paymob`,
      items: [{
        name:      'Trust🔁Deal – Escrow',
        amount:    amountCents,
        description: `صفقة #${dealId.slice(0, 8)}`,
        quantity:  1,
      }],
      billing_data: {
        apartment:    'NA', floor: 'NA', street: 'NA', building: 'NA',
        shipping_method: 'NA', postal_code: 'NA', state: 'Cairo', city: 'Cairo', country: 'EG',
        email:        buyer?.email        || 'buyer@trustdeal.com',
        phone_number: buyer?.phone        || '+201000000000',
        first_name:   buyer?.display_name?.split(' ')[0]             || buyer?.username || 'User',
        last_name:    buyer?.display_name?.split(' ').slice(1).join(' ') || 'User',
      },
      customer: {
        first_name: buyer?.display_name?.split(' ')[0]             || buyer?.username || 'User',
        last_name:  buyer?.display_name?.split(' ').slice(1).join(' ') || 'User',
        email:      buyer?.email || 'buyer@trustdeal.com',
      },
    }),
  });

  const data = await res.json();
  console.log('[paymob-intention]', JSON.stringify(data).slice(0, 400));

  if (!data.client_secret)
    throw new Error('Paymob intention failed: ' + JSON.stringify(data).slice(0, 300));

  return { clientSecret: data.client_secret, intentionId: data.id || '' };
}

/**
 * POST /api/checkout
 * body: { dealId, gateway: 'paymob_card' | 'paymob_wallet' | 'paypal' }
 * Returns: { checkoutUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, gateway } = await req.json();
    if (!dealId) return apiError('معرف الصفقة مطلوب');
    if (!['paymob_card', 'paymob_wallet', 'paypal'].includes(gateway))
      return apiError('البوابة غير صالحة');

    const deal = await getDoc('deals', dealId);
    if (!deal) return apiError('الصفقة غير موجودة', 404);
    if (deal.buyer_id !== auth.userId) return apiError('لست مشتري هذه الصفقة', 403);
    if (!['pending_payment', 'payment_sent'].includes(deal.status))
      return apiError('الصفقة ليست بانتظار الدفع');

    const buyerDoc = await getDoc('users', auth.userId);
    let checkoutUrl = '';

    // ── Paymob (Card / Mobile Wallet) via Intention API v2 ────────────
    if (gateway.startsWith('paymob_')) {
      if (!SECRET_KEY || SECRET_KEY.includes('REPLACE'))
        return apiError('PAYMOB_SECRET_KEY غير موجود في .env.local', 503);

      // Convert USD → EGP piasters
      const USD_TO_EGP  = parseFloat(process.env.USD_TO_EGP_RATE || '50');
      const amountCents = Math.round(deal.amount * USD_TO_EGP * 100);

      const cardIntId   = parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID   || '0');
      const walletIntId = parseInt(process.env.PAYMOB_WALLET_INTEGRATION_ID || '0');
      const integId     = gateway === 'paymob_card' ? cardIntId : walletIntId;

      if (!integId)
        return apiError(
          `Integration ID غير موجود — أضف ${gateway === 'paymob_card' ? 'PAYMOB_CARD_INTEGRATION_ID' : 'PAYMOB_WALLET_INTEGRATION_ID'} في .env.local`,
          503
        );

      // Make special_reference unique per attempt (Paymob rejects duplicates)
      const pmRef = `${dealId}_${Date.now()}`;

      const { clientSecret } = await createPaymobIntention(amountCents, pmRef, integId, buyerDoc);

      // Store the paymob reference in the deal so webhook can find the deal
      await updateDoc('deals', dealId, {
        payment_gateway:      gateway,
        payment_initiated_at: new Date().toISOString(),
        paymob_reference:     pmRef,
      });

      // Unified Checkout URL
      checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${PUBLIC_KEY}&clientSecret=${clientSecret}`;
    }

    // ── PayPal ─────────────────────────────────────────────────────────
    if (gateway === 'paypal') {
      if (!process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID.includes('REPLACE'))
        return apiError('PayPal غير مفعّل — أضف PAYPAL_CLIENT_ID في .env.local', 503);

      const mode    = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
      const base    = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const authStr = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');

      const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        headers: { Authorization: `Basic ${authStr}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
      });
      const { access_token } = await tokenRes.json();

      const orderRes = await fetch(`${base}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ reference_id: dealId, description: `TrustDeal #${dealId.slice(0,8)}`, amount: { currency_code: 'USD', value: deal.amount.toFixed(2) } }],
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

    // For PayPal, save gateway info (Paymob already saved in its block above)
    if (gateway === 'paypal') {
      await updateDoc('deals', dealId, {
        payment_gateway: gateway, payment_initiated_at: new Date().toISOString(),
      });
    }

    return apiSuccess({ checkoutUrl });
  } catch (e: any) {
    console.error('[checkout POST]', e);
    return apiError('خطأ في إنشاء جلسة الدفع: ' + (e?.message || ''), 500);
  }
}
