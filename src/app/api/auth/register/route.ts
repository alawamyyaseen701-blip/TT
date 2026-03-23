import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { findByEmailOrUsername, setDoc } from '@/lib/firebase';
import { signToken, apiSuccess, apiError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, displayName, phone } = await req.json();

    if (!username || !email || !password || !displayName)
      return apiError('جميع الحقول مطلوبة');
    if (password.length < 8) return apiError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return apiError('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط');
    if (username.length < 3 || username.length > 30) return apiError('اسم المستخدم بين 3 و30 حرفاً');

    // Check existing
    const existing = await findByEmailOrUsername(email, username);
    if (existing) return apiError('البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل');

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await setDoc('users', userId, {
      username,
      email,
      phone: phone || null,
      password_hash: passwordHash,
      display_name: displayName,
      avatar: null,
      bio: null,
      country: 'SA',
      role: 'user',
      status: 'active',
      rating: 0,
      total_deals: 0,
      total_reviews: 0,
      wallet_balance: 0,
      escrow_balance: 0,
      platform_balance: 0,
      is_email_verified: false,
      is_phone_verified: false,
      last_seen: new Date().toISOString(),
    });

    const token = signToken({ userId, username, role: 'user' });
    const response = apiSuccess({ token, user: { id: userId, username, displayName, email, role: 'user' } }, 201);
    const res = new Response(response.body, response);
    res.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    return res;
  } catch (e: any) {
    console.error('[register]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
