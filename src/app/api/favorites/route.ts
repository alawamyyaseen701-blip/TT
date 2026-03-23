import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/favorites — get user's favorites
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const favorites = db.prepare(`
      SELECT
        l.id, l.type, l.platform, l.title, l.price, l.currency,
        l.country, l.followers, l.monetized, l.featured, l.status,
        l.created_at,
        u.username as seller_username, u.display_name as seller_name,
        u.rating as seller_rating, u.role as seller_role,
        f.created_at as saved_at
      FROM favorites f
      JOIN listings l ON l.id = f.listing_id
      JOIN users u ON u.id = l.seller_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(user.userId);

    return apiSuccess({ favorites });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/favorites — toggle favorite
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { listingId } = await req.json();
    if (!listingId) return apiError('معرف الإعلان مطلوب');

    const db = getDb();
    const existing = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?').get(user.userId, listingId);

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?').run(user.userId, listingId);
      db.prepare('UPDATE listings SET favorites = MAX(0, favorites - 1) WHERE id = ?').run(listingId);
      return apiSuccess({ saved: false, message: 'تم إزالة الإعلان من المفضلة' });
    } else {
      db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)').run(user.userId, listingId);
      db.prepare('UPDATE listings SET favorites = favorites + 1 WHERE id = ?').run(listingId);
      return apiSuccess({ saved: true, message: 'تم إضافة الإعلان إلى المفضلة' });
    }
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
