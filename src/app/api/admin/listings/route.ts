import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { updateDoc, deleteDoc } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const { listingId, action } = await req.json();
    if (!listingId || !action) return apiError('بيانات ناقصة');
    if (action === 'delete') {
      await deleteDoc('listings', listingId);
      return apiSuccess({ message: 'تم حذف الإعلان' });
    }
    if (action === 'suspend') {
      await updateDoc('listings', listingId, { status: 'suspended' });
      return apiSuccess({ message: 'تم إيقاف الإعلان' });
    }
    return apiError('إجراء غير صحيح');
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}
