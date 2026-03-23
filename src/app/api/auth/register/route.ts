import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, apiSuccess, apiError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, displayName, phone } = await req.json();

    if (!username || !email || !password || !displayName) {
      return apiError('جميع الحقول مطلوبة');
    }

    if (password.length < 8) return apiError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return apiError('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط');
    if (username.length < 3 || username.length > 30) return apiError('اسم المستخدم بين 3 و30 حرفاً');

    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) return apiError('البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل');

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, email, phone, password_hash, display_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, email, phone || null, passwordHash, displayName) as any;

    const userId = result.lastInsertRowid as number;
    const token = signToken({ userId, username, role: 'user' });

    const response = apiSuccess({
      token,
      user: { id: userId, username, displayName, email, role: 'user' },
    }, 201);

    const res = new Response(response.body, response);
    res.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    return res;
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return apiError('المستخدم موجود مسبقاً');
    return apiError('خطأ في الخادم', 500);
  }
}
