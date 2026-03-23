import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError, calculateCommission } from '@/lib/auth';
import { getDocs, createDoc, updateDoc, getDoc } from '@/lib/firebase';

// GET /api/listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('q');
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const filters: any[] = [{ field: 'status', op: '==', value: 'active' }];
    if (type) filters.push({ field: 'type', op: '==', value: type });

    const orderMap: Record<string, { field: string; dir: 'asc' | 'desc' }> = {
      newest: { field: 'created_at', dir: 'desc' },
      oldest: { field: 'created_at', dir: 'asc' },
      price_low: { field: 'price', dir: 'asc' },
      price_high: { field: 'price', dir: 'desc' },
    };
    const order = orderMap[sortBy] || orderMap.newest;

    let listings = await getDocs('listings', filters, {
      orderBy: order.field,
      direction: order.dir,
    });

    // Client-side search filter (Firestore doesn't support full-text search natively)
    if (search) {
      const s = search.toLowerCase();
      listings = listings.filter(l =>
        l.title?.toLowerCase().includes(s) ||
        l.description?.toLowerCase().includes(s) ||
        l.platform?.toLowerCase().includes(s)
      );
    }

    const total = listings.length;
    const paginated = listings.slice((page - 1) * limit, page * limit);

    // Attach seller info
    const enriched = await Promise.all(paginated.map(async (l) => {
      const seller = await getDoc('users', l.seller_id);
      return {
        ...l,
        seller_username: seller?.username,
        seller_name: seller?.display_name,
        seller_rating: seller?.rating,
        seller_role: seller?.role,
      };
    }));

    return apiSuccess({ listings: enriched, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (e: any) {
    console.error('[listings GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// POST /api/listings
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول أولاً', 401);

    const body = await req.json();
    const { type, platform, title, description, price, country, domain, followers, engagement, monthly_profit, age_months, monetized } = body;

    if (!type || !title || !description || !price) {
      const missing = [!type && 'type', !title && 'title', !description && 'description', !price && 'price'].filter(Boolean);
      return apiError(`الحقول المطلوبة: ${missing.join(', ')}`);
    }
    if (parseFloat(String(price)) <= 0) return apiError('السعر يجب أن يكون أكبر من صفر');
    if (String(title).length < 5) return apiError('العنوان يجب أن يكون 5 أحرف على الأقل');

    const id = await createDoc('listings', {
      seller_id: auth.userId,
      type, platform: platform || null,
      title, description,
      price: parseFloat(String(price)),
      country: country || 'SA',
      domain: domain || null,
      followers: followers || null,
      engagement: engagement ? parseFloat(String(engagement)) : null,
      monthly_profit: monthly_profit ? parseFloat(String(monthly_profit)) : null,
      age_months: age_months ? parseInt(String(age_months)) : null,
      monetized: monetized || false,
      status: 'active',
      featured: false,
      views: 0,
      favorites: 0,
    });

    return apiSuccess({ id, status: 'active', message: 'تم نشر الإعلان بنجاح' }, 201);
  } catch (e: any) {
    console.error('[listings POST]', e);
    return apiError('خطأ في الخادم: ' + (e?.message || 'unknown'), 500);
  }
}
