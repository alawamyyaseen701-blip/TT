'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (form.password !== form.confirmPassword) { setError('كلمات المرور غير متطابقة'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: form.name, username: form.username || form.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user' + Date.now().toString().slice(-6), email: form.email, phone: form.phone, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'خطأ في إنشاء الحساب'); return; }
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.push('/dashboard');
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };


  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: 'white', fontSize: 15,
    fontFamily: 'Tajawal, sans-serif', outline: 'none',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #2563EB, #10B981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>🔁</div>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>Trust🔁Deal</span>
            </div>
          </Link>

          {/* Steps indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 16 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: s <= step ? 'linear-gradient(135deg, #10B981, #2563EB)' : 'rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: s === step ? '2px solid rgba(16,185,129,0.5)' : '2px solid transparent',
                  boxShadow: s <= step ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                }}>{s <= step - 1 ? '✓' : s}</div>
                <span style={{ color: s === step ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  {s === 1 ? 'البيانات الأساسية' : 'تأمين الحساب'}
                </span>
                {s < 2 && <div style={{ width: 32, height: 1, background: s < step ? '#10B981' : 'rgba(255,255,255,0.15)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          padding: '36px 32px',
        }}>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, marginBottom: 6 }}>
            {step === 1 ? 'إنشاء حساب جديد 🎉' : 'تأمين حسابك 🔐'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28 }}>
            {step === 1 ? 'أدخل بياناتك الأساسية للبدء' : 'اختر كلمة مرور قوية وآمنة'}
          </p>

          <form onSubmit={handleNext}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 14, marginBottom: 20 }}>
                ⚠️ {error}
              </div>
            )}
            {step === 1 ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>الاسم الكامل</label>
                  <input id="reg-name" type="text" required placeholder="محمد أحمد" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>اسم المستخدم (يوزرنيم) — بالإنجليزي</label>
                  <input id="reg-username" type="text" required placeholder="ahmed123" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>أحرف إنجليزية وأرقام و _ فقط</div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>البريد الإلكتروني</label>
                  <input id="reg-email" type="email" required placeholder="example@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>رقم الهاتف</label>
                  <input id="reg-phone" type="tel" placeholder="+966 5xxxxxxxx" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>كلمة المرور</label>
                  <input id="reg-password" type="password" required placeholder="8 أحرف على الأقل" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                  {/* Strength */}
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4, transition: 'width 0.3s',
                          width: form.password.length < 4 ? '25%' : form.password.length < 8 ? '60%' : '100%',
                          background: form.password.length < 4 ? '#EF4444' : form.password.length < 8 ? '#F59E0B' : '#10B981',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: form.password.length < 4 ? '#EF4444' : form.password.length < 8 ? '#F59E0B' : '#10B981', marginTop: 4, display: 'block' }}>
                        {form.password.length < 4 ? 'ضعيفة' : form.password.length < 8 ? 'متوسطة' : 'قوية ✓'}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 7 }}>تأكيد كلمة المرور</label>
                  <input id="reg-confirm-password" type="password" required placeholder="أعد إدخال كلمة المرور" value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }}>كلمات المرور غير متطابقة</span>
                  )}
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 24 }}>
                  <input id="reg-agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
                    أوافق على{' '}
                    <Link href="/terms" style={{ color: '#10B981' }}>شروط الاستخدام</Link>
                    {' '}و{' '}
                    <Link href="/privacy" style={{ color: '#10B981' }}>سياسة الخصوصية</Link>
                  </span>
                </label>
              </>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 14, color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600, fontSize: 15, cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                }}>← رجوع</button>
              )}
              <button id="reg-next-btn" type="submit" disabled={loading || (step === 2 && !agree)}
                style={{
                  flex: 1, padding: '14px',
                  background: (loading || (step === 2 && !agree)) ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10B981, #2563EB)',
                  border: 'none', borderRadius: 14, color: 'white',
                  fontWeight: 800, fontSize: 15, cursor: (loading || (step === 2 && !agree)) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                }}
              >
                {loading ? '⏳ جاري إنشاء الحساب...' : step === 1 ? 'التالي →' : 'إنشاء الحساب 🎉'}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 24 }}>
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
