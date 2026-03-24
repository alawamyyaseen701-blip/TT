import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { createDoc, getDocs, getDoc } from '@/lib/firebase';

const WITHDRAW_METHODS = ['usdt_trc20', 'usdt_bep20', 'usdt_erc20', 'binance_pay', 'paypal', 'wise', 'bank_transfer'];

/**
 * POST /api/wallet/withdraw
 * User requests a withdrawal from their available balance
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { method, amount, address, accountName, notes } = await req.json();

    if (!method || !WITHDRAW_METHODS.includes(method))
      return apiError('طريقة السحب غير صالحة');
    if (!amount || parseFloat(String(amount)) < 10)
      return apiError('الحد الأدنى للسحب $10');
    if (!address?.trim())
      return apiError('عنوان الاستلام (محفظة / إيميل) مطلوب');

    const user = await getDoc('users', auth.userId);
    const balance = user?.wallet_balance || 0;

    if (balance < parseFloat(String(amount)))
      return apiError(`رصيدك غير كافٍ. الرصيد المتاح: $${balance.toFixed(2)}`);

    const id = await createDoc('wallet_requests', {
      user_id:      auth.userId,
      username:     user?.username || '',
      type:         'withdraw',
      method,
      amount:       parseFloat(String(amount)),
      address:      address.trim(),
      account_name: accountName?.trim() || null,
      notes:        notes?.trim() || null,
      status:       'pending',
    });

    // Notify admin
    await createDoc('notifications', {
      user_id: 'admin',
      type:    'withdraw_request',
      title:   '💸 طلب سحب جديد',
      body:    `${user?.username} طلب سحب $${amount} عبر ${method}`,
      link:    '/admin',
      read_at: null,
    });

    return apiSuccess({ id, message: 'تم إرسال طلب السحب — سيتم التحويل خلال 24 ساعة' }, 201);
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}

/**
 * GET /api/wallet/withdraw — user's withdrawal history
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const requests = await getDocs('wallet_requests', [
      { field: 'user_id', op: '==', value: auth.userId },
      { field: 'type',    op: '==', value: 'withdraw' },
    ]);

    const sorted = requests.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return apiSuccess({ requests: sorted });
  } catch (e: any) {
    return apiError('خطأ في الخادم', 500);
  }
}
