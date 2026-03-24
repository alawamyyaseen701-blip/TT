'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TYPE_LABELS: Record<string, string> = {
  social: 'حسابات سوشيال ميديا',
  asset: 'الأصول الرقمية',
  subscription: 'اشتراكات رقمية',
  store: 'منتجات رقمية',
  service: 'خدمات رقمية',
};

const TYPE_ICONS: Record<string, string> = {
  social: '📱', asset: '💎', subscription: '⭐', store: '🛒', service: '⚡',
};

// Skeleton loader
function Skeleton({ w = '100%', h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) { try { setCurrentUser(JSON.parse(u)); } catch {} }
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/listings/${listingId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!data.success || !data.data) { setNotFound(true); return; }
      setListing(data.data);
      setIsFav(data.data.is_favorited || false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    setBuyLoading(true); setBuyError('');
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId, sellerId: listing.seller_id }),
      });
      const data = await res.json();
      if (!data.success) { setBuyError(data.error || 'حدث خطأ'); return; }
      setShowBuyModal(false);
      router.push(`/deals/${data.data.dealId || data.data.id}`);
    } catch { setBuyError('خطأ في الاتصال بالخادم'); }
    finally { setBuyLoading(false); }
  };

  const toggleFav = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    setIsFav(f => !f);
    await fetch('/api/favorites', {
      method: isFav ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId }),
    }).catch(() => {});
  };

  const isOwner = currentUser && listing && currentUser.id === listing.seller_id;
  const images: string[] = listing?.images?.length ? listing.images : [TYPE_ICONS[listing?.type] || '📋'];
  const isReal = (val: any) => val !== null && val !== undefined && val !== '' && val !== 0;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', padding: 24, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton w={80} h={80} r={16} />
              </div>
              <div style={{ background: 'white', borderRadius: 24, padding: 28 }}>
                <Skeleton h={32} r={8} /><div style={{ marginTop: 12 }} /><Skeleton h={16} r={6} /><div style={{ marginTop: 8 }} /><Skeleton w="70%" h={16} r={6} />
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 24, padding: 24, height: 250 }}><Skeleton h={40} r={8} /></div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );

  /* ── Not Found ── */
  if (notFound || !listing) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🔍</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>الإعلان غير موجود</h1>
          <p style={{ color: '#64748B', marginBottom: 24 }}>ربما تم حذفه أو بيعه بالفعل</p>
          <Link href="/"><button style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>← العودة للرئيسية</button></Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, background: '#F8FAFC', flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>
            <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>الرئيسية</Link>
            <span>›</span>
            <Link href={`/${listing.type === 'social' ? 'social-accounts' : listing.type === 'asset' ? 'digital-assets' : listing.type + 's'}`} style={{ color: '#94A3B8', textDecoration: 'none' }}>{TYPE_LABELS[listing.type] || listing.type}</Link>
            <span>›</span>
            <span style={{ color: '#64748B' }}>{listing.title?.slice(0, 40)}</span>
          </div>

          {/* Sold / single-purchase banners */}
          {listing.status === 'sold' ? (
            <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontWeight: 700, fontSize: 14, marginBottom: 24 }}>
              🔴 {listing.type === 'subscription'
                ? 'هذا الاشتراك تم بيعه ولم يعد متاحاً'
                : 'هذا الإعلان تم بيعه ولم يعد متاحاً للشراء'}
            </div>
          ) : listing.type === 'subscription' ? (
            <div style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', color: '#92400E', fontWeight: 600, fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> هذا الاشتراك يُباع مرة واحدة فقط — لشخص واحد. سيُزال من الموقع بعد أول عملية شراء.
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* ── Left Column ── */}
            <div>
              {/* Images */}
              <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                <div style={{ padding: '60px', background: 'linear-gradient(135deg, #F1F5F9, #EFF6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                  {images[activeImage]?.startsWith('data:') ? (
                    <img src={images[activeImage]} alt="" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 16, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: 120 }}>{images[activeImage]}</div>
                  )}
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <button key={i} id={`img-thumb-${i}`} onClick={() => setActiveImage(i)}
                        style={{ width: 60, height: 60, borderRadius: 10, border: `2px solid ${activeImage === i ? '#1E3A8A' : '#E2E8F0'}`, background: '#F8FAFC', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0 }}>
                        {img?.startsWith('data:') ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : img}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + Details */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {listing.platform && <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>📱 {listing.platform}</span>}
                  <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(37,99,235,0.1)', color: '#1D4ED8', fontSize: 12, fontWeight: 700 }}>{TYPE_ICONS[listing.type]} {TYPE_LABELS[listing.type]}</span>
                  {listing.asset_subtype && <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(37,99,235,0.08)', color: '#1D4ED8', fontSize: 12, fontWeight: 700 }}>{{ website: '🌐 موقع', app: '📱 تطبيق', store: '🛍️ متجر', domain: '🔗 دومين' }[listing.asset_subtype as string] || listing.asset_subtype}</span>}
                  {listing.allow_multiple_purchases && (
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: 12, fontWeight: 700 }}>
                      🔄 متعدد الشراء
                    </span>
                  )}
                  {listing.allow_multiple_purchases && (listing.purchase_count || 0) > 0 && (
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#D97706', fontSize: 12, fontWeight: 700 }}>
                      🛒 {listing.purchase_count} مشتري
                    </span>
                  )}
                  {listing.monetized && <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: 12, fontWeight: 700 }}>💰 مفعّلة الربح</span>}
                  {listing.featured && <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#D97706', fontSize: 12, fontWeight: 700 }}>⭐ مميز</span>}
                  {listing.country && <span style={{ padding: '4px 12px', borderRadius: 100, background: '#F8FAFC', color: '#64748B', fontSize: 12, fontWeight: 600 }}>🌍 {listing.country}</span>}
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 16, lineHeight: 1.4 }}>{listing.title}</h1>

                {/* Stats row */}
                {(isReal(listing.followers) || isReal(listing.engagement) || isReal(listing.monthly_profit) || isReal(listing.age_months)) && (
                  <div style={{ display: 'flex', gap: 20, padding: '16px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', margin: '16px 0', flexWrap: 'wrap' }}>
                    {isReal(listing.followers) && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>👥</div><div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{listing.followers}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>المتابعون</div></div>}
                    {isReal(listing.engagement) && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>📈</div><div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{listing.engagement}%</div><div style={{ fontSize: 11, color: '#94A3B8' }}>التفاعل</div></div>}
                    {isReal(listing.monthly_profit) && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>💵</div><div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>${Number(listing.monthly_profit).toLocaleString('en-US')}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>الأرباح/شهر</div></div>}
                    {isReal(listing.monthly_revenue) && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>💵</div><div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>${Number(listing.monthly_revenue).toLocaleString('en-US')}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>الإيراد/شهر</div></div>}
                    {isReal(listing.age_months) && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>📅</div><div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{listing.age_months >= 12 ? `${Math.floor(listing.age_months / 12)} سنة` : `${listing.age_months} شهر`}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>العمر</div></div>}
                  </div>
                )}

                {/* Description */}
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, color: '#374151', lineHeight: 1.9 }}>{listing.description}</div>
              </div>

              {/* Extra fields + GitHub */}
              {(isReal(listing.plan) || isReal(listing.duration) || isReal(listing.domain) || isReal(listing.tech_stack) || isReal(listing.delivery) || isReal(listing.includes) || isReal(listing.github_url)) && (
                <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>📋 تفاصيل العرض</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { k: 'plan',         label: '📦 الباقة / الخطة' },
                      { k: 'duration',     label: '⏱️ مدة الاشتراك' },
                      { k: 'domain',       label: '🔗 الدومين' },
                      { k: 'tech_stack',   label: '💻 التقنية' },
                      { k: 'delivery',     label: '🚀 طريقة التسليم' },
                      { k: 'includes',     label: '✅ يشمل' },
                    ].filter(f => isReal(listing[f.k])).map(f => (
                      <div key={f.k} style={{ padding: '12px 16px', borderRadius: 12, background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{f.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textAlign: 'left' }}>{listing[f.k]}</span>
                      </div>
                    ))}
                  </div>

                  {/* GitHub link card — visible publicly for multi-purchase assets */}
                  {listing.allow_multiple_purchases && listing.github_url && (
                    <div style={{ marginTop: 16, padding: '16px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(30,58,138,0.04), rgba(16,185,129,0.04))', border: '1.5px solid rgba(30,58,138,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>🐙 كود المشروع على GitHub</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>بعد الشراء ستحصل على رابط التحميل المباشر</div>
                      </div>
                      <a href={listing.github_url} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '9px 20px', borderRadius: 10, background: '#0F172A', color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                        <span>🐙</span> عرض Repository
                      </a>
                    </div>
                  )}

                  {/* Domain — single purchase notice */}
                  {listing.asset_subtype === 'domain' && (
                    <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                      🔴 الدومين يُباع مرة واحدة فقط — الإعلان سيُزال بعد أول عملية شراء
                    </div>
                  )}
                </div>
              )}

              {/* Views + Date */}
              <div style={{ background: 'white', borderRadius: 24, padding: '16px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 20, alignItems: 'center', fontSize: 13, color: '#94A3B8' }}>
                <span>👁️ {listing.views || 0} مشاهدة</span>
                <span>❤️ {listing.favorites || 0} محفوظ</span>
                {listing.created_at && <span>📅 {new Date(listing.created_at).toLocaleDateString('ar-SA')}</span>}
              </div>
            </div>

            {/* ── Right Sidebar ── */}
            <div style={{ position: 'sticky', top: 90 }}>
              {/* Price + Buy */}
              <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: '#1E3A8A', marginBottom: 4 }}>
                  ${Number(listing.price).toLocaleString('en-US')}
                </div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
                  البائع يحصل على ${(Number(listing.price) * 0.95).toLocaleString('en-US')} بعد عمولة 5%
                </div>

                {listing.status === 'sold' ? (
                  <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontWeight: 700, textAlign: 'center', fontSize: 15 }}>
                    🔴 تم البيع
                  </div>
                ) : isOwner ? (
                  <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontWeight: 700, textAlign: 'center', fontSize: 14 }}>
                    ✅ هذا إعلانك — لا يمكنك شراؤه
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button id="buy-now-btn" onClick={() => {
                      const token = localStorage.getItem('token');
                      if (!token) router.push('/auth/login?redirect=/listings/' + listingId);
                      else setShowBuyModal(true);
                    }}
                      style={{ width: '100%', padding: '16px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 24px rgba(30,58,138,0.3)' }}>
                      🔒 شراء آمن عبر Escrow
                    </button>
                    <button id="message-seller-btn" onClick={() => {
                      const token = localStorage.getItem('token');
                      if (!token) router.push('/auth/login');
                      else router.push(`/messages?with=${listing.seller_id}`);
                    }}
                      style={{ width: '100%', padding: '14px', border: '1.5px solid #1E3A8A', borderRadius: 14, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      💬 مراسلة البائع
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button id="fav-btn" onClick={toggleFav}
                        style={{ padding: '12px', border: `1.5px solid ${isFav ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, background: isFav ? 'rgba(239,68,68,0.05)' : 'white', color: isFav ? '#EF4444' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {isFav ? '❤️ محفوظ' : '🤍 حفظ'}
                      </button>
                      <button id="report-btn" style={{ padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#94A3B8', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        🚩 إبلاغ
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, rgba(30,58,138,0.04), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>🛡️ ضمان Trust🔁Deal</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>أموالك محمية بنظام Escrow. لن تصل للبائع إلا بعد تأكيدك الاستلام الكامل.</div>
                </div>
              </div>

              {/* Seller Card */}
              {(listing.seller_name || listing.seller_username) && (
                <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>البائع</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>
                      {(listing.seller_name || listing.seller_username || '?').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {listing.seller_name || listing.seller_username}
                        {listing.seller_role === 'verified' && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontWeight: 700 }}>✓ موثق</span>}
                      </div>
                      {listing.seller_username && <div style={{ fontSize: 13, color: '#94A3B8' }}>@{listing.seller_username}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: 12, borderRadius: 12, background: '#F8FAFC', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B' }}>★ {Number(listing.seller_rating || 0).toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>التقييم</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 12, background: '#F8FAFC', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>{listing.seller_deals || 0}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>الصفقات</div>
                    </div>
                  </div>
                  {listing.seller_username && (
                    <Link href={`/profile/${listing.seller_username}`} style={{ textDecoration: 'none' }}>
                      <button style={{ width: '100%', padding: '11px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: 'white', color: '#1E3A8A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        عرض الملف الشخصي
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && listing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>تأكيد الشراء الآمن</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>سيتم تجميد المبلغ في Escrow حتى تؤكد استلام المنتج بالكامل</p>

            <div style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 12, fontSize: 14 }}>{listing.title}</div>
              {[
                { label: 'سعر الإعلان', val: `$${Number(listing.price).toLocaleString('en-US')}` },
                { label: 'عمولة المنصة (5%)', val: `-$${(Number(listing.price) * 0.05).toFixed(2)}` },
                { label: 'ما سيحصله البائع', val: `$${(Number(listing.price) * 0.95).toLocaleString('en-US')}` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 13, color: '#64748B' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{r.val}</span>
                </div>
              ))}
            </div>

            {buyError && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 14 }}>⚠️ {buyError}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowBuyModal(false); setBuyError(''); }}
                style={{ flex: 1, padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: 14, background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button id="confirm-buy-btn" onClick={handleBuy} disabled={buyLoading}
                style={{ flex: 2, padding: '14px', border: 'none', borderRadius: 14, background: buyLoading ? '#94A3B8' : 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 800, fontSize: 15, cursor: buyLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {buyLoading ? '⏳ جاري الإنشاء...' : '🔒 تأكيد الشراء'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}
