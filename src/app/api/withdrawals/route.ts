import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/withdrawals
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();

    const withdrawals = db.prepare(`
      SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC
    `).all(user.userId);

    const wallet = db.prepare(
      'SELECT wallet_balance, escrow_balance FROM users WHERE id = ?'
    ).get(user.userId) as any;

    // الأموال في فترة الحماية (مكتملة لكن لم يُفرج عنها بعد)
    const pendingRow = db.prepare(`
      SELECT COALESCE(SUM(seller_net), 0) as pending_amount,
             MIN(protection_expires_at) as next_release
      FROM deals
      WHERE seller_id = ?
        AND status = 'completed'
        AND payout_released = 0
        AND protection_expires_at > datetime('now')
    `).get(user.userId) as any;

    // إجمالي العمولات (5%) التي جمعتها المنصة من هذا البائع
    const earned = db.prepare(`
      SELECT COALESCE(SUM(seller_net), 0) as total_earned,
             COALESCE(SUM(commission), 0) as total_commission,
             COUNT(*) as total_deals
      FROM deals
      WHERE seller_id = ? AND status = 'completed' AND payout_released = 1
    `).get(user.userId) as any;

    return apiSuccess({
      wallet,
      withdrawals,
      pendingBalance: pendingRow?.pending_amount || 0,
      nextRelease: pendingRow?.next_release || null,
      stats: {
        totalEarned: earned?.total_earned || 0,
        totalCommission: earned?.total_commission || 0,
        totalDeals: earned?.total_deals || 0,
      },
    });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/withdrawals
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { amount, method, account_details } = await req.json();
    if (!amount || !method || !account_details) return apiError('جميع الحقول مطلوبة');

    const MIN_WITHDRAWAL = 10;
    if (amount < MIN_WITHDRAWAL) return apiError(`الحد الأدنى للسحب هو $${MIN_WITHDRAWAL}`);

    const db = getDb();
    const wallet = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(user.userId) as any;

    if (!wallet || wallet.wallet_balance < amount) {
      return apiError(`رصيدك غير كافٍ. المتاح: $${(wallet?.wallet_balance || 0).toFixed(2)}`);
    }

    // يتحقق من عدم وجود طلب معلق
    const pending = db.prepare("SELECT id FROM withdrawals WHERE user_id = ? AND status = 'pending'").get(user.userId);
    if (pending) return apiError('لديك طلب سحب قيد المراجعة بالفعل — انتظر حتى يُعالَج');

    db.transaction(() => {
      db.prepare(`
        INSERT INTO withdrawals (user_id, amount, method, account_details, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(user.userId, amount, method, account_details);
      // يُجمِّد المبلغ من المحفظة فوراً
      db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amount, user.userId);
      // إشعار للأدمن
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body, link)
        SELECT id, 'withdrawal_request', '💸 طلب سحب جديد', ?, '/admin'
        FROM users WHERE role = 'admin'
      `).run(`طلب سحب $${amount} بطريقة ${method} من المستخدم #${user.userId}`);
    })();

    return apiSuccess({ message: 'تم إرسال طلب السحب — سيتم مراجعته خلال 24-48 ساعة' }, 201);
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
