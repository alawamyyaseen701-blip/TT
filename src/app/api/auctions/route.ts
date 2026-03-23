import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError, generateId } from '@/lib/auth';

// GET /api/auctions — list active auctions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    const db = getDb();
    const total = db.prepare("SELECT COUNT(*) as count FROM auctions WHERE status = 'active' AND ends_at > datetime('now')").get() as { count: number };

    const auctions = db.prepare(`
      SELECT
        a.*,
        l.title as listing_title, l.type as listing_type, l.platform, l.description,
        u.username as seller_username, u.display_name as seller_name, u.rating as seller_rating,
        (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as bids_count,
        (SELECT MAX(amount) FROM auction_bids WHERE auction_id = a.id) as current_bid
      FROM auctions a
      JOIN listings l ON l.id = a.listing_id
      JOIN users u ON u.id = l.seller_id
      WHERE a.status = 'active' AND a.ends_at > datetime('now')
      ORDER BY a.ends_at ASC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return apiSuccess({ auctions, pagination: { total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) } });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/auctions — create an auction for a listing
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { listingId, startingPrice, reservePrice, durationHours } = await req.json();
    if (!listingId || !startingPrice || !durationHours) return apiError('listingId و startingPrice و durationHours مطلوبة');

    const db = getDb();
    const listing = db.prepare("SELECT * FROM listings WHERE id = ? AND seller_id = ? AND status = 'active'").get(listingId, user.userId) as any;
    if (!listing) return apiError('الإعلان غير موجود أو لا تملكه', 404);

    const existing = db.prepare("SELECT id FROM auctions WHERE listing_id = ? AND status = 'active'").get(listingId);
    if (existing) return apiError('يوجد مزاد نشط لهذا الإعلان');

    const auctionId = generateId();
    db.prepare(`
      INSERT INTO auctions (id, listing_id, starting_price, reserve_price, current_price, status, starts_at, ends_at)
      VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now', '+' || ? || ' hours'))
    `).run(auctionId, listingId, startingPrice, reservePrice || null, startingPrice, Math.min(durationHours, 168));

    db.prepare("UPDATE listings SET status = 'auction' WHERE id = ?").run(listingId);

    return apiSuccess({ auctionId, message: 'تم إنشاء المزاد بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
