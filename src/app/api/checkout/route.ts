import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc } from '@/lib/firebase';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const COMMISSION = parseFloat(process.env.COMMISSION_RATE || '0.05');

// ── Create Stripe checkout session ───────────────────────────────────
async function createStripeSession(deal: any, dealId: string) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const amountCents = Math.round(deal.amount * 100); // Stripe uses cents

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name:        `TrustDeal — ${deal.listing_title || 'صفقة'}`,
          description: `صفقة مؤمَّنة #${dealId.slice(0, 8)} — البائع: ${deal.seller_username || ''}`,
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    metadata: {
      deal_id:   dealId,
      buyer_id:  deal.buyer_id,
      seller_id: deal.seller_id,
    },
    success_url: `${SITE_URL}/deals/${dealId}?payment=success`,
    cancel_url:  `${SITE_URL}/deals/${dealId}?payment=cancelled`,
  });

  return session.url as string;
}

// ── Create PayPal order ───────────────────────────────────────────────
async function createPayPalOrder(deal: any, dealId: string) {
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const base = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // Get access token
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json();

  // Create order
  const orderRes = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id:  dealId,
        description:   `TrustDeal — صفقة #${dealId.slice(0, 8)}`,
        amount:        { currency_code: 'USD', value: deal.amount.toFixed(2) },
      }],
      application_context: {
        return_url: `${SITE_URL}/api/checkout/paypal/capture?deal_id=${dealId}`,
        cancel_url: `${SITE_URL}/deals/${dealId}?payment=cancelled`,
      },
    }),
  });

  const order = await orderRes.json();
  const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
  return approvalUrl as string;
}

/**
 * POST /api/checkout
 * body: { dealId, gateway: 'stripe' | 'paypal' }
 * Returns: { checkoutUrl } to redirect the buyer
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, gateway } = await req.json();
    if (!dealId) return apiError('معرف الصفقة مطلوب');
    if (!['stripe', 'paypal'].includes(gateway))
      return apiError('البوابة غير صالحة — اختر stripe أو paypal');

    const deal = await getDoc('deals', dealId);
    if (!deal) return apiError('الصفقة غير موجودة', 404);
    if (deal.buyer_id !== auth.userId) return apiError('لست مشتري هذه الصفقة', 403);
    if (!['pending_payment', 'payment_sent'].includes(deal.status))
      return apiError('لا يمكن الدفع — الصفقة ليست بانتظار الدفع');

    // Enrich deal with listing info
    if (deal.listing_id && !deal.listing_title) {
      const listing = await getDoc('listings', deal.listing_id);
      deal.listing_title = listing?.title;
    }
    const sellerDoc = await getDoc('users', deal.seller_id);
    deal.seller_username = sellerDoc?.username;

    let checkoutUrl = '';

    if (gateway === 'stripe') {
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('REPLACE'))
        return apiError('Stripe غير مفعّل — أضف STRIPE_SECRET_KEY في .env.local', 503);
      checkoutUrl = await createStripeSession(deal, dealId);
    }

    if (gateway === 'paypal') {
      if (!process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID.includes('REPLACE'))
        return apiError('PayPal غير مفعّل — أضف PAYPAL_CLIENT_ID في .env.local', 503);
      checkoutUrl = await createPayPalOrder(deal, dealId);
    }

    if (!checkoutUrl) return apiError('فشل إنشاء جلسة الدفع', 500);

    // Update deal to track which gateway was used
    await updateDoc('deals', dealId, {
      payment_gateway:    gateway,
      payment_initiated_at: new Date().toISOString(),
    });

    return apiSuccess({ checkoutUrl });
  } catch (e: any) {
    console.error('[checkout POST]', e);
    return apiError('خطأ في إنشاء جلسة الدفع: ' + (e?.message || ''), 500);
  }
}
