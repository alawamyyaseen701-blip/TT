import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError, calculateCommission, generateDealId } from '@/lib/auth';
import { getDocs, createDoc, getDoc, updateDoc, batchWrite, setDoc } from '@/lib/firebase';

// GET /api/deals
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'all';

    let deals: any[] = [];
    if (role === 'buyer' || role === 'all') {
      const buyerDeals = await getDocs('deals', [{ field: 'buyer_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' });
      deals.push(...buyerDeals);
    }
    if (role === 'seller' || role === 'all') {
      const sellerDeals = await getDocs('deals', [{ field: 'seller_id', op: '==', value: auth.userId }], { orderBy: 'created_at', direction: 'desc' });
      // Avoid duplicates
      for (const d of sellerDeals) {
        if (!deals.find(x => x.id === d.id)) deals.push(d);
      }
    }

    // Enrich with user + listing info
    const enriched = await Promise.all(deals.map(async (d) => {
      const [buyer, seller, listing] = await Promise.all([
        getDoc('users', d.buyer_id),
        getDoc('users', d.seller_id),
        d.listing_id ? getDoc('listings', d.listing_id) : null,
      ]);
      return {
        ...d,
        buyer_username: buyer?.username, buyer_name: buyer?.display_name, buyer_rating: buyer?.rating,
        seller_username: seller?.username, seller_name: seller?.display_name, seller_rating: seller?.rating,
        listing_title: listing?.title, listing_type: listing?.type, platform: listing?.platform,
      };
    }));

    return apiSuccess({ deals: enriched });
  } catch (e: any) {
    console.error('[deals GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/deals — create deal
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { listingId } = await req.json();
    if (!listingId) return apiError('معرف الإعلان مطلوب');

    const listing = await getDoc('listings', listingId);
    if (!listing || listing.status !== 'active') return apiError('الإعلان غير موجود أو غير متاح', 404);
    if (listing.seller_id === auth.userId) return apiError('لا يمكنك شراء إعلانك بنفسك');

    const buyer = await getDoc('users', auth.userId);
    if (!buyer || buyer.wallet_balance < listing.price) {
      return apiError(`رصيدك غير كافٍ. الرصيد: $${buyer?.wallet_balance?.toFixed(2) || 0}، المطلوب: $${listing.price}`);
    }

    const { commission, sellerNet } = calculateCommission(listing.price);
    const dealId = generateDealId();
    const autoRelease = new Date(Date.now() + 7 * 86400000).toISOString();
    const now = new Date().toISOString();

    await setDoc('deals', dealId, {
      listing_id: listingId,
      buyer_id: auth.userId,
      seller_id: listing.seller_id,
      amount: listing.price,
      commission, seller_net: sellerNet,
      status: 'in_escrow',
      auto_release_at: autoRelease,
      delivery_data: null,
      buyer_confirmed_at: null,
      protection_expires_at: null,
      payout_released: false,
    });

    // Deduct buyer wallet → escrow
    await updateDoc('users', auth.userId, {
      wallet_balance: (buyer.wallet_balance || 0) - listing.price,
      escrow_balance: (buyer.escrow_balance || 0) + listing.price,
    });

    // Mark listing sold
    await updateDoc('listings', listingId, { status: 'sold' });

    // Notify seller
    await createDoc('notifications', {
      user_id: listing.seller_id,
      type: 'new_deal',
      title: 'صفقة جديدة! 🎉',
      body: `${buyer.display_name} اشترى إعلانك "${listing.title}"`,
      link: `/deals/${dealId}`,
      read_at: null,
    });

    // System message
    await createDoc('messages', {
      deal_id: dealId,
      sender_id: auth.userId,
      receiver_id: listing.seller_id,
      content: `تم إنشاء صفقة #${dealId} — المبلغ $${listing.price} محتجز في Escrow`,
      type: 'system',
      read_at: null,
    });

    return apiSuccess({ dealId, amount: listing.price, commission, sellerNet, status: 'in_escrow' }, 201);
  } catch (e: any) {
    console.error('[deals POST]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
