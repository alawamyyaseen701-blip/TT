import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc, createDoc, getDoc } from '@/lib/firebase';

// GET /api/admin/withdrawals
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'admin') return apiError('Admin only', 403);
    const requests = await getDocs('wallet_requests', [{ field: 'type', op: '==', value: 'withdraw' }], { orderBy: 'created_at', direction: 'desc', limit: 100 });
    return apiSuccess({ withdrawals: requests });
  } catch (e: any) {
    console.error('[admin/withdrawals GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/withdrawals — approve or reject
export async function PATCH(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'admin') return apiError('Admin only', 403);

    const { requestId, action, note } = await req.json();
    if (!requestId || !action) return apiError('معرف الطلب والإجراء مطلوبان');
    if (!['approve', 'reject'].includes(action)) return apiError('إجراء غير صالح');

    const request = await getDoc('wallet_requests', requestId);
    if (!request) return apiError('الطلب غير موجود', 404);
    if (request.status !== 'pending') return apiError('الطلب تمت معالجته بالفعل');

    const now = new Date().toISOString();

    if (action === 'approve') {
      await updateDoc('wallet_requests', requestId, { status: 'approved', admin_note: note || null, processed_at: now });
      // Deduct from user wallet
      const userDoc = await getDoc('users', request.user_id);
      const newBal  = Math.max(0, (userDoc?.wallet_balance || 0) - request.amount);
      await updateDoc('users', request.user_id, { wallet_balance: newBal });
      await createDoc('notifications', {
        user_id: request.user_id, type: 'withdrawal_approved',
        title: '✅ تمت الموافقة على طلب السحب',
        body:  `تمت الموافقة على سحب $${request.amount} — سيصلك خلال 24 ساعة.`,
        link: '/dashboard', read_at: null,
      });
    } else {
      await updateDoc('wallet_requests', requestId, { status: 'rejected', admin_note: note || null, processed_at: now });
      // Unfreeze balance
      const userDoc = await getDoc('users', request.user_id);
      await updateDoc('users', request.user_id, { wallet_balance: (userDoc?.wallet_balance || 0) + request.amount });
      await createDoc('notifications', {
        user_id: request.user_id, type: 'withdrawal_rejected',
        title: '❌ تم رفض طلب السحب',
        body:  `تم رفض طلب سحب $${request.amount}. السبب: ${note || 'غير محدد'}. تم إعادة المبلغ لمحفظتك.`,
        link: '/dashboard', read_at: null,
      });
    }

    return apiSuccess({ status: action === 'approve' ? 'approved' : 'rejected' });
  } catch (e: any) {
    console.error('[admin/withdrawals PATCH]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
