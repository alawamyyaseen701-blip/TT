import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, createDoc, updateDoc, getDoc } from '@/lib/firebase';

// GET /api/withdrawals
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const [withdrawals, user, pendingDeals, doneDeals] = await Promise.all([
      getDocs('withdrawals', [{ field: 'user_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' }),
      getDoc('users', auth.userId),
      getDocs('deals', [
        { field: 'seller_id', op: '==', value: auth.userId },
        { field: 'status', op: '==', value: 'completed' },
        { field: 'payout_released', op: '==', value: false },
      ]),
      getDocs('deals', [
        { field: 'seller_id', op: '==', value: auth.userId },
        { field: 'status', op: '==', value: 'completed' },
        { field: 'payout_released', op: '==', value: true },
      ]),
    ]);

    const pendingBalance = pendingDeals.reduce((s, d) => s + (d.seller_net || 0), 0);
    const nextRelease = pendingDeals.sort((a, b) =>
      new Date(a.protection_expires_at).getTime() - new Date(b.protection_expires_at).getTime()
    )[0]?.protection_expires_at || null;

    return apiSuccess({
      wallet: { wallet_balance: user?.wallet_balance || 0, escrow_balance: user?.escrow_balance || 0 },
      withdrawals,
      pendingBalance,
      nextRelease,
      stats: {
        totalEarned: doneDeals.reduce((s, d) => s + (d.seller_net || 0), 0),
        totalCommission: doneDeals.reduce((s, d) => s + (d.commission || 0), 0),
        totalDeals: doneDeals.length,
      },
    });
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}

// POST /api/withdrawals
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { amount, method, account_details } = await req.json();
    if (!amount || !method || !account_details) return apiError('جميع الحقول مطلوبة');
    if (amount < 10) return apiError('الحد الأدنى للسحب هو $10');

    const user = await getDoc('users', auth.userId);
    if (!user || user.wallet_balance < amount)
      return apiError(`رصيدك غير كافٍ. المتاح: $${(user?.wallet_balance || 0).toFixed(2)}`);

    const pending = await getDocs('withdrawals', [
      { field: 'user_id', op: '==', value: auth.userId },
      { field: 'status', op: '==', value: 'pending' },
    ]);
    if (pending.length > 0) return apiError('لديك طلب سحب قيد المراجعة بالفعل');

    await createDoc('withdrawals', {
      user_id: auth.userId,
      amount, method, account_details,
      status: 'pending',
      admin_note: null,
      processed_at: null,
    });
    await updateDoc('users', auth.userId, { wallet_balance: (user.wallet_balance || 0) - amount });

    // Notify admins
    const admins = await getDocs('users', [{ field: 'role', op: '==', value: 'admin' }]);
    for (const admin of admins) {
      await createDoc('notifications', {
        user_id: admin.id, type: 'withdrawal_request',
        title: '💸 طلب سحب جديد',
        body: `طلب سحب $${amount} بطريقة ${method}`,
        link: '/admin', read_at: null,
      });
    }

    return apiSuccess({ message: 'تم إرسال طلب السحب — سيتم مراجعته خلال 24-48 ساعة' }, 201);
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}
