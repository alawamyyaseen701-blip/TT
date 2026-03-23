import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, getDoc, getDb } from '@/lib/firebase';

// GET /api/favorites
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const favs = await getDocs('favorites', [{ field: 'user_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' });
    // Enrich with listing data
    const enriched = await Promise.all(favs.map(async f => {
      const listing = await getDoc('listings', f.listing_id);
      return { ...f, listing };
    }));
    return apiSuccess({ favorites: enriched.filter(f => f.listing) });
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}

// POST /api/favorites — toggle
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { listingId } = await req.json();
    if (!listingId) return apiError('معرف الإعلان مطلوب');

    const existing = await getDocs('favorites', [
      { field: 'user_id', op: '==', value: auth.userId },
      { field: 'listing_id', op: '==', value: listingId },
    ]);

    if (existing.length > 0) {
      // Remove
      await getDb().collection('favorites').doc(existing[0].id).delete();
      return apiSuccess({ favorited: false, message: 'تم إزالة من المفضلة' });
    } else {
      // Add
      await getDb().collection('favorites').add({
        user_id: auth.userId,
        listing_id: listingId,
        created_at: new Date().toISOString(),
      });
      return apiSuccess({ favorited: true, message: 'تم إضافة للمفضلة' });
    }
  } catch (e) { return apiError('خطأ في الخادم', 500); }
}
