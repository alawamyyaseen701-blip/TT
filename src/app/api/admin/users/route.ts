import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc } from '@/lib/firebase';

// GET /api/admin/users
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const users = await getDocs('users');
    const safe = users.map(({ password_hash, ...u }) => u);
    return apiSuccess({ users: safe });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}

// POST /api/admin/users — suspend/activate
export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const { userId, action } = await req.json();
    if (!userId || !action) return apiError('بيانات ناقصة');
    const status = action === 'suspend' ? 'suspended' : 'active';
    await updateDoc('users', userId, { status });
    return apiSuccess({ message: `تم تحديث الحساب إلى ${status}` });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}
