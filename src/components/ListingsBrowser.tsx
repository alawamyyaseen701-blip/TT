'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Listing {
  id: string;
  type: string;
  platform?: string;
  title: string;
  description?: string;
  price: number;
  followers?: number;
  engagement?: number;
  status: string;
  featured?: boolean;
  views?: number;
  seller_name?: string;
  seller_username?: string;
  seller_rating?: number;
  country?: string;
  age_months?: number;
  monetized?: boolean;
  created_at?: string;
}

interface ListingsBrowserProps {
  type: string;           // 'social' | 'asset' | 'store' | 'subscription' | 'service'
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  platforms?: string[];
  emptyIcon?: string;
}

export default function ListingsBrowser({
  type, title, subtitle, icon, color, platforms = [], emptyIcon = '📭'
}: ListingsBrowserProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [type, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, sort: sortBy, limit: '24' });
      const res = await fetch(`/api/listings?${params}`);
      const data = await res.json();
      if (data.success) setListings(data.data?.listings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = listings.filter(l => {
    if (maxPrice && l.price > Number(maxPrice)) return false;
    if (search && !l.title?.toLowerCase().includes(search.toLowerCase()) && !l.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const platformIcon: Record<string, string> = {
    YouTube: '▶️', Instagram: '📸', TikTok: '🎵', Facebook: '👥', Twitter: '🐦',
    Snapchat: '👻', Telegram: '📬', Discord: '🎮', Shopify: '🛍️', WordPress: '🎨',
    ChatGPT: '🤖', default: icon,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 60%, #0F172A 100%)',
        padding: '120px 24px 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: `rgba(${color},0.1)`, border: `1px solid rgba(${color},0.2)`, color: '#10B981', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {icon} {title}
              </div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 36, marginBottom: 12, lineHeight: 1.2 }}>
                تصفح <span style={{ background: 'linear-gradient(135deg, #10B981, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7 }}>{subtitle}</p>
            </div>
            <Link href="/listings/create" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #10B981, #2563EB)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                + أضف إعلانك
              </button>
            </Link>
          </div>

          {/* Search */}
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, display: 'flex', gap: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`ابحث في ${title}...`}
                style={{ flex: 1, padding: '13px 16px', background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 14, fontFamily: 'Tajawal, sans-serif' }} />
              <button style={{ padding: '13px 20px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16 }}>🔍</button>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontFamily: 'Tajawal, sans-serif', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
              <option style={{ background: '#1E293B' }} value="newest">الأحدث</option>
              <option style={{ background: '#1E293B' }} value="price_low">السعر: من الأقل</option>
              <option style={{ background: '#1E293B' }} value="price_high">السعر: من الأعلى</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ padding: '13px 18px', borderRadius: 12, border: `1px solid ${showFilters ? '#10B981' : 'rgba(255,255,255,0.15)'}`, background: showFilters ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)', color: showFilters ? '#10B981' : 'rgba(255,255,255,0.7)', fontFamily: 'Tajawal, sans-serif', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔧 فلاتر
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div style={{ marginTop: 16, padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>الحد الأقصى للسعر ($)</label>
                <input type="number" placeholder="مثال: 5000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontFamily: 'Tajawal, sans-serif', fontSize: 13, width: 150, outline: 'none' }} />
              </div>
              <button onClick={() => { setMaxPrice(''); setSearch(''); }}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                🗑️ مسح
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Listings Grid */}
      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Stats bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: '#64748B', fontSize: 14, fontFamily: 'Tajawal, sans-serif' }}>
              {loading ? 'جاري التحميل...' : <><span style={{ fontWeight: 700, color: '#0F172A' }}>{filtered.length}</span> إعلان</>}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: 16, background: 'white', border: '1.5px solid #F1F5F9', overflow: 'hidden', height: 280, animation: 'pulse 1.5s infinite' }}>
                  <div style={{ height: 100, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  <div style={{ padding: 20 }}>
                    {[80, 60, 40].map((w, j) => (
                      <div key={j} style={{ height: 14, background: '#F1F5F9', borderRadius: 7, marginBottom: 12, width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: 'Tajawal, sans-serif' }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>{emptyIcon}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                {search || maxPrice ? 'لا توجد نتائج مطابقة' : 'لا توجد إعلانات بعد'}
              </h2>
              <p style={{ color: '#64748B', fontSize: 15, marginBottom: 28 }}>
                {search || maxPrice ? 'جرّب تغيير الفلاتر' : `كن أول من ينشر إعلاناً في ${title}`}
              </p>
              <Link href="/listings/create" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                  + أضف أول إعلان
                </button>
              </Link>
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {filtered.map(listing => (
                <div key={listing.id} className="card" style={{ position: 'relative' }}>
                  {listing.featured && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>⭐ مميز</div>
                  )}

                  {/* Card Header */}
                  <div style={{ padding: '40px 20px 20px', background: 'linear-gradient(135deg, rgba(37,99,235,0.06), #F8FAFC)', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', flexShrink: 0 }}>
                      {platformIcon[listing.platform || ''] || icon}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>
                        {listing.platform || title} {listing.country && `· ${listing.country}`}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{listing.title}</div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  {(listing.followers || listing.engagement || listing.age_months) && (
                    <div style={{ padding: '14px 20px', display: 'flex', gap: 16, borderBottom: '1px solid #F8FAFC' }}>
                      {listing.followers && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#1E3A8A' }}>{listing.followers.toLocaleString('en-US')}</div>
                          <div style={{ fontSize: 10, color: '#94A3B8' }}>متابع</div>
                        </div>
                      )}
                      {listing.engagement && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{listing.engagement}%</div>
                          <div style={{ fontSize: 10, color: '#94A3B8' }}>تفاعل</div>
                        </div>
                      )}
                      {listing.monetized && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>✓</div>
                          <div style={{ fontSize: 10, color: '#94A3B8' }}>مربح</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seller */}
                  {listing.seller_name && (
                    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F8FAFC' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                        {listing.seller_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{listing.seller_name}</div>
                        {listing.seller_rating && <div style={{ fontSize: 11, color: '#94A3B8' }}>⭐ {listing.seller_rating.toFixed(1)}</div>}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>السعر</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>
                        ${listing.price.toLocaleString('en-US')}
                      </div>
                    </div>
                    <Link href={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        عرض ←
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
