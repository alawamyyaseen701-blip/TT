import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc, getDb } from '@/lib/firebase';

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const notifs = await getDocs('notifications',
      [{ field: 'user_id', op: '==', value: auth.userId }],
      { orderBy: 'created_at', direction: 'desc', limit: 50 }
    );
    const unreadCount = notifs.filter(n => !n.read_at).length;
    return apiSuccess({ notifications: notifs, unreadCount });
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const notifs = await getDocs('notifications', [
      { field: 'user_id', op: '==', value: auth.userId },
      { field: 'read_at', op: '==', value: null },
    ]);
    const now = new Date().toISOString();
    const db = getDb();
    const batch = db.batch();
    for (const n of notifs) {
      batch.update(db.collection('notifications').doc(n.id), { read_at: now });
    }
    await batch.commit();
    return apiSuccess({ message: 'تم تحديد الكل كمقروء' });
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}
