import { NextRequest, NextResponse } from 'next/server';
import { getDoc, updateDoc, createDoc } from '@/lib/firebase';

const COMMISSION = parseFloat(process.env.COMMISSION_RATE || '0.05');
const SITE_URL   = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

/**
 * Activates a deal after successful payment.
 * Called by Stripe webhook OR PayPal capture.
 */
export async function activateDeal(dealId: string, paymentDetails?: object) {
  const deal = await getDoc('deals', dealId);
  if (!deal) throw new Error('Deal not found: ' + dealId);
  if (deal.status === 'in_escrow') return; // Already activated (idempotent)

  const now          = new Date().toISOString();
  const autoRelease  = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const sellerNet    = deal.amount * (1 - COMMISSION);

  await updateDoc('deals', dealId, {
    status:              'in_escrow',
    payment_approved_at: now,
    auto_release_at:     autoRelease,
    seller_net:          sellerNet,
    ...(paymentDetails || {}),
  });

  // Mark listing as sold (for single-purchase)
  if (deal.listing_id) {
    const listing = await getDoc('listings', deal.listing_id);
    if (listing && !listing.allow_multiple_purchases) {
      await updateDoc('listings', deal.listing_id, { status: 'sold' });
    } else if (listing?.allow_multiple_purchases) {
      await updateDoc('listings', deal.listing_id, {
        purchase_count: (listing.purchase_count || 0) + 1,
      });
    }
  }

  // Notify buyer
  await createDoc('notifications', {
    user_id: deal.buyer_id,
    type:    'payment_approved',
    title:   '✅ تم الدفع بنجاح! الصفقة نشطة',
    body:    `دفعتك $${deal.amount} وصلت. الصفقة في Escrow — انتظر تسليم البائع.`,
    link:    `/deals/${dealId}`,
    read_at: null,
  });

  // Notify seller
  await createDoc('notifications', {
    user_id: deal.seller_id,
    type:    'deal_active',
    title:   '🎉 المشتري دفع — سلّم الآن!',
    body:    `مبلغ $${deal.amount} في Escrow. ستحصل على $${sellerNet.toFixed(2)} بعد التأكيد. سلّم المنتج الآن.`,
    link:    `/deals/${dealId}`,
    read_at: null,
  });

  return { dealId, status: 'in_escrow', sellerNet };
}

// ── Stripe Webhook ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  try {
    const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('[stripe-webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const dealId  = session.metadata?.deal_id;

      if (!dealId) {
        console.error('[stripe-webhook] No deal_id in metadata');
        return NextResponse.json({ error: 'No deal_id' }, { status: 400 });
      }

      await activateDeal(dealId, {
        stripe_payment_intent: session.payment_intent,
        stripe_session_id:     session.id,
      });

      console.log(`[stripe-webhook] Deal ${dealId} activated ✅`);
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[stripe-webhook]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
