import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiSuccess, apiError, calculateCommission } from '@/lib/auth';

const CRON_SECRET = process.env.CRON_SECRET || 'trustdeal-cron-secret-2025';
const AUTO_RELEASE_DAYS = 7; // 7 أيام من التسليم لو المشتري لم يرد

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.nextUrl.searchParams.get('secret');
  if (secret !== CRON_SECRET) return apiError('Unauthorized', 401);

  const db = getDb();
  let autoReleased = 0;
  let protectionReleased = 0;
  let errors = 0;

  try {
    // ─── 1) إطلاق أموال الصفقات المكتملة بعد انتهاء فترة الحماية ─────
    const completedPendingPayout = db.prepare(`
      SELECT * FROM deals
      WHERE status = 'completed'
        AND payout_released = 0
        AND protection_expires_at IS NOT NULL
        AND protection_expires_at <= datetime('now')
    `).all() as any[];

    const releasePayout = db.transaction((deals: any[]) => {
      for (const deal of deals) {
        try {
          db.prepare(`UPDATE deals SET payout_released=1, updated_at=datetime('now') WHERE id=?`).run(deal.id);
          // أضاف صافي البائع (95%) لمحفظته
          db.prepare(`UPDATE users SET wallet_balance=wallet_balance+? WHERE id=?`).run(deal.seller_net, deal.seller_id);
          // أضاف العمولة (5%) لرصيد المنصة (حساب الأدمن)
          db.prepare(`UPDATE users SET platform_balance=platform_balance+? WHERE role='admin'`).run(deal.commission);
          db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'payment_released',?,?,?)`)
            .run(deal.seller_id,
              '💰 تم إطلاق أموالك!',
              `تم تحويل $${deal.seller_net.toFixed(2)} لمحفظتك — انتهت فترة الضمان بأمان.`,
              `/deals/${deal.id}`);
          protectionReleased++;
        } catch (e) { console.error(e); errors++; }
      }
    });
    releasePayout(completedPendingPayout);

    // ─── 2) إطلاق تلقائي لصفقات in_delivery لم يُؤكدها المشتري ─────
    const overdueDeals = db.prepare(`
      SELECT * FROM deals
      WHERE status IN ('in_delivery', 'in_escrow')
        AND auto_release_at IS NOT NULL
        AND auto_release_at <= datetime('now')
    `).all() as any[];

    const autoRelease = db.transaction((deals: any[]) => {
      for (const deal of deals) {
        try {
          const { sellerNet } = calculateCommission(deal.amount);
          const now = new Date().toISOString();
          const protExpires = new Date(Date.now() + 72 * 3600000).toISOString();
          db.prepare(`
            UPDATE deals SET
              status='completed',
              buyer_confirmed_at=?,
              protection_expires_at=?,
              payout_released=0,
              updated_at=?
            WHERE id=?
          `).run(now, protExpires, now, deal.id);
          db.prepare('UPDATE users SET escrow_balance=MAX(0,escrow_balance-?), total_deals=total_deals+1 WHERE id=?')
            .run(deal.amount, deal.buyer_id);
          db.prepare('UPDATE users SET total_deals=total_deals+1 WHERE id=?').run(deal.seller_id);
          if (deal.listing_id) db.prepare("UPDATE listings SET status='sold' WHERE id=?").run(deal.listing_id);
          db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'deal_update',?,?,?)`)
            .run(deal.seller_id, '⏳ اكتملت الصفقة تلقائياً',
              `تم إكمال الصفقة بعد ${AUTO_RELEASE_DAYS} أيام. أموالك $${sellerNet} ستُحوَّل بعد 72 ساعة.`,
              `/deals/${deal.id}`);
          autoReleased++;
        } catch (e) { console.error(e); errors++; }
      }
    });
    autoRelease(overdueDeals);

    return apiSuccess({
      message: 'Cron complete',
      protectionReleased,
      autoReleased,
      errors,
      processedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[Cron]', e);
    return apiError('Cron job failed', 500);
  }
}
