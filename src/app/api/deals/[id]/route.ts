import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError, calculateCommission } from '@/lib/auth';
import { getDoc, updateDoc, createDoc, getDocs } from '@/lib/firebase';

const PROTECTION_HOURS = 72;

// GET /api/deals/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { id } = await params;
    const deal = await getDoc('deals', id);
    if (!deal) return apiError('الصفقة غير موجودة', 404);

    // Must be buyer, seller, or admin
    const userDoc = await getDoc('users', auth.userId);
    const isAdmin  = userDoc?.role === 'admin' || auth.role === 'admin';
    const isBuyer  = deal.buyer_id  === auth.userId;
    const isSeller = deal.seller_id === auth.userId;
    if (!isBuyer && !isSeller && !isAdmin)
      return apiError('غير مصرح لك بالاطلاع على هذه الصفقة', 403);

    // Enrich with user/listing info
    const [buyer, seller, listing] = await Promise.all([
      getDoc('users',    deal.buyer_id),
      getDoc('users',    deal.seller_id),
      deal.listing_id ? getDoc('listings', deal.listing_id) : null,
    ]);

    // Credentials: visible to seller/admin always, buyer only after delivery
    let deliveryCredentials = null;
    if (deal.delivery_data) {
      const canSee = isSeller || isAdmin ||
        (isBuyer && ['in_delivery', 'delivered', 'confirmed', 'completed'].includes(deal.status));
      if (canSee) {
        try { deliveryCredentials = JSON.parse(deal.delivery_data); }
        catch { deliveryCredentials = null; }
      } else {
        deliveryCredentials = { locked: true };
      }
    }

    // Protection window
    let protectionInfo = null;
    if (deal.protection_expires_at) {
      const expiresAt  = new Date(deal.protection_expires_at);
      const now        = new Date();
      const hoursLeft  = Math.max(0, (expiresAt.getTime() - now.getTime()) / 3_600_000);
      protectionInfo   = {
        active:         hoursLeft > 0 && !deal.payout_released,
        hoursLeft:      Math.ceil(hoursLeft),
        expiresAt:      deal.protection_expires_at,
        payoutReleased: !!deal.payout_released,
      };
    }

    return apiSuccess({
      deal: {
        ...deal,
        buyer_username:  buyer?.username,
        buyer_name:      buyer?.display_name,
        buyer_rating:    buyer?.rating,
        seller_username: seller?.username,
        seller_name:     seller?.display_name,
        seller_rating:   seller?.rating,
        listing_title:   listing?.title,
        listing_type:    listing?.type,
        platform:        listing?.platform,
      },
      deliveryCredentials,
      protectionInfo,
    });
  } catch (e: any) {
    console.error('[deal GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/deals/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth) return apiError('يجب تسجيل الدخول', 401);

    const { id }   = await params;
    const body     = await req.json();
    const { action } = body;

    const deal     = await getDoc('deals', id);
    if (!deal) return apiError('الصفقة غير موجودة', 404);

    const userDoc  = await getDoc('users', auth.userId);
    const isAdmin  = userDoc?.role === 'admin' || auth.role === 'admin';
    const isBuyer  = deal.buyer_id  === auth.userId;
    const isSeller = deal.seller_id === auth.userId;
    const now      = new Date().toISOString();

    // ── المشتري يبلّغ بإرسال الدفعة ─────────────────────────────
    if (action === 'confirm_payment' && isBuyer) {
      if (deal.status !== 'pending_payment')
        return apiError('الصفقة ليست بانتظار الدفع');

      await updateDoc('deals', id, {
        status:                'payment_sent',
        payment_confirmed_by_buyer_at: now,
      });

      // Notify admin to verify the payment
      await createDoc('notifications', {
        user_id: 'admin',
        type:    'payment_sent',
        title:   '💰 مشتري أرسل دفعة بانتظار التأكيد',
        body:    `صفقة #${id.slice(0, 8)} — مبلغ $${deal.amount} — بانتظار التحقق`,
        link:    `/admin`,
        read_at: null,
      });

      return apiSuccess({ status: 'payment_sent', message: 'تم إرسال الإشعار للأدمن — سيتم التأكيد خلال دقائق' });
    }

    // ── الأدمن يؤكد استلام الدفعة → الصفقة تبدأ (in_escrow) ─────
    if (action === 'approve_payment' && isAdmin) {
      if (!['pending_payment', 'payment_sent'].includes(deal.status))
        return apiError('الصفقة ليست بانتظار تأكيد الدفع');

      const autoRelease = new Date(Date.now() + 7 * 86_400_000).toISOString();
      await updateDoc('deals', id, {
        status:           'in_escrow',
        auto_release_at:  autoRelease,
        payment_approved_at: now,
      });

      // Mark listing sold (single-purchase types)
      if (deal.listing_id) {
        const listing = await getDoc('listings', deal.listing_id);
        if (listing && !listing.allow_multiple_purchases) {
          await updateDoc('listings', deal.listing_id, { status: 'sold' });
        }
      }

      // Notify buyer
      await createDoc('notifications', {
        user_id: deal.buyer_id,
        type:    'payment_approved',
        title:   '✅ تم تأكيد الدفعة! الصفقة نشطة',
        body:    `دفعتك $${deal.amount} تم تأكيدها. الصفقة الآن في Escrow — انتظر تسليم البائع.`,
        link:    `/deals/${id}`,
        read_at: null,
      });

      // Notify seller
      await createDoc('notifications', {
        user_id: deal.seller_id,
        type:    'deal_active',
        title:   '🎉 دفع المشتري تم تأكيده — سلّم الآن',
        body:    `صفقة #${id.slice(0, 8)} — المبلغ $${deal.amount} في Escrow. سلّم المنتج الآن.`,
        link:    `/deals/${id}`,
        read_at: null,
      });

      return apiSuccess({ status: 'in_escrow', message: 'تم تأكيد الدفع وتفعيل الصفقة' });
    }

    // ── البائع يرفع بيانات التسليم ──────────────────────────────
    if (action === 'submit_credentials' && isSeller) {
      if (!['in_escrow', 'in_delivery'].includes(deal.status))
        return apiError('لا يمكن رفع البيانات الآن');

      const { credentials } = body;
      if (!credentials || !Object.values(credentials).some((v: any) => v?.toString().trim()))
        return apiError('يجب ملء حقل واحد على الأقل');

      await updateDoc('deals', id, {
        delivery_data: JSON.stringify(credentials),
        status:        'in_delivery',
      });

      await createDoc('notifications', {
        user_id: deal.buyer_id,
        type:    'deal_update',
        title:   '🔓 بيانات الحساب جاهزة!',
        body:    'أرسل البائع بيانات الحساب. تحقق منها وأكد الاستلام.',
        link:    `/deals/${id}`,
        read_at: null,
      });

      return apiSuccess({ status: 'in_delivery' });
    }

    // ── المشتري يؤكد الاستلام ────────────────────────────────────
    if (action === 'confirm_receipt' && isBuyer) {
      if (!['in_delivery', 'in_escrow'].includes(deal.status))
        return apiError('لا يمكن التأكيد الآن');

      const protectionExpires = new Date(Date.now() + PROTECTION_HOURS * 3_600_000).toISOString();
      await updateDoc('deals', id, {
        status:                 'completed',
        buyer_confirmed_at:     now,
        protection_expires_at:  protectionExpires,
        payout_released:        false,
      });

      // ✅ Credit seller wallet (amount minus commission)
      const sellerDoc = await getDoc('users', deal.seller_id);
      const sellerNet = deal.seller_net || (deal.amount * 0.95);
      await updateDoc('users', deal.seller_id, {
        wallet_balance: (sellerDoc?.wallet_balance || 0) + sellerNet,
        total_deals:    (sellerDoc?.total_deals    || 0) + 1,
      });

      // Mark listing sold if not multiple-purchase
      if (deal.listing_id) {
        const listing = await getDoc('listings', deal.listing_id);
        if (listing && !listing.allow_multiple_purchases && listing.status !== 'sold') {
          await updateDoc('listings', deal.listing_id, { status: 'sold' });
        } else if (listing?.allow_multiple_purchases) {
          await updateDoc('listings', deal.listing_id, {
            purchase_count: (listing.purchase_count || 0) + 1,
          });
        }
      }

      // Notify seller
      await createDoc('notifications', {
        user_id: deal.seller_id,
        type:    'deal_update',
        title:   `⏳ تم التأكيد — $${sellerNet.toFixed(2)} في محفظتك!`,
        body:    `المشتري أكد الاستلام. تم إضافة $${sellerNet.toFixed(2)} لمحفظتك (بعد خصم عمولة 5%). يمكنك سحبه الآن.`,
        link:    `/deals/${id}`,
        read_at: null,
      });

      return apiSuccess({ status: 'completed', protectionHours: PROTECTION_HOURS, sellerNet });
    }

    // ── المشتري يُبلغ عن استرداد الحساب (Clawback) ───────────────
    if (action === 'clawback' && isBuyer) {
      if (deal.status !== 'completed') return apiError('لا يمكن الإبلاغ إلا على صفقة مكتملة');
      if (deal.payout_released)        return apiError('تم تحويل أموال البائع بالفعل');

      const protectionExpires = deal.protection_expires_at ? new Date(deal.protection_expires_at) : null;
      if (protectionExpires && new Date() > protectionExpires)
        return apiError(`انتهت فترة الحماية (${PROTECTION_HOURS} ساعة)`);

      const { reason } = body;
      if (!reason) return apiError('يجب ذكر سبب الإبلاغ');

      // Deduct seller wallet (freeze funds)
      const sellerDoc = await getDoc('users', deal.seller_id);
      const sellerNet = deal.seller_net || deal.amount * 0.95;
      if ((sellerDoc?.wallet_balance || 0) >= sellerNet) {
        await updateDoc('users', deal.seller_id, {
          wallet_balance: (sellerDoc?.wallet_balance || 0) - sellerNet,
        });
      }

      await updateDoc('deals', id, { status: 'clawback' });

      await Promise.all([
        createDoc('notifications', {
          user_id: deal.seller_id,
          type:    'deal_disputed',
          title:   '🚨 تجميد أموال — بلاغ استرداد حساب',
          body:    'المشتري أبلغ عن استرداد الحساب. تم تجميد أموالك ريثما يُحقق الفريق.',
          link:    `/deals/${id}`,
          read_at: null,
        }),
        createDoc('notifications', {
          user_id: 'admin',
          type:    'deal_disputed',
          title:   '🚨 Clawback — صفقة ' + id.slice(0, 8),
          body:    `المشتري أبلغ عن استرداد حساب. السبب: ${reason}`,
          link:    `/admin`,
          read_at: null,
        }),
      ]);

      return apiSuccess({ message: 'تم تجميد المبلغ وإبلاغ الفريق — سيتواصلون معك خلال 24 ساعة' });
    }

    // ── إلغاء الصفقة ─────────────────────────────────────────────
    if (action === 'cancel' && (isBuyer || isAdmin)) {
      if (!['pending_payment', 'payment_sent', 'in_escrow'].includes(deal.status))
        return apiError('لا يمكن إلغاء الصفقة الآن');

      await updateDoc('deals', id, { status: 'cancelled' });

      if (deal.listing_id && deal.status !== 'pending_payment')
        await updateDoc('listings', deal.listing_id, { status: 'active' });

      return apiSuccess({ status: 'cancelled' });
    }

    return apiError('إجراء غير صالح أو غير مصرح به');
  } catch (e: any) {
    console.error('[deal PATCH]', e);
    return apiError('خطأ في الخادم: ' + (e?.message || ''), 500);
  }
}
