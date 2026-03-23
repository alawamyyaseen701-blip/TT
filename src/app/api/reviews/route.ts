import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/reviews?userId=X — reviews for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!userId) return apiError('معرف المستخدم مطلوب');

    const db = getDb();
    const reviews = db.prepare(`
      SELECT
        r.*,
        u.username as reviewer_username,
        u.display_name as reviewer_name,
        u.avatar as reviewer_avatar,
        u.role as reviewer_role
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.reviewed_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews WHERE reviewed_id = ?
    `).get(userId) as any;

    return apiSuccess({ reviews, stats });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/reviews — post review after deal
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, rating, comment } = await req.json();
    if (!dealId || !rating) return apiError('معرف الصفقة والتقييم مطلوبان');
    if (rating < 1 || rating > 5) return apiError('التقييم يجب أن يكون بين 1 و 5');

    const db = getDb();

    // Verify deal exists and user was part of it
    const deal = db.prepare(`
      SELECT * FROM deals WHERE id = ? AND (buyer_id = ? OR seller_id = ?) AND status = 'completed'
    `).get(dealId, user.userId, user.userId) as any;
    if (!deal) return apiError('الصفقة غير موجودة أو لم تكتمل بعد', 404);

    // Check if already reviewed
    const existing = db.prepare('SELECT id FROM reviews WHERE deal_id = ? AND reviewer_id = ?').get(dealId, user.userId);
    if (existing) return apiError('لقد قيّمت هذه الصفقة مسبقاً');

    // The reviewer rates the OTHER party
    const reviewedId = deal.buyer_id === user.userId ? deal.seller_id : deal.buyer_id;

    const result = db.prepare(`
      INSERT INTO reviews (deal_id, reviewer_id, reviewed_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(dealId, user.userId, reviewedId, rating, comment || null) as any;

    // Update reviewed user's average rating
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE reviewed_id = ?').get(reviewedId) as any;
    db.prepare('UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?')
      .run(parseFloat(stats.avg.toFixed(2)), stats.cnt, reviewedId);

    return apiSuccess({ id: result.lastInsertRowid, message: 'شكراً! تم إرسال تقييمك بنجاح' }, 201);
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
