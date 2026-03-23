import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, createDoc, updateDoc } from '@/lib/firebase';

// GET /api/messages
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('deal_id');

    const filters: any[] = [{ field: dealId ? 'deal_id' : 'receiver_id', op: '==', value: dealId || auth.userId }];
    if (!dealId) filters.push({ field: 'read_at', op: '==', value: null });

    let messages;
    if (dealId) {
      messages = await getDocs('messages', [{ field: 'deal_id', op: '==', value: dealId }], { orderBy: 'created_at', direction: 'asc' });
    } else {
      // Get all conversations for the user
      const sent = await getDocs('messages', [{ field: 'sender_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' });
      const received = await getDocs('messages', [{ field: 'receiver_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' });
      messages = [...sent, ...received];
    }

    return apiSuccess({ messages });
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}

// POST /api/messages
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, receiverId, content, type } = await req.json();
    if (!receiverId || !content) return apiError('المستلم والمحتوى مطلوبان');
    if (auth.userId === receiverId) return apiError('لا يمكنك مراسلة نفسك');

    const id = await createDoc('messages', {
      deal_id: dealId || null,
      sender_id: auth.userId,
      receiver_id: receiverId,
      content,
      type: type || 'text',
      read_at: null,
    });

    return apiSuccess({ id, message: 'تم إرسال الرسالة' }, 201);
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}
