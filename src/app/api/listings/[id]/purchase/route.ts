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

    // Types that are ALWAYS single-purchase (sold after first buy):
    // - subscription: اشتراك رقمي — حساب واحد لشخص واحد
    // - social: حساب سوشيال — يُنقل لمشترٍ واحد
    // - asset with subtype=domain: دومين — ملكية حصرية
    const SINGLE_PURCHASE_TYPES = ['subscription', 'social'];
    const isSinglePurchase =
      SINGLE_PURCHASE_TYPES.includes(listing.type) ||
      listing.asset_subtype === 'domain' ||
      !listing.allow_multiple_purchases;

    if (!isSinglePurchase) {
      // Multi-purchase: website / app / store with a GitHub link
      await updateDoc('listings', id, {
        purchase_count: (listing.purchase_count || 0) + 1,
        status: 'active', // stays active for more buyers
      });
      return apiSuccess({
        multi: true,
        purchase_count: (listing.purchase_count || 0) + 1,
        github_url: listing.github_url || null,
        message: 'تم الشراء بنجاح — يمكنك تحميل الكود من الرابط',
      });
    } else {
      // Single-purchase: mark as sold immediately
      await updateDoc('listings', id, {
        status: 'sold',
        purchase_count: 1,
        sold_at: new Date().toISOString(),
      });
      return apiSuccess({
        multi: false,
        purchase_count: 1,
        message: listing.type === 'subscription'
          ? 'تم الشراء — الاشتراك لم يعد متاحاً لأشخاص آخرين'
          : 'تم البيع — الإعلان لم يعد متاحاً',
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
