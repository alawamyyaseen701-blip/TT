import { NextRequest, NextResponse } from 'next/server';
import { createHmac }               from 'crypto';
import { getDoc, updateDoc, createDoc } from '@/lib/firebase';

const COMMISSION = parseFloat(process.env.COMMISSION_RATE || '0.05');

/**
 * Activates a deal after successful payment.
 * Used by both Paymob webhook and PayPal capture.
 */
export async function activateDeal(dealId: string, paymentDetails?: object) {
  const deal = await getDoc('deals', dealId);
  if (!deal) throw new Error('Deal not found: ' + dealId);
  if (deal.status === 'in_escrow') return; // Idempotent

  const now         = new Date().toISOString();
  const autoRelease = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const sellerNet   = deal.amount * (1 - COMMISSION);

  await updateDoc('deals', dealId, {
    status:              'in_escrow',
    payment_approved_at: now,
    auto_release_at:     autoRelease,
    seller_net:          sellerNet,
    ...(paymentDetails || {}),
  });

  // Mark listing sold (single-purchase)
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

  await createDoc('notifications', {
    user_id: deal.buyer_id, type: 'payment_approved',
    title:   '✅ تم الدفع! الصفقة نشطة',
    body:    `دفعتك $${deal.amount} وصلت للضمان — انتظر تسليم البائع.`,
    link:    `/deals/${dealId}`, read_at: null,
  });

  await createDoc('notifications', {
    user_id: deal.seller_id, type: 'deal_active',
    title:   '🎉 المشتري دفع — سلّم الآن!',
    body:    `$${deal.amount} في Escrow. ستحصل على $${sellerNet.toFixed(2)} بعد تأكيد المشتري.`,
    link:    `/deals/${dealId}`, read_at: null,
  });

  return { dealId, status: 'in_escrow', sellerNet };
}

// ── Paymob Webhook ────────────────────────────────────────────────────
// Paymob posts transaction data here after payment
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

    // Verify HMAC signature
    if (hmacSecret) {
      const {
        amount_cents, created_at, currency, error_occured,
        has_parent_transaction, id, integration_id, is_3d_secure,
        is_auth, is_capture, is_refunded, is_standalone_payment, is_voided,
        order, owner, pending, source_data_pan, source_data_sub_type,
        source_data_type, success,
      } = body.obj || {};

      const concatString = [
        amount_cents, created_at, currency, error_occured,
        has_parent_transaction, id, integration_id, is_3d_secure,
        is_auth, is_capture, is_refunded, is_standalone_payment, is_voided,
        order?.id, owner, pending, source_data_pan, source_data_sub_type,
        source_data_type, success,
      ].join('');

      const expectedHmac = createHmac('sha512', hmacSecret)
        .update(concatString)
        .digest('hex');

      const receivedHmac = req.nextUrl.searchParams.get('hmac') || '';
      if (receivedHmac && expectedHmac !== receivedHmac) {
        console.error('[paymob-webhook] HMAC mismatch');
        return NextResponse.json({ error: 'Invalid HMAC' }, { status: 400 });
      }
    }

    const txn = body.obj;

    // Only process successful transactions
    if (txn?.success !== true) {
      console.log('[paymob-webhook] Transaction not successful:', txn?.id);
      return NextResponse.json({ received: true });
    }

    // Get deal_id: Intention API v2 uses special_reference; classic uses merchant_order_id
    const dealId = txn?.order?.merchant_order_id
      || txn?.extra?.special_reference
      || txn?.source_data?.extra?.special_reference
      || body?.obj?.special_reference;

    if (!dealId) {
      console.error('[paymob-webhook] No deal_id found in webhook payload', JSON.stringify(body).slice(0, 300));
      return NextResponse.json({ error: 'No deal_id' }, { status: 400 });
    }

    await activateDeal(dealId, {
      paymob_transaction_id: txn.id,
      paymob_order_id:       txn.order?.id,
    });

    console.log(`[paymob-webhook] Deal ${dealId} activated ✅`);
    return NextResponse.json({ received: true });

  } catch (e: any) {
    console.error('[paymob-webhook]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
