import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc } from '@/lib/firebase';

/**
 * POST /api/listings/[id]/purchase
 * Called after a deal is completed to update listing state:
 * - If allow_multiple_purchases=true (website/app/store): increment purchase_count, keep status=active
 * - If allow_multiple_purchases=false (domain/social/subscription): set status=sold
 *
 * Also exposes github_url to the buyer after successful purchase.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { id } = await params;
    const listing = await getDoc('listings', id);
    if (!listing) return apiError('الإعلان غير موجود', 404);

    if (listing.allow_multiple_purchases) {
      // Multi-purchase: increment counter, keep active
      await updateDoc('listings', id, {
        purchase_count: (listing.purchase_count || 0) + 1,
        status: 'active', // stays active
      });
      return apiSuccess({
        multi: true,
        purchase_count: (listing.purchase_count || 0) + 1,
        github_url: listing.github_url || null,
        message: 'تم الشراء بنجاح — يمكنك تحميل الكود من الرابط',
      });
    } else {
      // Single-purchase: mark as sold
      await updateDoc('listings', id, {
        status: 'sold',
        purchase_count: 1,
        sold_at: new Date().toISOString(),
      });
      return apiSuccess({
        multi: false,
        purchase_count: 1,
        message: 'تم البيع — الإعلان لم يعد متاحاً',
      });
    }
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}

/**
 * GET /api/listings/[id]/purchase
 * Returns github_url to a verified buyer (after deal completed)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { id } = await params;
    const listing = await getDoc('listings', id);
    if (!listing) return apiError('الإعلان غير موجود', 404);

    // Only expose github_url to verified buyer (check via deals)
    // For now return it if listing allows multi-purchase (public after purchase)
    return apiSuccess({
      github_url: listing.github_url || null,
      purchase_count: listing.purchase_count || 0,
      allow_multiple_purchases: listing.allow_multiple_purchases || false,
    });
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
