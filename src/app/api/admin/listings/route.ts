import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

function requireAdmin(req: NextRequest) {
  const user = getTokenFromRequest(req);
  return user?.role === 'admin' ? user : null;
}

// GET /api/admin/listings?status=pending&type=social&page=1
export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = getDb();
    let where = 'WHERE l.status = ?';
    const params: any[] = [status];
    if (type) { where += ' AND l.type = ?'; params.push(type); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM listings l ${where}`).get(...params) as { count: number };
    const listings = db.prepare(`
      SELECT l.*, u.username, u.display_name, u.email, u.role as seller_role
      FROM listings l JOIN users u ON u.id = l.seller_id
      ${where}
      ORDER BY l.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return apiSuccess({ listings, pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) } });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/listings — approve/reject/feature listings
export async function PATCH(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { listingId, action } = await req.json();
    if (!listingId || !action) return apiError('listingId و action مطلوبان');

    const db = getDb();
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId) as any;
    if (!listing) return apiError('الإعلان غير موجود', 404);

    const actions: Record<string, () => void> = {
      approve: () => {
        db.prepare("UPDATE listings SET status = 'active', published_at = datetime('now') WHERE id = ?").run(listingId);
        db.prepare("INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'listing_approved', 'تم قبول إعلانك!', ?, ?)")
          .run(listing.seller_id, `إعلانك "${listing.title}" تم قبوله ونشره`, `/listings/${listingId}`);
      },
      reject: () => {
        db.prepare("UPDATE listings SET status = 'rejected' WHERE id = ?").run(listingId);
        db.prepare("INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'listing_rejected', 'تم رفض إعلانك', ?, ?)")
          .run(listing.seller_id, `إعلانك "${listing.title}" تم رفضه من قبل الإدارة`, `/dashboard`);
      },
      feature: () => db.prepare("UPDATE listings SET featured = 1 WHERE id = ?").run(listingId),
      unfeature: () => db.prepare("UPDATE listings SET featured = 0 WHERE id = ?").run(listingId),
      archive: () => db.prepare("UPDATE listings SET status = 'archived' WHERE id = ?").run(listingId),
    };

    if (!actions[action]) return apiError('إجراء غير معروف');
    actions[action]();

    db.prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, 'listing', ?)").run(admin.userId, action, listingId.toString());
    return apiSuccess({ message: 'تم التعديل بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
