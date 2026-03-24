import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, createDoc } from '@/lib/firebase';

// GET /api/requests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const filters: any[] = [{ field: 'status', op: '==', value: 'open' }];
    if (category) filters.push({ field: 'category', op: '==', value: category });
    const requests = await getDocs('requests', filters, { orderBy: 'created_at', direction: 'desc', limit: 50 });
    return apiSuccess({ requests });
  } catch { return apiError('خطأ في الخادم', 500); }
}

// POST /api/requests
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { title, description, category, budget_min, budget_max, deadline_days } = await req.json();
    if (!title || !category) return apiError('العنوان والتصنيف مطلوبان');

    const id = await createDoc('requests', {
      user_id: auth.userId, title, description: description || null,
      category, budget_min: budget_min || null, budget_max: budget_max || null,
      deadline_days: deadline_days || 7, status: 'open', offers_count: 0,
    });
    return apiSuccess({ id }, 201);
  } catch { return apiError('خطأ في الخادم', 500); }
}
