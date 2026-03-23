import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, updateDoc, getDoc } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const deals = await getDocs('deals');
    return apiSuccess({ deals });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('ممنوع', 403);
    const { dealId, action } = await req.json();
    if (!dealId || !action) return apiError('بيانات ناقصة');
    const deal = await getDoc('deals', dealId);
    if (!deal) return apiError('الصفقة غير موجودة');
    if (action === 'complete') {
      await updateDoc('deals', dealId, { status: 'completed', completed_at: new Date().toISOString(), admin_note: 'أُتمّت بواسطة الأدمن' });
    } else if (action === 'cancel') {
      await updateDoc('deals', dealId, { status: 'cancelled', cancelled_at: new Date().toISOString(), admin_note: 'أُلغيت بواسطة الأدمن' });
    }
    return apiSuccess({ message: 'تم تحديث الصفقة' });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}
