import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { createDoc, getDocs, getDoc } from '@/lib/firebase';

const DEPOSIT_METHODS = ['usdt_trc20', 'usdt_bep20', 'usdt_erc20', 'binance_pay', 'paypal', 'wise', 'bank_transfer'];

/**
 * POST /api/wallet/deposit
 * User submits a deposit request with proof of payment
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { method, amount, txId, notes } = await req.json();

    if (!method || !DEPOSIT_METHODS.includes(method))
      return apiError('طريقة الدفع غير صالحة');
    if (!amount || parseFloat(String(amount)) < 5)
      return apiError('الحد الأدنى للإيداع $5');
    if (!txId?.trim())
      return apiError('رقم/معرف العملية (TxID) مطلوب للتحقق');

    const user = await getDoc('users', auth.userId);

    const id = await createDoc('wallet_requests', {
      user_id:    auth.userId,
      username:   user?.username || '',
      type:       'deposit',
      method,
      amount:     parseFloat(String(amount)),
      tx_id:      txId.trim(),
      notes:      notes?.trim() || null,
      status:     'pending',    // pending → approved / rejected
    });

    // Notify admin
    await createDoc('notifications', {
      user_id: 'admin',
      type:    'deposit_request',
      title:   '💰 طلب إيداع جديد',
      body:    `${user?.username} طلب إيداع $${amount} عبر ${method}`,
      link:    '/admin',
      read_at: null,
    });

    return apiSuccess({ id, message: 'تم إرسال طلب الإيداع — سيتم التحقق خلال 30 دقيقة' }, 201);
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}

/**
 * GET /api/wallet/deposit — get user's deposit history
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const requests = await getDocs('wallet_requests', [
      { field: 'user_id', op: '==', value: auth.userId },
      { field: 'type',    op: '==', value: 'deposit' },
    ]);

    const sorted = requests.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return apiSuccess({ requests: sorted });
  } catch (e: any) {
    return apiError('خطأ في الخادم', 500);
  }
}
