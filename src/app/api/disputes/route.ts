import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError, generateDisputeId } from '@/lib/auth';

// GET /api/disputes — list disputes (admin) or user's disputes
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const where = user.role === 'admin'
      ? ''
      : 'WHERE d.id IN (SELECT id FROM deals WHERE buyer_id = ? OR seller_id = ?)';
    const params = user.role === 'admin' ? [] : [user.userId, user.userId];

    const disputes = db.prepare(`
      SELECT disp.*, d.amount, d.buyer_id, d.seller_id,
        buyer.display_name as buyer_name, seller.display_name as seller_name,
        opener.display_name as opened_by_name
      FROM disputes disp
      JOIN deals d ON d.id = disp.deal_id
      JOIN users buyer ON buyer.id = d.buyer_id
      JOIN users seller ON seller.id = d.seller_id
      JOIN users opener ON opener.id = disp.opened_by
      ${where}
      ORDER BY disp.created_at DESC
    `).all(...params);

    return apiSuccess({ disputes });
  } catch {
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/disputes — open a dispute
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, reason, description } = await req.json();
    if (!dealId || !reason) return apiError('معرف الصفقة والسبب مطلوبان');

    const db = getDb();
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as any;
    if (!deal) return apiError('الصفقة غير موجودة', 404);
    if (deal.buyer_id !== user.userId && deal.seller_id !== user.userId) return apiError('غير مصرح', 403);
    if (!['in_escrow', 'in_delivery', 'delivered'].includes(deal.status)) return apiError('لا يمكن فتح نزاع الآن');

    const existingDispute = db.prepare("SELECT id FROM disputes WHERE deal_id = ? AND status = 'open'").get(dealId);
    if (existingDispute) return apiError('يوجد نزاع مفتوح بالفعل لهذه الصفقة');

    const disputeId = generateDisputeId();
    db.transaction(() => {
      db.prepare(`
        INSERT INTO disputes (id, deal_id, opened_by, reason, description, status)
        VALUES (?, ?, ?, ?, ?, 'open')
      `).run(disputeId, dealId, user.userId, reason, description || null);

      db.prepare("UPDATE deals SET status = 'disputed', updated_at = datetime('now') WHERE id = ?").run(dealId);

      // Notify admin (user 1 typically)
      db.prepare(`INSERT INTO notifications (user_id, type, title, body, link) VALUES (1, 'new_dispute', ?, ?, ?)`)
        .run(`نزاع جديد #${disputeId}`, `تم فتح نزاع على صفقة #${dealId}`, `/admin`);

      // Notify other party
      const otherParty = deal.buyer_id === user.userId ? deal.seller_id : deal.buyer_id;
      db.prepare(`INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'dispute_opened', ?, ?, ?)`)
        .run(otherParty, '⚖️ تم فتح نزاع', `تم فتح نزاع على صفقة #${dealId}`, `/deals/${dealId}`);
    })();

    return apiSuccess({ disputeId, status: 'open' }, 201);
  } catch {
    return apiError('خطأ في الخادم', 500);
  }
}
