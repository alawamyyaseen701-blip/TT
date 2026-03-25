import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/auth';
import { getDocs } from '@/lib/firebase';
import { sendStatsReport, notifyAdmin } from '@/lib/telegram';

const CRON_SECRET = process.env.CRON_SECRET || 'trustdeal-cron-secret-2025';

/**
 * GET /api/telegram/report
 * يُرسل تقرير إحصائي للأدمن على Telegram
 * —  استدعاء تلقائي من Vercel Cron (كل يوم)
 * —  أو يدوي: /api/telegram/report?secret=...
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== CRON_SECRET) return apiError('Unauthorized', 401);

  try {
    const [deals, wallets, disputes] = await Promise.all([
      getDocs('deals', []),
      getDocs('wallet_requests', [{ field: 'status', op: '==', value: 'pending' }]),
      getDocs('disputes',       [{ field: 'status', op: '==', value: 'open' }]),
    ]);

    const today      = new Date().toDateString();
    const newToday   = deals.filter(d => new Date(d.created_at).toDateString() === today).length;
    const escrowDeals = deals.filter(d => ['in_escrow', 'in_delivery'].includes(d.status));
    const escrowBalance = escrowDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const completedDeals = deals.filter(d => d.status === 'completed');
    const totalRevenue = completedDeals.reduce((sum, d) => sum + ((d.amount || 0) * 0.05), 0);
    const pendingPayments = deals.filter(d => d.status === 'payment_sent').length;

    await sendStatsReport({
      totalDeals:       deals.length,
      newToday,
      pendingPayments,
      openDisputes:     disputes.length,
      pendingWithdrawals: wallets.length,
      totalRevenue,
      escrowBalance,
    });

    return apiSuccess({ sent: true, stats: { totalDeals: deals.length, newToday, escrowBalance, totalRevenue } });
  } catch (e: any) {
    return apiError('فشل إرسال التقرير: ' + e.message, 500);
  }
}

/**
 * POST /api/telegram/report
 * إرسال رسالة مخصصة للأدمن (من لوحة التحكم)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, message, emoji = '📢' } = body;
    if (secret !== CRON_SECRET) return apiError('Unauthorized', 401);
    if (!message) return apiError('الرسالة مطلوبة');
    await notifyAdmin(emoji, 'رسالة من النظام', message);
    return apiSuccess({ sent: true });
  } catch (e: any) {
    return apiError('فشل الإرسال: ' + e.message, 500);
  }
}
