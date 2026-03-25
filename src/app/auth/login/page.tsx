'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const saveUser = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: user.id, username: user.username, display_name: user.displayName, email: user.email, role: user.role, avatar: user.avatar }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في تسجيل الدخول'); return; }
      saveUser(data.data.token, data.data.user);
      router.push(redirect);
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل تسجيل الدخول بجوجل'); return; }
      saveUser(data.data.token, data.data.user);
      router.push(redirect);
    } catch (e: any) { if (e.code !== 'auth/popup-closed-by-user') setError('فشل تسجيل الدخول بجوجل'); }
    finally { setGoogleLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      {/* ── Left Panel ── */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #0F4C75 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.12)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10B981, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>🔁</div>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 26, letterSpacing: '-0.5px' }}>Trust🔁Deal</span>
            </div>
          </Link>

          {/* Big Icon */}
          <div style={{ fontSize: 80, marginBottom: 24, filter: 'drop-shadow(0 8px 24px rgba(16,185,129,0.3))' }}>🔐</div>

          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, marginBottom: 12 }}>مرحباً بعودتك!</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            منصة موثوقة لبيع وشراء الأصول الرقمية<br />بحماية كاملة ونظام Escrow آمن
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            {[['🔒', 'Escrow آمن', '100%'], ['⚡', 'صفقات ناجحة', '+1K'], ['⭐', 'تقييم المنصة', '4.9']].map(([icon, label, val]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                <div style={{ color: '#10B981', fontWeight: 900, fontSize: 18 }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div style={{ width: 480, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ color: '#0F172A', fontSize: 26, fontWeight: 900, marginBottom: 6 }}>تسجيل الدخول</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>أدخل بيانات حسابك للمتابعة</p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontSize: 13, marginBottom: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google */}
          <button id="google-login-btn" onClick={handleGoogle} disabled={googleLoading || loading}
            style={{ width: '100%', padding: '13px 20px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E293B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#94A3B8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}>
            {googleLoading ? <span style={{ color: '#64748B' }}>⏳ جاري...</span> : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.271 9.327A7.017 7.017 0 0 1 12 5.016c1.85 0 3.533.681 4.83 1.797l3.582-3.582A11.957 11.957 0 0 0 12 0C7.322 0 3.253 2.658 1.254 6.546l4.017 2.781z"/>
                  <path fill="#FBBC05" d="M16.041 18.013A6.992 6.992 0 0 1 12 19.016a7.018 7.018 0 0 1-6.573-4.558L1.37 17.303A11.967 11.967 0 0 0 12 24c2.933 0 5.642-1.052 7.73-2.79l-3.689-3.197z"/>
                  <path fill="#4285F4" d="M19.73 21.21C21.892 19.128 23.267 16.22 23.267 12c0-.732-.1-1.503-.233-2.197H12v4.57h6.35c-.284 1.375-1.098 2.58-2.316 3.43l3.696 3.407z"/>
                  <path fill="#34A853" d="M5.427 14.458A7.048 7.048 0 0 1 5.016 12c0-.857.16-1.673.413-2.45L1.254 6.546A11.973 11.973 0 0 0 0 12c0 1.904.443 3.7 1.23 5.303l4.197-2.845z"/>
                </svg>
                متابعة بحساب Google
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ color: '#94A3B8', fontSize: 12 }}>أو بالبريد الإلكتروني</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>البريد الإلكتروني</label>
              <input id="login-email" type="email" required placeholder="example@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none', color: '#0F172A', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#10B981'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input id="login-password" type={showPass ? 'text' : 'password'} required placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: '100%', padding: '13px 46px 13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none', color: '#0F172A', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#10B981'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <Link href="/auth/forgot-password" style={{ color: '#2563EB', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>نسيت كلمة المرور؟</Link>
            </div>

            <button id="login-submit" type="submit" disabled={loading || googleLoading}
              style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: (loading || googleLoading) ? '#94A3B8' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 15, cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
              {loading ? '⏳ جاري الدخول...' : 'تسجيل الدخول ←'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748B' }}>
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" style={{ color: '#10B981', fontWeight: 800, textDecoration: 'none' }}>سجّل مجاناً →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif', background: '#F8FAFC' }}><div style={{ fontSize: 48 }}>⏳</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
