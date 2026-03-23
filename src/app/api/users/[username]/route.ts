import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/auth';

// GET /api/users/[username] — public profile
export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const db = getDb();

    const user = db.prepare(`
      SELECT
        id, username, display_name, avatar, bio, country, role,
        status, rating, total_deals, total_reviews, joined_at
      FROM users WHERE username = ? AND status != 'banned'
    `).get(username) as any;

    if (!user) return apiError('المستخدم غير موجود', 404);

    // Get active listings
    const listings = db.prepare(`
      SELECT id, type, platform, title, price, currency, followers, monetized, featured, views, favorites, created_at
      FROM listings WHERE seller_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 12
    `).all(user.id);

    // Get reviews
    const reviews = db.prepare(`
      SELECT r.rating, r.comment, r.created_at,
             u.username as reviewer_username, u.display_name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews r JOIN users u ON u.id = r.reviewer_id
      WHERE r.reviewed_id = ?
      ORDER BY r.created_at DESC LIMIT 10
    `).all(user.id);

    return apiSuccess({ user, reviews });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
