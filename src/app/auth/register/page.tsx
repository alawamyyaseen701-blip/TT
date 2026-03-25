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
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (localStorage.getItem('token')) router.replace('/dashboard'); }, []);

  const saveUser = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: user.id, username: user.username, display_name: user.displayName, email: user.email, role: user.role, avatar: user.avatar }));
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل التسجيل'); return; }
      saveUser(data.data.token, data.data.user);
      router.push('/dashboard');
    } catch (e: any) { if (e.code !== 'auth/popup-closed-by-user') setError('فشل التسجيل بجوجل'); }
    finally { setGoogleLoading(false); }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.name || !form.username || !form.email) { setError('يرجى تعبئة جميع الحقول'); return; }
      if (form.username.length < 3) { setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'); return; }
      setError(''); setStep(2); return;
    }
    if (form.password !== form.confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (!agree) { setError('يجب الموافقة على الشروط والأحكام'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: form.name, username: form.username, email: form.email, phone: form.phone, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في إنشاء الحساب'); return; }
      saveUser(data.data.token, data.data.user);
      router.push('/dashboard');
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0',
    borderRadius: 12, background: 'white', fontSize: 14,
    fontFamily: 'Tajawal, sans-serif', outline: 'none', color: '#0F172A',
    boxSizing: 'border-box', transition: 'border-color 0.2s', ...extra,
  });
  const focus = (e: any) => e.target.style.borderColor = '#10B981';
  const blur = (e: any) => e.target.style.borderColor = '#E2E8F0';

  const strengthLevel = form.password.length === 0 ? 0 : form.password.length < 4 ? 1 : form.password.length < 8 ? 2 : 3;
  const strengthColor = ['transparent', '#EF4444', '#F59E0B', '#10B981'][strengthLevel];
  const strengthText = ['', 'ضعيفة', 'متوسطة', 'قوية ✓'][strengthLevel];

  const benefits = [
    { icon: '🔒', text: 'حماية Escrow على كل صفقة' },
    { icon: '⚡', text: 'إعلانات في ثوانٍ' },
    { icon: '💰', text: 'سحب أرباحك بسهولة' },
    { icon: '🛡️', text: 'نظام نزاعات متطور' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      {/* ── Left Panel ── */}
      <div className="auth-left-panel" style={{ flex: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #0F4C75 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.12)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10B981, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>🔁</div>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 26 }}>Trust🔁Deal</span>
            </div>
          </Link>

          <div style={{ fontSize: 72, marginBottom: 24, filter: 'drop-shadow(0 8px 24px rgba(16,185,129,0.3))' }}>🚀</div>
          <h2 style={{ color: 'white', fontSize: 26, fontWeight: 900, marginBottom: 12 }}>انضم لمنصة الثقة</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            أنشئ حسابك مجاناً وابدأ<br />ببيع وشراء الأصول الرقمية بأمان
          </p>

          <div style={{ textAlign: 'right' }}>
            {benefits.map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600 }}>{b.text}</span>
                <div style={{ marginRight: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#10B981' }}>✓</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="auth-right-panel" style={{ width: 500, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {[1, 2].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 2 ? 1 : 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s <= step ? 'linear-gradient(135deg, #10B981, #059669)' : '#E2E8F0', color: s <= step ? 'white' : '#94A3B8', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: s === step ? '0 4px 12px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.3s' }}>
                    {s < step ? '✓' : s}
                  </div>
                  <span style={{ color: s === step ? '#0F172A' : '#94A3B8', fontSize: 13, fontWeight: 700 }}>
                    {s === 1 ? 'بياناتك' : 'كلمة المرور'}
                  </span>
                </div>
                {s < 2 && <div style={{ flex: 1, height: 2, background: step > 1 ? '#10B981' : '#E2E8F0', margin: '0 12px', transition: 'background 0.3s', borderRadius: 2 }} />}
              </div>
            ))}
          </div>

          <h1 style={{ color: '#0F172A', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
            {step === 1 ? 'إنشاء حساب جديد 🎉' : 'تأمين حسابك 🔐'}
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>
            {step === 1 ? 'أدخل بياناتك الأساسية للبدء' : 'اختر كلمة مرور قوية'}
          </p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google (Step 1 only) */}
          {step === 1 && (
            <>
              <button id="google-reg-btn" onClick={handleGoogle} disabled={googleLoading || loading}
                style={{ width: '100%', padding: '13px 20px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E293B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s', position: 'relative' }}
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
                    التسجيل بحساب Google
                  </>
                )}
                <span style={{ position: 'absolute', top: -8, right: 12, background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>الأسرع</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ color: '#94A3B8', fontSize: 12 }}>أو بالبريد الإلكتروني</span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>
            </>
          )}

          <form onSubmit={handleNext}>
            {step === 1 ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 7 }}>الاسم الكامل</label>
                  <input id="reg-name" type="text" required placeholder="محمد أحمد" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} style={inp()} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 7 }}>اسم المستخدم <span style={{ color: '#94A3B8', fontWeight: 400 }}>(بالإنجليزي)</span></label>
                  <input id="reg-username" type="text" required placeholder="ahmed123" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} style={inp()} onFocus={focus} onBlur={blur} />
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>أحرف إنجليزية وأرقام و _ فقط — هيظهر في ملفك الشخصي</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 7 }}>البريد الإلكتروني</label>
                  <input id="reg-email" type="email" required placeholder="example@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={inp()} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 7 }}>رقم الهاتف <span style={{ color: '#94A3B8', fontWeight: 400 }}>(اختياري)</span></label>
                  <input id="reg-phone" type="tel" placeholder="+20 10xxxxxxxx" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} style={inp()} onFocus={focus} onBlur={blur} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                  التالي ←
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 7 }}>كلمة المرور</label>
                  <div style={{ position: 'relative' }}>
                    <input id="reg-password" type={showPass ? 'text' : 'password'} required placeholder="8 أحرف على الأقل" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} style={inp({ paddingLeft: 46 })} onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8' }}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                        {[1, 2, 3].map(l => (
                          <div key={l} style={{ flex: 1, height: 4, borderRadius: 4, background: strengthLevel >= l ? strengthColor : '#E2E8F0', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: strengthColor, fontWeight: 700 }}>{strengthText}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: '#374151', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 7 }}>تأكيد كلمة المرور</label>
                  <input id="reg-confirm" type="password" required placeholder="أعد كتابة كلمة المرور" value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    style={inp({ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#EF4444' : '#E2E8F0' })} onFocus={focus} onBlur={blur} />
                  {form.confirmPassword && form.confirmPassword !== form.password && (
                    <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>⚠️ كلمتا المرور غير متطابقتين</div>
                  )}
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer', background: '#F0FDF4', borderRadius: 12, padding: 14, border: '1.5px solid #BBF7D0' }}>
                  <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2, accentColor: '#10B981', width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ color: '#374151', fontSize: 13, lineHeight: 1.6 }}>
                    أوافق على{' '}
                    <Link href="/terms" target="_blank" style={{ color: '#10B981', fontWeight: 800, textDecoration: 'none' }}>الشروط والأحكام</Link>
                    {' '}و{' '}
                    <Link href="/privacy" target="_blank" style={{ color: '#10B981', fontWeight: 800, textDecoration: 'none' }}>سياسة الخصوصية</Link>
                  </span>
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                  <button id="reg-submit" type="submit" disabled={loading || !agree || form.password !== form.confirmPassword || form.password.length < 8}
                    style={{ flex: 2, padding: '14px', border: 'none', borderRadius: 12, background: (loading || !agree || form.password !== form.confirmPassword || form.password.length < 8) ? '#94A3B8' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 15, cursor: (loading || !agree || form.password !== form.confirmPassword || form.password.length < 8) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: (loading || !agree) ? 'none' : '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
                    {loading ? '⏳ جاري التسجيل...' : 'إنشاء الحساب 🎉'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748B' }}>
            لديك حساب؟{' '}
            <Link href="/auth/login" style={{ color: '#10B981', fontWeight: 800, textDecoration: 'none' }}>تسجيل الدخول →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
