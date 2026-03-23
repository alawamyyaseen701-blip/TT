import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/auth';

// GET /api/listings — fetch with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const platform = searchParams.get('platform');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const country = searchParams.get('country');
    const verified = searchParams.get('verified');
    const featured = searchParams.get('featured');
    const search = searchParams.get('q');
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    const db = getDb();
    let where = "WHERE l.status = 'active'";
    const params: any[] = [];

    if (type) { where += ' AND l.type = ?'; params.push(type); }
    if (platform) { where += ' AND l.platform = ?'; params.push(platform); }
    if (minPrice) { where += ' AND l.price >= ?'; params.push(Number(minPrice)); }
    if (maxPrice) { where += ' AND l.price <= ?'; params.push(Number(maxPrice)); }
    if (country) { where += ' AND l.country = ?'; params.push(country); }
    if (featured === 'true') { where += ' AND l.featured = 1'; }
    if (verified === 'true') { where += " AND u.role = 'verified'"; }
    if (search) {
      where += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.platform LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const orderMap: Record<string, string> = {
      newest: 'l.created_at DESC',
      oldest: 'l.created_at ASC',
      price_low: 'l.price ASC',
      price_high: 'l.price DESC',
      rating: 'u.rating DESC',
      popular: 'l.views DESC',
      featured: 'l.featured DESC, l.created_at DESC',
    };
    const order = orderMap[sortBy] || orderMap.newest;

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM listings l
      JOIN users u ON u.id = l.seller_id
      ${where}
    `).get(...params) as { count: number };

    const listings = db.prepare(`
      SELECT
        l.id, l.type, l.platform, l.title, l.price, l.currency,
        l.country, l.domain, l.followers, l.engagement,
        l.monthly_profit, l.age_months, l.monetized,
        l.featured, l.views, l.favorites, l.created_at,
        u.id as seller_id, u.username as seller_username,
        u.display_name as seller_name, u.rating as seller_rating,
        u.role as seller_role, u.total_deals as seller_deals
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      ${where}
      ORDER BY ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return apiSuccess({
      listings,
      pagination: {
        total: total.count,
        page,
        limit,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/listings — create new listing
export async function POST(req: NextRequest) {
  try {
    const { getTokenFromRequest } = await import('@/lib/auth');
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول أولاً', 401);

    const body = await req.json();
    const { type, platform, title, description, price, country, domain, followers, engagement, monthly_profit, age_months, monetized } = body;

    if (!type || !title || !description || !price) {
      return apiError('النوع والعنوان والوصف والسعر مطلوبة');
    }
    if (price <= 0) return apiError('السعر يجب أن يكون أكبر من صفر');
    if (title.length < 10) return apiError('العنوان يجب أن يكون 10 أحرف على الأقل');

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO listings
        (seller_id, type, platform, title, description, price, country, domain, followers, engagement, monthly_profit, age_months, monetized, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      user.userId, type, platform || null, title, description, price,
      country || 'SA', domain || null, followers || null,
      engagement || null, monthly_profit || null, age_months || null,
      monetized ? 1 : 0,
    ) as any;

    return apiSuccess({ id: result.lastInsertRowid, status: 'pending', message: 'سيتم مراجعة الإعلان خلال 24 ساعة' }, 201);
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
