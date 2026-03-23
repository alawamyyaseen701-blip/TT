'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // سيتم ربطه بـ API البريد الإلكتروني لاحقاً
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep('sent');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F172A, #1E3A8A, #0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔁</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>Trust🔁Deal</div>
            </div>
          </Link>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '40px 32px' }}>
          {step === 'email' ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
                <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>نسيت كلمة المرور؟</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>البريد الإلكتروني</label>
                  <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com"
                    style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'white', fontSize: 15, fontFamily: 'Tajawal, sans-serif', outline: 'none' }} />
                </div>
                <button id="send-reset-btn" type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10B981, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {loading ? '⏳ جاري الإرسال...' : 'إرسال رابط الاستعادة →'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>تم إرسال الرابط!</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                تحقق من بريدك الإلكتروني <strong style={{ color: '#10B981' }}>{email}</strong> وانقر على رابط إعادة التعيين.
              </p>
              <button id="resend-btn" onClick={() => setStep('email')}
                style={{ padding: '12px 28px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 14, background: 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                إعادة الإرسال
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 24 }}>
          <Link href="/auth/login" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>← العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
