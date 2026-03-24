import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { findOne, getDocs, createDoc, updateDoc } from '@/lib/firebase';

// GET /api/users/[username]
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const user = await findOne('users', 'username', username);
    if (!user) return apiError('المستخدم غير موجود', 404);

    const [listings, reviews] = await Promise.all([
      getDocs('listings', [{ field: 'seller_id', op: '==', value: user.id }, { field: 'status', op: '==', value: 'active' }], { limit: 20 }),
      getDocs('reviews',  [{ field: 'reviewed_id', op: '==', value: user.id }], { orderBy: 'created_at', direction: 'desc', limit: 10 }),
    ]);

    // Public profile — strip sensitive fields
    const { password_hash, ...publicProfile } = user as any;
    return apiSuccess({ user: publicProfile, listings, reviews });
  } catch (e: any) {
    console.error('[users/username GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/users/[username] — update profile (own only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { username } = await params;
    const target = await findOne('users', 'username', username);
    if (!target) return apiError('المستخدم غير موجود', 404);
    if (auth.userId !== target.id && auth.role !== 'admin') return apiError('غير مصرح', 403);

    const body = await req.json();
    const allowed = ['display_name', 'bio', 'country', 'avatar', 'phone'];
    const updates: Record<string, any> = {};
    for (const key of allowed) { if (body[key] !== undefined) updates[key] = body[key]; }
    if (Object.keys(updates).length === 0) return apiError('لا توجد بيانات للتحديث');

    await updateDoc('users', target.id, updates);
    return apiSuccess({ message: 'تم التحديث بنجاح' });
  } catch (e: any) {
    console.error('[users/username PATCH]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
