import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError, generateId } from '@/lib/auth';

// POST /api/reports — report a user, listing, or message
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { targetType, targetId, reason, description } = await req.json();
    if (!targetType || !targetId || !reason) return apiError('targetType و targetId و reason مطلوبة');
    if (!['user', 'listing', 'message', 'deal'].includes(targetType)) return apiError('نوع البلاغ غير صحيح');

    const db = getDb();
    const existingReport = db.prepare(
      "SELECT id FROM disputes WHERE opened_by = ? AND deal_id = ? AND status = 'open'"
    ).get(user.userId, targetId);

    const reportId = generateId();
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, 'report', ?, ?, ?, datetime('now'))
    `).run(reportId, user.userId, targetType, targetId, JSON.stringify({ reason, description }));

    // Notify admins via a notification
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: string }[];
    const stmt = db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'new_report', '🚩 بلاغ جديد', ?)");
    for (const a of admins) {
      stmt.run(a.id, `بلاغ على ${targetType} #${targetId}: ${reason}`);
    }

    return apiSuccess({ message: 'تم إرسال البلاغ بنجاح، سيتم مراجعته من قِبل الإدارة' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// GET /api/reports — admin: list all reports
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'admin') return apiError('غير مصرح', 403);

    const db = getDb();
    const reports = db.prepare(`
      SELECT al.*, u.username as reporter_username, u.display_name as reporter_name
      FROM activity_logs al
      JOIN users u ON u.id = al.user_id
      WHERE al.action = 'report'
      ORDER BY al.created_at DESC LIMIT 100
    `).all();

    return apiSuccess({ reports });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
