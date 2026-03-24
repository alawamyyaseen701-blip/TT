'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STEP_LABELS = [
  { id: 1, label: 'تأكيد الطلب', icon: '📋', desc: 'تم قبول الصفقة من كلا الطرفين' },
  { id: 2, label: 'الدفع إلى Escrow', icon: '💰', desc: 'تم إيداع المبلغ في حساب الضمان' },
  { id: 3, label: 'بدء التسليم', icon: '📦', desc: 'البائع يقوم بنقل ملكية الأصل' },
  { id: 4, label: 'مراجعة المشتري', icon: '🔍', desc: 'المشتري يتحقق من الاستلام' },
  { id: 5, label: 'تحرير الأموال', icon: '✅', desc: 'يتم تحويل المبلغ للبائع تلقائياً' },
];

const STATUS_STEP: Record<string, number> = {
  pending_payment: 1, in_escrow: 2,
  in_delivery: 3, delivered: 3,
  confirmed: 4, completed: 5,
  cancelled: 0, refunded: 0, disputed: 2,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'في انتظار الدفع', color: '#F59E0B' },
  in_escrow: { label: 'محتجز في Escrow', color: '#2563EB' },
  in_delivery: { label: 'جارٍ التسليم', color: '#F97316' },
  delivered: { label: 'تم التسليم', color: '#8B5CF6' },
  confirmed: { label: 'مؤكد', color: '#10B981' },
  completed: { label: 'مكتمل', color: '#10B981' },
  disputed: { label: 'نزاع مفتوح', color: '#EF4444' },
  cancelled: { label: 'ملغي', color: '#94A3B8' },
  refunded: { label: 'مسترد', color: '#64748B' },
};

/* ── Payment Method Card ─────────────────────────────────────────── */
function PaymentCard({ method }: { method: { id: string; icon: string; name: string; tag: string; address: string; note: string; color: string; bg: string } }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(method.address).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ marginBottom: 10, borderRadius: 14, border: `1.5px solid ${method.color}30`, background: method.bg, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{method.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{method.name}</div>
          <div style={{ fontSize: 11, color: method.color, fontWeight: 600 }}>{method.tag}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: `1px solid ${method.color}40`, borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
          <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: '#0F172A', wordBreak: 'break-all' }}>{method.address}</span>
          <button onClick={copy} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 8, border: 'none', background: copied ? '#10B981' : method.color, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', transition: 'background 0.2s' }}>
            {copied ? '✓ تم' : 'نسخ'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#64748B' }}>⚠️ {method.note}</div>
      </div>
    </div>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [showCredForm, setShowCredForm] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '', email: '', recovery_email: '', notes: '' });
  const [credSubmitting, setCredSubmitting] = useState(false);
  const [credMsg, setCredMsg] = useState('');
  const [showClawback, setShowClawback] = useState(false);
  const [clawbackReason, setClawbackReason] = useState('');
  const [clawbackLoading, setClawbackLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await fetch(`/api/deals/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!data.success) { setError(data.error || 'لم يتم العثور على الصفقة'); return; }
        setDeal(data.data);
      } catch { setError('خطأ في تحميل الصفقة'); }
      finally { setLoading(false); }
    };
    if (params.id) fetchDeal();
  }, [params.id]);

  const submitCredentials = async () => {
    const hasData = Object.values(credentials).some(v => v.trim());
    if (!hasData) { setCredMsg('❌ يجب ملء حقل واحد على الأقل'); return; }
    setCredSubmitting(true); setCredMsg('');
    try {
      const res = await fetch(`/api/deals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'submit_credentials', credentials }),
      });
      const data = await res.json();
      if (!data.success) { setCredMsg('❌ ' + (data.error || 'حدث خطأ')); return; }
      setCredMsg('✅ تم رفع البيانات بنجاح وإبلاغ المشتري');
      setShowCredForm(false);
      const refresh = await fetch(`/api/deals/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const refreshData = await refresh.json();
      if (refreshData.success) setDeal(refreshData.data);
    } catch { setCredMsg('❌ خطأ في الاتصال'); }
    finally { setCredSubmitting(false); }
  };

  const submitClawback = async () => {
    if (!clawbackReason.trim()) return;
    setClawbackLoading(true);
    try {
      const res = await fetch(`/api/deals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'clawback', reason: clawbackReason }),
      });
      const data = await res.json();
      if (!data.success) { setActionMsg('❌ ' + (data.error || 'حدث خطأ')); return; }
      setActionMsg('🚨 تم تجميد الأموال وفتح نزاع — سيتواصل معك فريقنا قريباً');
      setShowClawback(false);
      const refresh = await fetch(`/api/deals/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const refreshData = await refresh.json();
      if (refreshData.success) setDeal(refreshData.data);
    } catch { setActionMsg('❌ خطأ في الاتصال'); }
    finally { setClawbackLoading(false); }
  };

  const handleAction = async (action: string) => {
    setActionLoading(true); setActionMsg('');
    try {
      const res = await fetch(`/api/deals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) { setActionMsg('❌ ' + (data.error || 'حدث خطأ')); return; }
      setActionMsg('✅ تم التحديث بنجاح');
      setShowConfirm(false);
      // Refresh deal
      const refresh = await fetch(`/api/deals/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const refreshData = await refresh.json();
      if (refreshData.success) setDeal(refreshData.data);
    } catch { setActionMsg('❌ خطأ في الاتصال'); }
    finally { setActionLoading(false); }
  };

  const submitDispute = async () => {
    if (!disputeReason) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ dealId: params.id, reason: disputeReason, description: disputeDesc }),
      });
      const data = await res.json();
      if (data.success) { setShowDispute(false); setActionMsg('✅ تم رفع النزاع — سيتواصل معك الفريق قريباً'); }
      else setActionMsg('❌ ' + (data.error || 'حدث خطأ'));
    } catch { setActionMsg('❌ خطأ في الاتصال'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ marginTop: 16, color: '#64748B' }}>جاري التحميل...</div></div>
    </div>
  );

  if (error || !deal) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{error || 'الصفقة غير موجودة'}</div>
        <Link href="/dashboard"><button style={{ padding: '12px 24px', border: 'none', borderRadius: 12, background: '#1E3A8A', color: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}>← العودة للوحة التحكم</button></Link>
      </div>
    </div>
  );

  const currentStep = STATUS_STEP[deal.status] || 0;
  const statusInfo = STATUS_LABELS[deal.status] || { label: deal.status, color: '#94A3B8' };
  const isBuyer = currentUser?.id === deal.buyer_id || currentUser?.id === String(deal.buyer_id);
  const isSeller = currentUser?.id === deal.seller_id || currentUser?.id === String(deal.seller_id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        {/* Top Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/dashboard" style={{ color: '#64748B', textDecoration: 'none', fontSize: 13 }}>← لوحة التحكم</Link>
              <span style={{ color: '#CBD5E1' }}>›</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>صفقة #{String(deal.id).slice(0, 8)}</span>
              <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 100, background: `${statusInfo.color}15`, color: statusInfo.color, fontWeight: 700 }}>
                {statusInfo.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href={`/messages?with=${isBuyer ? deal.seller_id : deal.buyer_id}`} style={{ textDecoration: 'none' }}>
                <button id="msg-btn" style={{ padding: '8px 18px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, color: '#1E3A8A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  💬 مراسلة
                </button>
              </Link>
              {(isBuyer || isSeller) && deal.status !== 'completed' && deal.status !== 'cancelled' && (
                <button id="dispute-btn" onClick={() => setShowDispute(true)} style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  ⚖️ فتح نزاع
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          {/* Main Column */}
          <div>
            {actionMsg && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: actionMsg.startsWith('✅') ? '#059669' : '#DC2626', fontWeight: 600, fontSize: 14 }}>
                {actionMsg}
              </div>
            )}

            {/* ─── بانر فترة الحماية ─────────────────────────────────── */}
            {deal.protectionInfo && isBuyer && deal.status === 'completed' && (
              <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${deal.protectionInfo.active ? 'rgba(16,185,129,0.3)' : '#E2E8F0'}` }}>
                <div style={{ padding: '14px 20px', background: deal.protectionInfo.active ? 'rgba(16,185,129,0.06)' : '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: deal.protectionInfo.active ? '#059669' : '#94A3B8', fontSize: 14 }}>
                      {deal.protectionInfo.active ? `🛡️ فترة الحماية نشطة — ${deal.protectionInfo.hoursLeft} ساعة متبقية` : '⏰ انتهت فترة الحماية'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                      {deal.protectionInfo.active
                        ? 'إذا استُرجع الحساب الآن يمكنك تجميد أموال البائع فوراً'
                        : deal.protectionInfo.payoutReleased ? 'تم تحويل أموال البائع بعد انتهاء فترة الأمان' : 'سيتم تحويل الأموال تلقائياً قريباً'}
                    </div>
                  </div>
                  {deal.protectionInfo.active && !showClawback && (
                    <button id="clawback-btn" onClick={() => setShowClawback(true)}
                      style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', whiteSpace: 'nowrap' }}>
                      🚨 استُرجع الحساب!
                    </button>
                  )}
                </div>
                {showClawback && deal.protectionInfo.active && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.03)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 10 }}>
                      ⚠️ بضغطك هذا الزر سيتم تجميد أموال البائع فوراً وفتح نزاع رسمي
                    </div>
                    <textarea value={clawbackReason} onChange={e => setClawbackReason(e.target.value)}
                      placeholder="اشرح ما حدث بالتفصيل: متى غيّر البائع الباسورد؟ هل تحاول التسجيل وتجد كلمة المرور خاطئة؟..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 10, fontFamily: 'Tajawal, sans-serif', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 12 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setShowClawback(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                      <button id="confirm-clawback-btn" onClick={submitClawback} disabled={clawbackLoading || !clawbackReason.trim()}
                        style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: clawbackLoading ? '#CBD5E1' : 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white', fontWeight: 800, fontSize: 14, cursor: clawbackLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {clawbackLoading ? '⏳ جاري التجميد...' : '🚨 تجميد الأموال فوراً'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Steps */}
            <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>🔒 مراحل الصفقة الآمنة</h2>
                <span style={{ fontSize: 12, color: '#64748B' }}>الخطوة {currentStep} من {STEP_LABELS.length}</span>
              </div>
              <div style={{ padding: '28px 24px' }}>
                {STEP_LABELS.map((step, i) => {
                  const done = currentStep > step.id;
                  const active = currentStep === step.id;
                  return (
                    <div key={step.id} style={{ display: 'flex', gap: 20, marginBottom: i < STEP_LABELS.length - 1 ? 8 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? 18 : 16, fontWeight: 800, background: done ? 'linear-gradient(135deg, #10B981, #059669)' : active ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#F1F5F9', color: (done || active) ? 'white' : '#94A3B8', boxShadow: active ? '0 0 0 4px rgba(30,58,138,0.12)' : 'none', zIndex: 1, position: 'relative' }}>
                          {done ? '✓' : step.icon}
                        </div>
                        {i < STEP_LABELS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 32, background: done ? '#10B981' : '#E2E8F0', margin: '4px 0' }} />}
                      </div>
                      <div style={{ paddingTop: 10, paddingBottom: i < STEP_LABELS.length - 1 ? 28 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: done ? '#10B981' : active ? '#1E3A8A' : '#94A3B8' }}>{step.label}</span>
                          {active && <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, background: 'rgba(30,58,138,0.1)', color: '#1E3A8A', fontWeight: 700 }}>● جارٍ الآن</span>}
                        </div>
                        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── BUYER: Pay Now button ─────────────────────────── */}
              {isBuyer && ['pending_payment', 'payment_sent'].includes(deal.status) && (
                <div style={{ padding: '24px', borderTop: '2px solid #F59E0B', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>💳</span>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#92400E' }}>
                      {deal.status === 'payment_sent' ? '⏳ جاري التحقق من دفعتك...' : 'أكمل الدفع لتفعيل الصفقة'}
                    </div>
                  </div>
                  {deal.status === 'payment_sent' ? (
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.12)', border: '1px solid #FCD34D', fontSize: 13, color: '#92400E', lineHeight: 1.7 }}>
                      ✅ استلمنا إشعار دفعتك — جاري التحقق على البلوك تشين أو بوابة الدفع.<br />
                      سيتم تفعيل الصفقة <strong>خلال 30 دقيقة</strong> وستصلك إشعار فور التأكيد.
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: '#78350F', marginBottom: 16, lineHeight: 1.7 }}>
                        ادفع <strong>${deal.amount}</strong> عبر بوابة الدفع الآمنة — بطاقة بنكية، PayPal، أو USDT.<br />
                        الأموال تذهب مباشرة لحساب الضمان ✅
                      </p>
                      <Link href={`/payment/${deal.id}`}>
                        <button
                          id="go-to-payment-btn"
                          style={{ width: '100%', padding: '16px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(30,58,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          💳 ادفع الآن ${deal.amount} — مؤمَّن 100%
                          <span style={{ fontSize: 12, opacity: 0.8 }}>→</span>
                        </button>
                      </Link>
                      <div style={{ marginTop: 10, display: 'flex', gap: 12, justifyContent: 'center', fontSize: 12, color: '#92400E' }}>
                        <span>💳 Visa / Mastercard</span>
                        <span>🅿️ PayPal</span>
                        <span>💎 USDT</span>
                        <span>🔶 Binance</span>
                      </div>
                    </>
                  )}
                </div>
              )}



              {/* ─── SELLER: Upload Credentials ─────────────────── */}
              {isSeller && ['in_escrow', 'in_delivery'].includes(deal.status) && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', background: 'rgba(30,58,138,0.03)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>📦 الخطوة التالية للبائع</div>
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>ارفع بيانات الحساب بأمان ← ستبقى مشفرة ولن يراها المشتري إلا بعد تأكيد الدفع.</p>
                  {credMsg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: credMsg.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: credMsg.startsWith('✅') ? '#059669' : '#DC2626', fontSize: 13, fontWeight: 600 }}>{credMsg}</div>}
                  {!deal.deliveryCredentials && !showCredForm && (
                    <button id="upload-creds-btn" onClick={() => setShowCredForm(true)}
                      style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      🔐 رفع بيانات الحساب
                    </button>
                  )}
                  {deal.deliveryCredentials && !deal.deliveryCredentials.locked && (
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: 13, fontWeight: 700 }}>
                      ✅ تم رفع بيانات الحساب — في انتظار تأكيد المشتري
                    </div>
                  )}
                  {showCredForm && (
                    <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 20, background: 'white' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        🔒 هذه البيانات ستُخزَّن مشفرة ولن تُكشف للمشتري إلا بعد تأكيد الدفع
                      </div>
                      {[{ key: 'username', label: '👤 اسم المستخدم / اليوزر', placeholder: 'username123' },
                        { key: 'password', label: '🔑 كلمة المرور', placeholder: 'P@ssw0rd!' },
                        { key: 'email', label: '📧 الإيميل المرتبط', placeholder: 'account@gmail.com' },
                        { key: 'recovery_email', label: '🔄 إيميل الاسترداد (اختياري)', placeholder: 'recovery@gmail.com' },
                        { key: 'notes', label: '📝 ملاحظات إضافية (اختياري)', placeholder: 'رمز التحقق الثنائي، إلخ...' }]
                        .map(f => (
                          <div key={f.key} style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{f.label}</label>
                            <input id={`cred-${f.key}`} type={f.key === 'password' ? 'text' : 'text'}
                              value={(credentials as any)[f.key]} onChange={e => setCredentials(prev => ({ ...prev, [f.key]: e.target.value }))}
                              placeholder={f.placeholder}
                              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }} />
                          </div>
                        ))}
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button onClick={() => setShowCredForm(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                        <button id="submit-creds-btn" onClick={submitCredentials} disabled={credSubmitting}
                          style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 10, background: credSubmitting ? '#CBD5E1' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 14, cursor: credSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                          {credSubmitting ? '⏳ جاري الرفع...' : '🔐 رفع وتشفير البيانات'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── BUYER: View Credentials ─────────────────────── */}
              {isBuyer && deal.deliveryCredentials && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', background: deal.deliveryCredentials.locked ? 'rgba(148,163,184,0.04)' : 'rgba(16,185,129,0.04)' }}>
                  {deal.deliveryCredentials.locked ? (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>بيانات الحساب مقفلة</div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>ستظهر بعد تأكيد إيداع مبلغك في Escrow</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ fontSize: 20 }}>🔓</div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>بيانات الحساب — سرية لك فقط</div>
                      </div>
                      <div style={{ border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 14, overflow: 'hidden' }}>
                        {[{ key: 'username', label: '👤 اليوزر' }, { key: 'password', label: '🔑 الباسورد' }, { key: 'email', label: '📧 الإيميل' }, { key: 'recovery_email', label: '🔄 إيميل الاسترداد' }, { key: 'notes', label: '📝 ملاحظات' }]
                          .filter(f => (deal.deliveryCredentials as any)[f.key])
                          .map((f, i) => (
                            <div key={f.key} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: i % 2 === 0 ? '#F0FDF4' : 'white', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                              <span style={{ fontSize: 13, color: '#64748B', width: 140, flexShrink: 0 }}>{f.label}</span>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', letterSpacing: 0.5 }}>{(deal.deliveryCredentials as any)[f.key]}</span>
                              <button onClick={() => navigator.clipboard.writeText((deal.deliveryCredentials as any)[f.key])} style={{ marginRight: 'auto', padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', color: '#64748B', fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>نسخ</button>
                            </div>
                          ))}
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>تحقق من البيانات وتسجيل الدخول، ثم اضغط تأكيد الاستلام لإطلاق المبلغ للبائع.</p>
                        <button id="confirm-receipt-btn" onClick={() => setShowConfirm(true)}
                          style={{ padding: '13px 32px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
                          ✅ تأكيد الاستلام وتحرير الأموال
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {deal.status === 'completed' && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', background: 'rgba(16,185,129,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981', marginBottom: 4 }}>الصفقة مكتملة!</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>تم تحويل ${(deal.seller_net || deal.amount * 0.95).toLocaleString()} للبائع</div>
                </div>
              )}
            </div>

            {/* Timeline from deal_steps */}
            <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>📜 سجل الصفقة</h2>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {[
                  { time: deal.created_at, event: 'تم إنشاء الصفقة', icon: '📋', color: '#8B5CF6' },
                  ...(deal.status !== 'pending_payment' ? [{ time: deal.updated_at, event: 'تم إيداع المبلغ في Escrow', icon: '💰', color: '#10B981' }] : []),
                  ...(deal.status === 'in_delivery' || deal.status === 'completed' ? [{ time: deal.updated_at, event: 'بدأ البائع التسليم', icon: '📦', color: '#F97316' }] : []),
                  ...(deal.status === 'completed' ? [{ time: deal.updated_at, event: 'اكتملت الصفقة — أُطلقت الأموال للبائع', icon: '✅', color: '#10B981' }] : []),
                ].reverse().map((event, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < 3 ? 20 : 0, position: 'relative' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${event.color}15`, border: `1.5px solid ${event.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{event.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>{event.event}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(event.time).toLocaleString('ar-SA')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1E3A8A, #0F2060)', borderRadius: 20, padding: '24px', color: 'white', marginBottom: 20 }}>
              <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 6 }}>💰 مبلغ الصفقة</div>
              <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>${Number(deal.amount).toLocaleString()}</div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
              {[
                { label: 'سعر البيع', val: `$${Number(deal.amount).toLocaleString()}` },
                { label: 'عمولة المنصة (5%)', val: `-$${Number(deal.commission).toLocaleString()}` },
                { label: 'صافي البائع', val: `$${Number(deal.seller_net).toLocaleString()}` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ opacity: 0.6, fontSize: 13 }}>{row.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: i === 2 ? '#10B981' : 'white' }}>{row.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔒</span>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>الأموال محمية في Escrow</span>
              </div>
            </div>

            {/* Deal Info */}
            <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '20px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>📋 تفاصيل الصفقة</div>
              {[
                { label: 'رقم الصفقة', val: `#${String(deal.id).slice(0, 8)}` },
                { label: 'الحالة', val: statusInfo.label },
                { label: 'الإنشاء', val: new Date(deal.created_at).toLocaleDateString('ar-SA') },
                { label: 'آخر تحديث', val: new Date(deal.updated_at).toLocaleDateString('ar-SA') },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>تأكيد استلام الأصل</h2>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 28 }}>
              هل تأكد من الاستلام والتحقق؟ بعد التأكيد سيتم تحرير <strong style={{ color: '#10B981' }}>${Number(deal.seller_net).toLocaleString()}</strong> للبائع فوراً ولا يمكن التراجع.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '13px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, color: '#64748B', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button id="final-confirm-btn" onClick={() => handleAction('confirm_receipt')} disabled={actionLoading}
                style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 15, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {actionLoading ? '⏳ جاري...' : '✅ نعم، تأكيد الاستلام'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '36px', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#EF4444' }}>⚖️ فتح نزاع</h2>
              <button onClick={() => setShowDispute(false)} style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 20, fontSize: 13, color: '#EF4444', lineHeight: 1.6 }}>
              ⚠️ سيتم إيقاف الصفقة وسيتدخل فريق Trust🔁Deal. يرجى تقديم سبب واضح.
            </div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>سبب النزاع *</label>
            <select id="dispute-reason-select" value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', marginBottom: 12 }}>
              <option value="">اختر سبب النزاع</option>
              <option value="no_delivery">البائع لم يسلم الأصل</option>
              <option value="wrong_asset">الأصل لا يطابق الوصف</option>
              <option value="account_suspended">الحساب موقوف أو محظور</option>
              <option value="lost_access">فقدت الوصول</option>
              <option value="other">سبب آخر</option>
            </select>
            <textarea id="dispute-desc" placeholder="اشرح المشكلة بالتفصيل..." rows={4} value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, resize: 'none', outline: 'none', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowDispute(false)} style={{ flex: 1, padding: '13px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, color: '#64748B', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button id="submit-dispute-btn" onClick={submitDispute} disabled={!disputeReason || actionLoading}
                style={{ flex: 2, padding: '13px', background: disputeReason ? 'linear-gradient(135deg, #EF4444, #DC2626)' : '#CBD5E1', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, fontSize: 14, cursor: disputeReason ? 'pointer' : 'not-allowed', fontFamily: 'Tajawal, sans-serif' }}>
                {actionLoading ? '⏳ جاري...' : '⚖️ رفع النزاع رسمياً'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
