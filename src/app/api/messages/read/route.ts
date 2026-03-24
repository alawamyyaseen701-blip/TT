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

    // Use single-field filter only (avoids composite index requirement)
    // Then filter receiver_id and read_at in JS
    const fromSender = await getDocs('messages', [
      { field: 'sender_id', op: '==', value: withUserId },
    ]);
    const unread = fromSender.filter((msg: any) =>
      msg.receiver_id === auth.userId && !msg.read_at
    );

    const now = new Date().toISOString();
    await Promise.all(unread.map((msg: any) =>
      updateDoc('messages', msg.id, { read_at: now })
    ));

    return apiSuccess({ marked: unread.length });
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
