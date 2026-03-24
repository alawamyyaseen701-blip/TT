import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, getDoc } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'admin') return apiError('Admin only', 403);

    const [users, listings, deals, disputes, withdrawals] = await Promise.all([
      getDocs('users',   [], { limit: 1000 }),
      getDocs('listings',[], { limit: 1000 }),
      getDocs('deals',   [], { limit: 1000 }),
      getDocs('disputes',[], { limit: 1000 }),
      getDocs('wallet_requests', [{ field: 'type', op: '==', value: 'withdraw' }], { limit: 1000 }),
    ]);

    const totalVolume = deals
      .filter(d => ['completed', 'in_escrow', 'in_delivery'].includes(d.status))
      .reduce((s, d) => s + (d.amount || 0), 0);
    const totalCommission = deals
      .filter(d => d.status === 'completed')
      .reduce((s, d) => s + (d.amount || 0) * 0.05, 0);

    return apiSuccess({
      users:       { total: users.length, active: users.filter(u => u.status === 'active').length },
      listings:    { total: listings.length, active: listings.filter(l => l.status === 'active').length, pending: listings.filter(l => l.status === 'pending').length },
      deals:       { total: deals.length, active: deals.filter(d => ['in_escrow','in_delivery'].includes(d.status)).length, completed: deals.filter(d => d.status === 'completed').length },
      disputes:    { total: disputes.length, open: disputes.filter(d => d.status === 'open').length },
      withdrawals: { pending: withdrawals.filter(w => w.status === 'pending').length },
      finance:     { totalVolume: parseFloat(totalVolume.toFixed(2)), totalCommission: parseFloat(totalCommission.toFixed(2)) },
    });
  } catch (e: any) {
    console.error('[admin/stats]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
