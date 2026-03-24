import { NextRequest } from 'next/server';
import { apiSuccess, apiError, calculateCommission } from '@/lib/auth';
import { getDocs, updateDoc, createDoc, getDoc } from '@/lib/firebase';

const CRON_SECRET       = process.env.CRON_SECRET || 'trustdeal-cron-secret-2025';
const AUTO_RELEASE_DAYS = 7;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    || req.nextUrl.searchParams.get('secret');
  if (secret !== CRON_SECRET) return apiError('Unauthorized', 401);

  let autoReleased = 0, protectionReleased = 0, errors = 0;
  const now = new Date().toISOString();

  try {
    // ─── 1) Release payout for completed deals whose protection period ended ──
    const completedPending = await getDocs('deals', [
      { field: 'status',           op: '==', value: 'completed' },
      { field: 'payout_released',  op: '==', value: false },
    ]);

    for (const deal of completedPending) {
      if (!deal.protection_expires_at) continue;
      if (new Date(deal.protection_expires_at) > new Date()) continue;
      try {
        await updateDoc('deals', deal.id, { payout_released: true });
        const sellerDoc = await getDoc('users', deal.seller_id);
        await updateDoc('users', deal.seller_id, {
          wallet_balance: (sellerDoc?.wallet_balance || 0) + (deal.seller_net || deal.amount * 0.95),
        });
        await createDoc('notifications', {
          user_id: deal.seller_id, type: 'payment_released',
          title: '💰 تم إطلاق أموالك!',
          body:  `تم تحويل $${(deal.seller_net || deal.amount * 0.95).toFixed(2)} لمحفظتك.`,
          link:  `/deals/${deal.id}`, read_at: null,
        });
        protectionReleased++;
      } catch (e) { console.error('[cron payout]', e); errors++; }
    }

    // ─── 2) Auto-release for overdue in_delivery / in_escrow deals ───────────
    const overdueDeals = await getDocs('deals', [
      { field: 'status', op: 'in', value: ['in_delivery', 'in_escrow'] },
    ]);

    for (const deal of overdueDeals) {
      if (!deal.auto_release_at) continue;
      if (new Date(deal.auto_release_at) > new Date()) continue;
      try {
        const { sellerNet } = calculateCommission(deal.amount);
        const protExpires   = new Date(Date.now() + 72 * 3_600_000).toISOString();
        await updateDoc('deals', deal.id, {
          status: 'completed', buyer_confirmed_at: now,
          protection_expires_at: protExpires, payout_released: false,
        });
        const sellerDoc = await getDoc('users', deal.seller_id);
        await updateDoc('users', deal.seller_id, {
          total_deals: (sellerDoc?.total_deals || 0) + 1,
        });
        if (deal.listing_id) await updateDoc('listings', deal.listing_id, { status: 'sold' });
        await createDoc('notifications', {
          user_id: deal.seller_id, type: 'deal_update',
          title: '⏳ اكتملت الصفقة تلقائياً',
          body:  `تم إكمال الصفقة بعد ${AUTO_RELEASE_DAYS} أيام. أموالك $${sellerNet} ستُحوَّل بعد 72 ساعة.`,
          link:  `/deals/${deal.id}`, read_at: null,
        });
        autoReleased++;
      } catch (e) { console.error('[cron auto-release]', e); errors++; }
    }

    return apiSuccess({ message: 'Cron complete', protectionReleased, autoReleased, errors, processedAt: now });
  } catch (e) {
    console.error('[Cron]', e);
    return apiError('Cron job failed', 500);
  }
}
