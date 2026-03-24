'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/* ── Constants ── */
const STEPS = [
  { id: 1, label: 'القسم',     icon: '🗂️' },
  { id: 2, label: 'البيانات',  icon: '📝' },
  { id: 3, label: 'الصور',     icon: '📸' },
  { id: 4, label: 'بيانات النقل', icon: '🔑' },
  { id: 5, label: 'السعر',     icon: '💰' },
];

const CATEGORIES = [
  { id: 'social',       icon: '📱', label: 'حسابات سوشيال ميديا', desc: 'YouTube, Instagram, TikTok, وغيره',     color: '#8B5CF6' },
  { id: 'asset',        icon: '💎', label: 'الأصول الرقمية',       desc: 'مواقع، متاجر، تطبيقات، دومينات',        color: '#2563EB' },
  { id: 'subscription', icon: '⭐', label: 'اشتراك رقمي',          desc: 'Netflix, ChatGPT, Spotify, وغيره',       color: '#F59E0B' },
  { id: 'store',        icon: '🛒', label: 'منتج رقمي',            desc: 'قوالب، ملفات، كورسات، أكواد',           color: '#10B981' },
  { id: 'service',      icon: '⚡', label: 'خدمة رقمية',           desc: 'سوشيال ميديا، تسويق، محتوى',            color: '#EF4444' },
];

const SOCIAL_PLATFORMS = ['YouTube','Instagram','TikTok','Facebook','Twitter / X','Snapchat','Telegram','Discord','Pinterest','LinkedIn'];

// Default images shown per category when seller has no images
const DEFAULT_IMAGES: Record<string, { url: string; label: string }[]> = {
  social: [
    { url: '📱', label: 'حساب سوشيال' },
    { url: '▶️', label: 'يوتيوب' },
    { url: '📸', label: 'إنستغرام' },
    { url: '🎵', label: 'تيك توك' },
    { url: '👥', label: 'فيسبوك' },
    { url: '🐦', label: 'تويتر' },
  ],
  subscription: [
    { url: '🎬', label: 'نتفليكس' },
    { url: '🎵', label: 'سبوتيفاي' },
    { url: '🤖', label: 'ChatGPT' },
    { url: '🎨', label: 'Canva' },
    { url: '☁️', label: 'سحابة' },
    { url: '⭐', label: 'اشتراك' },
  ],
  asset: [
    { url: '🌐', label: 'موقع ويب' },
    { url: '🛍️', label: 'متجر إلكتروني' },
    { url: '📱', label: 'تطبيق' },
    { url: '🔗', label: 'دومين' },
    { url: '💻', label: 'برنامج' },
    { url: '💎', label: 'أصل رقمي' },
  ],
  store: [
    { url: '📄', label: 'قالب' },
    { url: '🎓', label: 'كورس' },
    { url: '📊', label: 'ملف' },
    { url: '🖼️', label: 'تصميم' },
    { url: '💻', label: 'كود' },
    { url: '🛒', label: 'منتج' },
  ],
  service: [
    { url: '✍️', label: 'كتابة' },
    { url: '🎨', label: 'تصميم' },
    { url: '📈', label: 'تسويق' },
    { url: '💻', label: 'برمجة' },
    { url: '🎬', label: 'مونتاج' },
    { url: '⚡', label: 'خدمة' },
  ],
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px', border: '1.5px solid #E2E8F0',
  borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14,
  outline: 'none', background: 'white', color: '#0F172A', boxSizing: 'border-box',
};

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export default function CreateListingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    // Social/asset stats
    followers: '', engagement: '', age: '', monthly_profit: '', monetized: false, country: '',
    // Subscription
    plan: '', duration: '', sub_platform: '',
    // Asset
    domain: '', tech_stack: '', monthly_revenue: '',
    // Store/service
    delivery: '', includes: '',
    // Credentials (encrypted / shown only when deal completes)
    account_email: '', account_password: '', account_phone: '', extra_info: '',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);   // base64 user uploads
  const [selectedDefaults, setSelectedDefaults] = useState<string[]>([]); // default emoji picks
  const [useDefault, setUseDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishedId, setPublishedId] = useState('');
  const [success, setSuccess] = useState(false);

  const f = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const selectedCat = CATEGORIES.find(c => c.id === category);
  const needCredentials = ['social', 'subscription', 'asset'].includes(category);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.replace('/auth/login?redirect=/listings/create');
  }, []);

  // Image upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setUploadedImages(prev => [...prev, ev.target?.result as string]);
        setUseDefault(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleDefaultImg = (emoji: string) => {
    setSelectedDefaults(prev =>
      prev.includes(emoji) ? prev.filter(e => e !== emoji) : [...prev, emoji]
    );
  };

  const handlePublish = async () => {
    if (!form.title || !form.description || !form.price) {
      setError('يرجى تعبئة العنوان والوصف والسعر'); return;
    }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const images = useDefault
        ? selectedDefaults.length > 0 ? selectedDefaults : (DEFAULT_IMAGES[category] || []).slice(0, 1).map(d => d.url)
        : uploadedImages;

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          type: category, platform: platform || form.sub_platform || null,
          title: form.title, description: form.description,
          price: parseFloat(form.price),
          country: form.country || null,
          followers: form.followers || null,
          engagement: form.engagement ? parseFloat(form.engagement) : null,
          age_months: form.age ? parseFloat(form.age) * 12 : null,
          monthly_profit: form.monthly_profit ? parseFloat(form.monthly_profit) : null,
          monthly_revenue: form.monthly_revenue ? parseFloat(form.monthly_revenue) : null,
          monetized: form.monetized,
          plan: form.plan || null,
          duration: form.duration || null,
          domain: form.domain || null,
          tech_stack: form.tech_stack || null,
          delivery: form.delivery || null,
          includes: form.includes || null,
          images,
          // Credentials stored securely — only released when deal completes
          credentials: needCredentials ? {
            email: form.account_email || null,
            password: form.account_password || null,
            phone: form.account_phone || null,
            extra: form.extra_info || null,
          } : null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل في نشر الإعلان'); return; }
      setPublishedId(data.data.id);
      setSuccess(true);
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 24px', boxShadow: '0 16px 40px rgba(16,185,129,0.3)' }}>🎉</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>تم نشر إعلانك بنجاح!</h1>
          <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            إعلانك قيد المراجعة من فريق Trust🔁Deal — سيظهر للعموم خلال 24 ساعة.
            {needCredentials && <><br/><strong style={{ color: '#1E3A8A' }}>🔒 بيانات الحساب محفوظة بأمان</strong> — ستُسلَّم للمشتري فقط عند اكتمال الصفقة.</>}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>لوحة التحكم</button>
            </Link>
            {publishedId && <Link href={`/listings/${publishedId}`} style={{ textDecoration: 'none' }}>
              <button style={{ padding: '14px 32px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#1E3A8A', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض الإعلان</button>
            </Link>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>

        {/* Progress Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '20px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: s.id < step ? 'pointer' : 'default' }}
                    onClick={() => s.id < step && setStep(s.id)}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.id === step ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : s.id < step ? '#10B981' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: s.id <= step ? 'white' : '#94A3B8', transition: 'all 0.3s', boxShadow: s.id === step ? '0 4px 16px rgba(30,58,138,0.3)' : 'none' }}>
                      {s.id < step ? '✓' : s.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.id === step ? '#1E3A8A' : s.id < step ? '#10B981' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > s.id ? '#10B981' : '#E2E8F0', margin: '0 6px', marginBottom: 20, transition: 'background 0.3s' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

          {/* ── STEP 1: Category ── */}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>اختر نوع الإعلان</h1>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>أخبرنا بما تريد بيعه لنساعدك في إنشاء الإعلان المناسب</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} id={`cat-${cat.id}`} onClick={() => setCategory(cat.id)}
                    style={{ padding: '24px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.25s', border: `2px solid ${category === cat.id ? cat.color : '#E2E8F0'}`, background: category === cat.id ? `${cat.color}08` : 'white', boxShadow: category === cat.id ? `0 8px 20px ${cat.color}20` : 'none' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14 }}>{cat.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: category === cat.id ? cat.color : '#0F172A', marginBottom: 6 }}>{cat.label}</div>
                    <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{cat.desc}</div>
                    {category === cat.id && <div style={{ marginTop: 12, color: cat.color, fontWeight: 700, fontSize: 13 }}>✓ تم الاختيار</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                <button id="step1-next" onClick={() => category && setStep(2)} disabled={!category}
                  style={{ padding: '14px 40px', background: category ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#E2E8F0', border: 'none', borderRadius: 14, color: category ? 'white' : '#94A3B8', fontWeight: 800, fontSize: 16, cursor: category ? 'pointer' : 'not-allowed', fontFamily: 'Tajawal, sans-serif' }}>
                  التالي ←
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
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

                {/* Social: platform picker */}
                {category === 'social' && (
                  <Field label="المنصة" required>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {SOCIAL_PLATFORMS.map(p => (
                        <button key={p} onClick={() => setPlatform(p)}
                          style={{ padding: '8px 16px', borderRadius: 100, border: '1.5px solid', fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', borderColor: platform === p ? '#1E3A8A' : '#E2E8F0', background: platform === p ? '#1E3A8A' : 'white', color: platform === p ? 'white' : '#64748B' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                {/* Subscription: platform + plan */}
                {category === 'subscription' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="الخدمة / المنصة" required>
                      <input style={inputStyle} value={form.sub_platform} onChange={e => f('sub_platform', e.target.value)} placeholder="مثال: Netflix, ChatGPT, Spotify" />
                    </Field>
                    <Field label="الباقة / الخطة">
                      <input style={inputStyle} value={form.plan} onChange={e => f('plan', e.target.value)} placeholder="مثال: Premium, Family, Pro" />
                    </Field>
                    <Field label="مدة الاشتراك">
                      <input style={inputStyle} value={form.duration} onChange={e => f('duration', e.target.value)} placeholder="مثال: سنة، 6 أشهر، شهر" />
                    </Field>
                    <Field label="الدولة">
                      <input style={inputStyle} value={form.country} onChange={e => f('country', e.target.value)} placeholder="مثال: SA / AE / US" />
                    </Field>
                  </div>
                )}

                {/* Asset: domain + tech */}
                {category === 'asset' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="الدومين / الرابط">
                      <input style={inputStyle} value={form.domain} onChange={e => f('domain', e.target.value)} placeholder="example.com" />
                    </Field>
                    <Field label="التقنية المستخدمة">
                      <input style={inputStyle} value={form.tech_stack} onChange={e => f('tech_stack', e.target.value)} placeholder="WordPress, Shopify, Next.js..." />
                    </Field>
                    <Field label="الأرباح الشهرية ($)">
                      <input style={inputStyle} type="number" value={form.monthly_revenue} onChange={e => f('monthly_revenue', e.target.value)} placeholder="0" />
                    </Field>
                    <Field label="الدولة">
                      <input style={inputStyle} value={form.country} onChange={e => f('country', e.target.value)} placeholder="SA / AE / EG..." />
                    </Field>
                  </div>
                )}

                {/* Store / Service specific */}
                {(category === 'store' || category === 'service') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="مدة/طريقة التسليم">
                      <input style={inputStyle} value={form.delivery} onChange={e => f('delivery', e.target.value)} placeholder="فوري / خلال 24 ساعة / 3 أيام" />
                    </Field>
                    <Field label="ما يشمله العرض">
                      <input style={inputStyle} value={form.includes} onChange={e => f('includes', e.target.value)} placeholder="ملف PDF, مصدر, تعديل واحد..." />
                    </Field>
                  </div>
                )}

                {/* Social stats */}
                {category === 'social' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="عدد المتابعين">
                      <input style={inputStyle} value={form.followers} onChange={e => f('followers', e.target.value)} placeholder="مثال: 450K" />
                    </Field>
                    <Field label="نسبة التفاعل %">
                      <input style={inputStyle} type="number" value={form.engagement} onChange={e => f('engagement', e.target.value)} placeholder="7.2" />
                    </Field>
                    <Field label="عمر الحساب (بالسنوات)">
                      <input style={inputStyle} type="number" value={form.age} onChange={e => f('age', e.target.value)} placeholder="3" />
                    </Field>
                    <Field label="الأرباح الشهرية ($)">
                      <input style={inputStyle} type="number" value={form.monthly_profit} onChange={e => f('monthly_profit', e.target.value)} placeholder="1200" />
                    </Field>
                    <Field label="الدولة">
                      <input style={inputStyle} value={form.country} onChange={e => f('country', e.target.value)} placeholder="SA / AE / EG..." />
                    </Field>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '13px 16px', border: '1.5px solid #E2E8F0', borderRadius: 12, alignSelf: 'end' }}>
                      <input type="checkbox" checked={form.monetized} onChange={e => f('monetized', e.target.checked)} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>مفعّل الربح 💰</span>
                    </label>
                  </div>
                )}

                {/* Title + Description always */}
                <Field label="عنوان الإعلان" required>
                  <input id="listing-title" style={inputStyle} value={form.title} onChange={e => f('title', e.target.value)}
                    placeholder={category === 'social' ? 'مثال: قناة يوتيوب تقنية 450K متابع مفعلة الربح' : category === 'subscription' ? 'مثال: اشتراك ChatGPT Plus لمدة سنة' : category === 'asset' ? 'مثال: موقع مدونة WordPress يربح $800 شهرياً' : 'عنوان واضح ومميز للإعلان'} />
                </Field>
                <Field label="الوصف التفصيلي" required>
                  <textarea id="listing-desc" value={form.description} onChange={e => f('description', e.target.value)}
                    placeholder="اشرح ما تبيعه بالتفصيل، أبرز المميزات، تاريخ الحساب، سبب البيع..." rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </Field>
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="step2-next" onClick={() => form.title && form.description && setStep(3)}
                  style={{ padding: '13px 40px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>التالي ←</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Images ── */}
          {step === 3 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>📸 الصور</h1>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 24 }}>الصور تزيد ثقة المشتري وتسرّع البيع</p>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button onClick={() => setUseDefault(true)} style={{ padding: '10px 24px', borderRadius: 12, border: `2px solid ${useDefault ? '#1E3A8A' : '#E2E8F0'}`, background: useDefault ? '#1E3A8A' : 'white', color: useDefault ? 'white' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  🖼️ اختر من الصور الجاهزة
                </button>
                <button onClick={() => setUseDefault(false)} style={{ padding: '10px 24px', borderRadius: 12, border: `2px solid ${!useDefault ? '#1E3A8A' : '#E2E8F0'}`, background: !useDefault ? '#1E3A8A' : 'white', color: !useDefault ? 'white' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  📤 ارفع صورك الخاصة
                </button>
              </div>

              {useDefault ? (
                <div>
                  <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>اختر الأيقونة المناسبة أو اتركها تُختار تلقائياً:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                    {(DEFAULT_IMAGES[category] || []).map(img => (
                      <div key={img.url} onClick={() => toggleDefaultImg(img.url)}
                        style={{ padding: '20px 12px', borderRadius: 16, border: `2px solid ${selectedDefaults.includes(img.url) ? '#1E3A8A' : '#E2E8F0'}`, background: selectedDefaults.includes(img.url) ? 'rgba(30,58,138,0.06)' : 'white', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{img.url}</div>
                        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{img.label}</div>
                        {selectedDefaults.includes(img.url) && <div style={{ fontSize: 11, color: '#1E3A8A', fontWeight: 700, marginTop: 4 }}>✓ مختار</div>}
                      </div>
                    ))}
                  </div>
                  {selectedDefaults.length === 0 && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', color: '#065F46', fontSize: 13 }}>
                      💡 سيتم اختيار الأيقونة الأولى تلقائياً إذا لم تختر
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                  <div style={{ border: '2px dashed #C7D2FE', borderRadius: 20, padding: '60px 24px', textAlign: 'center', background: '#F8FAFF', cursor: 'pointer' }}
                    onClick={() => fileRef.current?.click()}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1E3A8A', marginBottom: 8 }}>اضغط لرفع صورة</div>
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>PNG, JPG — حجم أقصى 5MB — حتى 8 صور</div>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 20 }}>
                      {uploadedImages.map((img, i) => (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', position: 'relative', border: '1.5px solid #E2E8F0' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(2)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="step3-next" onClick={() => setStep(needCredentials ? 4 : 5)}
                  style={{ padding: '13px 40px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>التالي ←</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Credentials (social/subscription/asset only) ── */}
          {step === 4 && needCredentials && (
            <div>
              <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(30,58,138,0.04)', border: '1.5px solid rgba(30,58,138,0.12)', marginBottom: 28, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32 }}>🔑</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1E3A8A', marginBottom: 6 }}>بيانات نقل الملكية</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    {category === 'social' ? 'أدخل بيانات دخول الحساب الذي ستبيعه. هذه البيانات ' : 'أدخل بيانات الاشتراك أو بيانات الدخول. '}
                    <strong style={{ color: '#1E3A8A' }}>ستُسلَّم للمشتري فقط بعد اكتمال الصفقة وانتقال المبلغ</strong> — لن يراها أحد قبل ذلك.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="الإيميل / البريد الإلكتروني" hint="إيميل الحساب أو البريد المرتبط به">
                    <input id="acc-email" type="email" style={inputStyle} value={form.account_email} onChange={e => f('account_email', e.target.value)} placeholder="example@gmail.com" />
                  </Field>
                  <Field label="كلمة المرور" required hint="كلمة مرور الحساب المراد بيعه">
                    <input id="acc-password" type="text" style={inputStyle} value={form.account_password} onChange={e => f('account_password', e.target.value)} placeholder="الباسورد الحالي للحساب" />
                  </Field>
                  <Field label="رقم الهاتف" hint="رقم الموبايل المرتبط بالحساب (اختياري)">
                    <input id="acc-phone" type="tel" style={inputStyle} value={form.account_phone} onChange={e => f('account_phone', e.target.value)} placeholder="+966 5x xxx xxxx" />
                  </Field>
                  {category === 'asset' && (
                    <Field label="تفاصيل الاستضافة">
                      <input style={inputStyle} value={form.extra_info} onChange={e => f('extra_info', e.target.value)} placeholder="cPanel / hosting credentials..." />
                    </Field>
                  )}
                </div>
                {category === 'social' && (
                  <Field label="معلومات إضافية" hint="مثال: كود 2FA، البريد الاحتياطي، حساب مرتبط بالحساب الشخصي...">
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.extra_info} onChange={e => f('extra_info', e.target.value)} placeholder="أي معلومات إضافية تساعد في نقل الحساب..." />
                  </Field>
                )}

                {!form.account_password && (
                  <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400E', fontSize: 13 }}>
                    ⚠️ كلمة المرور مطلوبة لضمان نقل الحساب بعد الصفقة
                  </div>
                )}
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(3)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="step4-next" onClick={() => setStep(5)}
                  style={{ padding: '13px 40px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>التالي ←</button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Price & Publish ── */}
          {step === 5 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>تحديد السعر</h1>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>ستحصل على {95}% من السعر بعد خصم عمولة المنصة (5%)</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field label="السعر المطلوب ($)" required>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94A3B8' }}>$</span>
                    <input id="listing-price" type="number" value={form.price} onChange={e => f('price', e.target.value)} placeholder="0"
                      style={{ ...inputStyle, padding: '16px 40px 16px 16px', fontSize: 24, fontWeight: 900, color: '#1E3A8A', textAlign: 'right' }} />
                  </div>
                </Field>

                {form.price && Number(form.price) > 0 && (
                  <div style={{ padding: 24, borderRadius: 16, background: 'linear-gradient(135deg, rgba(30,58,138,0.04), rgba(16,185,129,0.04))', border: '1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>📊 ملخص الأرباح</div>
                    {[
                      { label: 'سعر البيع', val: `$${Number(form.price).toLocaleString('en-US')}`, color: '#0F172A' },
                      { label: 'عمولة المنصة (5%)', val: `-$${(Number(form.price) * 0.05).toFixed(2)}`, color: '#EF4444' },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ color: '#64748B', fontSize: 14 }}>{r.label}</span>
                        <span style={{ fontWeight: 700, color: r.color }}>{r.val}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: '#E2E8F0', marginBottom: 10 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>صافي ما ستحصل عليه</span>
                      <span style={{ fontWeight: 900, fontSize: 22, color: '#10B981' }}>${(Number(form.price) * 0.95).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                )}

                {/* Summary card */}
                <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>📋 ملخص الإعلان</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#64748B' }}>
                    <div>📁 النوع: <strong>{selectedCat?.label}</strong></div>
                    {platform && <div>📱 المنصة: <strong>{platform}</strong></div>}
                    <div>📝 العنوان: <strong>{form.title}</strong></div>
                    {needCredentials && form.account_password && <div>🔑 بيانات النقل: <strong style={{ color: '#10B981' }}>✓ محفوظة بأمان</strong></div>}
                    <div>🖼️ الصور: <strong>{useDefault ? (selectedDefaults.length > 0 ? `${selectedDefaults.length} أيقونة مختارة` : 'افتراضية تلقائية') : `${uploadedImages.length} صورة مرفوعة`}</strong></div>
                  </div>
                </div>
              </div>

              {error && <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 14 }}>{error}</div>}

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(needCredentials ? 4 : 3)} style={{ padding: '13px 28px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, color: '#64748B', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← رجوع</button>
                <button id="publish-btn" onClick={handlePublish} disabled={!form.price || loading}
                  style={{ padding: '14px 48px', background: form.price ? 'linear-gradient(135deg, #10B981, #2563EB)' : '#E2E8F0', border: 'none', borderRadius: 14, color: form.price ? 'white' : '#94A3B8', fontWeight: 800, fontSize: 16, cursor: form.price ? 'pointer' : 'not-allowed', fontFamily: 'Tajawal, sans-serif', boxShadow: form.price ? '0 8px 24px rgba(16,185,129,0.3)' : 'none' }}>
                  {loading ? '⏳ جاري النشر...' : '🚀 نشر الإعلان'}
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
