import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc, getDocs, createDoc } from '@/lib/firebase';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }     = await params;
    const request    = await getDoc('requests', id);
    if (!request) return apiError('الطلب غير موجود', 404);
    const offers     = await getDocs('request_offers', [{ field: 'request_id', op: '==', value: id }], { orderBy: 'created_at', direction: 'desc' });
    return apiSuccess({ request, offers });
  } catch { return apiError('خطأ في الخادم', 500); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { id }      = await params;
    const request     = await getDoc('requests', id);
    if (!request) return apiError('الطلب غير موجود', 404);
    if (request.status !== 'open') return apiError('الطلب مغلق');
    if (request.user_id === auth.userId) return apiError('لا يمكنك تقديم عرض على طلبك');
    const { price, delivery_days, message } = await req.json();
    if (!price) return apiError('السعر مطلوب');
    await createDoc('request_offers', { request_id: id, seller_id: auth.userId, price, delivery_days: delivery_days || 3, message: message || null, status: 'pending' });
    await updateDoc('requests', id, { offers_count: (request.offers_count || 0) + 1 });
    return apiSuccess({ message: 'تم إرسال العرض بنجاح' }, 201);
  } catch { return apiError('خطأ في الخادم', 500); }
}
