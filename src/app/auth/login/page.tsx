'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const saveUser = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: user.id, username: user.username,
      display_name: user.displayName, email: user.email,
      role: user.role, avatar: user.avatar,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
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
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل تسجيل الدخول بجوجل'); return; }
      saveUser(data.data.token, data.data.user);
      router.push(redirect);
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') setError('فشل تسجيل الدخول بجوجل');
    } finally { setGoogleLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: 'white', fontSize: 15,
    fontFamily: 'Tajawal, sans-serif', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔁</div>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>Trust🔁Deal</span>
            </div>
          </Link>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>مرحباً بعودتك 👋</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>سجّل الدخول للوصول إلى حسابك</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '36px 32px' }}>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google Sign In */}
          <button id="google-signin-btn" onClick={handleGoogle} disabled={googleLoading || loading}
            style={{ width: '100%', padding: '13px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, fontSize: 14, cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, transition: 'all 0.2s' }}
            onMouseEnter={e => !googleLoading && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}>
            {googleLoading ? '⏳ جاري...' : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.271 9.327A7.017 7.017 0 0 1 12 5.016c1.85 0 3.533.681 4.83 1.797l3.582-3.582A11.957 11.957 0 0 0 12 0C7.322 0 3.253 2.658 1.254 6.546l4.017 2.781z"/>
                  <path fill="#FBBC05" d="M16.041 18.013A6.992 6.992 0 0 1 12 19.016a7.018 7.018 0 0 1-6.573-4.558L1.37 17.303A11.967 11.967 0 0 0 12 24c2.933 0 5.642-1.052 7.73-2.79l-3.689-3.197z"/>
                  <path fill="#4285F4" d="M19.73 21.21C21.892 19.128 23.267 16.22 23.267 12c0-.732-.1-1.503-.233-2.197H12v4.57h6.35c-.284 1.375-1.098 2.58-2.316 3.43l3.696 3.407z"/>
                  <path fill="#34A853" d="M5.427 14.458A7.048 7.048 0 0 1 5.016 12c0-.857.16-1.673.413-2.45L1.254 6.546A11.973 11.973 0 0 0 0 12c0 1.904.443 3.7 1.23 5.303l4.197-2.845z"/>
                </svg>
                تسجيل الدخول بـ Google
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>أو بالبريد الإلكتروني</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>البريد الإلكتروني</label>
              <input id="login-email" type="email" required placeholder="example@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>كلمة المرور</label>
              <input id="login-password" type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <Link href="/auth/forgot-password" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textDecoration: 'none' }}>
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button id="login-submit" type="submit" disabled={loading || googleLoading}
              style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: (loading || googleLoading) ? '#334155' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 15, cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
              {loading ? '⏳ جاري الدخول...' : 'تسجيل الدخول →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>
              سجّل مجاناً
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
