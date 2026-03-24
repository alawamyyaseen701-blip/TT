import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc, createDoc } from '@/lib/firebase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { id }     = await params;
    const auction    = await getDoc('auctions', id);
    if (!auction) return apiError('المزاد غير موجود', 404);
    if (auction.status !== 'live') return apiError('المزاد غير نشط');
    if (auction.seller_id === auth.userId) return apiError('لا يمكنك المزايدة في مزادك');
    const { amount } = await req.json();
    if (!amount) return apiError('مبلغ المزايدة مطلوب');
    const minBid = (auction.current_price || auction.starting_price) + (auction.min_increment || 1);
    if (amount < minBid) return apiError(`الحد الأدنى للمزايدة هو $${minBid}`);
    await createDoc('auction_bids', { auction_id: id, user_id: auth.userId, bid_amount: amount });
    await updateDoc('auctions', id, { current_price: amount, winner_id: auth.userId, bids_count: (auction.bids_count || 0) + 1 });
    return apiSuccess({ message: 'تم تسجيل مزايدتك', currentPrice: amount }, 201);
  } catch { return apiError('خطأ في الخادم', 500); }
}
