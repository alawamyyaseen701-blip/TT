import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { setDoc, getDoc } from '@/lib/firebase';

/**
 * POST /api/messages/typing  — tell others you're typing
 * GET  /api/messages/typing?with=userId — check if that user is typing
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('غير مصرح', 401);

    const { receiverId, isTyping } = await req.json();
    if (!receiverId) return apiError('receiverId مطلوب');

    // Store typing state with TTL: expires after 4 seconds
    await setDoc('typing', `${auth.userId}_${receiverId}`, {
      from: auth.userId,
      to: receiverId,
      typing: isTyping,
      updated_at: new Date().toISOString(),
    });

    return apiSuccess({ ok: true });
  } catch (e: any) {
    return apiError('خطأ', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('غير مصرح', 401);

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get('with');
    if (!withUserId) return apiError('with مطلوب');

    const doc = await getDoc('typing', `${withUserId}_${auth.userId}`);
    if (!doc || !doc.typing) return apiSuccess({ typing: false });

    // Consider stale if > 4 seconds
    const age = Date.now() - new Date(doc.updated_at).getTime();
    return apiSuccess({ typing: age < 4000 });
  } catch (e: any) {
    return apiSuccess({ typing: false });
  }
}
