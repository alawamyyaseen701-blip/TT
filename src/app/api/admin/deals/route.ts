import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/admin/deals — list all deals for admin oversight
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'admin') return apiError('غير مصرح', 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = getDb();
    const whereClause = status ? `WHERE d.status = '${status}'` : '';

    const total = db.prepare(`SELECT COUNT(*) as count FROM deals d ${whereClause}`).get() as { count: number };
    const deals = db.prepare(`
      SELECT
        d.*,
        l.title as listing_title, l.type as listing_type, l.platform,
        buyer.username as buyer_username, buyer.display_name as buyer_name,
        seller.username as seller_username, seller.display_name as seller_name
      FROM deals d
      LEFT JOIN listings l ON l.id = d.listing_id
      JOIN users buyer ON buyer.id = d.buyer_id
      JOIN users seller ON seller.id = d.seller_id
      ${whereClause}
      ORDER BY d.created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);

    return apiSuccess({ deals, pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) } });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/deals — admin can force-cancel or force-complete a deal
export async function PATCH(req: NextRequest) {
  try {
    const admin = getTokenFromRequest(req);
    if (!admin || admin.role !== 'admin') return apiError('غير مصرح', 403);

    const { dealId, action, note } = await req.json();
    if (!dealId || !action) return apiError('dealId و action مطلوبان');
    if (!['force_cancel', 'force_complete'].includes(action)) return apiError('إجراء غير صحيح');

    const db = getDb();
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as any;
    if (!deal) return apiError('الصفقة غير موجودة', 404);

    db.transaction(() => {
      if (action === 'force_cancel') {
        db.prepare("UPDATE deals SET status = 'cancelled' WHERE id = ?").run(dealId);
        if (deal.status === 'in_escrow' || deal.status === 'in_delivery') {
          db.prepare('UPDATE users SET escrow_balance = MAX(0, escrow_balance - ?), wallet_balance = wallet_balance + ? WHERE id = ?')
            .run(deal.amount, deal.amount, deal.buyer_id);
        }
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'deal_cancelled', 'تم إلغاء الصفقة', ?)")
          .run(deal.buyer_id, note || 'تم إلغاء الصفقة من قِبل الإدارة');
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'deal_cancelled', 'تم إلغاء الصفقة', ?)")
          .run(deal.seller_id, note || 'تم إلغاء الصفقة من قِبل الإدارة');
      } else {
        db.prepare("UPDATE deals SET status = 'completed' WHERE id = ?").run(dealId);
        db.prepare('UPDATE users SET escrow_balance = MAX(0, escrow_balance - ?), total_deals = total_deals + 1 WHERE id = ?').run(deal.amount, deal.buyer_id);
        db.prepare('UPDATE users SET wallet_balance = wallet_balance + ?, total_deals = total_deals + 1 WHERE id = ?').run(deal.seller_net, deal.seller_id);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'payment_released', '💰 تم تحرير الأموال', ?)")
          .run(deal.seller_id, `حصلت على $${deal.seller_net} من قِبل الإدارة`);
      }
      db.prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, 'deal', ?)").run(admin.userId, action, dealId);
    })();

    return apiSuccess({ message: 'تم تنفيذ الإجراء بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
