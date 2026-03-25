import { NextRequest } from 'next/server';
import { getTokenFromRequest, apiSuccess, apiError } from '@/lib/auth';
import { getDocs, setDoc, getDoc } from '@/lib/firebase';

// Default payment methods config (seeded on first run)
const DEFAULTS = [
  { id: 'paymob_card',   icon: '💳', label: 'بطاقة بنكية (Paymob)',      description: 'Visa / Mastercard / Meeza', address: '', enabled: true,  type: 'auto',   note: 'تفعيل تلقائي عبر Paymob' },
  { id: 'paymob_wallet', icon: '📱', label: 'محفظة إلكترونية (Paymob)',  description: 'Vodafone Cash / Orange / CIB', address: '', enabled: true, type: 'auto',   note: 'تفعيل تلقائي عبر Paymob' },
  { id: 'instapay',      icon: '⚡', label: 'Instapay',                   description: 'تحويل فوري داخل مصر',    address: '', enabled: true,  type: 'manual', note: 'أدخل رقم هاتفك أو Instapay ID' },
  { id: 'paypal',        icon: '🅿️', label: 'PayPal',                    description: 'دفع دولي — $',            address: '', enabled: true,  type: 'auto',   note: 'تفعيل تلقائي عبر PayPal API' },
  { id: 'usdt_trc20',    icon: '💎', label: 'USDT TRC20',                 description: 'Tron Network',             address: '', enabled: true,  type: 'manual', note: 'أدخل عنوان محفظة TRC20' },
  { id: 'usdt_bep20',    icon: '🟡', label: 'USDT BEP20',                 description: 'Binance Smart Chain',      address: '', enabled: false, type: 'manual', note: 'أدخل عنوان محفظة BEP20' },
  { id: 'usdt_erc20',    icon: '🔷', label: 'USDT ERC20',                 description: 'Ethereum Network',         address: '', enabled: false, type: 'manual', note: 'أدخل عنوان محفظة ERC20' },
  { id: 'binance_pay',   icon: '🔶', label: 'Binance Pay',                description: 'بدون رسوم — فوري',        address: '', enabled: false, type: 'manual', note: 'أدخل Binance Pay ID' },
  { id: 'wise',          icon: '🌍', label: 'Wise Transfer',              description: 'تحويل بنكي دولي',         address: '', enabled: false, type: 'manual', note: 'أدخل بريد Wise الإلكتروني' },
];

async function seedIfEmpty() {
  for (const method of DEFAULTS) {
    const existing = await getDoc('payment_methods', method.id);
    if (!existing) {
      await setDoc('payment_methods', method.id, method);
    }
  }
}

// GET /api/admin/payment-methods
export async function GET(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('Admin only', 403);

    await seedIfEmpty();
    const methods = await getDocs('payment_methods', [], { orderBy: 'id' });
    return apiSuccess({ methods });
  } catch (e: any) {
    console.error('[payment-methods GET]', e);
    return apiError('خطأ في الخادم', 500);
  }
}

// PATCH /api/admin/payment-methods — update a method
export async function PATCH(req: NextRequest) {
  try {
    const auth = getTokenFromRequest(req);
    if (!auth || auth.role !== 'admin') return apiError('Admin only', 403);

    const { id, enabled, address, label, description } = await req.json();
    if (!id) return apiError('معرف طريقة الدفع مطلوب');

    const updates: Record<string, any> = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (address  !== undefined) updates.address = address;
    if (label    !== undefined) updates.label   = label;
    if (description !== undefined) updates.description = description;

    const { updateDoc } = await import('@/lib/firebase');
    await updateDoc('payment_methods', id, updates);
    return apiSuccess({ message: 'تم التحديث بنجاح' });
  } catch (e: any) {
    console.error('[payment-methods PATCH]', e);
    return apiError('خطأ في الخادم', 500);
  }
}
