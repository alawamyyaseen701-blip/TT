import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { findOne } from '@/lib/firebase';
import { signToken, apiSuccess, apiError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return apiError('البريد وكلمة المرور مطلوبان');

    const user = await findOne('users', 'email', email);
    if (!user) return apiError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    if (user.status === 'banned') return apiError('تم حظر هذا الحساب', 403);
    if (user.status === 'suspended') return apiError('تم تعليق هذا الحساب مؤقتاً', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return apiError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);

    // Update last seen
    const { updateDoc } = await import('@/lib/firebase');
    await updateDoc('users', user.id, { last_seen: new Date().toISOString() });

    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    const response = apiSuccess({
      token,
      user: {
        id: user.id, username: user.username,
        displayName: user.display_name, email: user.email,
        role: user.role, avatar: user.avatar,
        walletBalance: user.wallet_balance, rating: user.rating,
      },
    });
    const res = new Response(response.body, response);
    res.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    return res;
  } catch (e: any) {
    console.error('[login]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
