'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ACCOUNTS = [
  { id: 1, platform: 'YouTube', icon: '▶️', color: '#FF0000', name: 'قناة تقنية وبرمجة', followers: '450K', engagement: '7.2%', price: 8500, country: '🇸🇦', domain: 'تقنية', age: '4 سنوات', monetized: true, rating: 4.9, reviews: 23, verified: true, featured: true },
  { id: 2, platform: 'Instagram', icon: '📸', color: '#E1306C', name: 'صفحة موضة وأزياء', followers: '280K', engagement: '5.8%', price: 3200, country: '🇦🇪', domain: 'موضة', age: '3 سنوات', monetized: false, rating: 4.7, reviews: 15, verified: true, featured: false },
  { id: 3, platform: 'TikTok', icon: '🎵', color: '#010101', name: 'حساب ترفيه وكوميديا', followers: '1.2M', engagement: '9.1%', price: 12000, country: '🇸🇦', domain: 'ترفيه', age: '2 سنة', monetized: true, rating: 4.9, reviews: 41, verified: true, featured: true },
  { id: 4, platform: 'Facebook', icon: '👥', color: '#1877F2', name: 'مجموعة طبخ وطعام', followers: '95K', engagement: '4.2%', price: 1800, country: '🇪🇬', domain: 'طعام', age: '5 سنوات', monetized: false, rating: 4.5, reviews: 8, verified: false, featured: false },
  { id: 5, platform: 'Twitter', icon: '🐦', color: '#1DA1F2', name: 'حساب رياضة وكرة قدم', followers: '180K', engagement: '6.5%', price: 4500, country: '🇸🇦', domain: 'رياضة', age: '6 سنوات', monetized: false, rating: 4.8, reviews: 19, verified: true, featured: false },
  { id: 6, platform: 'Snapchat', icon: '👻', color: '#FFFC00', name: 'حساب لايف ستايل', followers: '320K', engagement: '8.3%', price: 5500, country: '🇰🇼', domain: 'لايف ستايل', age: '3 سنوات', monetized: false, rating: 4.6, reviews: 12, verified: true, featured: false },
  { id: 7, platform: 'Telegram', icon: '📬', color: '#2AABEE', name: 'قناة استثمار وعملات', followers: '55K', engagement: '12.0%', price: 6800, country: '🇸🇦', domain: 'استثمار', age: '2 سنة', monetized: false, rating: 4.7, reviews: 9, verified: true, featured: false },
  { id: 8, platform: 'YouTube', icon: '▶️', color: '#FF0000', name: 'قناة طبخ وحلويات', followers: '220K', engagement: '6.8%', price: 3900, country: '🇲🇦', domain: 'طعام', age: '3 سنوات', monetized: true, rating: 4.8, reviews: 17, verified: true, featured: false },
];

const PLATFORMS = ['الكل', 'YouTube', 'Instagram', 'TikTok', 'Facebook', 'Twitter', 'Snapchat', 'Telegram', 'Discord'];

export default function SocialAccountsPage() {
  const [activePlatform, setActivePlatform] = useState('الكل');
  const [sortBy, setSortBy] = useState('featured');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyMonetized, setOnlyMonetized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favs, setFavs] = useState<number[]>([]);

  const filtered = ACCOUNTS.filter(a => {
    if (activePlatform !== 'الكل' && a.platform !== activePlatform) return false;
    if (onlyVerified && !a.verified) return false;
    if (onlyMonetized && !a.monetized) return false;
    if (maxPrice && a.price > Number(maxPrice)) return false;
    return true;
  });

  const toggleFav = (id: number) => {
    setFavs(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 60%, #0F172A 100%)',
        padding: '120px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
                borderRadius: 100, background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#10B981', fontSize: 13, fontWeight: 600, marginBottom: 16,
              }}>📱 حسابات السوشيال ميديا</div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, marginBottom: 12, lineHeight: 1.2 }}>
                اشترِ وبع حسابات{' '}
                <span style={{ background: 'linear-gradient(135deg, #10B981, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  بأمان تام
                </span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7 }}>
                أكثر من 12,400 حساب موثق على منصات مختلفة — مع ضمان نقل الحساب الكامل عبر نظام Escrow
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/listings/create" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #10B981, #2563EB)',
                  border: 'none', borderRadius: 14, color: 'white',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                }}>+ أضف حسابك</button>
              </Link>
              <Link href="/requests/create" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '14px 28px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 14, color: 'white',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                }}>📋 أضف طلبك</button>
              </Link>
            </div>
          </div>

          {/* Platform Tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            {PLATFORMS.map(p => (
              <button key={p} id={`tab-${p}`} onClick={() => setActivePlatform(p)}
                style={{
                  padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                  border: '1.5px solid',
                  borderColor: activePlatform === p ? '#10B981' : 'rgba(255,255,255,0.15)',
                  background: activePlatform === p ? '#10B981' : 'rgba(255,255,255,0.06)',
                  color: activePlatform === p ? 'white' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                  transition: 'all 0.2s',
                }}
              >{p}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '40px 24px 80px', flex: 1, background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24, flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ color: '#64748B', fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{filtered.length}</span> نتيجة
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select id="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '9px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0',
                  fontFamily: 'Tajawal, sans-serif', fontSize: 13, color: '#0F172A',
                  background: 'white', cursor: 'pointer', outline: 'none',
                }}>
                <option value="featured">الأكثر تميزاً</option>
                <option value="price_low">السعر: من الأقل</option>
                <option value="price_high">السعر: من الأعلى</option>
                <option value="followers">عدد المتابعين</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>
              <button id="toggle-filters-btn" onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '9px 18px', borderRadius: 10,
                  border: `1.5px solid ${showFilters ? '#1E3A8A' : '#E2E8F0'}`,
                  background: showFilters ? '#1E3A8A' : 'white',
                  color: showFilters ? 'white' : '#64748B',
                  fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                🔧 فلاتر {showFilters ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div style={{
              padding: '24px', borderRadius: 16, marginBottom: 24,
              background: 'white', border: '1.5px solid #E2E8F0',
              display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>الحد الأقصى للسعر ($)</label>
                <input id="filter-max-price" type="number" placeholder="مثال: 5000" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontFamily: 'Tajawal, sans-serif', fontSize: 14, width: 160, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>الحد الأدنى للمتابعين</label>
                <input id="filter-min-followers" type="number" placeholder="مثال: 100000" value={minFollowers}
                  onChange={e => setMinFollowers(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontFamily: 'Tajawal, sans-serif', fontSize: 14, width: 180, outline: 'none' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input id="filter-verified" type="checkbox" checked={onlyVerified} onChange={e => setOnlyVerified(e.target.checked)} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>موثق فقط ✅</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input id="filter-monetized" type="checkbox" checked={onlyMonetized} onChange={e => setOnlyMonetized(e.target.checked)} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>مفعّل الربح فقط 💰</span>
              </label>
              <button onClick={() => { setMaxPrice(''); setMinFollowers(''); setOnlyVerified(false); setOnlyMonetized(false); }}
                style={{
                  padding: '10px 18px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', background: 'white',
                  color: '#EF4444', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                }}>🗑️ مسح الفلاتر</button>
            </div>
          )}

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {filtered.map(account => (
              <div key={account.id} className="card" style={{ position: 'relative' }}>
                {account.featured && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 2,
                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 100,
                  }}>⭐ مميز</div>
                )}
                <button id={`fav-${account.id}`} onClick={() => toggleFav(account.id)}
                  style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 2,
                    width: 34, height: 34, borderRadius: 10,
                    background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer',
                    fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>{favs.includes(account.id) ? '❤️' : '🤍'}</button>

                {/* Header */}
                <div style={{
                  padding: '50px 20px 20px',
                  background: `linear-gradient(135deg, ${account.color}12, #F8FAFC)`,
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 16,
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: `2px solid ${account.color}30`,
                  }}>{account.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>
                      {account.platform} {account.country} · {account.domain}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{account.name}</div>
                    {account.verified && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: '#10B981' }}>✅ موثق من المنصة</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  padding: '16px 20px',
                  display: 'grid', gridTemplateColumns: account.monetized ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                  gap: 12,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1E3A8A' }}>{account.followers}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>متابع</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{account.engagement}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>تفاعل</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#64748B' }}>{account.age}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>العمر</div>
                  </div>
                  {account.monetized && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>✓</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>مربح</div>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: 12, color: s <= Math.floor(account.rating) ? '#F59E0B' : '#CBD5E1' }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{account.rating}</span>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>({account.reviews} تقييم)</span>
                </div>

                {/* Footer */}
                <div style={{
                  padding: '14px 20px',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>السعر</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A' }}>${account.price.toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/listings/${account.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '9px 18px',
                        background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                        border: 'none', borderRadius: 10,
                        color: 'white', fontWeight: 700, fontSize: 13,
                        cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                      }}>عرض</button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>لا توجد نتائج</div>
              <div style={{ color: '#64748B', fontSize: 14 }}>جرب تغيير الفلاتر أو البحث بكلمات أخرى</div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
