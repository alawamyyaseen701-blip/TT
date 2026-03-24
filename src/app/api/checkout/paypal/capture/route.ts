import { NextRequest, NextResponse } from 'next/server';
import { activateDeal } from '@/app/api/webhooks/paymob/route';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealId  = searchParams.get('deal_id');
  const orderId = searchParams.get('token');

  if (!dealId || !orderId)
    return NextResponse.redirect(`${SITE_URL}/payment/${dealId}?payment=error`);

  try {
    const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
    const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const authStr  = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST', headers: { Authorization: `Basic ${authStr}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await tokenRes.json();

    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    });
    const capture = await captureRes.json();

    if (capture.status === 'COMPLETED') {
      await activateDeal(dealId, { paypal_order_id: orderId, paypal_capture_id: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id });
      return NextResponse.redirect(`${SITE_URL}/payment/${dealId}?payment=success`);
    }
    return NextResponse.redirect(`${SITE_URL}/payment/${dealId}?payment=error`);
  } catch (e: any) {
    console.error('[paypal-capture]', e);
    return NextResponse.redirect(`${SITE_URL}/payment/${dealId}?payment=error`);
  }
}
