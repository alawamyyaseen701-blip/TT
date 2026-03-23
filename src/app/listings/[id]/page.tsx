'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MOCK_LISTING = {
  id: 1,
  type: 'social',
  platform: 'YouTube',
  title: 'قناة يوتيوب تقنية متميزة — 120K مشترك',
  description: `قناة يوتيوب راسخة في مجال التقنية والبرمجة، تأسست منذ 4 سنوات وتمتلك:\n\n✅ 120,000 مشترك حقيقي ومتفاعل\n✅ مفعلة الربح وتحقق 900$ - 1200$ شهرياً\n✅ نسبة تفاعل 4.8% فوق المتوسط\n✅ 35 مليون مشاهدة إجمالية\n✅ محتوى نظيف بدون مخالفات\n\nالقناة جاهزة للتسليم الفوري مع كل البيانات، وسيكون التحويل من خلال منصة Trust🔁Deal بنظام Escrow لضمان الحقوق.`,
  price: 12000,
  currency: 'USD',
  country: 'SA',
  followers: '120K',
  engagement: 4.8,
  monthly_profit: 1100,
  age_months: 48,
  monetized: true,
  views: 234,
  favorites: 18,
  featured: true,
  created_at: '2025-03-15T10:00:00Z',
  images: ['📺', '📊', '🎯'],
  attributes: {
    subscribers: '120,000',
    monthly_views: '1.2M',
    total_views: '35M',
    content_type: 'تقنية وبرمجة',
    violations: '0',
    language: 'عربي',
    region: 'السعودية',
  },
  seller: {
    id: 5,
    username: 'seller_pro',
    display_name: 'أحمد يوتيوبر',
    rating: 4.9,
    total_deals: 24,
    role: 'verified',
    country: 'SA',
    joined_at: '2023-06-01T00:00:00Z',
  },
  reviews: [
    { reviewer_name: 'خالد المالكي', rating: 5, comment: 'بائع محترف جداً، تسليم سريع وصادق', created_at: '2025-03-01T00:00:00Z' },
    { reviewer_name: 'نورة العمري', rating: 5, comment: 'كل البيانات صحيحة 100%، أنصح بالتعامل معه', created_at: '2025-02-15T00:00:00Z' },
  ],
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  const listing = MOCK_LISTING;

  const handleBuy = async () => {
    setBuyLoading(true); setBuyError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { setBuyError('يجب تسجيل الدخول أولاً'); setBuyLoading(false); return; }
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id, sellerId: String(listing.seller.id) }),
      });
      const data = await res.json();
      if (!data.success) { setBuyError(data.error || 'حدث خطأ في إنشاء الصفقة'); return; }
      setShowBuyModal(false);
      router.push(`/deals/${data.data.dealId}`);
    } catch { setBuyError('خطأ في الاتصال بالخادم'); }
    finally { setBuyLoading(false); }
  };

  const handleMessage = () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    router.push(`/messages?with=${listing.seller.id}`);
  };

  const toggleFav = async () => {
    setIsFav(!isFav);
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch('/api/favorites', {
      method: isFav ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId: listing.id }),
    }).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>
            <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>الرئيسية</Link>
            <span>›</span>
            <Link href="/social-accounts" style={{ color: '#94A3B8', textDecoration: 'none' }}>حسابات سوشيال ميديا</Link>
            <span>›</span>
            <span style={{ color: '#64748B' }}>YouTube</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* Left */}
            <div>
              {/* Images */}
              <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                <div style={{ padding: '60px', background: 'linear-gradient(135deg, #F1F5F9, #EFF6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                  <div style={{ fontSize: 120 }}>{listing.images[activeImage]}</div>
                </div>
                {listing.images.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderTop: '1px solid #F1F5F9' }}>
                    {listing.images.map((img, i) => (
                      <button key={i} id={`img-thumb-${i}`} onClick={() => setActiveImage(i)}
                        style={{ width: 60, height: 60, borderRadius: 10, border: `2px solid ${activeImage === i ? '#1E3A8A' : '#E2E8F0'}`, background: '#F8FAFC', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {img}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + stats */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ padding: '5px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', color: '#DC2626', fontSize: 13, fontWeight: 700 }}>📺 YouTube</span>
                  {listing.featured && <span style={{ padding: '5px 14px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#D97706', fontSize: 13, fontWeight: 700 }}>⭐ مميز</span>}
                  {listing.monetized && <span style={{ padding: '5px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: 13, fontWeight: 700 }}>💰 مفعّلة الربح</span>}
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 8, lineHeight: 1.4 }}>{listing.title}</h1>
                <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', margin: '16px 0', flexWrap: 'wrap' }}>
                  {[
                    { label: 'المشتركون', value: listing.followers, icon: '👥' },
                    { label: 'التفاعل', value: `${listing.engagement}%`, icon: '📈' },
                    { label: 'الأرباح/شهر', value: `$${listing.monthly_profit}`, icon: '💵' },
                    { label: 'عمر القناة', value: `${Math.floor(listing.age_months / 12)} سنوات`, icon: '📅' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20 }}>{s.icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, color: '#374151', lineHeight: 1.9 }}>{listing.description}</div>
              </div>

              {/* Attributes */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>📊 إحصائيات تفصيلية</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(listing.attributes).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      subscribers: 'عدد المشتركين', monthly_views: 'المشاهدات الشهرية', total_views: 'إجمالي المشاهدات',
                      content_type: 'نوع المحتوى', violations: 'المخالفات', language: 'لغة المحتوى', region: 'الدولة',
                    };
                    return (
                      <div key={key} style={{ padding: '14px 16px', borderRadius: 12, background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>{labels[key] || key}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>⭐ تقييمات البائع ({listing.reviews.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {listing.reviews.map((r, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 14, background: '#F8FAFC' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.reviewer_name}</div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14, color: s <= r.rating ? '#F59E0B' : '#CBD5E1' }}>★</span>)}
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#1E3A8A', marginBottom: 4 }}>${listing.price.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>ستحصل على ~${(listing.price * 0.95).toLocaleString()} بعد عمولة 5%</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button id="buy-now-btn" onClick={() => setShowBuyModal(true)}
                    style={{ width: '100%', padding: '16px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 24px rgba(30,58,138,0.3)' }}>
                    🔒 شراء آمن عبر Escrow
                  </button>
                  <button id="message-seller-btn" onClick={handleMessage}
                    style={{ width: '100%', padding: '14px', border: '1.5px solid #1E3A8A', borderRadius: 14, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    💬 مراسلة البائع
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button id="fav-btn" onClick={toggleFav}
                      style={{ padding: '12px', border: `1.5px solid ${isFav ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, background: isFav ? 'rgba(239,68,68,0.05)' : 'white', color: isFav ? '#EF4444' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      {isFav ? '❤️ محفوظ' : '🤍 حفظ'}
                    </button>
                    <button id="report-btn"
                      style={{ padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#94A3B8', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      🚩 إبلاغ
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, rgba(30,58,138,0.04), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 6 }}>🛡️ ضمان Trust🔁Deal</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>أموالك محمية بنظام Escrow. لن تصل للبائع إلا بعد تأكيدك للاستلام الكامل.</div>
                </div>
              </div>

              {/* Seller Card */}
              <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>البائع</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22 }}>
                    {listing.seller.display_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {listing.seller.display_name}
                      {listing.seller.role === 'verified' && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontWeight: 700 }}>✓ موثق</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>@{listing.seller.username}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'التقييم', value: `★ ${listing.seller.rating}`, color: '#F59E0B' },
                    { label: 'الصفقات', value: listing.seller.total_deals, color: '#10B981' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '12px', borderRadius: 12, background: '#F8FAFC', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <Link href={`/profile/${listing.seller.username}`}>
                  <button style={{ width: '100%', padding: '11px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    عرض الملف الشخصي
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>تأكيد الشراء الآمن</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>سيتم تجميد المبلغ في Escrow حتى تؤكد استلام المنتج بالكامل</p>
            <div style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', marginBottom: 20 }}>
              {[
                { label: 'سعر الإعلان', value: `$${listing.price.toLocaleString()}` },
                { label: 'عمولة المنصة (5%)', value: `-$${(listing.price * 0.05).toFixed(2)}` },
                { label: 'ما سيحصله البائع', value: `$${(listing.price * 0.95).toLocaleString()}` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 14, color: '#64748B' }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
                </div>
              ))}
            </div>
            {buyError && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 14 }}>⚠️ {buyError}</div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowBuyModal(false); setBuyError(''); }} style={{ flex: 1, padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: 14, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                إلغاء
              </button>
              <button id="confirm-buy-btn" onClick={handleBuy} disabled={buyLoading}
                style={{ flex: 2, padding: '14px', border: 'none', borderRadius: 14, background: buyLoading ? 'rgba(30,58,138,0.5)' : 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: buyLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {buyLoading ? '⏳ جاري الإنشاء...' : '🔒 تأكيد الشراء'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
