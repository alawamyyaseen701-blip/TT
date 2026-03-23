'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const METHODS = [
  {
    id: 'bank_transfer', label: 'حوالة بنكية', icon: '🏦', color: '#1E3A8A',
    fields: [
      { key: 'bank_name', label: 'اسم البنك', placeholder: 'مثال: Al Rajhi Bank' },
      { key: 'iban', label: 'رقم الحساب (IBAN)', placeholder: 'SA...' },
      { key: 'account_name', label: 'اسم صاحب الحساب', placeholder: 'الاسم كما في البطاقة' },
      { key: 'swift', label: 'SWIFT Code (اختياري)', placeholder: 'RJHISARI' },
    ],
    note: 'يتم التحويل خلال 2-5 أيام عمل',
  },
  {
    id: 'vodafone_cash', label: 'Vodafone Cash', icon: '📱', color: '#E60000',
    fields: [
      { key: 'phone', label: 'رقم المحفظة (فودافون)', placeholder: '010XXXXXXXX' },
      { key: 'account_name', label: 'الاسم على المحفظة', placeholder: 'محمد أحمد' },
    ],
    note: '⚡ يصل فوراً بعد موافقة الإدارة — للمصريين',
  },
  {
    id: 'orange_cash', label: 'Orange Cash', icon: '🟠', color: '#FF6600',
    fields: [
      { key: 'phone', label: 'رقم المحفظة (أورنج)', placeholder: '012XXXXXXXX' },
      { key: 'account_name', label: 'الاسم على المحفظة', placeholder: 'محمد أحمد' },
    ],
    note: '⚡ يصل فوراً بعد موافقة الإدارة — للمصريين',
  },
  {
    id: 'we_cash', label: 'WE Cash', icon: '🔵', color: '#0033A0',
    fields: [
      { key: 'phone', label: 'رقم المحفظة (WE)', placeholder: '011XXXXXXXX' },
      { key: 'account_name', label: 'الاسم على المحفظة', placeholder: 'محمد أحمد' },
    ],
    note: '⚡ يصل فوراً بعد موافقة الإدارة — للمصريين',
  },
  {
    id: 'paypal', label: 'PayPal', icon: '💙', color: '#0070BA',
    fields: [
      { key: 'email', label: 'البريد الإلكتروني لـ PayPal', placeholder: 'yourname@paypal.com' },
      { key: 'full_name', label: 'الاسم الكامل على الحساب', placeholder: 'John Doe' },
    ],
    note: 'يصل خلال 1-2 يوم عمل',
  },
  {
    id: 'usdt_trc20', label: 'USDT TRC20', icon: '💎', color: '#26A17B',
    fields: [
      { key: 'wallet_address', label: 'عنوان محفظة TRC20', placeholder: 'T...' },
    ],
    note: '⚡ يصل خلال دقائق بعد تأكيد الإدارة',
  },
  {
    id: 'usdt_erc20', label: 'USDT ERC20', icon: '🔷', color: '#627EEA',
    fields: [
      { key: 'wallet_address', label: 'عنوان محفظة ERC20', placeholder: '0x...' },
    ],
    note: '⚡ يصل خلال دقائق (رسوم شبكة قد تُطبَّق)',
  },
  {
    id: 'wise', label: 'Wise', icon: '🟢', color: '#00B9FF',
    fields: [
      { key: 'email', label: 'البريد الإلكتروني لـ Wise', placeholder: 'yourname@wise.com' },
      { key: 'currency', label: 'العملة المفضلة', placeholder: 'USD / EUR / GBP / SAR' },
    ],
    note: 'يصل خلال 1-3 أيام عمل',
  },
  {
    id: 'binance', label: 'Binance Pay', icon: '🟡', color: '#F0B90B',
    fields: [
      { key: 'pay_id', label: 'Binance Pay ID', placeholder: '123456789' },
      { key: 'email', label: 'البريد على Binance (اختياري)', placeholder: 'yourname@email.com' },
    ],
    note: '⚡ تحويل فوري بعد موافقة الإدارة',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'قيد المراجعة', color: '#F59E0B', icon: '⏳' },
  approved: { label: 'موافق — جاري التحويل', color: '#3B82F6', icon: '✅' },
  paid: { label: 'تم الدفع', color: '#10B981', icon: '💰' },
  rejected: { label: 'مرفوض', color: '#EF4444', icon: '❌' },
};

export default function WithdrawalPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [nextRelease, setNextRelease] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState('bank_transfer');
  const [amount, setAmount] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const selectedMethod = METHODS.find(m => m.id === method)!;

  const fetchData = async () => {
    try {
      const res = await fetch('/api/withdrawals', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) {
        setWallet(data.data.wallet);
        setWithdrawals(data.data.withdrawals);
        setPendingBalance(data.data.pendingBalance || 0);
        setNextRelease(data.data.nextRelease);
        setStats(data.data.stats);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const available = wallet?.wallet_balance || 0;
  const amt = parseFloat(amount) || 0;
  const isValid = amt >= 10 && amt <= available && Object.values(fields).filter(Boolean).length >= selectedMethod.fields.filter(f => !f.label.includes('اختياري')).length;

  const handleSubmit = async () => {
    setSubmitting(true); setMsg(null);
    if (amt < 10) { setMsg({ type: 'error', text: 'الحد الأدنى للسحب $10' }); setSubmitting(false); return; }
    if (amt > available) { setMsg({ type: 'error', text: `رصيدك غير كافٍ. المتاح: $${available.toFixed(2)}` }); setSubmitting(false); return; }
    const accountDetails = JSON.stringify({ method_label: selectedMethod.label, ...fields });
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ amount: amt, method, account_details: accountDetails }),
      });
      const data = await res.json();
      if (!data.success) { setMsg({ type: 'error', text: data.error || 'حدث خطأ' }); return; }
      setMsg({ type: 'success', text: '✅ تم إرسال طلب السحب — ستصل أموالك خلال 24-48 ساعة' });
      setAmount(''); setFields({});
      await fetchData();
    } catch { setMsg({ type: 'error', text: 'خطأ في الاتصال' }); }
    finally { setSubmitting(false); }
  };

  const hoursUntilRelease = nextRelease
    ? Math.max(0, Math.ceil((new Date(nextRelease).getTime() - Date.now()) / 3600000))
    : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              💸 سحب الأرباح
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>طلب سحب الأموال</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>استلم أرباحك من صفقاتك المكتملة بطريقتك المفضلة</p>
          </div>

          {/* Balance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {/* Available */}
            <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 20, padding: 24, color: 'white' }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>💰 متاح للسحب الآن</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{loading ? '...' : `$${available.toFixed(2)}`}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>بعد خصم العمولة 5%</div>
            </div>

            {/* Pending */}
            <div style={{ background: pendingBalance > 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'white', borderRadius: 20, padding: 24, color: pendingBalance > 0 ? 'white' : '#0F172A', border: pendingBalance > 0 ? 'none' : '1.5px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>⏳ قيد فترة الحماية</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{loading ? '...' : `$${pendingBalance.toFixed(2)}`}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                {pendingBalance > 0 ? `يُفرج عنه خلال ${hoursUntilRelease} ساعة` : 'لا توجد أموال معلقة'}
              </div>
            </div>

            {/* Total Earned */}
            <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1.5px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>📊 إجمالي الأرباح</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#1E3A8A' }}>{loading ? '...' : `$${(stats?.totalEarned || 0).toFixed(2)}`}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>من {stats?.totalDeals || 0} صفقة مكتملة</div>
            </div>
          </div>

          {/* Info Banner */}
          <div style={{ marginBottom: 28, padding: '14px 20px', borderRadius: 14, background: 'rgba(30,58,138,0.04)', border: '1.5px solid rgba(30,58,138,0.1)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 20 }}>ℹ️</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
              <strong>كيف يعمل نظام السحب:</strong><br />
              ١. عند تأكيد المشتري للاستلام → تبدأ فترة حماية <strong>72 ساعة</strong><br />
              ٢. بعد انتهاء فترة الحماية → يُضاف صافي أرباحك (95%) تلقائياً لمحفظتك<br />
              ٣. تطلب السحب → تختار الطريقة → الإدارة تحوّل لك خلال 24-48 ساعة<br />
              ٤. المنصة تأخذ عمولة <strong>5% فقط</strong> من كل صفقة (الباقي 95% لك)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
            {/* Form */}
            <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1.5px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>📤 طلب سحب جديد</h2>

              {msg && (
                <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12,
                  background: msg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: msg.type === 'success' ? '#059669' : '#DC2626', fontSize: 13, fontWeight: 600 }}>
                  {msg.text}
                </div>
              )}

              {available < 10 && (
                <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.2)', color: '#92400E', fontSize: 13 }}>
                  ⚠️ رصيدك الحالي أقل من الحد الأدنى ($10). انتظر حتى تكتمل صفقاتك.
                  {pendingBalance > 0 && ` لديك $${pendingBalance.toFixed(2)} في فترة الحماية ستتاح خلال ${hoursUntilRelease} ساعة.`}
                </div>
              )}

              {/* Method Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 12 }}>طريقة الاستلام</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {METHODS.map(m => (
                    <button key={m.id} id={`method-${m.id}`}
                      onClick={() => { setMethod(m.id); setFields({}); }}
                      style={{ padding: '14px 8px', border: `2px solid ${method === m.id ? m.color : '#E2E8F0'}`, borderRadius: 14,
                        background: method === m.id ? `${m.color}10` : 'white', cursor: 'pointer',
                        fontFamily: 'Tajawal, sans-serif', fontSize: 12, fontWeight: 700,
                        color: method === m.id ? m.color : '#64748B', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 24 }}>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: '#F0FDF4', fontSize: 12, color: '#059669', fontWeight: 600 }}>
                  {selectedMethod.note}
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>المبلغ المطلوب سحبه ($)</label>
                <div style={{ position: 'relative' }}>
                  <input id="withdrawal-amount" type="number" min="10" step="0.01"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={`الحد الأدنى $10`}
                    style={{ width: '100%', padding: '13px 16px', border: `1.5px solid ${amt > available && amt > 0 ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 15, outline: 'none', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>المتاح: <strong style={{ color: '#10B981' }}>${available.toFixed(2)}</strong></span>
                  {amt > 0 && amt <= available && (
                    <span style={{ fontSize: 12, color: '#64748B' }}>المتبقي: <strong>${(available - amt).toFixed(2)}</strong></span>
                  )}
                  {amt > available && amt > 0 && (
                    <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>⚠️ يتجاوز رصيدك</span>
                  )}
                </div>
                {/* Quick amount buttons */}
                {available > 10 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {[25, 50, 100, available].filter(v => v <= available && v >= 10).map(v => (
                      <button key={v} onClick={() => setAmount(v.toFixed(2))}
                        style={{ padding: '6px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {v === available ? 'الكل' : `$${v}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Fields */}
              {selectedMethod.fields.map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>{f.label}</label>
                  <input id={`field-${f.key}`} value={fields[f.key] || ''}
                    onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
                </div>
              ))}

              <button id="submit-withdrawal" onClick={handleSubmit}
                disabled={submitting || !isValid || available < 10}
                style={{ width: '100%', padding: '15px', border: 'none', borderRadius: 14, marginTop: 8,
                  background: (submitting || !isValid || available < 10) ? '#CBD5E1' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white', fontWeight: 800, fontSize: 15,
                  cursor: (submitting || !isValid || available < 10) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Tajawal, sans-serif', boxShadow: isValid && available >= 10 ? '0 6px 20px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.2s' }}>
                {submitting ? '⏳ جاري الإرسال...' : `💸 سحب $${amt > 0 ? amt.toFixed(2) : '—'} عبر ${selectedMethod.label}`}
              </button>

              <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: '#F8FAFC', fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
                🔒 أموالك آمنة — يتحقق فريقنا من كل طلب قبل التحويل<br />
                📞 للاستفسار: راسلنا عبر <Link href="/messages" style={{ color: '#1E3A8A', fontWeight: 700 }}>الرسائل</Link>
              </div>
            </div>

            {/* History */}
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>📋 سجل طلبات السحب</h2>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ height: 80, borderRadius: 16, background: 'white', border: '1.5px solid #F1F5F9', marginBottom: 10, animation: 'pulse-glow 1.5s infinite' }} />
                ))
              ) : withdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ color: '#64748B', fontSize: 14 }}>لا توجد طلبات سحب بعد</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {withdrawals.map((w: any) => {
                    const s = STATUS_LABELS[w.status] || { label: w.status, color: '#94A3B8', icon: '?' };
                    const methodInfo = METHODS.find(m => m.id === w.method);
                    let details: any = {};
                    try { details = JSON.parse(w.account_details); } catch { /* ignore */ }
                    return (
                      <div key={w.id} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', border: `1.5px solid ${w.status === 'paid' ? 'rgba(16,185,129,0.2)' : '#E2E8F0'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>${Number(w.amount).toFixed(2)}</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              {methodInfo?.icon} {methodInfo?.label || w.method}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, background: `${s.color}15`, color: s.color, fontWeight: 700 }}>
                            {s.icon} {s.label}
                          </span>
                        </div>
                        {/* Account details */}
                        <div style={{ padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', fontSize: 12, color: '#374151' }}>
                          {Object.entries(details)
                            .filter(([k]) => k !== 'method_label')
                            .slice(0, 2)
                            .map(([k, v]) => (
                              <div key={k} style={{ marginBottom: 2 }}>
                                <span style={{ color: '#94A3B8' }}>{k.replace(/_/g, ' ')}: </span>
                                <strong>{String(v)}</strong>
                              </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: '#CBD5E1 ' }}>
                          {new Date(w.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        {w.admin_note && (
                          <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', color: '#DC2626', fontSize: 12 }}>
                            📝 {w.admin_note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Commission info */}
              {stats && stats.totalDeals > 0 && (
                <div style={{ marginTop: 20, padding: 20, borderRadius: 16, background: 'white', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>📊 إحصائيات الأرباح</div>
                  {[
                    { label: 'إجمالي أرباحك (95%)', value: `$${stats.totalEarned.toFixed(2)}`, color: '#10B981' },
                    { label: 'عمولة المنصة (5%)', value: `$${stats.totalCommission.toFixed(2)}`, color: '#F59E0B' },
                    { label: 'عدد الصفقات', value: stats.totalDeals, color: '#2563EB' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
