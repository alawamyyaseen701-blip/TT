import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

function requireAdmin(req: NextRequest) {
  const user = getTokenFromRequest(req);
  return user?.role === 'admin' ? user : null;
}

// GET /api/admin/disputes?status=open
export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'open';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = getDb();
    const where = `WHERE d.status = ?`;
    const total = db.prepare(`SELECT COUNT(*) as count FROM disputes d ${where}`).get(status) as { count: number };

    const disputes = db.prepare(`
      SELECT
        d.*,
        opener.username as opener_username, opener.display_name as opener_name,
        deals.amount, deals.buyer_id, deals.seller_id,
        buyer.display_name as buyer_name, seller.display_name as seller_name,
        l.title as listing_title
      FROM disputes d
      JOIN users opener ON opener.id = d.opened_by
      JOIN deals ON deals.id = d.deal_id
      JOIN users buyer ON buyer.id = deals.buyer_id
      JOIN users seller ON seller.id = deals.seller_id
      LEFT JOIN listings l ON l.id = deals.listing_id
      ${where}
      ORDER BY d.created_at DESC LIMIT ? OFFSET ?
    `).all(status, limit, offset);

    return apiSuccess({ disputes, pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) } });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/disputes — resolve dispute
export async function PATCH(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { disputeId, resolution, note, refundAmount } = await req.json();
    if (!disputeId || !resolution) return apiError('disputeId و resolution مطلوبان');

    const validResolutions = ['resolved_buyer', 'resolved_seller', 'resolved_partial', 'rejected'];
    if (!validResolutions.includes(resolution)) return apiError('قرار غير صحيح');

    const db = getDb();
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as any;
    if (!dispute) return apiError('النزاع غير موجود', 404);
    if (dispute.status !== 'open' && dispute.status !== 'under_review') return apiError('النزاع محلول بالفعل');

    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dispute.deal_id) as any;

    db.transaction(() => {
      // Update dispute
      db.prepare(`
        UPDATE disputes SET status = ?, resolution_note = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?
      `).run(resolution, note || null, admin.userId, disputeId);

      if (resolution === 'resolved_buyer') {
        // Full refund to buyer
        db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(deal.amount, deal.buyer_id);
        db.prepare("UPDATE deals SET status = 'refunded' WHERE id = ?").run(deal.id);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'dispute_resolved', 'تم حل النزاع', 'تم استرداد مبلغك كاملاً')")
          .run(deal.buyer_id);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'dispute_resolved', 'تم حل النزاع', 'تم البت في النزاع لصالح المشتري')")
          .run(deal.seller_id);

      } else if (resolution === 'resolved_seller') {
        // Release to seller
        db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(deal.seller_net, deal.seller_id);
        db.prepare("UPDATE deals SET status = 'completed' WHERE id = ?").run(deal.id);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'dispute_resolved', 'تم حل النزاع', 'تم تحويل المبلغ لحسابك')")
          .run(deal.seller_id);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'dispute_resolved', 'تم حل النزاع', 'تم البت في النزاع لصالح البائع')")
          .run(deal.buyer_id);

      } else if (resolution === 'resolved_partial') {
        const refund = refundAmount || deal.amount / 2;
        const sellerReceives = deal.amount - refund;
        if (refund > 0) db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(refund, deal.buyer_id);
        if (sellerReceives > 0) db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(sellerReceives * 0.95, deal.seller_id);
        db.prepare("UPDATE deals SET status = 'completed' WHERE id = ?").run(deal.id);
      }

      // Free escrow balance from buyer
      db.prepare('UPDATE users SET escrow_balance = MAX(0, escrow_balance - ?) WHERE id = ?').run(deal.amount, deal.buyer_id);

      db.prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, 'dispute', ?)").run(admin.userId, `resolve:${resolution}`, disputeId);
    })();

    return apiSuccess({ message: 'تم حل النزاع بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
