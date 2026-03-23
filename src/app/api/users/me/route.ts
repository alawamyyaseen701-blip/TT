import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/users/me — current user profile
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const profile = db.prepare(`
      SELECT id, username, email, phone, display_name, avatar, bio, country,
             role, status, rating, total_deals, total_reviews,
             wallet_balance, escrow_balance,
             is_email_verified, is_phone_verified, joined_at, last_seen
      FROM users WHERE id = ?
    `).get(user.userId) as any;

    if (!profile) return apiError('المستخدم غير موجود', 404);

    // Stats
    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN seller_id = ? AND status = 'completed' THEN 1 END) as total_sales,
        COUNT(CASE WHEN buyer_id = ? AND status = 'completed' THEN 1 END) as total_purchases,
        COUNT(CASE WHEN (buyer_id = ? OR seller_id = ?) AND status IN ('in_escrow','in_delivery','disputed') THEN 1 END) as active_deals,
        SUM(CASE WHEN seller_id = ? AND status = 'completed' THEN seller_net ELSE 0 END) as total_earned
      FROM deals WHERE buyer_id = ? OR seller_id = ?
    `).get(user.userId, user.userId, user.userId, user.userId, user.userId, user.userId, user.userId) as any;

    const unreadMsgCount = db.prepare('SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND read_at IS NULL').get(user.userId) as any;
    const unreadNotifCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL').get(user.userId) as any;

    return apiSuccess({
      user: profile,
      stats: {
        totalSales: stats.total_sales || 0,
        totalPurchases: stats.total_purchases || 0,
        activeDeals: stats.active_deals || 0,
        totalEarned: stats.total_earned || 0,
        unreadMessages: unreadMsgCount.c || 0,
        unreadNotifications: unreadNotifCount.c || 0,
      },
    });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/users/me — update profile
export async function PATCH(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const body = await req.json();
    const { displayName, bio, country, phone } = body;

    const db = getDb();
    db.prepare(`
      UPDATE users SET
        display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        country = COALESCE(?, country),
        phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(displayName || null, bio || null, country || null, phone || null, user.userId);

    return apiSuccess({ message: 'تم تحديث الملف الشخصي' });
  } catch {
    return apiError('خطأ في الخادم', 500);
  }
}
