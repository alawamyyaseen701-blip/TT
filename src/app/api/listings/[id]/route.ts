import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc } from '@/lib/firebase';

// GET /api/listings/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const listing = await getDoc('listings', id);
    if (!listing) return apiError('الإعلان غير موجود', 404);

    // Increment view count (fire and forget)
    updateDoc('listings', id, { views: (listing.views || 0) + 1 }).catch(() => {});

    // Attach seller info
    let sellerInfo = {};
    if (listing.seller_id) {
      try {
        const seller = await getDoc('users', listing.seller_id);
        if (seller) {
          sellerInfo = {
            seller_username: seller.username,
            seller_name: seller.display_name,
            seller_avatar: seller.avatar || null,
            seller_rating: seller.rating || 0,
            seller_deals: seller.total_deals || 0,
            seller_role: seller.role || 'user',
            seller_country: seller.country || null,
          };
        }
      } catch { /* seller fetch failed, continue */ }
    }

    // Check if current user has favorited this listing
    const auth = getTokenFromRequest(req);
    let is_favorited = false;
    if (auth?.userId) {
      try {
        const fav = await getDoc('favorites', `${auth.userId}_${id}`);
        is_favorited = !!fav;
      } catch { /* ignore */ }
    }

    // Don't expose credentials to anyone except via the deals flow
    const { credentials, ...safeListingData } = listing;

    return apiSuccess({ ...safeListingData, ...sellerInfo, is_favorited });
  } catch (e: any) {
    console.error('[listings GET by id]', e);
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}

// PATCH /api/listings/[id] — update (owner only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const listing = await getDoc('listings', id);
    if (!listing) return apiError('الإعلان غير موجود', 404);
    if (listing.seller_id !== auth.userId && auth.role !== 'admin') {
      return apiError('ليس لديك صلاحية تعديل هذا الإعلان', 403);
    }

    const body = await req.json();
    const allowed = ['title', 'description', 'price', 'country', 'platform', 'domain',
      'followers', 'engagement', 'monthly_profit', 'age_months', 'monetized', 'status',
      'plan', 'duration', 'tech_stack', 'delivery', 'includes', 'images'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) return apiError('لا يوجد بيانات للتعديل');

    await updateDoc('listings', id, updates);
    return apiSuccess({ message: 'تم التعديل بنجاح' });
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}

// DELETE /api/listings/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const listing = await getDoc('listings', id);
    if (!listing) return apiError('الإعلان غير موجود', 404);
    if (listing.seller_id !== auth.userId && auth.role !== 'admin') {
      return apiError('ليس لديك صلاحية حذف هذا الإعلان', 403);
    }

    await updateDoc('listings', id, { status: 'archived' });
    return apiSuccess({ message: 'تم حذف الإعلان' });
  } catch (e: any) {
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
