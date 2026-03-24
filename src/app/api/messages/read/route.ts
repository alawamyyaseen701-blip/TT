import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc } from '@/lib/firebase';

/**
 * PATCH /api/messages/read?with=userId
 * Marks all messages from `with` to current user as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get('with');
    if (!withUserId) return apiError('with param مطلوب');

    // Fetch unread messages sent BY withUserId TO current user
    const unread = await getDocs('messages', [
      { field: 'sender_id',   op: '==', value: withUserId },
      { field: 'receiver_id', op: '==', value: auth.userId },
      { field: 'read_at',     op: '==', value: null },
    ]);

    const now = new Date().toISOString();
    await Promise.all(unread.map((msg: any) =>
      updateDoc('messages', msg.id, { read_at: now })
    ));

    return apiSuccess({ marked: unread.length });
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
