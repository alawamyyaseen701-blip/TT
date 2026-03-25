import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/auth';
import { getDocs, getDoc } from '@/lib/firebase';

/**
 * GET /api/telegram/test
 * يرسل إشعار تجريبي ويعرض حالة المتغيرات
 */
export async function GET(req: NextRequest) {
  const token   = process.env.TELEGRAM_BOT_TOKEN    || '';
  const chatId  = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

  // Show env status
  if (!token || !chatId) {
    return apiError(`متغيرات البيئة غير موجودة — token: ${token ? '✅' : '❌'}, chatId: ${chatId ? '✅' : '❌'}\nأعد تشغيل npm run dev`);
  }

  // Find all pending payment deals
  const pendingDeals = await getDocs('deals', [
    { field: 'status', op: '==', value: 'payment_sent' },
  ]);

  const msgs: string[] = [];

  // Send notification for each pending deal
  for (const deal of pendingDeals) {
    const [buyer, seller] = await Promise.all([
      getDoc('users', deal.buyer_id),
      getDoc('users', deal.seller_id),
    ]);

    const methodLabel = deal.payment_method === 'instapay' ? '⚡ Instapay' : `🪙 ${(deal.payment_method || 'manual').toUpperCase()}`;
    const text = `
💰 <b>دفعة بانتظار التحقق</b>

${methodLabel}
📦 الصفقة: <code>${deal.id.slice(0, 10)}...</code>
💵 المبلغ: <b>$${deal.amount}</b>
👤 المشتري: ${buyer?.display_name || buyer?.username || '—'}
🏪 البائع: ${seller?.display_name || seller?.username || '—'}
🔑 رقم العملية: <code>${deal.payment_tx_id || '—'}</code>

<i>تحقق من العملية وافتح الصفقة لتأكيدها.</i>
`.trim();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || !appUrl.startsWith('https://');

    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    // Telegram doesn't accept localhost URLs in buttons — only add in production
    if (!isLocalhost) {
      body.reply_markup = {
        inline_keyboard: [[
          { text: '✅ تأكيد الدفع',  url: `${appUrl}/admin?deal=${deal.id}&action=approve` },
          { text: '🔍 فتح الصفقة',  url: `${appUrl}/deals/${deal.id}` },
        ]],
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    msgs.push(`Deal ${deal.id.slice(0,8)}: ${data.ok ? '✅ أُرسل' : '❌ ' + data.description}`);
  }

  if (pendingDeals.length === 0) {
    // Send test message
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '✅ البوت شغّال — لا يوجد دفعات معلقة حالياً', parse_mode: 'HTML' }),
    });
    const data = await res.json();
    return apiSuccess({ status: data.ok ? 'sent' : 'failed', note: 'لا يوجد deals بحالة payment_sent', tgResponse: data });
  }

  return apiSuccess({ sent: msgs.length, results: msgs, tokenStatus: '✅', chatStatus: '✅' });
}
