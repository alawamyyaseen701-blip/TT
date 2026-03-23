import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/requests/[id] — get single request + its offers
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const request = db.prepare(`
      SELECT r.*, u.username, u.display_name, u.avatar, u.rating, u.role
      FROM requests r JOIN users u ON u.id = r.user_id
      WHERE r.id = ?
    `).get(id) as any;
    if (!request) return apiError('الطلب غير موجود', 404);

    const offers = db.prepare(`
      SELECT ro.*, u.username, u.display_name, u.avatar, u.rating, u.role
      FROM request_offers ro JOIN users u ON u.id = ro.seller_id
      WHERE ro.request_id = ?
      ORDER BY ro.created_at DESC
    `).all(id);

    return apiSuccess({ ...request, offers });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/requests/[id]/offers — submit an offer
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const request = db.prepare("SELECT * FROM requests WHERE id = ? AND status = 'open'").get(id) as any;
    if (!request) return apiError('الطلب غير موجود أو مغلق', 404);
    if (request.user_id === user.userId) return apiError('لا يمكنك إرسال عرض على طلبك الخاص');

    const existing = db.prepare("SELECT id FROM request_offers WHERE request_id = ? AND seller_id = ? AND status = 'pending'").get(id, user.userId);
    if (existing) return apiError('لديك عرض مسبق على هذا الطلب');

    const { price, delivery_days, message } = await req.json();
    if (!price || price <= 0) return apiError('السعر يجب أن يكون أكبر من صفر');

    const result = db.prepare(`
      INSERT INTO request_offers (request_id, seller_id, price, delivery_days, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user.userId, price, delivery_days || 3, message || null) as any;

    // Update offers count
    db.prepare('UPDATE requests SET offers_count = offers_count + 1 WHERE id = ?').run(id);

    // Notify requester
    const seller = db.prepare('SELECT display_name FROM users WHERE id = ?').get(user.userId) as any;
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (?, 'new_offer', ?, ?, ?)
    `).run(request.user_id, 'عرض جديد!', `${seller.display_name} أرسل لك عرضاً على طلبك "${request.title}"`, `/requests/${id}`);

    return apiSuccess({ id: result.lastInsertRowid, message: 'تم إرسال عرضك بنجاح' }, 201);
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/requests/[id] — accept/reject offer or close request
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
    if (!request) return apiError('الطلب غير موجود', 404);
    if (request.user_id !== user.userId) return apiError('ليس لديك صلاحية تعديل هذا الطلب', 403);

    const { action, offerIdToAccept } = await req.json();

    if (action === 'close') {
      db.prepare("UPDATE requests SET status = 'closed' WHERE id = ?").run(id);
      return apiSuccess({ message: 'تم إغلاق الطلب' });
    }

    if (action === 'accept_offer' && offerIdToAccept) {
      db.transaction(() => {
        db.prepare("UPDATE request_offers SET status = 'accepted' WHERE id = ?").run(offerIdToAccept);
        db.prepare("UPDATE request_offers SET status = 'rejected' WHERE request_id = ? AND id != ? AND status = 'pending'").run(id, offerIdToAccept);
        db.prepare("UPDATE requests SET status = 'in_progress' WHERE id = ?").run(id);
      })();
      return apiSuccess({ message: 'تم قبول العرض' });
    }

    return apiError('إجراء غير معروف');
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
