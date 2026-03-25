/**
 * Telegram Bot Notification Service
 * ─────────────────────────────────
 * Setup:
 * 1. افتح @BotFather على Telegram → /newbot
 * 2. احفظ الـ TOKEN
 * 3. ابعت رسالة للبوت ثم افتح:
 *    https://api.telegram.org/bot{TOKEN}/getUpdates
 * 4. انسخ chat_id وضعه في TELEGRAM_ADMIN_CHAT_ID
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trustdeal.vercel.app';

type TgButton = { text: string; url?: string; callback_data?: string };

// ── Core sender — reads env vars at RUNTIME each call ─────────────────────

export async function sendTelegram(chatId: string, text: string, replyMarkup?: object): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const isLocalhost = (process.env.NEXT_PUBLIC_APP_URL || '').includes('localhost');

  if (!token || !chatId) {
    console.warn('[Telegram] BOT_TOKEN or chatId not configured — skipping. token=', token ? '✅' : '❌', 'chatId=', chatId || '❌');
    return false;
  }
  try {
    console.log('[Telegram] Sending to', chatId, '→', text.slice(0, 80));
    const payload: any = { chat_id: chatId, text, parse_mode: 'HTML' };
    // Telegram rejects localhost URLs in inline keyboards
    if (replyMarkup && !isLocalhost) payload.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) console.error('[Telegram] Send failed:', data.description);
    else console.log('[Telegram] ✅ Sent, message_id:', data.result?.message_id);
    return !!data.ok;
  } catch (e) {
    console.error('[Telegram] Error:', e);
    return false;
  }
}


/** Send to admin chat */
const tg = (text: string, buttons?: TgButton[][]) =>
  sendTelegram(process.env.TELEGRAM_ADMIN_CHAT_ID || '', text, buttons ? { inline_keyboard: buttons } : undefined);

// ── Notification templates ─────────────────────────────────────────────────

/** 💰 Manual payment pending verification (Instapay / Crypto) */
export async function notifyPaymentPending(deal: {
  id: string; amount: number; method: string; txId?: string;
  buyerName?: string; sellerName?: string;
}) {
  const methodLabel = deal.method === 'instapay' ? '⚡ Instapay' : `🪙 ${deal.method?.toUpperCase()}`;
  const text = `
💰 <b>دفعة بانتظار التحقق</b>

${methodLabel}
📦 الصفقة: <code>${deal.id.slice(0, 10)}...</code>
💵 المبلغ: <b>$${deal.amount}</b>
👤 المشتري: ${deal.buyerName || '—'}
🏪 البائع: ${deal.sellerName || '—'}
🔑 رقم العملية: <code>${deal.txId || '—'}</code>

<i>تحقق من العملية وافتح الصفقة لتأكيدها.</i>
`.trim();

  await tg(text, [[
    { text: '✅ تأكيد الدفع',  url: `${APP_URL}/admin?deal=${deal.id}&action=approve` },
    { text: '🔍 فتح الصفقة',   url: `${APP_URL}/deals/${deal.id}` },
    { text: '⚙️ لوحة التحكم', url: `${APP_URL}/admin` },
  ]]);
}

/** 💸 Withdrawal request submitted */
export async function notifyWithdrawal(req: {
  id: string; amount: number; method: string;
  sellerName?: string; sellerUsername?: string;
  walletAddress?: string;
}) {
  const text = `
💸 <b>طلب سحب جديد</b>

👤 البائع: ${req.sellerName || req.sellerUsername || '—'}
💵 المبلغ: <b>$${req.amount}</b>
🏦 طريقة السحب: ${req.method}
📍 العنوان: <code>${req.walletAddress || '—'}</code>
🆔 الطلب: <code>${req.id.slice(0, 10)}</code>

<i>راجع طلب السحب وحوّل المبلغ للبائع.</i>
`.trim();

  await tg(text, [[
    { text: '✅ موافقة',        url: `${APP_URL}/admin?section=payments&req=${req.id}` },
    { text: '⚙️ لوحة التحكم', url: `${APP_URL}/admin` },
  ]]);
}

/** ⚖️ Dispute opened */
export async function notifyDispute(dispute: {
  id: string; dealId: string; reason: string;
  buyerName?: string; sellerName?: string; amount?: number;
}) {
  const text = `
⚖️ <b>نزاع جديد مُفتوح!</b>

🆔 النزاع: <code>${dispute.id.slice(0, 10)}</code>
📦 الصفقة: <code>${dispute.dealId.slice(0, 10)}</code>
💵 المبلغ: ${dispute.amount ? `<b>$${dispute.amount}</b>` : '—'}
👤 المشتري: ${dispute.buyerName || '—'}
🏪 البائع: ${dispute.sellerName || '—'}
📝 السبب: <i>${dispute.reason.slice(0, 200)}</i>

⚠️ <b>يحتاج تدخل فوري!</b>
`.trim();

  await tg(text, [[
    { text: '⚖️ فتح النزاع',   url: `${APP_URL}/admin?section=disputes` },
    { text: '📦 عرض الصفقة',  url: `${APP_URL}/deals/${dispute.dealId}` },
  ]]);
}

/** 🚨 Clawback request */
export async function notifyClawback(deal: {
  id: string; amount: number; reason: string; buyerName?: string;
}) {
  const text = `
🚨 <b>طلب Clawback — استرداد أموال!</b>

📦 الصفقة: <code>${deal.id.slice(0, 10)}</code>
💵 المبلغ: <b>$${deal.amount}</b>
👤 المشتري: ${deal.buyerName || '—'}
📝 السبب: <i>${deal.reason.slice(0, 200)}</i>

⚠️ تم تجميد أموال البائع — راجع الطلب فوراً!
`.trim();

  await tg(text, [[
    { text: '🔍 فتح الصفقة',   url: `${APP_URL}/deals/${deal.id}` },
    { text: '⚙️ لوحة التحكم', url: `${APP_URL}/admin` },
  ]]);
}

/** 🎉 New deal started */
export async function notifyNewDeal(deal: {
  id: string; amount: number; listingTitle?: string;
  buyerName?: string; sellerName?: string;
}) {
  const text = `
🎉 <b>صفقة جديدة في Escrow</b>

📦 ${deal.listingTitle || 'صفقة مؤمّنة'}
💵 المبلغ: <b>$${deal.amount}</b>
👤 المشتري: ${deal.buyerName || '—'}
🏪 البائع: ${deal.sellerName || '—'}
🆔 الصفقة: <code>${deal.id.slice(0, 10)}</code>
`.trim();

  await tg(text, [[
    { text: '📦 عرض الصفقة',   url: `${APP_URL}/deals/${deal.id}` },
    { text: '⚙️ لوحة التحكم', url: `${APP_URL}/admin` },
  ]]);
}

/** 📊 Daily/manual stats report */
export async function sendStatsReport(stats: {
  totalDeals: number; newToday: number; pendingPayments: number;
  openDisputes: number; pendingWithdrawals: number;
  totalRevenue: number; escrowBalance: number;
}) {
  const now = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
  const text = `
📊 <b>تقرير Trust🔁Deal</b>
🕐 ${now}

═══════════════════════
💰 إجمالي الإيرادات: <b>$${stats.totalRevenue.toFixed(2)}</b>
💎 Escrow النشط: <b>$${stats.escrowBalance.toFixed(2)}</b>

🤝 الصفقات: <b>${stats.totalDeals}</b> | اليوم: <b>+${stats.newToday}</b>
⏳ دفعات بانتظار تأكيد: <b>${stats.pendingPayments}</b>
⚖️ نزاعات مفتوحة: <b>${stats.openDisputes}</b>
💸 طلبات سحب: <b>${stats.pendingWithdrawals}</b>
═══════════════════════
`.trim();

  await tg(text, [[
    { text: '⚙️ لوحة التحكم', url: `${APP_URL}/admin` },
  ]]);
}

/** 🔔 Generic alert */
export async function notifyAdmin(emoji: string, title: string, body: string, dealId?: string) {
  const text = `${emoji} <b>${title}</b>\n\n${body}`;
  const buttons: TgButton[][] = dealId
    ? [[{ text: '🔍 فتح', url: `${APP_URL}/deals/${dealId}` }, { text: '⚙️ لوحة', url: `${APP_URL}/admin` }]]
    : [[{ text: '⚙️ لوحة التحكم', url: `${APP_URL}/admin` }]];
  await tg(text, buttons);
}
