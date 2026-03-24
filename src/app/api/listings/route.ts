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

    // Only filter by status in Firestore (avoids composite index requirement)
    let listings = await getDocs('listings', [
      { field: 'status', op: '==', value: 'active' }
    ]);

    // Filter by type in JS
    if (type) listings = listings.filter(l => l.type === type);

    // Filter by search in JS
    if (search) {
      const s = search.toLowerCase();
      listings = listings.filter(l =>
        l.title?.toLowerCase().includes(s) ||
        l.description?.toLowerCase().includes(s) ||
        l.platform?.toLowerCase().includes(s)
      );
    }

    // Sort in JS
    if (sortBy === 'price_low') listings.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') listings.sort((a, b) => b.price - a.price);
    else listings.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    const total = listings.length;
    const paginated = listings.slice((page - 1) * limit, page * limit);

    // Attach seller info
    const enriched = await Promise.all(paginated.map(async (l) => {
      try {
        const seller = await getDoc('users', l.seller_id);
        return {
          ...l,
          seller_username: seller?.username,
          seller_name: seller?.display_name,
          seller_rating: seller?.rating,
          seller_role: seller?.role,
        };
      } catch {
        return l;
      }
    }));

    return apiSuccess({ listings: enriched, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (e: any) {
    console.error('[listings GET]', e);
    return apiError('خطأ في الخادم: ' + (e?.message || 'unknown'), 500);
  }
}


// POST /api/listings
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول أولاً', 401);

    const body = await req.json();
    const {
      type, platform, title, description, price, country,
      domain, followers, engagement, monthly_profit, monthly_revenue,
      age_months, monetized, plan, duration, tech_stack,
      delivery, includes, images, credentials,
      asset_subtype, github_url, allow_multiple_purchases, purchase_count,
    } = body;

    if (!type || !title || !description || !price) {
      const missing = [!type && 'type', !title && 'title', !description && 'description', !price && 'price'].filter(Boolean);
      return apiError(`الحقول المطلوبة: ${missing.join(', ')}`);
    }
    if (parseFloat(String(price)) <= 0) return apiError('السعر يجب أن يكون أكبر من صفر');
    if (String(title).length < 5) return apiError('العنوان يجب أن يكون 5 أحرف على الأقل');

    const id = await createDoc('listings', {
      seller_id: auth.userId,
      type,
      platform: platform || null,
      title,
      description,
      price: parseFloat(String(price)),
      country: country || null,
      domain: domain || null,
      followers: followers || null,
      engagement: engagement ? parseFloat(String(engagement)) : null,
      monthly_profit: monthly_profit ? parseFloat(String(monthly_profit)) : null,
      monthly_revenue: monthly_revenue ? parseFloat(String(monthly_revenue)) : null,
      age_months: age_months ? parseInt(String(age_months)) : null,
      monetized: monetized || false,
      plan: plan || null,
      duration: duration || null,
      tech_stack: tech_stack || null,
      delivery: delivery || null,
      includes: includes || null,
      images: images || [],
      // Credentials stored encrypted — only released when deal completes
      credentials: credentials ? JSON.stringify(credentials) : null,
      // Asset type logic
      asset_subtype: asset_subtype || null,
      github_url: github_url || null,
      allow_multiple_purchases: allow_multiple_purchases || false,
      purchase_count: purchase_count || 0,
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

