import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

function requireAdmin(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return null;
  if (user.role !== 'admin') return null;
  return user;
}

// GET /api/admin/users?page=1&q=search&status=active&role=user
export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (q) { where += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (role) { where += ' AND role = ?'; params.push(role); }

    const db = getDb();
    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as { count: number };
    const users = db.prepare(`
      SELECT id, username, email, display_name, phone, country, role, status,
             rating, total_deals, total_reviews, wallet_balance, escrow_balance,
             is_email_verified, joined_at, last_seen
      FROM users ${where}
      ORDER BY joined_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return apiSuccess({ users, pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) } });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/users — update user status/role
export async function PATCH(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { userId, action, role } = await req.json();
    if (!userId || !action) return apiError('userId و action مطلوبان');

    const db = getDb();
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!target) return apiError('المستخدم غير موجود', 404);
    if (target.role === 'admin') return apiError('لا يمكن تعديل حساب الإدارة');

    const updates: Record<string, string> = {
      ban: "UPDATE users SET status = 'banned' WHERE id = ?",
      unban: "UPDATE users SET status = 'active' WHERE id = ?",
      suspend: "UPDATE users SET status = 'suspended' WHERE id = ?",
      verify: "UPDATE users SET role = 'verified' WHERE id = ?",
      unverify: "UPDATE users SET role = 'user' WHERE id = ?",
    };

    if (action === 'set_role' && role) {
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
    } else if (updates[action]) {
      db.prepare(updates[action]).run(userId);
    } else {
      return apiError('إجراء غير معروف');
    }

    // Log activity
    db.prepare(`INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, 'user', ?)`).run(admin.userId, action, userId.toString());

    return apiSuccess({ message: 'تم التعديل بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// DELETE /api/admin/users — delete user
export async function DELETE(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return apiError('userId مطلوب');

    const db = getDb();
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!target) return apiError('المستخدم غير موجود', 404);
    if (target.role === 'admin') return apiError('لا يمكن حذف حساب الإدارة');

    db.prepare("UPDATE users SET status = 'banned', email = email || '_deleted', username = username || '_deleted' WHERE id = ?").run(userId);
    return apiSuccess({ message: 'تم حذف المستخدم' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
