import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/requests — list all requests with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'open';
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    const db = getDb();
    let where = 'WHERE r.status = ?';
    const params: any[] = [status];

    if (category) { where += ' AND r.category = ?'; params.push(category); }
    if (minBudget) { where += ' AND r.budget_max >= ?'; params.push(Number(minBudget)); }
    if (maxBudget) { where += ' AND r.budget_min <= ?'; params.push(Number(maxBudget)); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM requests r ${where}`).get(...params) as { count: number };

    const requests = db.prepare(`
      SELECT
        r.*,
        u.username, u.display_name, u.avatar, u.rating, u.role
      FROM requests r
      JOIN users u ON u.id = r.user_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return apiSuccess({
      requests,
      pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) },
    });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/requests — create a new request
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { title, description, category, budget_min, budget_max, deadline_days } = await req.json();
    if (!title || !category) return apiError('العنوان والقسم مطلوبان');
    if (title.length < 10) return apiError('العنوان يجب أن يكون 10 أحرف على الأقل');

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO requests (user_id, title, description, category, budget_min, budget_max, deadline_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.userId, title, description || null, category, budget_min || null, budget_max || null, deadline_days || 7) as any;

    return apiSuccess({ id: result.lastInsertRowid, message: 'تم نشر طلبك بنجاح' }, 201);
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
