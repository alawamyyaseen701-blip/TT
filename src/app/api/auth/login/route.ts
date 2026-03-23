import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, apiSuccess, apiError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return apiError('البريد وكلمة المرور مطلوبان');

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, email) as any;
    if (!user) return apiError('المستخدم غير موجود', 404);
    if (user.status !== 'active') return apiError('الحساب موقوف أو محظور', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return apiError('كلمة المرور غير صحيحة', 401);

    // Update last seen
    db.prepare('UPDATE users SET last_seen = datetime("now") WHERE id = ?').run(user.id);

    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    const res = apiSuccess({
      token,
      user: {
        id: user.id, username: user.username, displayName: user.display_name,
        email: user.email, role: user.role, avatar: user.avatar,
        rating: user.rating, totalDeals: user.total_deals,
        walletBalance: user.wallet_balance, escrowBalance: user.escrow_balance,
      },
    });

    // Set HTTP-only cookie
    const response = new Response(res.body, res);
    response.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    return response;
  } catch (e) {
    return apiError('خطأ في الخادم', 500);
  }
}
