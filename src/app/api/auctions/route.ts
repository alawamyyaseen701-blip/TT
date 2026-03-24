import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, createDoc, updateDoc, getDoc } from '@/lib/firebase';

// GET /api/auctions
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status') || 'live';
    const auctions = await getDocs('auctions', [{ field: 'status', op: '==', value: status }], { orderBy: 'end_at', direction: 'asc', limit: 50 });
    return apiSuccess({ auctions });
  } catch { return apiError('خطأ في الخادم', 500); }
}

// POST /api/auctions — create auction
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { listingId, startingPrice, minIncrement, startAt, endAt } = await req.json();
    if (!listingId || !startingPrice || !startAt || !endAt) return apiError('البيانات ناقصة');
    const listing = await getDoc('listings', listingId);
    if (!listing) return apiError('المنتج غير موجود', 404);
    if (listing.seller_id !== auth.userId) return apiError('غير مصرح', 403);
    const id = await createDoc('auctions', {
      listing_id: listingId, seller_id: auth.userId,
      starting_price: startingPrice, current_price: startingPrice,
      min_increment: minIncrement || 1,
      start_at: startAt, end_at: endAt,
      status: 'scheduled', bids_count: 0,
    });
    return apiSuccess({ id }, 201);
  } catch { return apiError('خطأ في الخادم', 500); }
}
