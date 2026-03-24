import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc, getDoc } from '@/lib/firebase';

/**
 * GET /api/admin/wallet — list all pending wallet requests
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('غير مصرح', 401);

    const user = await getDoc('users', auth.userId);
    if (user?.role !== 'admin') return apiError('للمديرين فقط', 403);

    const { searchParams } = new URL(req.url);
    const type   = searchParams.get('type');   // deposit | withdraw | all
    const status = searchParams.get('status'); // pending | approved | rejected

    let requests = await getDocs('wallet_requests', []);

    if (type && type !== 'all') requests = requests.filter(r => r.type === type);
    if (status) requests = requests.filter(r => r.status === status);

    const sorted = requests.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return apiSuccess({ requests: sorted });
  } catch (e: any) {
    return apiError('خطأ في الخادم', 500);
  }
}

/**
 * PATCH /api/admin/wallet — approve or reject a request
 * body: { requestId, action: 'approve' | 'reject', adminNote? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('غير مصرح', 401);

    const admin = await getDoc('users', auth.userId);
    if (admin?.role !== 'admin') return apiError('للمديرين فقط', 403);

    const { requestId, action, adminNote } = await req.json();
    if (!requestId || !['approve', 'reject'].includes(action))
      return apiError('بيانات غير صالحة');

    const request = await getDoc('wallet_requests', requestId);
    if (!request) return apiError('الطلب غير موجود', 404);
    if (request.status !== 'pending') return apiError('تم معالجة هذا الطلب مسبقاً');

    if (action === 'approve') {
      if (request.type === 'deposit') {
        // Add amount to user's wallet_balance
        const user = await getDoc('users', request.user_id);
        const current = user?.wallet_balance || 0;
        await updateDoc('users', request.user_id, {
          wallet_balance: current + request.amount,
        });
      } else if (request.type === 'withdraw') {
        // Deduct from user's wallet_balance
        const user = await getDoc('users', request.user_id);
        const current = user?.wallet_balance || 0;
        if (current < request.amount)
          return apiError('رصيد المستخدم غير كافٍ للسحب');
        await updateDoc('users', request.user_id, {
          wallet_balance: current - request.amount,
        });
      }
    }

    await updateDoc('wallet_requests', requestId, {
      status:     action === 'approve' ? 'approved' : 'rejected',
      admin_note: adminNote || null,
      processed_by: auth.userId,
    });

    return apiSuccess({ message: action === 'approve' ? 'تمت الموافقة وتحديث الرصيد' : 'تم الرفض' });
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
