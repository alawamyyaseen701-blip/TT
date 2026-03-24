import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { createDoc } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { type, reason, description, targetId, targetType } = await req.json();
    if (!reason || !targetId || !targetType) return apiError('البيانات ناقصة');
    await createDoc('reports', { reporter_id: auth.userId, type: type || 'other', reason, description: description || null, target_id: targetId, target_type: targetType, status: 'pending' });
    return apiSuccess({ message: 'تم إرسال البلاغ بنجاح' }, 201);
  } catch { return apiError('خطأ في الخادم', 500); }
}
