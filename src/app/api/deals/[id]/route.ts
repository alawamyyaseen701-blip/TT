import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDoc, updateDoc, createDoc } from '@/lib/firebase';
import { notifyPaymentPending, notifyNewDeal, notifyClawback } from '@/lib/telegram';

const PROTECTION_HOURS = 72;
const COMMISSION       = parseFloat(process.env.COMMISSION_RATE || '0.05');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { id } = await params;
    const deal   = await getDoc('deals', id);
    if (!deal)   return apiError('الصفقة غير موجودة', 404);

    const userDoc  = await getDoc('users', auth.userId);
    const isAdmin  = userDoc?.role === 'admin' || auth.role === 'admin';
    const isBuyer  = deal.buyer_id  === auth.userId;
    const isSeller = deal.seller_id === auth.userId;
    if (!isBuyer && !isSeller && !isAdmin) return apiError('غير مصرح', 403);

    const [buyer, seller, listing] = await Promise.all([
      getDoc('users', deal.buyer_id),
      getDoc('users', deal.seller_id),
      deal.listing_id ? getDoc('listings', deal.listing_id) : null,
    ]);

    let deliveryCredentials = null;
    if (deal.delivery_data) {
      const canSee = isSeller || isAdmin ||
        (isBuyer && ['in_delivery', 'delivered', 'confirmed', 'completed'].includes(deal.status));
      try { deliveryCredentials = canSee ? JSON.parse(deal.delivery_data) : { locked: true }; }
      catch { deliveryCredentials = null; }
    }

    let protectionInfo = null;
    if (deal.protection_expires_at) {
      const expiresAt = new Date(deal.protection_expires_at);
      const hoursLeft = Math.max(0, (expiresAt.getTime() - Date.now()) / 3_600_000);
      protectionInfo  = { active: hoursLeft > 0 && !deal.payout_released, hoursLeft: Math.ceil(hoursLeft), expiresAt: deal.protection_expires_at, payoutReleased: !!deal.payout_released };
    }

    return apiSuccess({
      deal: { ...deal, buyer_username: buyer?.username, buyer_name: buyer?.display_name, buyer_rating: buyer?.rating, seller_username: seller?.username, seller_name: seller?.display_name, seller_rating: seller?.rating, listing_title: listing?.title, listing_type: listing?.type, platform: listing?.platform },
      deliveryCredentials, protectionInfo,
    });
  } catch (e: any) { console.error('[deal GET]', e); return apiError('خطأ في الخادم', 500); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);
    const { id }     = await params;
    const body        = await req.json();
    const { action }  = body;
    const deal        = await getDoc('deals', id);
    if (!deal) return apiError('الصفقة غير موجودة', 404);

    const userDoc  = await getDoc('users', auth.userId);
    const isAdmin  = userDoc?.role === 'admin' || auth.role === 'admin';
    const isBuyer  = deal.buyer_id  === auth.userId;
    const isSeller = deal.seller_id === auth.userId;
    const now      = new Date().toISOString();

    // ── المشتري يبلّغ بإرسال كريبتو (TxID) ─────────────────────
    if (action === 'confirm_payment' && isBuyer) {
      if (deal.status !== 'pending_payment') return apiError('الصفقة ليست بانتظار الدفع');
      await updateDoc('deals', id, { status: 'payment_sent', payment_confirmed_by_buyer_at: now, payment_tx_id: body.txId || '', payment_method: body.method || '' });

      // Telegram notification to admin
      const [buyerDoc, sellerDoc] = await Promise.all([
        getDoc('users', deal.buyer_id),
        getDoc('users', deal.seller_id),
      ]);
      await notifyPaymentPending({
        id:          id,
        amount:      deal.amount,
        method:      body.method || 'manual',
        txId:        body.txId,
        buyerName:   buyerDoc?.display_name || buyerDoc?.username,
        sellerName:  sellerDoc?.display_name || sellerDoc?.username,
      });
      await createDoc('notifications', { user_id: 'admin', type: 'payment_sent', title: '💰 مشتري أرسل دفعة كريبتو', body: `صفقة #${id.slice(0,8)} — $${deal.amount} — TxID: ${body.txId || '—'}`, link: '/admin', read_at: null });
      return apiSuccess({ status: 'payment_sent' });
    }

    // ── الأدمن يؤكد الدفع (كريبتو) → in_escrow ─────────────────
    if (action === 'approve_payment' && isAdmin) {
      if (!['pending_payment', 'payment_sent'].includes(deal.status)) return apiError('الصفقة ليست بانتظار تأكيد');
      const sellerNet   = deal.amount * (1 - COMMISSION);
      const autoRelease = new Date(Date.now() + 7 * 86_400_000).toISOString();
      await updateDoc('deals', id, { status: 'in_escrow', seller_net: sellerNet, auto_release_at: autoRelease, payment_approved_at: now });
      if (deal.listing_id) { const l = await getDoc('listings', deal.listing_id); if (l && !l.allow_multiple_purchases) await updateDoc('listings', deal.listing_id, { status: 'sold' }); }
      const [buyerDoc2, sellerDoc2] = await Promise.all([getDoc('users', deal.buyer_id), getDoc('users', deal.seller_id)]);
      await Promise.all([
        createDoc('notifications', { user_id: deal.buyer_id,  type: 'payment_approved', title: '✅ تم تأكيد الدفع! الصفقة نشطة', body: `دفعتك $${deal.amount} في Escrow — انتظر البائع.`, link: `/deals/${id}`, read_at: null }),
        createDoc('notifications', { user_id: deal.seller_id, type: 'deal_active', title: '🎉 المشتري دفع — سلّم الآن!', body: `$${deal.amount} في Escrow. ستحصل على $${sellerNet.toFixed(2)} بعد التأكيد.`, link: `/deals/${id}`, read_at: null }),
        notifyNewDeal({ id, amount: deal.amount, listingTitle: deal.listing_title, buyerName: buyerDoc2?.display_name, sellerName: sellerDoc2?.display_name }),
      ]);
      return apiSuccess({ status: 'in_escrow' });
    }

    // ── البائع يرفع بيانات التسليم ──────────────────────────────
    if (action === 'submit_credentials' && isSeller) {
      if (!['in_escrow', 'in_delivery'].includes(deal.status)) return apiError('لا يمكن رفع البيانات الآن');
      const { credentials } = body;
      if (!credentials || !Object.values(credentials).some((v: any) => v?.toString().trim())) return apiError('يجب ملء حقل واحد على الأقل');
      await updateDoc('deals', id, { delivery_data: JSON.stringify(credentials), status: 'in_delivery' });
      await createDoc('notifications', { user_id: deal.buyer_id, type: 'deal_update', title: '🔓 بيانات الحساب جاهزة!', body: 'تحقق منها وأكد الاستلام.', link: `/deals/${id}`, read_at: null });
      return apiSuccess({ status: 'in_delivery' });
    }

    // ── المشتري يؤكد الاستلام → يُضاف رصيد البائع تلقائياً ────
    if (action === 'confirm_receipt' && isBuyer) {
      if (!['in_delivery', 'in_escrow'].includes(deal.status)) return apiError('لا يمكن التأكيد الآن');
      const protectionExpires = new Date(Date.now() + PROTECTION_HOURS * 3_600_000).toISOString();
      const sellerNet = deal.seller_net || deal.amount * (1 - COMMISSION);
      await updateDoc('deals', id, { status: 'completed', buyer_confirmed_at: now, protection_expires_at: protectionExpires, payout_released: false });
      const sellerDoc = await getDoc('users', deal.seller_id);
      await updateDoc('users', deal.seller_id, { wallet_balance: (sellerDoc?.wallet_balance || 0) + sellerNet, total_deals: (sellerDoc?.total_deals || 0) + 1 });
      if (deal.listing_id) { const l = await getDoc('listings', deal.listing_id); if (l && !l.allow_multiple_purchases && l.status !== 'sold') await updateDoc('listings', deal.listing_id, { status: 'sold' }); else if (l?.allow_multiple_purchases) await updateDoc('listings', deal.listing_id, { purchase_count: (l.purchase_count || 0) + 1 }); }
      await createDoc('notifications', { user_id: deal.seller_id, type: 'deal_update', title: `💰 $${sellerNet.toFixed(2)} في محفظتك!`, body: `المشتري أكد الاستلام. تم إضافة $${sellerNet.toFixed(2)} لمحفظتك بعد خصم عمولة ${COMMISSION * 100}%.`, link: `/deals/${id}`, read_at: null });
      return apiSuccess({ status: 'completed', sellerNet });
    }

    // ── المشتري يُبلغ عن Clawback ────────────────────────────────
    if (action === 'clawback' && isBuyer) {
      if (deal.status !== 'completed') return apiError('لا يمكن الإبلاغ إلا على صفقة مكتملة');
      if (deal.payout_released) return apiError('تم تحويل أموال البائع بالفعل');
      const protExpires = deal.protection_expires_at ? new Date(deal.protection_expires_at) : null;
      if (protExpires && new Date() > protExpires) return apiError(`انتهت فترة الحماية (${PROTECTION_HOURS} ساعة)`);
      const { reason } = body;
      if (!reason) return apiError('يجب ذكر سبب الإبلاغ');
      const sellerNet = deal.seller_net || deal.amount * (1 - COMMISSION);
      const sellerDoc = await getDoc('users', deal.seller_id);
      if ((sellerDoc?.wallet_balance || 0) >= sellerNet) await updateDoc('users', deal.seller_id, { wallet_balance: (sellerDoc?.wallet_balance || 0) - sellerNet });
      await updateDoc('deals', id, { status: 'clawback' });
      const buyerDoc3 = await getDoc('users', deal.buyer_id);
      await Promise.all([
        createDoc('notifications', { user_id: deal.seller_id, type: 'deal_disputed', title: '🚨 تجميد أموال — بلاغ استرداد', body: 'تم تجميد أموالك ريثما يُحقق الفريق.', link: `/deals/${id}`, read_at: null }),
        notifyClawback({ id, amount: deal.amount, reason, buyerName: buyerDoc3?.display_name || buyerDoc3?.username }),
      ]);
      return apiSuccess({ message: 'تم تجميد الأموال وإبلاغ الفريق' });
    }

    // ── إلغاء الصفقة ─────────────────────────────────────────────
    if (action === 'cancel' && (isBuyer || isAdmin)) {
      if (!['pending_payment', 'payment_sent', 'in_escrow'].includes(deal.status)) return apiError('لا يمكن إلغاء الصفقة الآن');
      await updateDoc('deals', id, { status: 'cancelled' });
      if (deal.listing_id) await updateDoc('listings', deal.listing_id, { status: 'active' });
      return apiSuccess({ status: 'cancelled' });
    }

    return apiError('إجراء غير صالح أو غير مصرح به');
  } catch (e: any) { console.error('[deal PATCH]', e); return apiError('خطأ في الخادم: ' + (e?.message || ''), 500); }
}
