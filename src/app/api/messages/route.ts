import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, createDoc, getDoc } from '@/lib/firebase';

// GET /api/messages
// ?with=userId  → get messages between current user and that user
// (no params)   → get conversations list (grouped by other user)
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get('with');
    const dealId     = searchParams.get('deal_id');

    // ── Messages with a specific user ──
    if (withUserId) {
      const [sent, received] = await Promise.all([
        getDocs('messages', [
          { field: 'sender_id',   op: '==', value: auth.userId },
          { field: 'receiver_id', op: '==', value: withUserId },
        ], { orderBy: 'created_at', direction: 'asc' }),
        getDocs('messages', [
          { field: 'sender_id',   op: '==', value: withUserId },
          { field: 'receiver_id', op: '==', value: auth.userId },
        ], { orderBy: 'created_at', direction: 'asc' }),
      ]);

      // Merge and sort chronologically
      const all = [...sent, ...received].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return apiSuccess({ messages: all });
    }

    // ── Deal messages ──
    if (dealId) {
      const messages = await getDocs('messages',
        [{ field: 'deal_id', op: '==', value: dealId }],
        { orderBy: 'created_at', direction: 'asc' }
      );
      return apiSuccess({ messages });
    }

    // ── Conversations list (all messages involving current user) ──
    const [sent, received] = await Promise.all([
      getDocs('messages', [{ field: 'sender_id',   op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' }),
      getDocs('messages', [{ field: 'receiver_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' }),
    ]);

    // Group into conversations by other user ID
    const convMap = new Map<string, any>();
    const allMsgs = [...sent, ...received].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const msg of allMsgs) {
      const otherId = msg.sender_id === auth.userId ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          other_user_id:    otherId,
          last_message:     msg.content,
          last_message_at:  msg.created_at,
          unread_count:     (!msg.read_at && msg.receiver_id === auth.userId) ? 1 : 0,
          deal_id:          msg.deal_id || null,
          // Will be filled below
          other_display_name: null,
          other_username:     null,
        });
      } else if (!msg.read_at && msg.receiver_id === auth.userId) {
        convMap.get(otherId).unread_count += 1;
      }
    }

    // Enrich with user info
    const conversations = await Promise.all(
      Array.from(convMap.values()).map(async (conv) => {
        try {
          const user = await getDoc('users', conv.other_user_id);
          if (user) {
            conv.other_display_name = user.display_name || user.username;
            conv.other_username     = user.username;
          }
        } catch { /* user fetch failed */ }
        return conv;
      })
    );

    return apiSuccess({ conversations });
  } catch (e: any) {
    console.error('[messages GET]', e);
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, receiverId, content, type } = await req.json();
    if (!receiverId || !content?.trim()) return apiError('المستلم والمحتوى مطلوبان');
    if (String(auth.userId) === String(receiverId)) return apiError('لا يمكنك مراسلة نفسك');

    const id = await createDoc('messages', {
      deal_id:     dealId   || null,
      sender_id:   auth.userId,
      receiver_id: receiverId,
      content:     content.trim(),
      type:        type || 'text',
      read_at:     null,
    });

    return apiSuccess({ id, message: 'تم إرسال الرسالة' }, 201);
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
