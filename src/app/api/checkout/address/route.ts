import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/auth';
import { getDocs, getDoc } from '@/lib/firebase';

// GET /api/checkout/address?method=xxx
// Returns admin wallet address/ID for a specific payment method
// Data is stored in Firestore 'payment_methods' collection (managed from admin panel)
export async function GET(req: NextRequest) {
  try {
    const method = new URL(req.url).searchParams.get('method');

    if (method) {
      // Single method
      const doc = await getDoc('payment_methods', method);
      if (!doc || !doc.enabled) return apiError('طريقة الدفع غير متاحة', 404);
      return apiSuccess({ address: doc.address || '', method: doc });
    }

    // All enabled methods
    const all = await getDocs('payment_methods', [{ field: 'enabled', op: '==', value: true }]);
    const addresses: Record<string, string> = {};
    for (const m of all) addresses[m.id] = m.address || '';
    return apiSuccess({ addresses, methods: all });
  } catch (e: any) {
    console.error('[checkout/address]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
