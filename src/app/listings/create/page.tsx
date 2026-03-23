'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STEPS = [
  { id: 1, label: 'القسم', icon: '🗂️' },
  { id: 2, label: 'البيانات', icon: '📝' },
  { id: 3, label: 'الصور', icon: '📸' },
  { id: 4, label: 'السعر', icon: '💰' },
  { id: 5, label: 'المراجعة', icon: '✅' },
];

const CATEGORIES = [
  { id: 'social', icon: '📱', label: 'حسابات سوشيال ميديا', desc: 'YouTube, Instagram, TikTok, وغيره', color: '#8B5CF6' },
  { id: 'asset', icon: '💎', label: 'الأصول الرقمية', desc: 'مواقع، متاجر، تطبيقات، دومينات', color: '#2563EB' },
  { id: 'store', icon: '🛒', label: 'منتج رقمي', desc: 'قوالب، ملفات، كورسات، أكواد', color: '#10B981' },
  { id: 'subscription', icon: '⭐', label: 'اشتراك رقمي', desc: 'Netflix, ChatGPT, Spotify, وغيره', color: '#F59E0B' },
  { id: 'service', icon: '⚡', label: 'خدمة رقمية', desc: 'سوشيال ميديا، تسويق، محتوى', color: '#EF4444' },
];

const SOCIAL_PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Twitter', 'Snapchat', 'Telegram', 'Discord'];

export default function CreateListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', price: '', followers: '', engagement: '',
    age: '', domain: '', country: '', monetized: false,
    monthly_profit: '', plan: '', duration: '', delivery: '',
    service_execution: '', includes: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishedId, setPublishedId] = useState('');

  const selectedCat = CATEGORIES.find(c => c.id === category);

  const handlePublish = async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          type: category, platform, title: form.title, description: form.description,
          price: parseFloat(form.price), country: form.country,
          followers: form.followers || null,
          age_months: form.age ? parseInt(form.age) * 12 : null,
          monthly_profit: form.monthly_profit ? parseFloat(form.monthly_profit) : null,
          monetized: form.monetized,
          engagement: form.engagement ? parseFloat(form.engagement) : null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل في نشر الإعلان'); return; }
      setPublishedId(data.data.id);
      setStep(5);
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        {/* Progress Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '20px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: s.id < step ? 'pointer' : 'default' }}
                    onClick={() => s.id < step && setStep(s.id)}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: s.id === step ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : s.id < step ? '#10B981' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800, color: s.id <= step ? 'white' : '#94A3B8',
                      transition: 'all 0.3s',
                      boxShadow: s.id === step ? '0 4px 16px rgba(30,58,138,0.3)' : 'none',
                    }}>
                      {s.id < step ? '✓' : s.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.id === step ? '#1E3A8A' : s.id < step ? '#10B981' : '#94A3B8' }}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: step > s.id ? '#10B981' : '#E2E8F0', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>اختر نوع الإعلان</h1>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>أخبرنا بما تريد بيعه لنساعدك في إنشاء الإعلان المناسب</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} id={`cat-select-${cat.id}`} onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '24px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.25s',
                      border: `2px solid ${category === cat.id ? cat.color : '#E2E8F0'}`,
                      background: category === cat.id ? `${cat.color}08` : 'white',
                      boxShadow: category === cat.id ? `0 8px 20px ${cat.color}20` : 'none',
                    }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14 }}>{cat.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: category === cat.id ? cat.color : '#0F172A', marginBottom: 6 }}>{cat.label}</div>
                    <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{cat.desc}</div>
                    {category === cat.id && <div style={{ marginTop: 12, color: cat.color, fontWeight: 700, fontSize: 13 }}>✓ تم الاختيار</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                <button id="step1-next-btn" onClick={() => category && setStep(2)} disabled={!category}
                  style={{ padding: '14px 40px', background: category ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#E2E8F0', border: 'none', borderRadius: 14, color: category ? 'white' : '#94A3B8', fontWeight: 800, fontSize: 16, cursor: category ? 'pointer' : 'not-allowed', fontFamily: 'Tajawal, sans-serif' }}>
                  التالي ←
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${selectedCat?.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{selectedCat?.icon}</div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>بيانات الإعلان</h1>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{selectedCat?.label}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Platform (for social) */}
                {category === 'social' && (
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>المنصة *</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {SOCIAL_PLATFORMS.map(p => (
                        <button key={p} id={`platform-${p}`} onClick={() => setPlatform(p)}
                          style={{ padding: '9px 18px', borderRadius: 100, border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', borderColor: platform === p ? '#1E3A8A' : '#E2E8F0', background: platform === p ? '#1E3A8A' : 'white', color: platform === p ? 'white' : '#64748B' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>عنوان الإعلان *</label>
                    <input id="listing-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: قناة يوتيوب تقنية متميزة"
                      style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  {category === 'social' && <>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>عدد المتابعين</label>
                      <input id="followers" value={form.followers} onChange={e => setForm({ ...form, followers: e.target.value })} placeholder="مثال: 450K"
                        style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>نسبة التفاعل %</label>
                      <input id="engagement" value={form.engagement} onChange={e => setForm({ ...form, engagement: e.target.value })} placeholder="مثال: 7.2"
                        style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>عمر الحساب</label>
                      <input id="account-age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="مثال: 3 سنوات"
                        style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الأرباح الشهرية ($)</label>
                      <input id="monthly-profit" value={form.monthly_profit} onChange={e => setForm({ ...form, monthly_profit: e.target.value })} placeholder="مثال: 1200"
                        style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الدولة</label>
                      <input id="country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="مثال: السعودية"
                        style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                      />
                    </div>
                    <label id="monetized-toggle" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12 }}>
                      <input type="checkbox" checked={form.monetized} onChange={e => setForm({ ...form, monetized: e.target.checked })} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>مفعّل الربح 💰</span>
                    </label>
                  </>}

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>الوصف التفصيلي *</label>
                    <textarea id="listing-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="اشرح ما تبيعه بالتفصيل، وأبرز مميزاته..." rows={5}
                      style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, resize: 'vertical', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button id="step2-back-btn" onClick={() => setStep(1)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="step2-next-btn" onClick={() => setStep(3)}
                  style={{ padding: '13px 40px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>التالي ←</button>
              </div>
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>رفع الصور</h1>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>الصور تزيد ثقة المشتري وتسرّع البيع — أضف صوراً واضحة وحقيقية</p>

              <div style={{ border: '2px dashed #C7D2FE', borderRadius: 20, padding: '60px 24px', textAlign: 'center', background: '#F8FAFF', marginBottom: 24, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLElement).style.borderColor = '#1E3A8A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFF'; (e.currentTarget as HTMLElement).style.borderColor = '#C7D2FE'; }}
                onClick={() => setImages(prev => [...prev, `img-${Date.now()}`])}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1E3A8A', marginBottom: 8 }}>اضغط لرفع صورة</div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>PNG, JPG — حجم أقصى 10MB — حتى 10 صور</div>
              </div>

              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {images.map((img, i) => (
                    <div key={img} style={{ aspectRatio: '1', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A20, #10B98120)', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ fontSize: 32 }}>🖼️</div>
                      <button id={`remove-img-${i}`} onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button id="step3-back-btn" onClick={() => setStep(2)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="step3-next-btn" onClick={() => setStep(4)} style={{ padding: '13px 40px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>التالي ←</button>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>تحديد السعر</h1>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>اختر سعراً مناسباً — ستحصل على {(100 - 5)}% منه بعد خصم عمولة المنصة</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>السعر المطلوب ($) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94A3B8' }}>$</span>
                    <input id="listing-price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0"
                      style={{ width: '100%', padding: '16px 40px 16px 16px', border: '1.5px solid #E2E8F0', borderRadius: 14, fontFamily: 'Tajawal, sans-serif', fontSize: 24, fontWeight: 900, color: '#1E3A8A', outline: 'none', textAlign: 'right' }}
                      onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>
                </div>

                {form.price && Number(form.price) > 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(30,58,138,0.05), rgba(16,185,129,0.05))', border: '1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>📊 ملخص الأرباح</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontSize: 13 }}>سعر البيع</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>${Number(form.price).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontSize: 13 }}>عمولة المنصة (5%)</span>
                        <span style={{ fontWeight: 700, color: '#EF4444' }}>-${(Number(form.price) * 0.05).toFixed(2)}</span>
                      </div>
                      <div style={{ height: 1, background: '#E2E8F0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>صافي ما ستحصل</span>
                        <span style={{ fontWeight: 900, fontSize: 20, color: '#10B981' }}>${(Number(form.price) * 0.95).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button id="step4-back-btn" onClick={() => setStep(3)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="publish-btn" onClick={handlePublish} disabled={!form.price || loading}
                  style={{ padding: '13px 40px', background: form.price ? 'linear-gradient(135deg, #10B981, #2563EB)' : '#E2E8F0', border: 'none', borderRadius: 14, color: form.price ? 'white' : '#94A3B8', fontWeight: 800, fontSize: 15, cursor: form.price ? 'pointer' : 'not-allowed', fontFamily: 'Tajawal, sans-serif' }}>
                  {loading ? '⏳ جاري النشر...' : '🚀 نشر الإعلان'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 24px', boxShadow: '0 16px 40px rgba(16,185,129,0.3)', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>تم نشر إعلانك بنجاح!</h1>
              <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                إعلانك الآن في طور المراجعة من فريق Trust🔁Deal. سيظهر للعموم خلال 24 ساعة.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض إعلاني</button>
                </Link>
                <button id="new-listing-btn" onClick={() => { setStep(1); setCategory(''); setForm({ title: '', description: '', price: '', followers: '', engagement: '', age: '', domain: '', country: '', monetized: false, monthly_profit: '', plan: '', duration: '', delivery: '', service_execution: '', includes: '' }); setImages([]); }}
                  style={{ padding: '14px 32px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#1E3A8A', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  + إضافة إعلان آخر
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
