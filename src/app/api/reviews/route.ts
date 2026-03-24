import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, createDoc, getDoc } from '@/lib/firebase';

// GET /api/reviews?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return apiError('معرف المستخدم مطلوب');
    const reviews = await getDocs('reviews', [{ field: 'reviewed_id', op: '==', value: userId }], { orderBy: 'created_at', direction: 'desc', limit: 50 });
    return apiSuccess({ reviews });
  } catch (e: any) { return apiError('خطأ في الخادم', 500); }
}

// POST /api/reviews — submit a review after deal completion
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { dealId, rating, comment } = await req.json();
    if (!dealId || !rating || rating < 1 || rating > 5) return apiError('معرف الصفقة والتقييم (1-5) مطلوبان');

    const deal = await getDoc('deals', dealId);
    if (!deal) return apiError('الصفقة غير موجودة', 404);
    if (deal.status !== 'completed') return apiError('يمكن التقييم فقط للصفقات المكتملة');
    if (deal.buyer_id !== auth.userId && deal.seller_id !== auth.userId) return apiError('غير مصرح', 403);

    const existing = await getDocs('reviews', [{ field: 'deal_id', op: '==', value: dealId }, { field: 'reviewer_id', op: '==', value: auth.userId }], { limit: 1 });
    if (existing.length > 0) return apiError('لقد قيّمت هذه الصفقة مسبقاً');

    const reviewedId = deal.buyer_id === auth.userId ? deal.seller_id : deal.buyer_id;
    await createDoc('reviews', { deal_id: dealId, reviewer_id: auth.userId, reviewed_id: reviewedId, rating, comment: comment || null });

    // Update reviewed user's average rating
    const allReviews = await getDocs('reviews', [{ field: 'reviewed_id', op: '==', value: reviewedId }]);
    const avgRating  = allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length;
    const { updateDoc: update } = await import('@/lib/firebase');
    await update('users', reviewedId, { rating: parseFloat(avgRating.toFixed(1)), total_reviews: allReviews.length });

    return apiSuccess({ message: 'تم إرسال التقييم بنجاح' }, 201);
  } catch (e: any) {
    console.error('[reviews POST]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
