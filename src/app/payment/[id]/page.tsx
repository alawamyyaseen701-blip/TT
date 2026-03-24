'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

const CRYPTO_METHODS = [
  { id: 'usdt_trc20',  icon: '💎', name: 'USDT (TRC20)', net: 'Tron Network',         note: 'الأسرع — رسوم < $0.5', color: '#10B981', bg: '#F0FDF4' },
  { id: 'usdt_bep20',  icon: '🟡', name: 'USDT (BEP20)', net: 'Binance Smart Chain',  note: 'BSC — رسوم منخفضة', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'usdt_erc20',  icon: '🔷', name: 'USDT (ERC20)', net: 'Ethereum',             note: 'Gas fees أعلى', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'binance_pay', icon: '🔶', name: 'Binance Pay',  net: 'بدون رسوم',           note: 'فوري عبر Binance', color: '#F97316', bg: '#FFF7ED' },
  { id: 'wise',        icon: '🌍', name: 'Wise Transfer', net: 'تحويل بنكي',         note: 'دولي برسوم منخفضة', color: '#0D9488', bg: '#F0FDFA' },
];

type PayStep = 'choose' | 'crypto_confirm' | 'done';

function PaymentContent() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const dealId       = params.id as string;

  const [deal,        setDeal]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [step,        setStep]        = useState<PayStep>('choose');
  const [cryptoId,    setCryptoId]    = useState('');
  const [cryptoAddr,  setCryptoAddr]  = useState('');
  const [copied,      setCopied]      = useState(false);
  const [txId,        setTxId]        = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [msg,         setMsg]         = useState('');
  const [redirecting, setRedirecting] = useState('');

  const paymentStatus = searchParams.get('payment');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    if (!dealId) return;
    fetch(`/api/deals/${dealId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { if (d.success) setDeal(d.data.deal); })
      .finally(() => setLoading(false));
  }, [dealId]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const launchGateway = async (gateway: 'stripe' | 'paypal') => {
    setRedirecting(gateway); setMsg('');
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ dealId, gateway }),
      });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setMsg('❌ ' + (data.error || 'حدث خطأ في إنشاء جلسة الدفع'));
        setRedirecting('');
      }
    } catch { setMsg('❌ خطأ في الاتصال'); setRedirecting(''); }
  };

  const submitCrypto = async () => {
    if (!txId.trim()) { setMsg('❌ أدخل رقم العملية (TxID)'); return; }
    setSubmitting(true); setMsg('');
    try {
      const res  = await fetch(`/api/deals/${dealId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action: 'confirm_payment', method: cryptoId, txId }),
      });
      const data = await res.json();
      if (data.success) { setStep('done'); }
      else { setMsg('❌ ' + (data.error || 'حدث خطأ')); }
    } catch { setMsg('❌ خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', border: '2px solid #E2E8F0', borderRadius: 14,
    fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white',
    boxSizing: 'border-box', color: '#0F172A',
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ color: '#64748B', marginTop: 12 }}>جاري التحميل...</div></div>
    </div>
  );

  // ── Success ────────────────────────────────────────────────────────
  if (paymentStatus === 'success' || deal?.status === 'in_escrow') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', marginBottom: 12 }}>تم الدفع بنجاح!</div>
        <div style={{ fontSize: 15, color: '#065F46', marginBottom: 28, lineHeight: 1.8 }}>
          دفعتك <strong>${deal?.amount}</strong> وصلت للضمان.<br />
          انتظر البائع ليسلّمك المنتج.
        </div>
        <Link href={`/deals/${dealId}`}>
          <button style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            عرض الصفقة →
          </button>
        </Link>
      </div>
    </div>
  );

  if (!deal) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>❌</div><div style={{ marginTop: 12 }}>الصفقة غير موجودة</div></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      <Header />
      <div style={{ paddingTop: 90, maxWidth: 680, margin: '0 auto', padding: '90px 16px 60px' }}>

        {/* Deal summary banner */}
        <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '20px 24px', marginBottom: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{deal.listing_title || 'صفقة مؤمَّنة'}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>بائع: {deal.seller_username || deal.seller_name} · #{dealId.slice(0, 10)}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>${deal.amount}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>البائع يستلم ${(deal.amount * 0.95).toFixed(2)}</div>
          </div>
        </div>

        {/* ── CHOOSE ─────────────────────────────────────────────── */}
        {step === 'choose' && (
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>اختر طريقة الدفع</h1>
            <p style={{ color: '#64748B', marginBottom: 24, fontSize: 13, lineHeight: 1.7 }}>
              💰 الأموال تروح مباشرة لحساب الضمان — بدون تدخل الأدمن<br />
              <strong>Stripe/PayPal: </strong>تفعيل فوري تلقائي · <strong>كريبتو: </strong>تحقق خلال 30 دقيقة
            </p>

            {/* Online Gateways */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 12, letterSpacing: 1 }}>⚡ دفع إلكتروني — تفعيل فوري وتلقائي 100%</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                
                <button id="pay-stripe" onClick={() => launchGateway('stripe')} disabled={!!redirecting}
                  style={{ padding: '18px 16px', borderRadius: 16, border: '2px solid #6366F1', background: redirecting === 'stripe' ? '#EEF2FF' : 'white', cursor: redirecting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>💳</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{redirecting === 'stripe' ? '⏳ جاري...' : 'بطاقة بنكية'}</div>
                    <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 600 }}>Visa / Mastercard / Mada</div>
                  </div>
                </button>

                <button id="pay-paypal" onClick={() => launchGateway('paypal')} disabled={!!redirecting}
                  style={{ padding: '18px 16px', borderRadius: 16, border: '2px solid #003087', background: redirecting === 'paypal' ? '#EEF6FF' : 'white', cursor: redirecting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1B3A9E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🅿️</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{redirecting === 'paypal' ? '⏳ جاري...' : 'PayPal'}</div>
                    <div style={{ fontSize: 11, color: '#003087', fontWeight: 600 }}>دفع فوري — تفعيل تلقائي</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Crypto */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 12, letterSpacing: 1 }}>🪙 كريبتو — إلى محفظة الضمان مباشرة</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CRYPTO_METHODS.map(m => (
                  <button key={m.id} id={`pay-${m.id}`}
                    onClick={async () => {
                      const res  = await fetch(`/api/checkout/address?method=${m.id}`);
                      const data = await res.json();
                      setCryptoAddr(data.address || '');
                      setCryptoId(m.id);
                      setStep('crypto_confirm');
                    }}
                    style={{ padding: '14px', borderRadius: 14, border: `1.5px solid ${m.color}30`, background: m.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{m.note}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {msg && <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          </div>
        )}

        {/* ── CRYPTO CONFIRM ────────────────────────────────────────── */}
        {step === 'crypto_confirm' && (() => {
          const m = CRYPTO_METHODS.find(x => x.id === cryptoId)!;
          return (
            <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>← رجوع لاختيار الطريقة</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>{m.net}</div>
                </div>
              </div>

              <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, background: `${m.color}08`, border: `1.5px solid ${m.color}30` }}>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>المبلغ المطلوب تحويله بالضبط:</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: m.color }}>${deal.amount} USDT</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>⚠️ أرسل المبلغ بالضبط — أي فرق يؤخّر التأكيد</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📍 عنوان محفظة الضمان</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <code style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '12px 14px', borderRadius: 12, fontSize: 12, color: '#0F172A', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {cryptoAddr || 'جاري التحميل...'}
                  </code>
                  <button onClick={() => copy(cryptoAddr)} style={{ flexShrink: 0, padding: '12px 18px', background: copied ? '#10B981' : m.color, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
                    {copied ? '✓' : 'نسخ'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                  🔑 Transaction ID (TxHash) — من محفظتك بعد الإرسال
                </label>
                <input id="crypto-txid" value={txId} onChange={e => setTxId(e.target.value)}
                  placeholder="0xabcdef... أو رقم التحويل" style={inputStyle} />
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>سيتم التحقق خلال 30 دقيقة — فوريًا بعد تأكيد على البلوكشين</div>
              </div>

              {msg && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: msg.startsWith('❌') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: msg.startsWith('❌') ? '#DC2626' : '#059669', fontSize: 13, fontWeight: 600 }}>{msg}</div>}

              <button id="submit-crypto-btn" onClick={submitCrypto} disabled={submitting}
                style={{ width: '100%', padding: 16, border: 'none', borderRadius: 14, background: submitting ? '#CBD5E1' : `linear-gradient(135deg, ${m.color}dd, ${m.color})`, color: 'white', fontWeight: 900, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: `0 6px 20px ${m.color}40` }}>
                {submitting ? '⏳ جاري الإرسال...' : '📤 أرسلت المبلغ — تأكيد وانتظر'}
              </button>
            </div>
          );
        })()}

        {/* ── DONE ─────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '48px 28px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>TxID استلمنا الـ</div>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              نتحقق من التحويل على البلوكشين.<br />
              <strong>الصفقة تنشط تلقائياً خلال 30 دقيقة</strong><br />
              سيصلك إشعار فور التأكيد.
            </p>
            <Link href={`/deals/${dealId}`}>
              <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(30,58,138,0.3)' }}>
                عرض الصفقة →
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div><div style={{ color: '#64748B', marginTop: 12 }}>جاري تحميل صفحة الدفع...</div></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
