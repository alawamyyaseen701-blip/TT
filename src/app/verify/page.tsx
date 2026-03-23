'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STEPS = [
  { id: 1, icon: '📋', title: 'تعبئة البيانات', desc: 'أدخل بياناتك الشخصية وتأكد من صحتها' },
  { id: 2, icon: '🪪', title: 'رفع الهوية', desc: 'صورة من بطاقة الهوية الوطنية أو جواز السفر' },
  { id: 3, icon: '🤳', title: 'صورة سيلفي', desc: 'صورة واضحة لوجهك مع بطاقة الهوية' },
  { id: 4, icon: '⏳', title: 'المراجعة', desc: 'الفريق يراجع الطلب خلال 24-48 ساعة' },
];

export default function VerifyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', idNumber: '', country: 'SA', birthDate: '' });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    // Simulate submission (would upload files and call API in production)
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', paddingTop: 72 }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: 24 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 24px' }}>✅</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>تم إرسال الطلب!</h1>
            <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              تم استلام طلب التوثيق بنجاح. سيراجعه فريقنا خلال <strong>24-48 ساعة</strong> وسترسل إليك إشعاراً بالنتيجة.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/dashboard">
                <button style={{ padding: '13px 28px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  العودة للوحة التحكم
                </button>
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12,
    fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none', background: 'white',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              ✅ التحقق من الهوية
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>احصل على الشارة الموثقة</h1>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7 }}>
              التوثيق يزيد ثقة المشترين ويرفع مبيعاتك — اكتمل خلال 5 دقائق فقط
            </p>
          </div>

          {/* Steps progress */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    background: step > s.id ? '#10B981' : step === s.id ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#E2E8F0',
                    color: step >= s.id ? 'white' : '#94A3B8', fontWeight: 900, transition: 'all 0.3s',
                    boxShadow: step === s.id ? '0 4px 12px rgba(30,58,138,0.3)' : 'none',
                  }}>
                    {step > s.id ? '✓' : s.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: step === s.id ? 700 : 500, color: step >= s.id ? '#1E3A8A' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.title}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 60, height: 2, background: step > s.id ? '#10B981' : '#E2E8F0', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 14, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1.5px solid #E2E8F0' }}>
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>📋 بياناتك الشخصية</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الاسم الكامل (كما في الهوية) *</label>
                    <input id="verify-name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required placeholder="محمد أحمد الشمري" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>رقم الهوية / الجواز *</label>
                      <input id="verify-id-number" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} placeholder="1XXXXXXXXX" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>تاريخ الميلاد *</label>
                      <input id="verify-dob" type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                </div>
                <button id="verify-next-1" onClick={() => { if (!form.fullName || !form.idNumber || !form.birthDate) { setError('يرجى تعبئة جميع الحقول المطلوبة'); return; } setError(''); setStep(2); }}
                  style={{ width: '100%', marginTop: 24, padding: '14px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  التالي — رفع الهوية →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>🪪 رفع بطاقة الهوية</h2>
                <p style={{ color: '#64748B', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>ارفع صورة واضحة من الأمام لبطاقة الهوية الوطنية أو جواز السفر</p>
                <label id="id-upload-label" style={{ display: 'block', border: '2px dashed #CBD5E1', borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: idFile ? 'rgba(16,185,129,0.04)' : '#FAFAFA', borderColor: idFile ? '#10B981' : '#CBD5E1' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1E3A8A'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = idFile ? '#10B981' : '#CBD5E1'}>
                  <input id="id-file-input" type="file" accept="image/*" onChange={e => setIdFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{idFile ? '✅' : '📤'}</div>
                  <div style={{ fontWeight: 700, color: idFile ? '#10B981' : '#374151', marginBottom: 4 }}>
                    {idFile ? idFile.name : 'انقر لاختيار صورة الهوية'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>PNG, JPG, HEIC — الحد الأقصى 10MB</div>
                </label>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E2E8F0', borderRadius: 14, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                  <button id="verify-next-2" onClick={() => { if (!idFile) { setError('يرجى رفع صورة الهوية'); return; } setError(''); setStep(3); }}
                    style={{ flex: 2, padding: '13px', border: 'none', borderRadius: 14, background: idFile ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#CBD5E1', color: 'white', fontWeight: 800, fontSize: 15, cursor: idFile ? 'pointer' : 'default', fontFamily: 'Tajawal, sans-serif' }}>
                    التالي — صورة سيلفي →
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>🤳 صورة سيلفي مع الهوية</h2>
                <p style={{ color: '#64748B', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>التقط صورة واضحة لوجهك بينما تمسك بطاقة هويتك. تأكد من وضوح كلا الوجهين.</p>
                <label id="selfie-upload-label" style={{ display: 'block', border: '2px dashed #CBD5E1', borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: selfieFile ? 'rgba(16,185,129,0.04)' : '#FAFAFA', borderColor: selfieFile ? '#10B981' : '#CBD5E1' }}>
                  <input id="selfie-file-input" type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{selfieFile ? '✅' : '🤳'}</div>
                  <div style={{ fontWeight: 700, color: selfieFile ? '#10B981' : '#374151', marginBottom: 4 }}>
                    {selfieFile ? selfieFile.name : 'انقر لرفع صورة السيلفي'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>PNG, JPG — حجم واضح ومضاء جيداً</div>
                </label>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E2E8F0', borderRadius: 14, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                  <button id="verify-submit" onClick={() => { if (!selfieFile) { setError('يرجى رفع صورة السيلفي'); return; } setError(''); handleSubmit(); }} disabled={loading}
                    style={{ flex: 2, padding: '13px', border: 'none', borderRadius: 14, background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    {loading ? '⏳ جاري الإرسال...' : '✅ إرسال الطلب'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 20, borderRadius: 16, background: 'rgba(30,58,138,0.04)', border: '1px solid rgba(30,58,138,0.1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A', marginBottom: 8 }}>🔒 بياناتك آمنة 100%</div>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>
              بياناتك مُشفّرة ولا تُشارك مع أي طرف ثالث. نستخدمها فقط للتحقق من هويتك وتفعيل الشارة الموثقة.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
