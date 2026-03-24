import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc } from '@/lib/firebase';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return apiError('كلمة المرور الحالية والجديدة مطلوبتان');
    if (newPassword.length < 8) return apiError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');

    const user = await getDoc('users', auth.userId);
    if (!user) return apiError('المستخدم غير موجود', 404);
    if (!user.password_hash) return apiError('هذا الحساب مرتبط بـ Google — لا يمكن تغيير الباسورد');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return apiError('كلمة المرور الحالية غير صحيحة');

    const newHash = await bcrypt.hash(newPassword, 12);
    await updateDoc('users', auth.userId, { password_hash: newHash });

    return apiSuccess({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (e: any) {
    console.error('[users/me/password]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
