import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError, generateId } from '@/lib/auth';

// POST /api/auctions/[id]/bid — place a bid
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { amount } = await req.json();
    const auctionId = (await params).id;

    if (!amount || amount <= 0) return apiError('المبلغ يجب أن يكون أكبر من صفر');

    const db = getDb();
    const auction = db.prepare(`
      SELECT a.*, l.seller_id, l.title as listing_title
      FROM auctions a JOIN listings l ON l.id = a.listing_id
      WHERE a.id = ? AND a.status = 'active' AND a.ends_at > datetime('now')
    `).get(auctionId) as any;

    if (!auction) return apiError('المزاد غير موجود أو انتهى', 404);
    if (auction.seller_id === user.userId) return apiError('لا يمكنك المزايدة على إعلانك');
    if (amount <= auction.current_price) return apiError(`يجب أن يكون المبلغ أكبر من ${auction.current_price}`);

    const user_data = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(user.userId) as any;
    if (user_data.wallet_balance < amount) return apiError('رصيدك غير كافٍ');

    const bidId = generateId();
    db.transaction(() => {
      db.prepare('INSERT INTO auction_bids (id, auction_id, bidder_id, amount) VALUES (?, ?, ?, ?)').run(bidId, auctionId, user.userId, amount);
      db.prepare('UPDATE auctions SET current_price = ? WHERE id = ?').run(amount, auctionId);

      // Notify seller
      db.prepare("INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'new_bid', '🔨 مزايدة جديدة!', ?)")
        .run(auction.seller_id, `مزايدة بقيمة $${amount} على "${auction.listing_title}"`);
    })();

    return apiSuccess({ bidId, message: 'تم تسجيل مزايدتك بنجاح', currentPrice: amount });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// GET /api/auctions/[id]/bid — get bids history for an auction
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auctionId = (await params).id;
    const db = getDb();

    const auction = db.prepare(`
      SELECT a.*, l.title, l.type, l.platform, u.display_name as seller_name
      FROM auctions a JOIN listings l ON l.id = a.listing_id JOIN users u ON u.id = l.seller_id
      WHERE a.id = ?
    `).get(auctionId) as any;

    if (!auction) return apiError('المزاد غير موجود', 404);

    const bids = db.prepare(`
      SELECT ab.*, u.username, u.display_name, u.rating
      FROM auction_bids ab JOIN users u ON u.id = ab.bidder_id
      WHERE ab.auction_id = ? ORDER BY ab.amount DESC LIMIT 20
    `).all(auctionId);

    return apiSuccess({ auction, bids });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
