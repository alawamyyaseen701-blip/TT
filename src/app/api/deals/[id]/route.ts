import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

const PROTECTION_HOURS = 72; // ساعات الحماية بعد تأكيد المشتري

// GET /api/deals/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);
    const db = getDb();
    const dealId = (await params).id;

    const deal = db.prepare(`
      SELECT d.*,
        l.title as listing_title, l.type as listing_type, l.platform, l.description as listing_desc,
        buyer.id as buyer_id, buyer.username as buyer_username, buyer.display_name as buyer_name,
        buyer.rating as buyer_rating, buyer.total_deals as buyer_deals, buyer.role as buyer_role,
        seller.id as seller_id, seller.username as seller_username, seller.display_name as seller_name,
        seller.rating as seller_rating, seller.total_deals as seller_deals, seller.role as seller_role
      FROM deals d
      LEFT JOIN listings l ON l.id = d.listing_id
      JOIN users buyer ON buyer.id = d.buyer_id
      JOIN users seller ON seller.id = d.seller_id
      WHERE d.id = ? AND (d.buyer_id = ? OR d.seller_id = ? OR ? = 'admin')
    `).get(dealId, user.userId, user.userId, user.role) as any;

    if (!deal) return apiError('الصفقة غير موجودة', 404);
    const steps = db.prepare('SELECT * FROM deal_steps WHERE deal_id = ? ORDER BY step').all(dealId);

    // Decrypt delivery data
    let deliveryCredentials = null;
    if (deal.delivery_data) {
      const isBuyer = deal.buyer_id === user.userId;
      const isSeller = deal.seller_id === user.userId;
      const isAdmin = user.role === 'admin';
      const canSee = isSeller || isAdmin ||
        (isBuyer && ['in_delivery', 'delivered', 'confirmed', 'completed', 'clawback'].includes(deal.status));
      if (canSee) {
        try { deliveryCredentials = JSON.parse(decrypt(deal.delivery_data)); }
        catch { deliveryCredentials = null; }
      } else {
        deliveryCredentials = { locked: true, message: 'ستُكشف بعد تأكيد الدفع' };
      }
    }

    // Calculate protection window
    let protectionInfo = null;
    if (deal.protection_expires_at) {
      const expiresAt = new Date(deal.protection_expires_at);
      const now = new Date();
      const hoursLeft = Math.max(0, (expiresAt.getTime() - now.getTime()) / 3600000);
      protectionInfo = {
        active: hoursLeft > 0 && !deal.payout_released,
        hoursLeft: Math.ceil(hoursLeft),
        expiresAt: deal.protection_expires_at,
        payoutReleased: !!deal.payout_released,
      };
    }

    const { delivery_data: _, ...dealClean } = deal;
    return apiSuccess({ deal: dealClean, steps, deliveryCredentials, protectionInfo });
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/deals/[id]
export async function PATCH(req: NextRequest, { params: paramsP }: { params: Promise<{ id: string }> }) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return apiError('يجب تسجيل الدخول', 401);
    const params = await paramsP;
    const body = await req.json();
    const { action } = body;
    const db = getDb();

    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(params.id) as any;
    if (!deal) return apiError('الصفقة غير موجودة', 404);

    const isBuyer = deal.buyer_id === user.userId;
    const isSeller = deal.seller_id === user.userId;
    const isAdmin = user.role === 'admin';

    // ─── البائع يرفع بيانات الحساب ────────────────────────────────
    if (action === 'submit_credentials' && isSeller) {
      if (!['in_escrow', 'in_delivery'].includes(deal.status)) return apiError('لا يمكن رفع البيانات الآن');
      const { credentials } = body;
      if (!credentials || !Object.values(credentials).some((v: any) => v?.toString().trim())) {
        return apiError('يجب ملء حقل واحد على الأقل');
      }
      const encrypted = encrypt(JSON.stringify(credentials));
      db.transaction(() => {
        db.prepare("UPDATE deals SET delivery_data=?, status='in_delivery', updated_at=datetime('now') WHERE id=?")
          .run(encrypted, params.id);
        db.prepare("UPDATE deal_steps SET completed_at=datetime('now') WHERE deal_id=? AND step=3").run(params.id);
        db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'deal_update',?,?,?)`)
          .run(deal.buyer_id, '🔓 بيانات الحساب جاهزة!',
            'أرسل البائع بيانات الحساب. تحقق منها وأكد الاستلام — أموالك في أمان.',
            `/deals/${params.id}`);
      })();
      return apiSuccess({ status: 'in_delivery' });
    }

    // ─── البائع يبدأ التسليم ────────────────────────────────────
    if (action === 'start_delivery' && isSeller) {
      if (deal.status !== 'in_escrow') return apiError('لا يمكن تغيير الحالة الآن');
      db.transaction(() => {
        db.prepare("UPDATE deals SET status='in_delivery', updated_at=datetime('now') WHERE id=?").run(params.id);
        db.prepare("UPDATE deal_steps SET completed_at=datetime('now') WHERE deal_id=? AND step=3").run(params.id);
        db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'deal_update',?,?,?)`)
          .run(deal.buyer_id, 'بدأ التسليم!', 'البائع بدأ التسليم. تحقق من الصفقة.', `/deals/${params.id}`);
      })();
      return apiSuccess({ status: 'in_delivery' });
    }

    // ─── المشتري يؤكد الاستلام — فترة حماية 72 ساعة ────────────
    if (action === 'confirm_receipt' && isBuyer) {
      if (!['in_delivery', 'in_escrow'].includes(deal.status)) return apiError('لا يمكن التأكيد الآن');
      const now = new Date();
      const protectionExpires = new Date(now.getTime() + PROTECTION_HOURS * 3600000).toISOString();

      db.transaction(() => {
        db.prepare(`
          UPDATE deals SET
            status='completed',
            buyer_confirmed_at=datetime('now'),
            protection_expires_at=?,
            payout_released=0,
            updated_at=datetime('now')
          WHERE id=?
        `).run(protectionExpires, params.id);
        db.prepare("UPDATE deal_steps SET completed_at=datetime('now') WHERE deal_id=? AND step IN (4,5)").run(params.id);
        // نُجمِّد المال في escrow_balance المشتري مؤقتاً حتى تنتهي فترة الحماية
        db.prepare('UPDATE users SET escrow_balance=escrow_balance-?, total_deals=total_deals+1 WHERE id=?')
          .run(deal.amount, deal.buyer_id);
        // البائع يرى المال "قيد الإفراج" لكن لا يُضاف لمحفظته بعد
        db.prepare('UPDATE users SET total_deals=total_deals+1 WHERE id=?').run(deal.seller_id);
        if (deal.listing_id) db.prepare("UPDATE listings SET status='sold' WHERE id=?").run(deal.listing_id);
        db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'deal_update',?,?,?)`)
          .run(deal.seller_id, '⏳ تم التأكيد — أموالك في فترة الحماية',
            `المشتري أكد الاستلام! أموالك $${deal.seller_net} ستُحوَّل بعد ${PROTECTION_HOURS} ساعة (فترة ضمان المشتري).`,
            `/deals/${params.id}`);
        db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'deal_update',?,?,?)`)
          .run(deal.buyer_id, '✅ تأكيد مُرسَل — فترة حمايتك نشطة',
            `تبدأ الآن فترة حماية ${PROTECTION_HOURS} ساعة. إذا استعاد البائع الحساب، أبلغ فوراً وسنُجمِّد أمواله.`,
            `/deals/${params.id}`);
      })();
      return apiSuccess({ status: 'completed', protectionHours: PROTECTION_HOURS, protectionExpires });
    }

    // ─── المشتري يُبلغ عن استرداد الحساب (Clawback) ─────────────
    if (action === 'clawback' && isBuyer) {
      if (deal.status !== 'completed') return apiError('لا يمكن الإبلاغ إلا على صفقة مكتملة');
      if (deal.payout_released) return apiError('تم إطلاق الأموال للبائع بالفعل — تواصل مع الدعم');
      const protectionExpires = deal.protection_expires_at ? new Date(deal.protection_expires_at) : null;
      if (protectionExpires && new Date() > protectionExpires) {
        return apiError(`انتهت فترة الحماية (${PROTECTION_HOURS} ساعة). تواصل مع الدعم لفتح نزاع.`);
      }
      const { reason } = body;
      if (!reason) return apiError('يجب ذكر سبب الإبلاغ');

      db.transaction(() => {
        // نُجمِّد المبلغ — لن يصل للبائع
        db.prepare("UPDATE deals SET status='clawback', updated_at=datetime('now') WHERE id=?").run(params.id);
        // نفتح نزاعاً تلقائياً
        const { generateId } = require('@/lib/auth');
        db.prepare(`
          INSERT INTO disputes (id, deal_id, opened_by, reason, description, status)
          VALUES (?, ?, ?, 'account_recovered', ?, 'open')
        `).run(generateId(), params.id, user.userId, reason);
        // إبلاغ البائع
        db.prepare(`INSERT INTO notifications (user_id,type,title,body,link) VALUES (?,'deal_disputed',?,?,?)`)
          .run(deal.seller_id, '🚨 تحذير: تم تجميد أموالك!',
            'أبلغ المشتري عن استرداد الحساب. تم تجميد أموالك ريثما يُحقق الفريق.', `/deals/${params.id}`);
        // إبلاغ الأدمن
        db.prepare(`INSERT INTO notifications (user_id,type,title,body,link)
          SELECT id, 'deal_disputed', '🚨 Clawback تلقائي', ?, ? FROM users WHERE role='admin'`)
          .run(`المشتري أبلغ عن استرداد حساب في صفقة #${params.id.slice(0,8)}`, `/admin`);
      })();
      return apiSuccess({ message: 'تم تجميد المبلغ وفتح نزاع تلقائي — سيتواصل معك فريقنا خلال 24 ساعة' });
    }

    // ─── إلغاء الصفقة ──────────────────────────────────────────
    if (action === 'cancel' && (isBuyer || isAdmin)) {
      if (!['pending_payment', 'in_escrow'].includes(deal.status)) return apiError('لا يمكن إلغاء الصفقة الآن');
      db.transaction(() => {
        db.prepare("UPDATE deals SET status='cancelled', updated_at=datetime('now') WHERE id=?").run(params.id);
        if (deal.status === 'in_escrow') {
          db.prepare('UPDATE users SET escrow_balance=escrow_balance-?, wallet_balance=wallet_balance+? WHERE id=?')
            .run(deal.amount, deal.amount, deal.buyer_id);
          if (deal.listing_id) db.prepare("UPDATE listings SET status='active' WHERE id=?").run(deal.listing_id);
        }
      })();
      return apiSuccess({ status: 'cancelled' });
    }

    return apiError('إجراء غير صالح أو غير مصرح به');
  } catch (e) {
    console.error(e);
    return apiError('خطأ في الخادم', 500);
  }
}
