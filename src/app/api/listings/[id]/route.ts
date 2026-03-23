import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';

// GET /api/listings/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const listing = db.prepare(`
      SELECT
        l.*,
        u.id as seller_id, u.username as seller_username,
        u.display_name as seller_name, u.avatar as seller_avatar,
        u.rating as seller_rating, u.total_deals as seller_deals,
        u.role as seller_role, u.country as seller_country,
        u.joined_at as seller_joined
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      WHERE l.id = ?
    `).get(id) as any;

    if (!listing) return apiError('الإعلان غير موجود', 404);

    // Increment view count
    db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(id);

    // Get images
    const images = db.prepare('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY sort_order').all(id);

    // Get attributes
    const rawAttrs = db.prepare('SELECT attr_key, attr_value FROM listing_attributes WHERE listing_id = ?').all(id) as any[];
    const attributes: Record<string, string> = {};
    for (const a of rawAttrs) attributes[a.attr_key] = a.attr_value;

    // Get seller reviews summary
    const reviewsSummary = db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(rating) as avg_rating
      FROM reviews WHERE reviewed_id = ?
    `).get(listing.seller_id) as any;

    return apiSuccess({ ...listing, images, attributes, reviewsSummary });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/listings/[id] — update listing (owner only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as any;
    if (!listing) return apiError('الإعلان غير موجود', 404);
    if (listing.seller_id !== user.userId && user.role !== 'admin') {
      return apiError('ليس لديك صلاحية تعديل هذا الإعلان', 403);
    }

    const body = await req.json();
    const allowed = ['title', 'description', 'price', 'country', 'platform', 'domain',
      'followers', 'engagement', 'monthly_profit', 'age_months', 'monetized', 'status'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (updates.length === 0) return apiError('لا يوجد بيانات للتعديل');

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return apiSuccess({ message: 'تم التعديل بنجاح' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// DELETE /api/listings/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);

    const db = getDb();
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as any;
    if (!listing) return apiError('الإعلان غير موجود', 404);
    if (listing.seller_id !== user.userId && user.role !== 'admin') {
      return apiError('ليس لديك صلاحية حذف هذا الإعلان', 403);
    }

    db.prepare("UPDATE listings SET status = 'archived' WHERE id = ?").run(id);
    return apiSuccess({ message: 'تم حذف الإعلان' });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
