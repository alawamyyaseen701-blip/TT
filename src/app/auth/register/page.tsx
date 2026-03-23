'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) router.replace('/dashboard');
  }, []);

  const saveUser = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: user.id, username: user.username,
      display_name: user.displayName, email: user.email,
      role: user.role, avatar: user.avatar,
    }));
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
      if (!data.success) { setError(data.error || 'فشل التسجيل بجوجل'); return; }
      saveUser(data.data.token, data.data.user);
      router.push('/dashboard');
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') setError('فشل التسجيل بجوجل');
    } finally { setGoogleLoading(false); }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.name || !form.username || !form.email) { setError('الاسم والمستخدم والبريد مطلوبان'); return; }
      setError(''); setStep(2); return;
    }
    if (form.password !== form.confirmPassword) { setError('كلمات المرور غير متطابقة'); return; }
    if (!agree) { setError('يجب الموافقة على الشروط والأحكام'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.name,
          username: form.username.trim() || ('user' + Math.random().toString(36).slice(2, 8)),
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في إنشاء الحساب'); return; }
      saveUser(data.data.token, data.data.user);
      router.push('/dashboard');
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: 'white', fontSize: 15,
    fontFamily: 'Tajawal, sans-serif', outline: 'none', transition: 'all 0.2s',
  };
  const focus = (e: any) => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; };
  const blur = (e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔁</div>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>Trust🔁Deal</span>
            </div>
          </Link>
          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginBottom: 4 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: s <= step ? 'linear-gradient(135deg, #10B981, #2563EB)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: s === step ? '2px solid rgba(16,185,129,0.5)' : '2px solid transparent' }}>
                  {s < step ? '✓' : s}
                </div>
                <span style={{ color: s === step ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  {s === 1 ? 'البيانات الأساسية' : 'تأمين الحساب'}
                </span>
                {s < 2 && <div style={{ width: 32, height: 1, background: s < step ? '#10B981' : 'rgba(255,255,255,0.15)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '36px 32px' }}>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
            {step === 1 ? 'إنشاء حساب جديد 🎉' : 'تأمين حسابك 🔐'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
            {step === 1 ? 'أدخل بياناتك الأساسية للبدء' : 'اختر كلمة مرور قوية وآمنة'}
          </p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google Sign Up (Step 1 only) */}
          {step === 1 && (
            <>
              <button id="google-signup-btn" onClick={handleGoogle} disabled={googleLoading || loading}
                style={{ width: '100%', padding: '13px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, fontSize: 14, cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                {googleLoading ? '⏳ جاري...' : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.271 9.327A7.017 7.017 0 0 1 12 5.016c1.85 0 3.533.681 4.83 1.797l3.582-3.582A11.957 11.957 0 0 0 12 0C7.322 0 3.253 2.658 1.254 6.546l4.017 2.781z"/>
                      <path fill="#FBBC05" d="M16.041 18.013A6.992 6.992 0 0 1 12 19.016a7.018 7.018 0 0 1-6.573-4.558L1.37 17.303A11.967 11.967 0 0 0 12 24c2.933 0 5.642-1.052 7.73-2.79l-3.689-3.197z"/>
                      <path fill="#4285F4" d="M19.73 21.21C21.892 19.128 23.267 16.22 23.267 12c0-.732-.1-1.503-.233-2.197H12v4.57h6.35c-.284 1.375-1.098 2.58-2.316 3.43l3.696 3.407z"/>
                      <path fill="#34A853" d="M5.427 14.458A7.048 7.048 0 0 1 5.016 12c0-.857.16-1.673.413-2.45L1.254 6.546A11.973 11.973 0 0 0 0 12c0 1.904.443 3.7 1.23 5.303l4.197-2.845z"/>
                    </svg>
                    التسجيل بـ Google (الأسرع)
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>أو بالبريد الإلكتروني</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleNext}>
            {step === 1 ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>الاسم الكامل</label>
                  <input id="reg-name" type="text" required placeholder="محمد أحمد" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>اسم المستخدم (بالإنجليزي)</label>
                  <input id="reg-username" type="text" required placeholder="ahmed123" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>أحرف إنجليزية وأرقام و _ فقط</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>البريد الإلكتروني</label>
                  <input id="reg-email" type="email" required placeholder="example@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>رقم الهاتف (اختياري)</label>
                  <input id="reg-phone" type="tel" placeholder="+20 10xxxxxxxx" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <button type="submit"
                  style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #1E3A8A)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  التالي →
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>كلمة المرور</label>
                  <input id="reg-password" type="password" required placeholder="8 أحرف على الأقل" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.3s', width: form.password.length < 4 ? '25%' : form.password.length < 8 ? '60%' : '100%', background: form.password.length < 4 ? '#EF4444' : form.password.length < 8 ? '#F59E0B' : '#10B981' }} />
                      </div>
                      <span style={{ fontSize: 11, color: form.password.length < 4 ? '#EF4444' : form.password.length < 8 ? '#F59E0B' : '#10B981', marginTop: 4, display: 'block' }}>
                        {form.password.length < 4 ? 'ضعيفة' : form.password.length < 8 ? 'متوسطة' : 'قوية ✓'}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>تأكيد كلمة المرور</label>
                  <input id="reg-confirm" type="password" required placeholder="أعد كتابة كلمة المرور" value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} style={{ ...inputStyle, borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#EF4444' : 'rgba(255,255,255,0.12)' }} onFocus={focus} onBlur={blur} />
                  {form.confirmPassword && form.confirmPassword !== form.password && (
                    <div style={{ fontSize: 12, color: '#EF4444', marginTop: 5 }}>⚠️ كلمتا المرور غير متطابقتين</div>
                  )}
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                    style={{ marginTop: 3, accentColor: '#10B981', width: 16, height: 16 }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>
                    أوافق على{' '}
                    <Link href="/terms" target="_blank" style={{ color: '#10B981', fontWeight: 700 }}>الشروط والأحكام</Link>
                    {' '}و{' '}
                    <Link href="/privacy" target="_blank" style={{ color: '#10B981', fontWeight: 700 }}>سياسة الخصوصية</Link>
                  </span>
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '14px', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    ← رجوع
                  </button>
                  <button id="reg-submit" type="submit" disabled={loading || !agree || form.password !== form.confirmPassword || form.password.length < 8}
                    style={{ flex: 2, padding: '14px', border: 'none', borderRadius: 12, background: (loading || !agree || form.password !== form.confirmPassword || form.password.length < 8) ? '#334155' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 15, cursor: (loading || !agree) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    {loading ? '⏳ جاري التسجيل...' : 'إنشاء الحساب 🎉'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            لديك حساب بالفعل؟{' '}
            <Link href="/auth/login" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
