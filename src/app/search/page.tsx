'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

const TYPE_MAP: Record<string, string> = {
  'سوشيال ميديا': 'social', 'أصول رقمية': 'asset', 'اشتراكات': 'subscription', 'خدمات': 'service', 'متجر': 'store',
};
const TYPE_LABELS: Record<string, string> = { social: 'سوشيال ميديا', subscription: 'اشتراكات', asset: 'أصول رقمية', service: 'خدمات', store: 'متجر' };
const TYPE_COLORS: Record<string, string> = { social: '#8B5CF6', subscription: '#F59E0B', asset: '#2563EB', service: '#EF4444', store: '#10B981' };
const PLATFORM_ICONS: Record<string, string> = { YouTube: '▶️', TikTok: '🎵', Instagram: '📸', Twitter: '🐦', Facebook: '📘', Shopify: '🛍️', ChatGPT: '🤖' };

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeType, setActiveType] = useState('الكل');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async (resetPage = false) => {
    setLoading(true);
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeType !== 'الكل') params.set('type', TYPE_MAP[activeType] || activeType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (verifiedOnly) params.set('verified', 'true');
    params.set('sort', sortBy);
    params.set('page', String(p));
    params.set('limit', '12');

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.listings);
        setPagination(data.data.pagination);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [query, activeType, sortBy, minPrice, maxPrice, verifiedOnly, page]);

  useEffect(() => { fetchListings(true); }, [activeType, sortBy, verifiedOnly]);

  const handleSearch = () => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
    fetchListings(true);
  };

  const types = ['الكل', 'سوشيال ميديا', 'أصول رقمية', 'اشتراكات', 'خدمات', 'متجر'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      {/* Hero Search */}
      <section style={{ background: 'linear-gradient(160deg, #0F172A, #1E3A8A)', padding: '100px 24px 48px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 32, marginBottom: 8 }}>
            🔍 البحث في{' '}
            <span style={{ background: 'linear-gradient(135deg, #10B981, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {pagination?.total || '...'} إعلان
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>ابحث وفلتر بين آلاف الأصول الرقمية الموثوقة</p>
          <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
            <input id="search-input" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="ابحث عن أي أصل رقمي..." style={{ flex: 1, padding: '16px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 15, fontFamily: 'Tajawal, sans-serif' }} />
            <button id="search-btn" onClick={handleSearch} style={{ padding: '16px 28px', background: 'linear-gradient(135deg, #10B981, #2563EB)', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 15, fontFamily: 'Tajawal, sans-serif' }}>
              🔍 بحث
            </button>
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 24px 64px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
          {/* Filters Sidebar */}
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: 24, position: 'sticky', top: 90 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 20 }}>⚙️ فلاتر البحث</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>النوع</div>
              {types.map(t => (
                <button key={t} id={`type-${t}`} onClick={() => setActiveType(t)}
                  style={{ display: 'block', width: '100%', textAlign: 'right', padding: '9px 14px', borderRadius: 10, border: 'none', background: activeType === t ? 'rgba(30,58,138,0.08)' : 'transparent', color: activeType === t ? '#1E3A8A' : '#64748B', fontWeight: activeType === t ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', marginBottom: 4 }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ height: 1, background: '#F1F5F9', marginBottom: 20 }} />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>نطاق السعر ($)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input id="min-price" type="number" placeholder="من" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  style={{ padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: 13 }} />
                <input id="max-price" type="number" placeholder="إلى" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  style={{ padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>الترتيب</div>
              {[
                { v: 'newest', l: 'الأحدث' }, { v: 'price_low', l: 'السعر: الأقل' },
                { v: 'price_high', l: 'السعر: الأعلى' }, { v: 'popular', l: 'الأكثر مشاهدة' },
              ].map(s => (
                <button key={s.v} id={`sort-${s.v}`} onClick={() => setSortBy(s.v)}
                  style={{ display: 'block', width: '100%', textAlign: 'right', padding: '9px 14px', borderRadius: 10, border: 'none', background: sortBy === s.v ? 'rgba(30,58,138,0.08)' : 'transparent', color: sortBy === s.v ? '#1E3A8A' : '#64748B', fontWeight: sortBy === s.v ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', marginBottom: 4 }}>
                  {s.l}
                </button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
              <input id="verified-filter" type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#1E3A8A' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>موثّق فقط ✅</span>
            </label>

            <button id="apply-filters" onClick={() => fetchListings(true)} style={{ width: '100%', marginTop: 16, padding: '12px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              تطبيق الفلاتر
            </button>
          </div>

          {/* Results */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
                {loading ? 'جاري البحث...' : `${pagination?.total || 0} نتيجة${query ? ` لـ "${query}"` : ''}`}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ height: 280, background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', animation: 'pulse-glow 1.5s infinite' }} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 24, border: '1.5px solid #E2E8F0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>لا توجد نتائج</div>
                <div style={{ color: '#64748B', fontSize: 14 }}>جرب تغيير الفلاتر أو كلمة البحث</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {results.map((item: any) => (
                    <div key={item.id} style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
                      <div style={{ padding: '20px', background: `linear-gradient(135deg, ${TYPE_COLORS[item.type] || '#64748B'}10, #fff)`, borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${TYPE_COLORS[item.type] || '#64748B'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                            {PLATFORM_ICONS[item.platform] || '📦'}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                              {TYPE_LABELS[item.type] || item.type} {item.seller_role === 'verified' ? '✅' : ''}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{item.title}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '14px 20px' }}>
                        {item.followers && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: '#94A3B8' }}>المتابعون</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A' }}>{item.followers}</span>
                          </div>
                        )}
                        {item.monthly_profit && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: '#94A3B8' }}>ربح شهري</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>${item.monthly_profit}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>التقييم</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>★ {Number(item.seller_rating || 0).toFixed(1)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A' }}>${Number(item.price).toLocaleString()}</div>
                          <Link href={`/listings/${item.id}`} style={{ textDecoration: 'none' }}>
                            <button id={`view-${item.id}`} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                              عرض
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
                      <button key={p} id={`page-${p}`} onClick={() => { setPage(p); fetchListings(); }}
                        style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${page === p ? '#1E3A8A' : '#E2E8F0'}`, background: page === p ? '#1E3A8A' : 'white', color: page === p ? 'white' : '#64748B', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 48 }}>⏳</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
