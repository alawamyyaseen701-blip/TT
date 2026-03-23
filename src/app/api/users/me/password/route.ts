import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// PATCH /api/users/me/password
export async function PATCH(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return apiError('كلمة المرور الحالية والجديدة مطلوبتان');
    if (newPassword.length < 8) return apiError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');

    const db = getDb();
    const dbUser = db.prepare('SELECT password FROM users WHERE id = ?').get(user.userId) as any;
    if (!dbUser) return apiError('المستخدم غير موجود', 404);

    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) return apiError('كلمة المرور الحالية غير صحيحة');

    const hashed = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.userId);

    return apiSuccess({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
