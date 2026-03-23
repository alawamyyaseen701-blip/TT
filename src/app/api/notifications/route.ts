import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const db = getDb();
    const where = unreadOnly ? 'WHERE user_id = ? AND read_at IS NULL' : 'WHERE user_id = ?';
    const notifications = db.prepare(`
      SELECT * FROM notifications ${where}
      ORDER BY created_at DESC LIMIT 50
    `).all(user.userId);

    const unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL').get(user.userId) as any;

    return apiSuccess({ notifications, unreadCount: unreadCount.c });
  } catch {
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { ids } = await req.json();
    const db = getDb();

    if (ids && Array.isArray(ids)) {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`UPDATE notifications SET read_at = datetime('now') WHERE id IN (${placeholders}) AND user_id = ?`)
        .run(...ids, user.userId);
    } else {
      // Mark all as read
      db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(user.userId);
    }

    return apiSuccess({ message: 'تم التحديث' });
  } catch {
    return apiError('خطأ في الخادم', 500);
  }
}
