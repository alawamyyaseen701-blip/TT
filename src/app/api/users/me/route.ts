import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, getDocs, updateDoc } from '@/lib/firebase';

// GET /api/users/me
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const user = await getDoc('users', String(auth.userId));
    if (!user) return apiError('المستخدم غير موجود', 404);

    // Pending payout from deals in protection window
    const pendingDeals = await getDocs('deals', [
      { field: 'seller_id', op: '==', value: String(auth.userId) },
      { field: 'status', op: '==', value: 'completed' },
      { field: 'payout_released', op: '==', value: false },
    ]);
    const pendingBalance = pendingDeals.reduce((sum, d) => sum + (d.seller_net || 0), 0);

    const { password_hash, ...safeUser } = user;
    return apiSuccess({ ...safeUser, pendingBalance });
  } catch (e) {
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/users/me
export async function PATCH(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { displayName, bio, country, avatar, phone } = await req.json();
    const updates: Record<string, any> = {};
    if (displayName) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (country) updates.country = country;
    if (avatar) updates.avatar = avatar;
    if (phone !== undefined) updates.phone = phone;

    await updateDoc('users', auth.userId, updates);
    const updated = await getDoc('users', auth.userId);
    const { password_hash, ...safe } = updated!;
    return apiSuccess(safe);
  } catch (e) {
    return apiError('خطأ في الخادم', 500);
  }
}
