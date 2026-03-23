import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

function requireAdmin(req: NextRequest) {
  const user = getTokenFromRequest(req);
  return user?.role === 'admin' ? user : null;
}

// GET /api/admin/withdrawals?status=pending
export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = getDb();
    const total = db.prepare(`SELECT COUNT(*) as count FROM withdrawals WHERE status = ?`).get(status) as { count: number };

    const withdrawals = db.prepare(`
      SELECT w.*, u.username, u.display_name, u.email, u.wallet_balance
      FROM withdrawals w JOIN users u ON u.id = w.user_id
      WHERE w.status = ?
      ORDER BY w.created_at DESC LIMIT ? OFFSET ?
    `).all(status, limit, offset);

    return apiSuccess({ withdrawals, pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) } });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/withdrawals — approve or reject
export async function PATCH(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return apiError('غير مصرح', 403);

    const { withdrawalId, action, note } = await req.json();
    if (!withdrawalId || !action) return apiError('withdrawalId و action مطلوبان');
    if (!['approve', 'reject'].includes(action)) return apiError('إجراء غير صحيح');

    const db = getDb();
    const wd = db.prepare("SELECT * FROM withdrawals WHERE id = ? AND status = 'pending'").get(withdrawalId) as any;
    if (!wd) return apiError('طلب السحب غير موجود أو تمت معالجته', 404);

    db.transaction(() => {
      if (action === 'approve') {
        db.prepare("UPDATE withdrawals SET status = 'paid', admin_note = ?, processed_at = datetime('now') WHERE id = ?").run(note || null, withdrawalId);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'withdrawal_approved', 'تم قبول طلب السحب', 'تم تحويل المبلغ إلى حسابك')")
          .run(wd.user_id);
      } else {
        // Refund amount to wallet
        db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(wd.amount, wd.user_id);
        db.prepare("UPDATE withdrawals SET status = 'rejected', admin_note = ?, processed_at = datetime('now') WHERE id = ?").run(note || null, withdrawalId);
        db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'withdrawal_rejected', 'تم رفض طلب السحب', ?)")
          .run(wd.user_id, note || 'تم رفض طلب السحب وإعادة المبلغ لرصيدك');
      }
    })();

    return apiSuccess({ message: action === 'approve' ? 'تم قبول طلب السحب' : 'تم رفض طلب السحب وإعادة المبلغ' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
