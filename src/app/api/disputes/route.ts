import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError, generateDisputeId } from '@/lib/auth';
import { getDoc, getDocs, createDoc, updateDoc } from '@/lib/firebase';
import { notifyDispute } from '@/lib/telegram';

// GET /api/disputes
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const isAdmin = user.role === 'admin';
    let disputes: any[] = [];

    if (isAdmin) {
      disputes = await getDocs('disputes', [], { orderBy: 'created_at', direction: 'desc', limit: 100 });
    } else {
      // Get user's deals first, then filter disputes
      const buyerDeals  = await getDocs('deals', [{ field: 'buyer_id',  op: '==', value: user.userId }]);
      const sellerDeals = await getDocs('deals', [{ field: 'seller_id', op: '==', value: user.userId }]);
      const dealIds     = [...new Set([...buyerDeals, ...sellerDeals].map(d => d.id))];
      if (dealIds.length > 0) {
        for (const dealId of dealIds) {
          const dealDisputes = await getDocs('disputes', [{ field: 'deal_id', op: '==', value: dealId }]);
          disputes.push(...dealDisputes);
        }
      }
    }

    return apiSuccess({ disputes });
  } catch (e: any) {
    console.error('[disputes GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/disputes — open a dispute
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, reason, description } = await req.json();
    if (!dealId || !reason) return apiError('معرف الصفقة والسبب مطلوبان');

    const deal = await getDoc('deals', dealId);
    if (!deal) return apiError('الصفقة غير موجودة', 404);
    if (deal.buyer_id !== user.userId && deal.seller_id !== user.userId) return apiError('غير مصرح', 403);
    if (!['in_escrow', 'in_delivery', 'delivered'].includes(deal.status))
      return apiError('لا يمكن فتح نزاع الآن');

    // Check no open dispute already
    const existing = await getDocs('disputes', [
      { field: 'deal_id', op: '==', value: dealId },
      { field: 'status',  op: '==', value: 'open' },
    ], { limit: 1 });
    if (existing.length > 0) return apiError('يوجد نزاع مفتوح بالفعل لهذه الصفقة');

    const disputeId = generateDisputeId();
    const now       = new Date().toISOString();

    await createDoc('disputes', {
      id: disputeId, deal_id: dealId,
      opened_by: user.userId,
      reason, description: description || null,
      status: 'open', created_at: now,
    });

    await updateDoc('deals', dealId, { status: 'disputed' });

    const otherParty = deal.buyer_id === user.userId ? deal.seller_id : deal.buyer_id;
    const [buyerDoc, sellerDoc] = await Promise.all([getDoc('users', deal.buyer_id), getDoc('users', deal.seller_id)]);
    await Promise.all([
      createDoc('notifications', { user_id: 'admin', type: 'new_dispute', title: `⚤️ نزاع جديد #${disputeId}`, body: `تم فتح نزاع على صفقة #${dealId} — السبب: ${reason}`, link: '/admin', read_at: null }),
      createDoc('notifications', { user_id: otherParty, type: 'dispute_opened', title: '⚤️ تم فتح نزاع', body: `تم فتح نزاع على صفقة #${dealId}`, link: `/deals/${dealId}`, read_at: null }),
      notifyDispute({ id: disputeId, dealId, reason: `${reason}${description ? ' — ' + description : ''}`, buyerName: buyerDoc?.display_name || buyerDoc?.username, sellerName: sellerDoc?.display_name || sellerDoc?.username, amount: deal.amount }),
    ]);

    return apiSuccess({ disputeId, status: 'open' }, 201);
  } catch (e: any) {
    console.error('[disputes POST]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
