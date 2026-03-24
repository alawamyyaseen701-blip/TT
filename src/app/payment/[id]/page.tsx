'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

const CRYPTO_METHODS = [
  { id: 'usdt_trc20',  icon: '💎', name: 'USDT TRC20',   net: 'Tron (الأسرع)',       note: 'رسوم < $0.5', color: '#10B981', bg: '#F0FDF4' },
  { id: 'usdt_bep20',  icon: '🟡', name: 'USDT BEP20',   net: 'Binance Chain',         note: 'رسوم منخفضة', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'usdt_erc20',  icon: '🔷', name: 'USDT ERC20',   net: 'Ethereum',              note: 'Gas fees أعلى', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'binance_pay', icon: '🔶', name: 'Binance Pay',  net: 'بدون رسوم',            note: 'فوري 100%', color: '#F97316', bg: '#FFF7ED' },
  { id: 'wise',        icon: '🌍', name: 'Wise Transfer', net: 'تحويل بنكي دولي',     note: 'رسوم منخفضة', color: '#0D9488', bg: '#F0FDFA' },
];

type PayStep = 'choose' | 'paymob_iframe' | 'crypto_form' | 'done';

function PaymentContent() {
  const params        = useParams();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const dealId        = params.id as string;

  const [deal,         setDeal]        = useState<any>(null);
  const [loading,      setLoading]     = useState(true);
  const [step,         setStep]        = useState<PayStep>('choose');
  const [iframeUrl,    setIframeUrl]   = useState('');
  const [cryptoId,     setCryptoId]    = useState('');
  const [cryptoAddr,   setCryptoAddr]  = useState('');
  const [copied,       setCopied]      = useState(false);
  const [txId,         setTxId]        = useState('');
  const [submitting,   setSubmitting]  = useState(false);
  const [redirecting,  setRedirecting] = useState('');
  const [msg,          setMsg]         = useState('');

  const paymentStatus = searchParams.get('payment');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    if (!dealId) return;
    fetch(`/api/deals/${dealId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => { if (d.success) setDeal(d.data.deal); })
      .finally(() => setLoading(false));
  }, [dealId]);

  // ── Launch Paymob (card or wallet) ────────────────────────────
  const launchPaymob = async (gateway: 'paymob_card' | 'paymob_wallet') => {
    setRedirecting(gateway); setMsg('');
    try {
      const res  = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dealId, gateway }),
      });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        setIframeUrl(data.data.checkoutUrl);
        setStep('paymob_iframe');
      } else {
        setMsg('❌ ' + (data.error || 'حدث خطأ — تأكد من إعداد مفاتيح Paymob في .env.local'));
      }
    } catch { setMsg('❌ خطأ في الاتصال بالخادم'); }
    finally { setRedirecting(''); }
  };

  // ── Launch PayPal (redirect) ──────────────────────────────────
  const launchPayPal = async () => {
    setRedirecting('paypal'); setMsg('');
    try {
      const res  = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dealId, gateway: 'paypal' }),
      });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setMsg('❌ ' + (data.error || 'حدث خطأ'));
        setRedirecting('');
      }
    } catch { setMsg('❌ خطأ في الاتصال'); setRedirecting(''); }
  };

  // ── Select crypto method → fetch address ─────────────────────
  const selectCrypto = async (methodId: string) => {
    setCryptoId(methodId); setCryptoAddr('');
    const res  = await fetch(`/api/checkout/address?method=${methodId}`);
    const data = await res.json();
    setCryptoAddr(data.address || '');
    setStep('crypto_form');
  };

  // ── Submit crypto TxID ────────────────────────────────────────
  const submitTxId = async () => {
    if (!txId.trim()) { setMsg('❌ أدخل Transaction ID بعد الإرسال'); return; }
    setSubmitting(true); setMsg('');
    try {
      const res  = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'confirm_payment', method: cryptoId, txId }),
      });
      const data = await res.json();
      if (data.success) setStep('done');
      else setMsg('❌ ' + (data.error || 'حدث خطأ'));
    } catch { setMsg('❌ خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ── Guards ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 52 }}>⏳</div><div style={{ color: '#64748B', marginTop: 12 }}>جاري تحميل الصفقة...</div></div>
    </div>
  );

  if (paymentStatus === 'success' || deal?.status === 'in_escrow') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', marginBottom: 12 }}>تم الدفع بنجاح!</div>
        <div style={{ fontSize: 15, color: '#065F46', lineHeight: 1.8, marginBottom: 28 }}>
          دفعتك <strong>${deal?.amount}</strong> وصلت للضمان.<br />انتظر تسليم البائع.
        </div>
        <Link href={`/deals/${dealId}`}>
          <button style={{ padding: '14px 36px', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>عرض الصفقة →</button>
        </Link>
      </div>
    </div>
  );

  if (!deal) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>❌</div><div style={{ marginTop: 12 }}>الصفقة غير موجودة</div></div>
    </div>
  );

  const cryptoM = CRYPTO_METHODS.find(x => x.id === cryptoId);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 100%)', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      <Header />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '90px 16px 60px' }}>

        {/* Deal summary */}
        <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '18px 22px', marginBottom: 22, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#1E3A8A,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{deal.listing_title || 'صفقة مؤمَّنة'}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>بائع: {deal.seller_username || deal.seller_name} · #{dealId.slice(0,10)}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#10B981' }}>${deal.amount}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>البائع يستلم ${(deal.amount * 0.95).toFixed(2)}</div>
          </div>
        </div>

        {/* ── STEP 1: Choose ──────────────────────────────────────── */}
        {step === 'choose' && (
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>اختر طريقة الدفع</h1>
            <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              الأموال تذهب مباشرة لحساب الضمان — بدون تدخل أي طرف ⚡<br />
              <strong>Paymob/PayPal:</strong> تفعيل فوري تلقائي · <strong>كريبتو:</strong> تحقق خلال 30 دقيقة
            </p>

            {/* ── Paymob (مصر والعالم العربي) ── */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 10, letterSpacing: 1 }}>⚡ PAYMOB — تفعيل فوري وتلقائي</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                <button id="pay-paymob-card" onClick={() => launchPaymob('paymob_card')} disabled={!!redirecting}
                  style={{ padding: '18px 14px', borderRadius: 16, border: '2px solid #6366F1', background: redirecting === 'paymob_card' ? '#EEF2FF' : 'white', cursor: redirecting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, transition: 'all 0.2s' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💳</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{redirecting === 'paymob_card' ? '⏳ جاري...' : 'بطاقة بنكية'}</div>
                    <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 600 }}>Visa / Mastercard / Meeza</div>
                  </div>
                </button>

                <button id="pay-paymob-wallet" onClick={() => launchPaymob('paymob_wallet')} disabled={!!redirecting}
                  style={{ padding: '18px 14px', borderRadius: 16, border: '2px solid #10B981', background: redirecting === 'paymob_wallet' ? '#F0FDF4' : 'white', cursor: redirecting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, transition: 'all 0.2s' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📱</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{redirecting === 'paymob_wallet' ? '⏳ جاري...' : 'محفظة إلكترونية'}</div>
                    <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Vodafone Cash / Orange / CIB</div>
                  </div>
                </button>
              </div>
            </div>

            {/* ── PayPal (دولي) ── */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 10, letterSpacing: 1 }}>🌍 دفع دولي</div>
              <button id="pay-paypal" onClick={launchPayPal} disabled={!!redirecting}
                style={{ width: '100%', padding: '16px 14px', borderRadius: 16, border: '2px solid #003087', background: redirecting === 'paypal' ? '#EFF6FF' : 'white', cursor: redirecting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, transition: 'all 0.2s' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1B3A9E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🅿️</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{redirecting === 'paypal' ? '⏳ جاري التوجيه...' : 'PayPal'}</div>
                  <div style={{ fontSize: 11, color: '#003087', fontWeight: 600 }}>دفع دولي — تأكيد تلقائي فوري</div>
                </div>
              </button>
            </div>

            {/* ── كريبتو ── */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 10, letterSpacing: 1 }}>🪙 كريبتو — إلى محفظة الضمان مباشرة</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CRYPTO_METHODS.map(m => (
                  <button key={m.id} id={`pay-${m.id}`} onClick={() => selectCrypto(m.id)}
                    style={{ padding: '13px', borderRadius: 14, border: `1.5px solid ${m.color}30`, background: m.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{m.note}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {msg && <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>{msg}</div>}
          </div>
        )}

        {/* ── STEP 2a: Paymob iframe ──────────────────────────────── */}
        {step === 'paymob_iframe' && iframeUrl && (
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, fontWeight: 600, padding: 0 }}>← رجوع</button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>💳 ادفع عبر Paymob</div>
              <div style={{ fontSize: 13, color: '#10B981', fontWeight: 700 }}>${deal.amount}</div>
            </div>
            <div style={{ padding: '0 0 8px' }}>
              <iframe
                src={iframeUrl}
                style={{ width: '100%', height: 580, border: 'none' }}
                title="Paymob Payment"
                allow="payment"
              />
            </div>
            <div style={{ padding: '10px 22px 18px', textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
              🔒 مدفوعات مشفرة بـ SSL — تشغيل بواسطة Paymob
            </div>
          </div>
        )}

        {/* ── STEP 2b: Crypto form ─────────────────────────────────── */}
        {step === 'crypto_form' && cryptoM && (
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>← رجوع</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{cryptoM.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{cryptoM.name}</div>
                <div style={{ fontSize: 12, color: cryptoM.color, fontWeight: 600 }}>{cryptoM.net}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, background: `${cryptoM.color}08`, border: `1.5px solid ${cryptoM.color}30` }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>أرسل هذا المبلغ بالضبط:</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: cryptoM.color }}>${deal.amount} USDT</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>⚠️ أرسل المبلغ بالضبط — أي فرق يؤخّر التأكيد</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>📍 عنوان محفظة الضمان</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <code style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '12px 14px', borderRadius: 12, fontSize: 12, color: '#0F172A', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {cryptoAddr || '⏳ جاري التحميل...'}
                </code>
                <button onClick={() => copy(cryptoAddr)} style={{ padding: '12px 18px', background: copied ? '#10B981' : cryptoM.color, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  {copied ? '✓' : 'نسخ'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                🔑 Transaction Hash (TxID) — من محفظتك بعد الإرسال
              </label>
              <input id="crypto-txid" value={txId} onChange={e => setTxId(e.target.value)}
                placeholder="0xabcdef1234... أو رقم العملية"
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #E2E8F0', borderRadius: 14, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' as const }} />
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>✅ سيتم التحقق خلال 30 دقيقة — فوريًا بعد تأكيد البلوكشين</div>
            </div>

            {msg && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: msg.startsWith('❌') ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)', color: msg.startsWith('❌') ? '#DC2626' : '#059669', fontSize: 13, fontWeight: 600 }}>{msg}</div>}

            <button id="submit-txid-btn" onClick={submitTxId} disabled={submitting}
              style={{ width: '100%', padding: 16, border: 'none', borderRadius: 14, background: submitting ? '#CBD5E1' : `linear-gradient(135deg,${cryptoM.color},${cryptoM.color}cc)`, color: 'white', fontWeight: 900, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: `0 6px 20px ${cryptoM.color}40` }}>
              {submitting ? '⏳ جاري الإرسال...' : '📤 أرسلت المبلغ — تأكيد الآن'}
            </button>
          </div>
        )}

        {/* ── STEP 3: Done (crypto pending) ───────────────────────── */}
        {step === 'done' && (
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '48px 28px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>TxID استلمنا الـ!</div>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              نتحقق من التحويل على البلوكشين.<br />
              <strong>الصفقة تنشط تلقائياً خلال 30 دقيقة</strong><br />
              سيصلك إشعار فور التأكيد.
            </p>
            <Link href={`/deals/${dealId}`}>
              <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#1E3A8A,#2563EB)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(30,58,138,0.3)' }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 52 }}>⏳</div><div style={{ color: '#64748B', marginTop: 12 }}>جاري التحميل...</div></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
