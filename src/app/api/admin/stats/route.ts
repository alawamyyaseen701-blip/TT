import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// Admin only middleware helper
function requireAdmin(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return { error: apiError('يجب تسجيل الدخول', 401), user: null };
  if (user.role !== 'admin') return { error: apiError('غير مصرح — يحتاج صلاحية مدير', 403), user: null };
  return { error: null, user };
}

// GET /api/admin/stats
export async function GET(req: NextRequest) {
  try {
    const { error, user } = requireAdmin(req);
    if (error) return error;

    const db = getDb();

    const stats = {
      users: db.prepare('SELECT COUNT(*) as c FROM users WHERE role != "admin"').get() as any,
      activeListings: db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'active'").get() as any,
      pendingListings: db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'pending'").get() as any,
      completedDeals: db.prepare("SELECT COUNT(*) as c FROM deals WHERE status = 'completed'").get() as any,
      activeDeals: db.prepare("SELECT COUNT(*) as c FROM deals WHERE status IN ('in_escrow','in_delivery')").get() as any,
      openDisputes: db.prepare("SELECT COUNT(*) as c FROM disputes WHERE status = 'open'").get() as any,
      totalRevenue: db.prepare("SELECT COALESCE(SUM(commission), 0) as c FROM deals WHERE status = 'completed'").get() as any,
    };

    const recentDeals = db.prepare(`
      SELECT d.id, d.amount, d.status, d.created_at,
        buyer.display_name as buyer, seller.display_name as seller,
        l.title as listing_title
      FROM deals d
      JOIN users buyer ON buyer.id = d.buyer_id
      JOIN users seller ON seller.id = d.seller_id
      LEFT JOIN listings l ON l.id = d.listing_id
      ORDER BY d.created_at DESC LIMIT 10
    `).all();

    const recentUsers = db.prepare(`
      SELECT id, username, display_name, email, role, status, rating, total_deals, joined_at
      FROM users ORDER BY joined_at DESC LIMIT 10
    `).all();

    const openDisputesList = db.prepare(`
      SELECT disp.*, d.amount, buyer.display_name as buyer_name, seller.display_name as seller_name
      FROM disputes disp
      JOIN deals d ON d.id = disp.deal_id
      JOIN users buyer ON buyer.id = d.buyer_id
      JOIN users seller ON seller.id = d.seller_id
      WHERE disp.status = 'open'
      ORDER BY disp.created_at DESC LIMIT 10
    `).all();

    return apiSuccess({
      stats: {
        totalUsers: stats.users.c,
        activeListings: stats.activeListings.c,
        pendingListings: stats.pendingListings.c,
        completedDeals: stats.completedDeals.c,
        activeDeals: stats.activeDeals.c,
        openDisputes: stats.openDisputes.c,
        totalRevenue: stats.totalRevenue.c,
      },
      recentDeals,
      recentUsers,
      openDisputesList,
    });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
