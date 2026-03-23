'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في تسجيل الدخول'); return; }
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.push('/dashboard');
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '10%', right: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, #2563EB, #10B981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              }}>🔁</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>Trust🔁Deal</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>منصة الأمان الرقمي</div>
              </div>
            </div>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>مرحباً بعودتك 👋</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          padding: '40px 36px',
        }}>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>تسجيل الدخول</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32 }}>
            ادخل بياناتك للوصول لحسابك
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 14, marginBottom: 20 }}>
                ⚠️ {error}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                البريد الإلكتروني أو رقم الهاتف
              </label>
              <input
                id="login-email"
                type="text"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, color: 'white', fontSize: 15,
                  fontFamily: 'Tajawal, sans-serif', outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10B981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                كلمة المرور
              </label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, color: 'white', fontSize: 15,
                  fontFamily: 'Tajawal, sans-serif', outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10B981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: 28 }}>
              <Link href="/auth/forgot-password" style={{ color: '#10B981', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10B981, #2563EB)',
                border: 'none', borderRadius: 14, color: 'white',
                fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
              }}
            >
              {loading ? '⏳ جاري التحقق...' : 'تسجيل الدخول →'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>أو</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Google */}
            <button
              id="google-login-btn"
              type="button"
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 14, color: 'white',
                fontWeight: 600, fontSize: 15, cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 20 }}>🌐</span>
              المتابعة مع Google
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 24 }}>
          ليس لديك حساب؟{' '}
          <Link href="/auth/register" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>
            سجل الآن مجاناً
          </Link>
        </p>
      </div>
    </div>
  );
}
