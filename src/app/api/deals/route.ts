import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError, generateDealId, calculateCommission } from '@/lib/auth';

// GET /api/deals — user's deals
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role') || 'all'; // buyer | seller | all

    const db = getDb();
    let where = `WHERE (d.buyer_id = ? OR d.seller_id = ?)`;
    const params: any[] = [user.userId, user.userId];

    if (role === 'buyer') { where = 'WHERE d.buyer_id = ?'; params.splice(0, 2, user.userId); }
    if (role === 'seller') { where = 'WHERE d.seller_id = ?'; params.splice(0, 2, user.userId); }
    if (status) { where += ' AND d.status = ?'; params.push(status); }

    const deals = db.prepare(`
      SELECT
        d.*,
        l.title as listing_title, l.type as listing_type, l.platform,
        buyer.username as buyer_username, buyer.display_name as buyer_name, buyer.rating as buyer_rating,
        seller.username as seller_username, seller.display_name as seller_name, seller.rating as seller_rating
      FROM deals d
      LEFT JOIN listings l ON l.id = d.listing_id
      JOIN users buyer ON buyer.id = d.buyer_id
      JOIN users seller ON seller.id = d.seller_id
      ${where}
      ORDER BY d.created_at DESC
    `).all(...params);

    return apiSuccess({ deals });
  } catch {
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/deals — create deal (buy listing)
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const { listingId } = await req.json();
    if (!listingId) return apiError('معرف الإعلان مطلوب');

    const db = getDb();
    const listing = db.prepare("SELECT * FROM listings WHERE id = ? AND status = 'active'").get(listingId) as any;
    if (!listing) return apiError('الإعلان غير موجود أو غير متاح', 404);
    if (listing.seller_id === user.userId) return apiError('لا يمكنك شراء إعلانك بنفسك');

    // Check buyer wallet balance
    const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId) as any;
    if (buyer.wallet_balance < listing.price) {
      return apiError(`رصيدك غير كافٍ. الرصيد الحالي: $${buyer.wallet_balance.toFixed(2)}، المطلوب: $${listing.price}`);
    }

    const { commission, sellerNet } = calculateCommission(listing.price);
    const dealId = generateDealId();

    const autoRelease = new Date();
    autoRelease.setDate(autoRelease.getDate() + 7);

    // Atomic transaction
    db.transaction(() => {
      // Create deal
      db.prepare(`
        INSERT INTO deals (id, listing_id, buyer_id, seller_id, amount, commission, seller_net, status, auto_release_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'in_escrow', ?)
      `).run(dealId, listingId, user.userId, listing.seller_id, listing.price, commission, sellerNet, autoRelease.toISOString());

      // Deduct from buyer wallet, add to escrow
      db.prepare('UPDATE users SET wallet_balance = wallet_balance - ?, escrow_balance = escrow_balance + ? WHERE id = ?')
        .run(listing.price, listing.price, user.userId);

      // Mark listing as in-deal
      db.prepare("UPDATE listings SET status = 'sold' WHERE id = ?").run(listingId);

      // Create deal steps
      const steps = [
        { step: 1, label: 'تأكيد الطلب', completed_at: new Date().toISOString() },
        { step: 2, label: 'الدفع إلى Escrow', completed_at: new Date().toISOString() },
        { step: 3, label: 'بدء التسليم', completed_at: null },
        { step: 4, label: 'مراجعة المشتري', completed_at: null },
        { step: 5, label: 'تحرير الأموال', completed_at: null },
      ];
      for (const s of steps) {
        db.prepare('INSERT INTO deal_steps (deal_id, step, label, completed_at) VALUES (?, ?, ?, ?)').run(dealId, s.step, s.label, s.completed_at);
      }

      // System message
      db.prepare(`
        INSERT INTO messages (deal_id, sender_id, receiver_id, content, type)
        VALUES (?, ?, ?, ?, 'system')
      `).run(dealId, user.userId, listing.seller_id, `تم إنشاء صفقة #${dealId} — المبلغ $${listing.price} محتجز في Escrow`);

      // Notify seller
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body, link)
        VALUES (?, 'new_deal', ?, ?, ?)
      `).run(listing.seller_id, 'صفقة جديدة!', `${buyer.display_name} اشترى إعلانك "${listing.title}"`, `/deals/${dealId}`);
    })();

    return apiSuccess({ dealId, amount: listing.price, commission, sellerNet, status: 'in_escrow' }, 201);
  } catch (e: any) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
