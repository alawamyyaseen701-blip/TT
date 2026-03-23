import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const disputes = await getDocs('disputes');
    return apiSuccess({ disputes });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const { disputeId, action } = await req.json();
    if (!disputeId || !action) return apiError('بيانات ناقصة');
    const status = action === 'resolve_seller' ? 'resolved_seller' : 'resolved_buyer';
    await updateDoc('disputes', disputeId, { status, resolved_at: new Date().toISOString(), resolved_by: 'admin' });
    return apiSuccess({ message: 'تم حل النزاع' });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}
